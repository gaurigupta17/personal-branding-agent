import os
import re
import requests
from bs4 import BeautifulSoup
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from parent workspace directory root
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(base_dir, '.env')
load_dotenv(dotenv_path=dotenv_path)

app = Flask(__name__)
# Enable CORS for all routes
CORS(app)

def crawl_url(url):
    target_url = url.strip()
    if not target_url.lower().startswith(('http://', 'https://')):
        target_url = 'https://' + target_url

    # Check if Firecrawl API is configured
    firecrawl_key = os.getenv("FIRECRAWL_API_KEY")
    if firecrawl_key:
        print(f"Scraping {target_url} via Firecrawl API SDK...")
        try:
            from firecrawl import FirecrawlApp
            app = FirecrawlApp(api_key=firecrawl_key)
            res = app.scrape_url(target_url, formats=['markdown'])
            
            markdown = getattr(res, 'markdown', '') or ''
            metadata = getattr(res, 'metadata', {}) or {}
            
            title = metadata.get("title") or metadata.get("ogTitle") or "Reference Page"
            description = metadata.get("description") or metadata.get("ogDescription") or ""
            return {
                "success": True,
                "title": title.strip(),
                "description": description.strip(),
                "text": markdown.strip(),
                "url": target_url
            }
        except Exception as e:
            print(f"Firecrawl SDK scrape failed: {e}, trying Tavily search fallback...")
            tavily_key = os.getenv("TAVILY_API_KEY")
            if tavily_key:
                try:
                    from tavily import TavilyClient
                    client = TavilyClient(api_key=tavily_key)
                    search_data = client.search(query=target_url, max_results=1)
                    results_list = search_data.get("results", [])
                    if results_list:
                        item = results_list[0]
                        return {
                            "success": True,
                            "title": item.get("title", "Reference Page"),
                            "description": item.get("title", "Reference Page"),
                            "text": item.get("content", ""),
                            "url": target_url
                        }
                except Exception as te:
                    print(f"Tavily fallback crawl failed: {te}")
            print("Falling back to BeautifulSoup...")

    # Fallback to BeautifulSoup scraper with retry loop
    print(f"Scraping {target_url} via BeautifulSoup fallback...")
    
    max_retries = 3
    last_error = "Unknown failure"
    
    for attempt in range(max_retries):
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            res = requests.get(target_url, headers=headers, timeout=15, allow_redirects=True)
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, 'html.parser')
                
                title = soup.title.string if soup.title else ""
                if not title:
                    h1_el = soup.find('h1')
                    title = h1_el.get_text() if h1_el else "Reference Webpage"
                    
                desc_el = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', attrs={'property': 'og:description'})
                description = desc_el.get('content', '') if desc_el else ''

                for element in soup(["script", "style", "head", "nav", "footer", "iframe", "noscript"]):
                    element.decompose()

                text = soup.get_text()
                text = " ".join(text.split())
                
                return {
                    "success": True,
                    "title": title.strip(),
                    "description": description.strip(),
                    "text": text.strip(),
                    "url": target_url
                }
            else:
                last_error = f"HTTP status code {res.status_code}"
                print(f"Attempt {attempt + 1} failed for {target_url}: status {res.status_code}")
        except requests.exceptions.Timeout:
            last_error = "Request timeout"
            print(f"Attempt {attempt + 1} failed for {target_url}: timeout")
        except requests.exceptions.TooManyRedirects:
            last_error = "Too many redirects"
            print(f"Attempt {attempt + 1} failed for {target_url}: too many redirects")
            break  # No point in retrying redirects loop
        except requests.exceptions.RequestException as e:
            last_error = str(e)
            print(f"Attempt {attempt + 1} failed for {target_url}: {e}")
            
    return {
        "success": False,
        "error": last_error,
        "url": target_url
    }

