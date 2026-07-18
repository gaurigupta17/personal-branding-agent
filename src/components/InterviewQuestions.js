/* ==========================================================================
   CLIENT DISCOVERY INTERVIEW QUESTIONS & NOTEPAD COMPONENT
   ========================================================================== */

import db from '../db.js';
import router from '../router.js';
import toast from './Toast.js';
import layout from './Layout.js';

class InterviewQuestions {
  constructor() {
    this.container = null;
    this.client = null;
    this.activeCategory = 'personalStory';
    this.isGenerating = false;
    this.autosaveTimeout = null;
    
    // Voice recording states
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingState = null;
    
    // The 17 categories required by CLAUDE.md
    this.categories = {
      personalStory: { label: 'Personal Story', icon: 'user' },
      career: { label: 'Career Journey', icon: 'briefcase' },
      failures: { label: 'Failures & Pivots', icon: 'trending-down' },
      achievements: { label: 'Achievements', icon: 'award' },
      lessons: { label: 'Core Lessons', icon: 'book-open' },
      leadership: { label: 'Leadership style', icon: 'users' },
      dailyRoutine: { label: 'Daily Routine', icon: 'clock' },
      business: { label: 'Business Scope', icon: 'activity' },
      industry: { label: 'Industry Insights', icon: 'globe' },
      opinions: { label: 'Opinions / Hot Takes', icon: 'flame' },
      futureGoals: { label: 'Future Goals', icon: 'compass' },
      childhood: { label: 'Childhood Roots', icon: 'home' },
      personality: { label: 'Personality Traits', icon: 'smile' },
      values: { label: 'Core Values', icon: 'shield' },
      books: { label: 'Books & Influences', icon: 'book' },
      habits: { label: 'Habits & Systems', icon: 'check-square' },
      vision: { label: 'Future Vision', icon: 'eye' }
    };
  }

  // Mount component
  async render(container, clientId) {
    this.container = container;
    this.showLoadingSkeleton();
    
    const client = await db.getClient(clientId);
    if (!client) {
      toast.error('Client profile not found.');
      router.navigate('dashboard');
      return;
    }

    this.client = client;
    layout.updateWorkspaceState(client);
    layout.highlightMenu('menu-questions');
    layout.updateBreadcrumbs([
      { label: client.name, hash: `#client/${client.id}` },
      { label: 'Interview Qs', hash: `#client/${client.id}/questions` }
    ]);

    this.draw();
  }

