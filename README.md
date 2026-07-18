# Personal Branding AI Agent

A premium, production-ready, client-management and content strategy platform designed for agencies to scale personal branding for executives, founders, and creators on LinkedIn.

This platform operates as a secure single-page application (SPA) with local-first persistence (IndexedDB) and a Python Flask proxy backend to orchestrate state-of-the-art AI generation, web scraping, and transcription models.

---

## Table of Contents

- [Core Features](#core-features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Environment Variables](#environment-variables)
- [Technical Architecture Details](#technical-architecture-details)
  - [Data Model & Autosave](#data-model--autosave)
  - [Scraping & Integration Pipeline](#scraping--integration-pipeline)
  - [Content Audit Protocol (Quality Gate)](#content-audit-protocol-quality-gate)
- [Future Scalability](#future-scalability)
- [License](#license)

---

## Core Features

### 1. Client Management Dashboard
- **Scale Unlimited Profiles**: Manage hundreds of clients through a clean, unified dashboard reminiscent of premium tools like Notion and Linear.
- **Search & Filter**: Find client records instantly using keyword search across names, roles, and industries.
- **Visual Completion Indicators**: Monitor the progress of each client profile with an automated completion percentage calculator (based on inputs, files, and strategies populated).
- **Client Cards**: Display name, designation, company, industry, status, and last modified date.
- **Quick Operations**: Add new profiles, duplicate existing client databases, or delete clients with simple, intuitive actions.

### 2. Deep Client Profiling & Knowledge Base
- **Granular Questionnaires**: Capture essential metadata (e.g., target geography, reading level, values, inspirations, podcasts, books written) alongside required business metrics.
- **Local Document Ingestion**: Client-side document processing for documents:
  - **PDF Extraction**: Extracts text locally using `pdf.js`.
  - **Word Docs (DOCX)**: Parses content using `mammoth.js`.
  - **Images & OCR**: Runs client-side optical character recognition (OCR) on screenshots/images using `tesseract.js`.
- **Large-scale Text Ingestion**: Dedicate textareas for Sales Call Transcripts, Zoom logs, and long-form articles. All uploaded files and text are unified into a single client-specific knowledge base.

### 3. Automated LinkedIn Strategy Synthesis
- **Dynamic Content Pillars**: Synthesizes **exactly 5 pillars** tailored to the client's experience.
  - *Note*: One pillar is always reserved for **Industry News & Trends**, which uses real-time web searches to stay fresh.
- **Audience Matrix**: Outlines Primary, Secondary, Buying, and Networking audiences, with pain points and reading level parameters.
- **LinkedIn Voice Signature**: Recommends tone, sentence lengths, emoji levels, hooks, and call-to-actions (CTAs).
- **Profile SEO & Engagement Matrix**: Generates search terms, connection request templates, growth tactics, and weekly/monthly routine planners.

### 4. LinkedIn Profile Optimizer
- **Hero Assets**: Generates 5 variations of LinkedIn Banner Texts, Headlines, and Bio/About descriptions.
- **Experience Improvements**: Replaces standard resume copy with accomplishment-driven bullet points.
- **Strategic Placements**: Suggests Creator Mode topics, custom URLs, and high-value search terms.

### 5. Content Idea Generator & Interview Simulator
- **Intelligent Questioning**: Spawns unique interview questions across categories like personal history, routine, failures, achievements, and core opinions to extract authentic story angles.
- **Interactive Recorder**: Supports audio recordings for interviews, transcribing voice responses directly into text inputs.

### 6. Advanced Post Generator & Editor
- **Multi-Draft Output**: Automatically constructs two highly distinct options (Draft A and Draft B) per topic.
- **Interactive Customizer**: Tweak word count limits (100, 150, 200, 300, 500, or custom), tone selections, call-to-actions, and structural templates (Problem-Agitate-Solve, AIDA, Listicle, Carousel Script, Thread Style, Founder POV).
- **Refinement Suite**: Modify drafts on the fly (expand, shorten, humanize, rewrite, toggle between professional and emotional styling).
- **Self-Auditing Mechanism**: Runs the proprietary **Content Audit Protocol** to flag and score drafts, catching AI clichés and structure violations before content delivery.

---

## Architecture & Tech Stack

### Frontend (SPA)
- **Runtime & UI**: Vanilla ES6 JavaScript modules, HTML5 semantic elements, and raw responsive CSS3. 
- **Styling**: Curated responsive stylesheets (`css/`) adopting modern design patterns like custom HSL theme tokens, glassmorphic effects, and dark/light modes.
- **Icons**: [Lucide Icons](https://lucide.dev/) for crisp, uniform iconography.
- **Local Services**: 
  - `IndexedDB` (wrapped in a native JS promise-based handler `db.js`) for fast local-first storage.
  - Client-side parser integrations (`pdf.min.js`, `mammoth.browser.min.js`, `tesseract.min.js`).

### Backend (Python Flask Proxy)
- **Web Framework**: Flask with CORS enabled to serve as a secure API router.
- **AI Models**: Integrates `google-generativeai` utilizing `gemini-2.5-flash` for high-throughput, low-latency strategy generation and text synthesis.
- **Web Crawlers**: 
  - **Firecrawl SDK**: Used to pull markdown representations of target websites.
  - **Tavily Search API**: Provides real-time internet search inputs for industry news.
  - **Proxycurl API**: Fetches live public LinkedIn profile and company page payloads securely.
  - **BeautifulSoup4**: Standard fallback scraper for websites.
- **Audio Processing**: **Deepgram API** (using Nova-2) handles high-fidelity voice-to-text transcriptions for client interviews.

---

## Project Directory Structure

```
personal-branding-agent/
├── css/                     # Modulized UI stylesheets
│   ├── base.css             # CSS variables, typography, scrollbars, reset rules
│   ├── components.css       # Cards, buttons, tabs, inputs, toast, modal styling
│   ├── dashboard.css        # Layout patterns and components for client dashboard
│   └── layout.css           # Workspace structural layouts and sidebar alignments
├── src/                     # Client application source files (ES Modules)
│   ├── components/          # Reusable dashboard and workspace components
│   │   ├── BrandingStrategy.js   # Renders the 5 pillars, voice, SEO, and engagement plans
│   │   ├── ClientWorkspace.js    # Client details form, OCR, document ingestion, and files list
│   │   ├── ContentGenerator.js   # Interface for generating/refining drafts with the QA engine
│   │   ├── Dashboard.js          # Main client listing grid, search, and duplicate/delete triggers
│   │   ├── InterviewQuestions.js # Question cards with voice recorder integrations
│   │   ├── Layout.js             # Workspace shell layout and sidebar navigation
│   │   └── Toast.js              # Overlay micro-feedback notifications
│   ├── app.js               # Entry script; boots DB and initializes routes
│   ├── constants.js         # Client templates, field configurations, and drop-down arrays
│   ├── db.js                # Local IndexedDB service, autosave logic, and progress calculations
│   └── router.js            # Hash-based SPA routing controller
├── server/                  # Backend proxy server files
│   ├── .env.example         # Template for security environment keys
│   ├── requirements.txt     # Python backend dependencies
│   ├── server.py            # Flask proxy backend endpoints
│   └── package.json         # Legacy configuration script
├── index.html               # Main application template (loads client scripts)
└── claude.md                # Specifications and master architectural instructions
```

---

## Getting Started

### Prerequisites
- **Node.js** (for running a local HTTP server to host the SPA)
- **Python 3.8+** (for executing the Flask proxy server)

### Backend Setup
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your `.env` file (see [Environment Variables](#environment-variables)).
5. Run the Flask server:
   ```bash
   python server.py
   ```
   *The server defaults to port `3000` (or `PORT` specified in your `.env`).*

### Frontend Setup
Because the frontend relies on ES6 modules (`import`/`export`), it must be served through an HTTP server rather than loaded directly as a local file (`file://`).

You can use any static server. For example, using Python or `npx`:

**Option A (Python):**
In the root directory, run:
```bash
python3 -m http.server 8000
```

**Option B (Node/npx):**
In the root directory, run:
```bash
npx serve -l 8000
```
Open `http://localhost:8000` in your web browser.

---

## Environment Variables

Create a file named `.env` in the root workspace folder (or inside the `server/` directory as Flask will load it). Refer to `server/.env.example` as a template:

```env
# Server Port
PORT=3000

# Required AI API Key
GEMINI_API_KEY=your_gemini_api_key

# Optional Advanced API Integrations
FIRECRAWL_API_KEY=your_firecrawl_api_key
TAVILY_API_KEY=your_tavily_api_key
PROXYCURL_API_KEY=your_proxycurl_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
```

*Note: If `DEEPGRAM_API_KEY`, `PROXYCURL_API_KEY`, or `FIRECRAWL_API_KEY` are not set, the application automatically falls back to beautifulsoup web scrapers and client-side mock handlers where relevant.*

---

## Technical Architecture Details

### Data Model & Autosave
The client database structure is governed by `src/constants.js` (`CLIENT_TEMPLATE`). Every field on the client profile form contains event listeners that detect changes and automatically persist updates to IndexedDB using a debounce pattern. There is no "Save" button; the status indicator in the app layout reflects the database synchronization state in real-time.

### Scraping & Integration Pipeline
When scraping client websites or public profiles:
1. The backend parses the query.
2. If it is a LinkedIn URL and `PROXYCURL_API_KEY` is present, it pulls deep structured JSON and compiles it into an educational and professional profile summary.
3. If it is a standard URL and `FIRECRAWL_API_KEY` is set, it pulls structural markdown content. If missing, it falls back to standard HTTP requests processed via `BeautifulSoup4`.
4. It calls `gemini-2.5-flash` with a summarization system instruction to produce a 20-30 word topic outline for content seeding.

### Content Audit Protocol (Quality Gate)
The AI ghostwriter is constrained by strict rules to prevent standard "AI speak". Every generated draft undergoes an automated validation check matching these patterns:
- **No Em-dashes (`—`)**: Force commas, colons, or parentheses.
- **No Parallelism Clichés**: Detects and flags "not X, but Y" patterns.
- **No Staccato Stacks**: Blocks lists of three or more fragment sentences in a row.
- **AI Buzzword Filter**: Rejects drafts containing: *game-changer, unlock, delve, leverage, robust, crucial, powerful, ultimately, at the end of the day, that said*.
- **Direct Calls-to-Action**: Flags weak CTAs (e.g. *"feel free to share"*) in favor of targeted ones.

If violations are found, the internal evaluator flags the draft, scores it, and attempts an automated rewrite to output polished, high-scoring variations.

---

## Future Scalability
The project is built with separation of concerns to support rapid deployment of future features:
- **Cross-Platform Scheduling**: Outlets for scheduling content directly to Twitter, Instagram, or email newsletters.
- **Analytics Trackers**: Adapters to pull LinkedIn engagement metrics (likes, impressions) directly into IndexedDB.
- **Interactive Audio Agents**: Voice-guided discovery calls using real-time audio streams.

---

## License
MIT