@app.route('/api/crawl', methods=['POST'])
def handle_crawl():
    data = request.json or {}
    url_input = data.get("url", "")
    if not url_input:
        return jsonify({"success": False, "error": "No URL provided"}), 400

    # Split by commas or whitespace
    urls = [u.strip() for u in re.split(r'[\s,]+', url_input) if u.strip()]
    
    results = []
    failed_results = []
    crawled_texts = []
    
    for url in urls:
        # Check if URL is a LinkedIn URL
        is_linkedin = "linkedin.com/in/" in url.lower() or "linkedin.com/company/" in url.lower()
        proxycurl_key = os.getenv("PROXYCURL_API_KEY")
        tavily_key = os.getenv("TAVILY_API_KEY")
        
        # 1. Try LinkedIn Specific Extractors
        if is_linkedin:
            profile_res = None
            linkedin_error = "Unconfigured API keys"
            
            if proxycurl_key:
                print(f"Scraping LinkedIn profile {url} via Proxycurl API...")
                headers = {
                    'Authorization': f'Bearer {proxycurl_key}'
                }
                params = {
                    'url': url,
                    'fallback_to_cache': 'on-error',
                    'use_cache': 'if-present'
                }
                try:
                    # Handle company vs person endpoint
                    endpoint = "https://nubela.co/proxycurl/api/v2/linkedin"
                    if "linkedin.com/company/" in url.lower():
                        endpoint = "https://nubela.co/proxycurl/api/linkedin/company"
                        
                    res = requests.get(endpoint, headers=headers, params=params, timeout=25)
                    if res.status_code == 200:
                        profile_data = res.json()
                        
                        # Convert JSON profile format to compiled text
                        summary_parts = []
                        if "linkedin.com/company/" in url.lower():
                            summary_parts.append(f"=== LINKEDIN COMPANY: {profile_data.get('name', 'N/A')} ===")
                            summary_parts.append(f"Industry: {profile_data.get('industry', 'N/A')}")
                            summary_parts.append(f"Website: {profile_data.get('website', 'N/A')}")
                            summary_parts.append(f"Description: {profile_data.get('description', 'N/A')}")
                            summary_parts.append(f"Company Size: {profile_data.get('company_size_on_linkedin', 'N/A')} employees")
                        else:
                            summary_parts.append(f"=== LINKEDIN PROFILE: {profile_data.get('first_name', '')} {profile_data.get('last_name', '')} ===")
                            summary_parts.append(f"Headline: {profile_data.get('headline', 'N/A')}")
                            summary_parts.append(f"Location: {profile_data.get('city', '')}, {profile_data.get('state', '')}, {profile_data.get('country_full', '')}")
                            summary_parts.append(f"Summary: {profile_data.get('summary', 'N/A')}")
                            
                            summary_parts.append("\nExperience:")
                            for exp in profile_data.get('experiences', []):
                                company_name = exp.get('company', 'N/A')
                                title = exp.get('title', 'N/A')
                                desc = exp.get('description', '')
                                summary_parts.append(f"- {title} at {company_name}")
                                if desc:
                                    summary_parts.append(f"  Description: {desc}")
                                    
                            summary_parts.append("\nEducation:")
                            for edu in profile_data.get('education', []):
                                school = edu.get('school', 'N/A')
                                degree = edu.get('degree_name', 'N/A')
                                field = edu.get('field_of_study', '')
                                summary_parts.append(f"- {degree} in {field} at {school}")
                                
                            if profile_data.get('skills'):
                                summary_parts.append(f"\nSkills: {', '.join(profile_data.get('skills'))}")
                                
                        compiled_text = "\n".join(summary_parts)
                        
                        profile_res = {
                            "success": True,
                            "title": f"LinkedIn Profile - {profile_data.get('first_name', '')} {profile_data.get('last_name', '')}" if "linkedin.com/in/" in url.lower() else f"LinkedIn Company - {profile_data.get('name', '')}",
                            "description": profile_data.get('headline', '') if "linkedin.com/in/" in url.lower() else profile_data.get('description', '')[:150],
                            "text": compiled_text,
                            "url": url
                        }
                    else:
                        linkedin_error = f"Proxycurl failed with code {res.status_code}"
                except Exception as e:
                    linkedin_error = f"Proxycurl scraping error: {e}"
            
            if not profile_res and tavily_key:
                print(f"Scraping LinkedIn profile {url} via Tavily Search fallback...")
                try:
                    from tavily import TavilyClient
                    client = TavilyClient(api_key=tavily_key)
                    search_data = client.search(query=url, max_results=1)
                    results_list = search_data.get("results", [])
                    if results_list:
                        item = results_list[0]
                        profile_res = {
                            "success": True,
                            "title": item.get("title", "LinkedIn Profile"),
                            "description": item.get("title", "LinkedIn Profile"),
                            "text": item.get("content", ""),
                            "url": url
                        }
                except Exception as e:
                    linkedin_error = f"Tavily Search LinkedIn fallback error: {e}"

            if profile_res:
                results.append(profile_res)
                crawled_texts.append(f"[Source: {profile_res['title']} ({profile_res['url']})]\n{profile_res['text']}")
                continue
            else:
                # Try BeautifulSoup crawl as last resort
                print(f"LinkedIn specific APIs failed or unconfigured, falling back to BeautifulSoup for {url}...")
                res = crawl_url(url)
                if res and res.get("success"):
                    results.append(res)
                    crawled_texts.append(f"[Source: {res['title']} ({res['url']})]\n{res['text']}")
                else:
                    failed_results.append({
                        "url": url,
                        "error": res.get("error") if (res and isinstance(res, dict)) else linkedin_error
                    })
                continue
                
        # 2. Non-LinkedIn URLs
        res = crawl_url(url)
        if res and res.get("success"):
            results.append(res)
            crawled_texts.append(f"[Source: {res['title']} ({res['url']})]\n{res['text']}")
        else:
            failed_results.append({
                "url": url,
                "error": res.get("error") if (res and isinstance(res, dict)) else "Failed to crawl webpage"
            })
            
    if not results:
        error_details = "; ".join([f"{f['url']}: {f['error']}" for f in failed_results])
        return jsonify({
            "success": False, 
            "error": f"Failed to crawl any of the reference URLs. Details: {error_details}",
            "failed": failed_results
        }), 500
        
    combined_text = "\n\n".join(crawled_texts)
    
    extracted_topic = ""
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and len(combined_text) > 50:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            system_prompt = "You are an expert content strategist. Given the following crawled webpage content, summarize the main topic/insight in a single short sentence or phrase (max 20-30 words) suitable to be used as a post topic/brief. Avoid empty buzzwords, em-dashes, and write it in the client's perspective or as a direct discussion prompt."
            response = model.generate_content(
                f"System instruction: {system_prompt}\n\nWebpage content:\n{combined_text}"
            )
            extracted_topic = response.text.replace('"', '').strip()
        except Exception as e:
            print(f"Error generating topic summary: {e}")
            
    if not extracted_topic and results:
        titles = " & ".join([r["title"] for r in results])
        desc = results[0].get("description") or (results[0]["text"][:100] + "...")
        extracted_topic = f"Insights from {titles}: {desc}"
        
    return jsonify({
        "success": True,
        "results": results,
        "failed": failed_results,
        "combinedText": combined_text,
        "extractedTopic": extracted_topic
    })