  // Draw loading skeleton screen
  showLoadingSkeleton() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-lg); width: 100%; max-width: 1000px; margin: 0 auto;" class="animate-fade-in">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="skeleton-pulse" style="width: 250px; height: 32px; border-radius: var(--radius-md);"></div>
        </div>
        <div style="display: grid; grid-template-columns: 240px 1fr; gap: var(--space-lg); margin-top: var(--space-xs); align-items: start;">
          <div class="card skeleton-pulse" style="height: 400px; border-radius: var(--radius-lg);"></div>
          <div style="display:flex; flex-direction:column; gap:var(--space-md);">
            <div class="card skeleton-pulse" style="height: 120px; border-radius: var(--radius-md);"></div>
            <div class="card skeleton-pulse" style="height: 120px; border-radius: var(--radius-md);"></div>
            <div class="card skeleton-pulse" style="height: 120px; border-radius: var(--radius-md);"></div>
          </div>
        </div>
      </div>
    `;
  }

  // Draw main structure
  draw() {
    if (!this.container) return;

    // Check if questions generated
    const hasQuestions = this.client.interviewQuestions && Object.keys(this.client.interviewQuestions).length > 0;

    if (this.isGenerating) {
      this._drawLoadingState();
      return;
    }

    if (!hasQuestions) {
      this._drawEmptyState();
      return;
    }

    // Render Side-by-side categories and inputs notepad
    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-md); width: 100%; max-width: 1000px; margin: 0 auto; padding-bottom: var(--space-xxl);">
        
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-md); flex-wrap: wrap;">
          <div>
            <h2>Client Discovery Interview Q&A</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem;">
              Fill in client answers to generate authentic, high-converting posts. Everything is autosaved.
            </p>
          </div>
          <button class="btn btn-secondary" id="btn-regenerate-questions">
            Re-generate Questions <i data-lucide="refresh-cw"></i>
          </button>
        </div>

        <div style="display: grid; grid-template-columns: 240px 1fr; gap: var(--space-lg); margin-top: var(--space-xs); align-items: start;">
          
          <!-- Left categories switcher sidebar -->
          <div class="card" style="padding: var(--space-xs); display:flex; flex-direction:column; gap:2px; max-height:calc(100vh - 160px); overflow-y:auto;">
            ${Object.entries(this.categories).map(([key, data]) => `
              <button class="sidebar-switcher-item btn-category-switch ${this.activeCategory === key ? 'active' : ''}" data-cat="${key}">
                <i data-lucide="${data.icon}" style="width:16px; height:16px;"></i>
                <span>${data.label}</span>
              </button>
            `).join('')}
          </div>

          <!-- Right questions notepad workspace -->
          <div style="display:flex; flex-direction:column; gap:var(--space-md);">
            <div style="border-bottom:1px solid var(--border-color); padding-bottom:8px; display:flex; align-items:center; gap:var(--space-xs);">
              <i data-lucide="${this.categories[this.activeCategory].icon}" style="color:var(--color-accent); width:20px; height:20px;"></i>
              <h3 style="margin:0; font-size:1.15rem;">${this.categories[this.activeCategory].label} Questions</h3>
            </div>
            
            <div class="accordion-container" id="questions-list-notepad">
              <!-- Rendered dynamically -->
            </div>
          </div>

        </div>

      </div>
    `;

    this._renderQuestionsList();
    this._bindInterviewEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  // Draw list of questions with answers textarea
  _renderQuestionsList() {
    const notepad = document.getElementById('questions-list-notepad');
    if (!notepad) return;

    const list = this.client.interviewQuestions[this.activeCategory] || [];
    
    if (list.length === 0) {
      notepad.innerHTML = `<div class="card text-center" style="color:var(--text-muted); font-size:0.85rem;">No questions generated for this category.</div>`;
      return;
    }

    notepad.innerHTML = list.map((item, idx) => `
      <div class="card" style="display:flex; flex-direction:column; gap:var(--space-sm); border:1px solid var(--border-color);">
        <div style="font-weight:600; font-size:0.875rem; color:var(--text-bright); display:flex; gap:8px;">
          <span style="color:var(--color-accent);">Q${idx + 1}:</span>
          <span>${item.question}</span>
        </div>
        <div class="form-group" style="margin-top:5px; position:relative;">
          <textarea class="textarea-input field-interview-answer" 
            data-cat="${this.activeCategory}" 
            data-idx="${idx}" 
            style="min-height:92px; font-size:0.825rem; padding-right: 48px;" 
            placeholder="Type client's notes or verbatim response here...">${item.answer || ''}</textarea>
          <button class="btn btn-secondary btn-icon-only btn-record-voice" 
            data-cat="${this.activeCategory}" 
            data-idx="${idx}" 
            title="Record Voice Answer" 
            style="position: absolute; right: 10px; bottom: 10px; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background-color: var(--bg-card); transition: all 0.2s; border: 1px solid var(--border-color);">
            <i data-lucide="mic" style="width:16px; height:16px; color: var(--text-muted);"></i>
          </button>
        </div>
      </div>
    `).join('');

    // Bind text input event handlers
    notepad.querySelectorAll('.field-interview-answer').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const cat = e.target.getAttribute('data-cat');
        const idx = parseInt(e.target.getAttribute('data-idx'));
        
        if (!this.client.interviewQuestions[cat]) this.client.interviewQuestions[cat] = [];
        this.client.interviewQuestions[cat][idx].answer = e.target.value;

        this.triggerAutosave();
      });
    });

    // Bind record voice button handlers
    notepad.querySelectorAll('.btn-record-voice').forEach(button => {
      button.addEventListener('click', () => {
        const cat = button.getAttribute('data-cat');
        const idx = parseInt(button.getAttribute('data-idx'));
        
        if (this.recordingState && this.recordingState.cat === cat && this.recordingState.idx === idx) {
          this.stopRecording();
        } else {
          this.startRecording(cat, idx, button);
        }
      });
    });
  }

  // Bind interface callbacks
  _bindInterviewEvents() {
    // Re-generate
    const regenBtn = document.getElementById('btn-regenerate-questions');
    if (regenBtn) {
      regenBtn.addEventListener('click', () => {
        if (confirm('Re-generating questions will clear any current interview responses. Proceed?')) {
          this.generateQuestions();
        }
      });
    }

    // Category click
    document.querySelectorAll('.btn-category-switch').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeCategory = btn.getAttribute('data-cat');
        this.draw();
      });
    });
  }

  // Draw empty screen state
  _drawEmptyState() {
    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-lg); width: 100%; max-width: 600px; margin: 0 auto; text-align: center; padding: 4rem var(--space-md);">
        <div style="background-color: var(--color-primary-light); color: var(--color-primary); padding: 1.25rem; border-radius: 50%; width: 72px; height: 72px; display:flex; align-items:center; justify-content:center; font-size:1.85rem; margin: 0 auto;">
          <i data-lucide="help-circle"></i>
        </div>
        <div>
          <h3>Generate Discovery Interview Questions</h3>
          <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 6px;">
            Create 3-4 custom targeted interview questions for each of the 17 categories, tailored directly to your client's career title and industry niche.
          </p>
        </div>
        <button class="btn btn-primary" id="btn-generate-questions-start" style="padding: 0.75rem 1.5rem; font-size: 0.95rem; margin: 0 auto;">
          Generate Targeted Client Questions <i data-lucide="sparkles"></i>
        </button>
      </div>
    `;

    document.getElementById('btn-generate-questions-start').addEventListener('click', () => this.generateQuestions());
    if (window.lucide) window.lucide.createIcons();
  }

  // Loading animation state
  _drawLoadingState() {
    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-lg); width: 100%; max-width: 650px; margin: 0 auto; text-align: center; padding: 4rem var(--space-md);">
        <div class="animate-spin" style="color: var(--color-accent); font-size: 2.5rem; margin:0 auto; width:48px; height:48px; display:flex; align-items:center; justify-content:center;">
          <i data-lucide="loader-2" style="width:48px; height:48px;"></i>
        </div>
        <div>
          <h3>Generating Tailored Interview Questions...</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 6px;">
            Structuring discovery questions across 17 categories including pivots, lessons, routine, childhood, values, and habits...
          </p>
        </div>
        <div style="display:flex; flex-direction:column; gap:var(--space-md); margin-top:10px;">
          <div class="skeleton-pulse" style="height: 100px; border-radius: var(--radius-lg);"></div>
          <div class="skeleton-pulse" style="height: 100px; border-radius: var(--radius-lg);"></div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  // Call API or Fallback templates
  async generateQuestions() {
    this.isGenerating = true;
    this.draw();

    const apiKey = localStorage.getItem('gemini_api_key') || '';
    const useBackend = localStorage.getItem('use_backend_server') === 'true';

    const profileData = `