@app.route('/api/news-search', methods=['POST'])
def handle_news_search():
    data = request.json or {}
    query = data.get("query", "")
    if not query:
        return jsonify({"success": False, "error": "No query provided"}), 400

    tavily_key = os.getenv("TAVILY_API_KEY")
    if not tavily_key:
        # Try NewsAPI key fallback
        newsapi_key = os.getenv("NEWSAPI_KEY")
        if newsapi_key:
            print(f"Querying NewsAPI for '{query}'...")
            try:
                res = requests.get(
                    f"https://newsapi.org/v2/everything?q={requests.utils.quote(query)}&sortBy=publishedAt&pageSize=6&apiKey={newsapi_key}",
                    timeout=15
                )
                if res.status_code == 200:
                    news_data = res.json()
                    articles = []
                    for art in news_data.get("articles", []):
                        articles.append({
                            "title": art.get("title", "N/A"),
                            "snippet": art.get("description", "N/A"),
                            "url": art.get("url", ""),
                            "source": art.get("source", {}).get("name", "NewsAPI")
                        })
                    return jsonify({"success": True, "articles": articles, "sourceUsed": "NewsAPI"})
            except Exception as e:
                print(f"NewsAPI query exception: {e}")
                
        return jsonify({"success": False, "error": "Neither TAVILY_API_KEY nor NEWSAPI_KEY is configured on the backend server."}), 500

    print(f"Querying Tavily Search for news '{query}' via SDK...")
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=tavily_key)
        search_data = client.search(query=query, max_results=5)
        articles = []
        for item in search_data.get("results", []):
            articles.append({
                "title": item.get("title", "Search Result"),
                "snippet": item.get("content", "N/A"),
                "url": item.get("url", ""),
                "source": "Tavily Search"
            })
        return jsonify({"success": True, "articles": articles, "sourceUsed": "Tavily"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/transcribe', methods=['POST'])
def handle_transcribe():
    deepgram_key = os.getenv("DEEPGRAM_API_KEY")
    if not deepgram_key:
        return jsonify({"success": False, "error": "DEEPGRAM_API_KEY is not configured on the backend server."}), 500

    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No audio file payload found in upload request."}), 400
        
    audio_file = request.files['file']
    audio_bytes = audio_file.read()
    
    if len(audio_bytes) == 0:
        return jsonify({"success": False, "error": "Audio file payload is empty."}), 400

    print("Uploading audio to Deepgram for voice-to-text transcription...")
    try:
        content_type = audio_file.content_type or 'audio/webm'
        headers = {
            'Authorization': f'Token {deepgram_key}',
            'Content-Type': content_type
        }
        params = {
            'model': 'nova-2',
            'smart_format': 'true',
            'detect_language': 'true'
        }
        
        res = requests.post(
            "https://api.deepgram.com/v1/listen",
            headers=headers,
            params=params,
            data=audio_bytes,
            timeout=30
        )
        
        if res.status_code == 200:
            resp_json = res.json()
            channels = resp_json.get("results", {}).get("channels", [])
            if channels and len(channels) > 0:
                alternatives = channels[0].get("alternatives", [])
                if alternatives and len(alternatives) > 0:
                    transcript = alternatives[0].get("transcript", "")
                    detected_language = resp_json.get("results", {}).get("channels", [{}])[0].get("detected_language", "unknown")
                    return jsonify({
                        "success": True, 
                        "transcript": transcript,
                        "detectedLanguage": detected_language
                    })
            return jsonify({"success": False, "error": "Failed to parse transcription candidates from Deepgram response."}), 500
        else:
            return jsonify({"success": False, "error": f"Deepgram returned status code {res.status_code}: {res.text}"}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/call-gemini', methods=['POST'])
def handle_call_gemini():
    data = request.json or {}
    system_instruction = data.get("systemInstruction", "")
    user_content = data.get("userContent", "")
    response_mime_type = data.get("responseMimeType", "application/json")
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return jsonify({"success": False, "error": "GEMINI_API_KEY is not configured on the backend server."}), 500

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_instruction
        )
        
        config = {
            "temperature": 0.3
        }
        if response_mime_type == "application/json":
            config["response_mime_type"] = "application/json"
            
        response = model.generate_content(
            user_content,
            generation_config=config
        )
        
        return jsonify({
            "success": True,
            "text": response.text
        })
    except Exception as e:
        print(f"Gemini API execution error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", 3000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host='0.0.0.0', port=port, debug=debug)