Name: ${this.client.name}
Title: ${this.client.designation}
Company: ${this.client.company}
Industry: ${this.client.industry}
About: ${this.client.basicInfo.about || ''}
Bio Summary: ${this.client.basicInfo.bio || ''}
Experience: ${this.client.basicInfo.experience || ''} years
Professional Skills: ${this.client.basicInfo.skillsProfessional || ''}
    `;

    if (apiKey || useBackend) {
      const systemInstruction = `You are a professional LinkedIn ghostwriter and business branding strategist.
Generate targeted interview questions designed to extract hook-worthy personal stories and deep technical insights.

Generate exactly 3 targeted questions for each of the 17 categories listed below:
1. personalStory
2. career
3. failures
4. achievements
5. lessons
6. leadership
7. dailyRoutine
8. business
9. industry
10. opinions
11. futureGoals
12. childhood
13. personality
14. values
15. books
16. habits
17. vision

You MUST return a valid JSON object matching this schema exactly:
{
  "personalStory": [
    { "question": "Question text here?", "answer": "" },
    ...
  ],
  "career": [ ... ],
  ...
}

Make the questions specific to their role: ${this.client.designation} and industry: ${this.client.industry}.
Do not wrap response in markdown blocks. Return raw JSON string only.`;

      try {
        const responseText = await this._callGeminiAPI(apiKey, systemInstruction, profileData);
        const parsed = this._cleanAndParseJSON(responseText);

        if (parsed && Object.keys(parsed).length > 0) {
          // Normalize questions to match activeCategory keys
          const normalized = {};
          Object.entries(this.categories).forEach(([key, _]) => {
            normalized[key] = parsed[key] || this._getDefaultQuestionsForCategory(key);
          });
          this.client.interviewQuestions = normalized;
          await db.saveClient(this.client);
          toast.success('Interview questions generated successfully!');
        } else {
          throw new Error('Malformed JSON schema');
        }
      } catch (err) {
        console.error(err);
        toast.error('API generation failed. Loading local questions template fallback...');
        this._runMockQuestions();
      }
    } else {
      this._runMockQuestions();
    }

    this.isGenerating = false;
    this.draw();
  }

  // REST connection
  async _callGeminiAPI(apiKey, systemInstruction, userContent) {
    const useBackend = localStorage.getItem('use_backend_server') === 'true';
    if (useBackend) {
      const backendUrl = localStorage.getItem('backend_server_url') || 'http://127.0.0.1:3000';
      try {
        const response = await fetch(`${backendUrl}/api/call-gemini`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction,
            userContent,
            responseMimeType: "application/json"
          })
        });
        if (!response.ok) {
          throw new Error(`Backend API error: ${response.status}`);
        }
        const data = await response.json();
        if (data.success && data.text) {
          return data.text;
        }
        throw new Error(data.error || 'Empty backend response');
      } catch (err) {
        console.warn('Backend call failed, falling back to direct browser call if API key exists:', err);
        if (!apiKey) throw err;
      }
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{ parts: [{ text: userContent }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error('Empty response candidates');
  }

  _cleanAndParseJSON(rawStr) {
    let cleanStr = rawStr.trim();
    if (cleanStr.startsWith('```')) {
      const match = cleanStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) cleanStr = match[1];
    }
    try {
      return JSON.parse(cleanStr);
    } catch (e) {
      const startIdx = cleanStr.indexOf('{');
      const endIdx = cleanStr.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        try {
          return JSON.parse(cleanStr.substring(startIdx, endIdx + 1));
        } catch (innerErr) {
          console.error(innerErr);
        }
      }
      return null;
    }
  }

  // High-fidelity local template fallback
  _runMockQuestions() {
    const questions = {};
    Object.keys(this.categories).forEach(cat => {
      questions[cat] = this._getDefaultQuestionsForCategory(cat);
    });
    this.client.interviewQuestions = questions;
    db.saveClient(this.client);
    toast.success('Mock Interview questions created successfully!');
  }

  // Hardcoded customized category mappings
  _getDefaultQuestionsForCategory(cat) {
    const job = this.client.designation || 'Consultant';
    const domain = this.client.industry || 'B2B SaaS';
    
    const defaults = {
      personalStory: [
        { question: `What is the single most defining moment of your life that drove you to become a ${job}?`, answer: '' },
        { question: `What is a core childhood memory that still shapes how you operate in ${domain} today?`, answer: '' },
        { question: `Describe a vulnerable personal challenge you overcame that changed your professional perspective.`, answer: '' }
      ],
      career: [
        { question: `Describe your first professional job. What was the most important lesson you took away from it?`, answer: '' },
        { question: `What is the biggest pivot or transition you made in your career, and why did you make it?`, answer: '' },
        { question: `If you could go back to the start of your journey as a ${job}, what advice would you give your younger self?`, answer: '' }
      ],
      failures: [
        { question: `Tell me about a project or business venture in ${domain} that failed completely. What went wrong?`, answer: '' },
        { question: `What was the most painful feedback or review you ever received, and how did it change your methods?`, answer: '' },
        { question: `Describe a time you felt completely out of your depth. How did you navigate that situation?`, answer: '' }
      ],
      achievements: [
        { question: `What is the single proudest milestone or win of your professional career so far?`, answer: '' },
        { question: `Tell me about a specific time you made a major impact for a client or organization. What were the exact metrics?`, answer: '' },
        { question: `What is an achievement you've had that people inside ${domain} rarely talk about or appreciate?`, answer: '' }
      ],
      lessons: [
        { question: `What is a core truth about ${domain} that took you over a decade of operating to finally learn?`, answer: '' },
        { question: `What is the most expensive lesson you've ever had to pay for in business?`, answer: '' },
        { question: `What is one piece of common advice given to young professionals in your role that you strongly disagree with?`, answer: '' }
      ],
      leadership: [
        { question: `How would you describe your leadership style in three words? Give an example of it in action.`, answer: '' },
        { question: `What is the hardest firing or team restructuring decision you've ever had to make?`, answer: '' },
        { question: `How do you handle team misalignment or disagreements on critical project deadlines?`, answer: '' }
      ],
      dailyRoutine: [
        { question: `Walk me through your typical daily routine. How do you structure your morning for peak focus?`, answer: '' },
        { question: `What is one daily habit that is completely non-negotiable for your mental or physical health?`, answer: '' },
        { question: `How do you shut down work at the end of the day and ensure you actually disconnect?`, answer: '' }
      ],
      business: [
        { question: `What is the core services offering or consultant sprint that drives the most value for your clients?`, answer: '' },
        { question: `Who is your absolute ideal target buyer, and what is their number one headache right now?`, answer: '' },
        { question: `What is the primary business bottleneck you are currently trying to solve for your company?`, answer: '' }
      ],
      industry: [
        { question: `What is the most significant trend or disruption happening in ${domain} right now?`, answer: '' },
        { question: `Where do you think most companies in ${domain} are wasting their budget or resources?`, answer: '' },
        { question: `What will the landscape of your industry look like in 5 years? Who will be the winners and losers?`, answer: '' }
      ],
      opinions: [
        { question: `What is your absolute hottest take or contrarian opinion about ${domain}?`, answer: '' },
        { question: `What is a popular trend in your industry that you think is complete corporate fluff?`, answer: '' },
        { question: `Which industry leader or influencer do you think is giving the worst advice right now?`, answer: '' }
      ],
      futureGoals: [
        { question: `Where do you want to take your personal brand and business over the next 18 months?`, answer: '' },
        { question: `What is a major milestone you want to achieve that is completely unrelated to business revenue?`, answer: '' },
        { question: `Are there any new domains or skills you are actively looking to break into or master?`, answer: '' }
      ],
      childhood: [
        { question: `Where did you grow up, and how did your local environment shape your ambition?`, answer: '' },
        { question: `What did your parents do, and what was the most important value they instilled in you?`, answer: '' },
        { question: `What was your favorite hobby or subject as a teenager, and does it connect to your current work?`, answer: '' }
      ],
      personality: [
        { question: `What do you think is your greatest psychological strength? What about your biggest blind spot?`, answer: '' },
        { question: `How do you think your close friends or long-term colleagues would describe your vibe in social settings?`, answer: '' },
        { question: `Are you naturally an introvert or extrovert? How does that impact how you network online?`, answer: '' }
      ],
      values: [
        { question: `What are the top three core values that govern every business partnership you make?`, answer: '' },
        { question: `Tell me about a time you walked away from a lucrative client or deal because it violated your values.`, answer: '' },
        { question: `What does 'success' mean to you at this stage of your life?`, answer: '' }
      ],
      books: [
        { question: `What are the top two books that have had the most profound impact on your worldview?`, answer: '' },
        { question: `Which podcast, blog, or system log do you read religiously every single week?`, answer: '' },
        { question: `Who is a historical figure or model that you look up to, and why?`, answer: '' }
      ],
      habits: [
        { question: `What is a personal habit that you spent years building that completely changed your efficiency?`, answer: '' },
        { question: `What is a bad habit you are actively trying to audit and break right now?`, answer: '' },
        { question: `Do you have a specific system or app you use to organize your thoughts and capture content ideas?`, answer: '' }
      ],
      vision: [
        { question: `If you could change one major thing about how teams communicate in modern business, what would it be?`, answer: '' },
        { question: `What is the ultimate legacy you want to leave behind in your professional field?`, answer: '' },
        { question: `What does a fully 'optimized' business look like to you?`, answer: '' }
      ]
    };

    return defaults[cat] || [
      { question: 'What is your perspective on this topic?', answer: '' },
      { question: 'What is a common misunderstanding people have about this?', answer: '' },
      { question: 'Could you share a practical example or case study?', answer: '' }
    ];
  }

  // Debounced database saves
  triggerAutosave() {
    layout.setAutosaveState('saving');
    if (this.autosaveTimeout) clearTimeout(this.autosaveTimeout);

    this.autosaveTimeout = setTimeout(async () => {
      try {
        // Recalculate progress completion
        this.client.profileCompletion = db.calculateCompletion(this.client);
        
        await db.saveClient(this.client);
        layout.setAutosaveState('saved');
        
        setTimeout(() => {
          if (layout.autosaveState === 'saved') {
            layout.setAutosaveState('hidden');
          }
        }, 2000);
      } catch (err) {
        console.error(err);
        layout.setAutosaveState('hidden');
      }
    }, 500);
  }

  async startRecording(cat, idx, buttonEl) {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      await this.stopRecording();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      this.audioChunks = [];
      this.recordingState = { cat, idx, buttonEl };

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const textarea = this.container.querySelector(`.field-interview-answer[data-cat="${cat}"][data-idx="${idx}"]`);
        
        buttonEl.innerHTML = `<div class="animate-spin" style="width:14px; height:14px; border:2px solid var(--text-muted); border-top-color:transparent; border-radius:50%;"></div>`;
        buttonEl.style.borderColor = 'var(--border-color)';
        buttonEl.style.boxShadow = 'none';
        
        await this.uploadAudio(audioBlob, cat, idx, textarea);
        
        // Stop stream tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Reset recording state
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordingState = null;
        
        // Restore button icon
        buttonEl.innerHTML = `<i data-lucide="mic" style="width:16px; height:16px; color: var(--text-muted);"></i>`;
        if (window.lucide) window.lucide.createIcons();
      };

      this.mediaRecorder.start();
      
      // Update UI for recording state
      buttonEl.innerHTML = `<i data-lucide="square" style="width:14px; height:14px; color: var(--color-danger);"></i>`;
      buttonEl.style.borderColor = 'var(--color-danger)';
      buttonEl.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.4)';
      if (window.lucide) window.lucide.createIcons();
      
      toast.info("Recording voice response... Speak now. Click stop icon when done.");
    } catch (err) {
      console.error('Error starting voice recording:', err);
      toast.error('Could not access microphone. Please check browser permissions.');
    }
  }

  async stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  async uploadAudio(blob, cat, idx, textareaEl) {
    if (!textareaEl) return;
    
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    
    try {
      const backendUrl = localStorage.getItem('backend_server_url') || 'http://127.0.0.1:3000';
      const response = await fetch(`${backendUrl}/api/transcribe`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload returned status ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.transcript) {
        const existing = textareaEl.value.trim();
        const separator = existing ? ' ' : '';
        const updatedVal = existing + separator + data.transcript;
        
        textareaEl.value = updatedVal;
        
        if (!this.client.interviewQuestions[cat]) this.client.interviewQuestions[cat] = [];
        this.client.interviewQuestions[cat][idx].answer = updatedVal;
        this.triggerAutosave();
        
        toast.success(`Speech-to-text success (Language: ${data.detectedLanguage || 'en/hi'})`);
      } else {
        throw new Error(data.error || 'Empty transcript response');
      }
    } catch (err) {
      console.error('Transcribe error:', err);
      toast.error('Voice transcription failed. Ensure backend server is running and DEEPGRAM_API_KEY is valid.');
    }
  }

  destroy() {
    if (this.autosaveTimeout) clearTimeout(this.autosaveTimeout);
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }
  }
}

export const interviewQuestions = new InterviewQuestions();
export default interviewQuestions;
