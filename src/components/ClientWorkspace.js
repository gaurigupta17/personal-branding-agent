/* ==========================================================================
   CLIENT WORKSPACE UI COMPONENT — personal-branding-agent
   ========================================================================== */

import db from '../db.js';
import router from '../router.js';
import toast from './Toast.js';
import layout from './Layout.js';
import { CLIENT_TEMPLATE } from '../constants.js';

// Setup PDF.js worker CDN reference
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
}

class ClientWorkspace {
  constructor() {
    this.container = null;
    this.client = null;
    this.activeTab = 'identity'; // 'identity' | 'brand' | 'journey' | 'business'
    this.autosaveTimeout = null;
    this.recognition = null;
    this.isRecording = false;
    this.isAutofilling = false;
  }

  // Mounts the client workspace page to the viewport
  async render(container, clientId) {
    this.container = container;
    this.showLoadingSkeleton();
    
    // Load Client Details from IndexedDB
    const client = await db.getClient(clientId);
    if (!client) {
      toast.error('Client profile not found.');
      router.navigate('dashboard');
      return;
    }

    this.client = client;
    layout.updateWorkspaceState(client);
    layout.highlightMenu('menu-profile');
    layout.updateBreadcrumbs([
      { label: client.name, hash: `#client/${client.id}` },
      { label: 'Profile Workspace', hash: `#client/${client.id}` }
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
          <div style="display:flex; gap: 8px;">
            <div class="skeleton-pulse" style="width: 120px; height: 36px; border-radius: var(--radius-md);"></div>
            <div class="skeleton-pulse" style="width: 150px; height: 36px; border-radius: var(--radius-md);"></div>
          </div>
        </div>
        <div class="card skeleton-pulse" style="height: 180px; border-radius: var(--radius-lg);"></div>
        <div class="workspace-tab-bar skeleton-pulse" style="height: 40px; border-radius: var(--radius-sm);"></div>
        <div class="card skeleton-pulse" style="height: 250px; border-radius: var(--radius-lg);"></div>
      </div>
    `;
  }

  // Draw core structures and tabs
  draw() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-lg); width: 100%; max-width: 1000px; margin: 0 auto; padding-bottom: var(--space-xxl);">
        
        <!-- Header Banner Details -->
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-md); flex-wrap: wrap;">
          <div>
            <h2 id="workspace-title">${this.client.name}</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem;" id="workspace-subtitle">
              ${this.client.designation || 'Add Title'} &bull; ${this.client.company || 'Add Company'}
            </p>
          </div>
          <div style="display: flex; gap: var(--space-sm);">
            <button class="btn btn-secondary" id="btn-workspace-dashboard">
              <i data-lucide="layout-dashboard"></i> Back to Dashboard
            </button>
            <button class="btn btn-primary" id="btn-workspace-strategy">
              Generate Strategy <i data-lucide="sparkles"></i>
            </button>
          </div>
        </div>

        <!-- Required Field validation warnings header -->
        <div class="card badge-danger hidden" id="validation-warning-banner" style="border: 1px solid rgba(239, 68, 68, 0.3); padding: var(--space-md); display: flex; align-items: center; gap: var(--space-sm);">
          <i data-lucide="alert-octagon" style="color: var(--color-danger); width:20px; height:20px;"></i>
          <div style="color: var(--text-bright); font-size: 0.85rem; font-weight: 500;">
            Required profile fields missing! Please specify <strong>Full Name, Job Title, Company, and Industry</strong> to enable AI strategy calculations.
          </div>
        </div>

        <!-- SECTION 1: INTAKE & KNOWLEDGE INPUT (Compulsory + Document Dropzone + Mic Recorder) -->
        <div class="card" style="display: flex; flex-direction: column; gap: var(--space-md);">
          <h3 style="font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 5px;">
            <i data-lucide="zap" style="width:16px; height:16px; color: var(--color-accent); display:inline-block; vertical-align:middle; margin-right:4px;"></i>
            Quick Intake & Knowledge Input
          </h3>
          
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="client-name">Full Name *</label>
              <input type="text" class="input-text required-field-input" id="client-name" value="${this.client.name}" placeholder="e.g. Gaurav Sharma">
            </div>
            <div class="form-group">
              <label class="form-label" for="client-designation">Designation / Job Title *</label>
              <input type="text" class="input-text required-field-input" id="client-designation" value="${this.client.designation || ''}" placeholder="e.g. VP of Product">
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="client-company">Company / Organisation *</label>
              <input type="text" class="input-text required-field-input" id="client-company" value="${this.client.company || ''}" placeholder="e.g. Acme Tech Solutions">
            </div>
            <div class="form-group">
              <label class="form-label" for="client-industry">Industry / Domain *</label>
              <input type="text" class="input-text required-field-input" id="client-industry" value="${this.client.industry || ''}" placeholder="e.g. B2B SaaS, Growth Marketing">
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="client-linkedinUrl">LinkedIn Profile URL</label>
              <input type="text" class="input-text quick-field-input" id="client-linkedinUrl" value="${this.client.basicInfo?.linkedinUrl || ''}" placeholder="https://linkedin.com/in/username">
            </div>
            <div class="form-group">
              <label class="form-label" for="client-website">Website URL</label>
              <input type="text" class="input-text quick-field-input" id="client-website" value="${this.client.basicInfo?.website || ''}" placeholder="https://example.com">
            </div>
          </div>

          <!-- Divider -->
          <div class="sidebar-divider" style="margin: var(--space-sm) 0;"></div>

          <!-- Speech Voice Recorder & Transcript Textbox -->
          <div class="form-grid-2">
            <div style="display:flex; flex-direction:column; gap:var(--space-sm);">
              <!-- Mic recorder panel -->
              <div class="recorder-container">
                <button class="btn-mic" id="btn-voice-record" title="Record Audio Notes">
                  <i data-lucide="mic" id="record-icon"></i>
                </button>
                <div class="user-info">
                  <span class="recorder-status-text" id="record-status-text" style="font-weight:600; color:var(--text-bright);">Voice Dictation Recorder</span>
                  <span class="doc-meta" style="margin-top:2px;" id="record-helper">Click mic to record discovery interview responses...</span>
                </div>
              </div>

              <!-- Upload picker dropzone -->
              <div class="dropzone" id="knowledge-dropzone" style="flex-grow: 1; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height: 120px;">
                <input type="file" id="knowledge-file-picker" multiple class="hidden" accept=".txt,.csv,.pdf,.docx,image/*">
                <i data-lucide="upload-cloud" class="dropzone-icon" style="margin-bottom: var(--space-xs); width:28px; height:28px;"></i>
                <p style="font-size:0.8rem;">Drag & drop document here or <strong>browse</strong></p>
                <small style="font-size:0.7rem; color:var(--text-muted);">PDF, Word, TXT, CSV, Images (OCR)</small>
              </div>
            </div>

            <!-- Additional info textbox -->
            <div class="form-group">
              <label class="form-label" for="field-additionalInfo">
                Additional Information / Call Transcripts
                <small>(Paste Zoom logs, chat notes, or record speech)</small>
              </label>
              <textarea class="textarea-input" id="field-additionalInfo" style="min-height: 172px; font-size:0.825rem;" placeholder="Paste raw notes, transcripts, or link blogs...">${this.client.knowledge.additionalInfo || ''}</textarea>
            </div>
          </div>

          <!-- Auto-Fill and Documents Grid -->
          <div style="display:flex; justify-content:space-between; align-items:center; gap:var(--space-md); flex-wrap:wrap; margin-top:5px; border-top:1px solid var(--border-color); padding-top:12px;">
            <div class="doc-meta" style="font-weight:500;">
              Files uploaded: <span id="files-count-badge" class="badge badge-primary" style="text-transform:none; border-radius:4px; font-size:0.75rem;">${(this.client.knowledge.files || []).length} items</span>
            </div>
            
            <button class="btn btn-primary" id="btn-ai-autofill">
              <i data-lucide="sparkles"></i> AI Auto-Fill Profile Details
            </button>
          </div>

          <!-- Uploaded files listings drawer -->
          <div class="doc-list" id="attached-docs-list" style="margin-top: 5px;">
            <!-- Rendered by _renderAttachedDocs() -->
          </div>
        </div>

        <!-- SECTION 2: PROFILE REVIEW & EDIT (Sub-Tabs of the 45+ Optional Fields) -->
        <div>
          <h3 style="font-size: 1rem; color: var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom: 12px;">
            Review & Edit Profile Details
          </h3>
          
          <div class="workspace-tab-bar">
            <button class="workspace-tab-btn ${this.activeTab === 'identity' ? 'active' : ''}" data-tab="identity">Personal Info</button>
            <button class="workspace-tab-btn ${this.activeTab === 'brand' ? 'active' : ''}" data-tab="brand">Brand Strategy</button>
            <button class="workspace-tab-btn ${this.activeTab === 'journey' ? 'active' : ''}" data-tab="journey">Biography Stories</button>
            <button class="workspace-tab-btn ${this.activeTab === 'business' ? 'active' : ''}" data-tab="business">Business Scope</button>
          </div>

          <!-- Tab Content Viewport -->
          <div class="tab-content-panel" id="tab-panel">
            <!-- Rendered dynamically by _renderTabContent() -->
          </div>
        </div>

      </div>
    `;

    this._renderTabContent();
    this._renderAttachedDocs();
    this._bindWorkspaceEvents();
    this.checkRequiredValidation();
    
    if (window.lucide) window.lucide.createIcons();
  }

  // Draw Tab specific details
  _renderTabContent() {
    const panel = document.getElementById('tab-panel');
    if (!panel) return;

    const info = this.client.basicInfo || {};
    const loadClass = this.isAutofilling ? 'skeleton-pulse' : '';
    
    if (this.activeTab === 'identity') {
      panel.innerHTML = `
        <div class="card animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-md);">
          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label" for="field-linkedinUrl">LinkedIn Profile URL</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-linkedinUrl" value="${info.linkedinUrl || ''}" placeholder="https://linkedin.com/in/username">
            </div>
            <div class="form-group">
              <label class="form-label" for="field-website">Website</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-website" value="${info.website || ''}" placeholder="https://example.com">
            </div>
            <div class="form-group">
              <label class="form-label" for="field-email">Email Address</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-email" value="${info.email || ''}" placeholder="client@company.com">
            </div>
          </div>

          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label" for="field-location">Location / Geography</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-location" value="${info.location || ''}" placeholder="e.g. San Francisco, CA">
            </div>
            <div class="form-group">
              <label class="form-label" for="field-experience">Years of Experience</label>
              <input type="number" class="input-text optional-field-input ${loadClass}" id="field-experience" value="${info.experience || ''}" placeholder="e.g. 15">
            </div>
            <div class="form-group">
              <label class="form-label" for="field-languages">Languages Spoken</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-languages" value="${info.languages || ''}" placeholder="e.g. English, Spanish">
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="field-skillsProfessional">Key Professional Skills <small>(comma-separated)</small></label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-skillsProfessional" value="${info.skillsProfessional || ''}" placeholder="Product Strategy, Roadmapping, PLG">
            </div>
            <div class="form-group">
              <label class="form-label" for="field-skillsPersonal">Key Personal Skills <small>(comma-separated)</small></label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-skillsPersonal" value="${info.skillsPersonal || ''}" placeholder="Active Listening, Public Speaking, Negotiation">
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="field-hobbies">Personal Hobbies</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-hobbies" value="${info.hobbies || ''}" placeholder="e.g. Hiking, Chess, Photography">
            </div>
            <div class="form-group">
              <label class="form-label" for="field-interests">Personal Interests</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-interests" value="${info.interests || ''}" placeholder="e.g. Decentralized Tech, History, Cooking">
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="field-education">Education Details</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-education" value="${info.education || ''}" placeholder="e.g. MS in Computer Science, Stanford">
            </div>
            <div class="form-group">
              <label class="form-label" for="field-certifications">Certifications</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-certifications" value="${info.certifications || ''}" placeholder="e.g. AWS Certified Architect, Scrum Master">
            </div>
          </div>
        </div>
      `;
    } 
    
    else if (this.activeTab === 'brand') {
      panel.innerHTML = `
        <div class="card animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-md);">
          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label" for="field-targetGeography">Target Geography</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-targetGeography" value="${info.targetGeography || ''}" placeholder="e.g. North America, EU">
            </div>
            <div class="form-group">
              <label class="form-label" for="field-targetCustomers">Target Customers</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-targetCustomers" value="${info.targetCustomers || ''}" placeholder="e.g. Mid-Market SaaS Founders">
            </div>
            <div class="form-group">
              <label class="form-label" for="field-targetAudience">Target Audience Profile</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-targetAudience" value="${info.targetAudience || ''}" placeholder="e.g. VC Partners, Software Architects">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="field-brandPersonality">Brand Personality / Vibe <small>(Select words that characterize them)</small></label>
            <input type="text" class="input-text optional-field-input ${loadClass}" id="field-brandPersonality" value="${info.brandPersonality || ''}" placeholder="e.g. Pragmatic, direct, contrarian, developer-friendly">
          </div>

          <div class="form-group">
            <label class="form-label" for="field-brandVoice">Brand Voice Directives</label>
            <textarea class="textarea-input optional-field-input ${loadClass}" id="field-brandVoice" placeholder="e.g. Written in first person. Zero corporate jargon. Uses technical analogies. Prefers short paragraphs.">${info.brandVoice || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="field-writingStyle">Writing Style Reference <small>(Paste a sample post or outline rules)</small></label>
            <textarea class="textarea-input optional-field-input ${loadClass}" id="field-writingStyle" placeholder="e.g. Paste a post that has the exact sentence structure, length, and formatting you want to emulate...">${info.writingStyle || ''}</textarea>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="field-mission">Mission Statement</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-mission" value="${info.mission || ''}" placeholder="e.g. Help startups build software teams that scale without drama">
            </div>
            <div class="form-group">
              <label class="form-label" for="field-vision">Vision Statement</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-vision" value="${info.vision || ''}" placeholder="e.g. Creating remote work alignment standards for B2B engineering">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="field-values">Core Values / Beliefs</label>
            <input type="text" class="input-text optional-field-input ${loadClass}" id="field-values" value="${info.values || ''}" placeholder="e.g. Transparency, Async first, Technical debt is a leverage, Quality over speed">
          </div>
        </div>
      `;
    } 
    
    else if (this.activeTab === 'journey') {
      panel.innerHTML = `
        <div class="card animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-md);">
          <div class="form-group">
            <label class="form-label" for="field-headline">Current LinkedIn Headline</label>
            <input type="text" class="input-text optional-field-input ${loadClass}" id="field-headline" value="${info.headline || ''}" placeholder="e.g. VP of Product at Acme SaaS | Scale Remote Product Teams">
          </div>

          <div class="form-group">
            <label class="form-label" for="field-bio">LinkedIn Bio Summary</label>
            <textarea class="textarea-input optional-field-input ${loadClass}" id="field-bio" placeholder="Copy paste their short profile summary...">${info.bio || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="field-about">Current LinkedIn About Section</label>
            <textarea class="textarea-input optional-field-input ${loadClass}" id="field-about" placeholder="Copy paste their full About section...">${info.about || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="field-storyProfessional">Professional Journey Story <small>(Career milestones, key pivots, how they got here)</small></label>
            <textarea class="textarea-input optional-field-input ${loadClass}" id="field-storyProfessional" placeholder="e.g. Started coding at 14. Monolith migration lead at Stripe. Founded PM Academy in 2021...">${info.storyProfessional || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="field-storyPersonal">Personal Journey Story <small>(Vulnerable background hooks, childhood lessons, core character events)</small></label>
            <textarea class="textarea-input optional-field-input ${loadClass}" id="field-storyPersonal" placeholder="e.g. Born in a small town. How climbing Mt. Rainier taught me endurance. Overcoming speech anxiety...">${info.storyPersonal || ''}</textarea>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="field-achievements">Key Achievements</label>
              <textarea class="textarea-input optional-field-input ${loadClass}" id="field-achievements" placeholder="e.g. Grew API scale by 300%. Hired and aligned 40 engineers in 6 months...">${info.achievements || ''}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="field-awards">Awards / Recognition</label>
              <textarea class="textarea-input optional-field-input ${loadClass}" id="field-awards" placeholder="e.g. Forbes 30 Under 30 (Tech). Google Developer Expert...">${info.awards || ''}</textarea>
            </div>
          </div>
        </div>
      `;
    } 
    
    else if (this.activeTab === 'business') {
      panel.innerHTML = `
        <div class="card animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-md);">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="field-goalsContent">Content Goals <small>(What do they want to achieve with posts?)</small></label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-goalsContent" value="${info.goalsContent || ''}" placeholder="e.g. Generate 50 inbound consultation inquiries, build authority">
            </div>
            <div class="form-group">
              <label class="form-label" for="field-goalsBusiness">Business Goals <small>(Conversion / Consulting / Retainer goals)</small></label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-goalsBusiness" value="${info.goalsBusiness || ''}" placeholder="e.g. Sell out my $5k Product Strategy Sprint, book 2 keynotes">
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="field-services">Services Offered</label>
              <textarea class="textarea-input optional-field-input ${loadClass}" id="field-services" placeholder="e.g. 1-on-1 CTO coaching, custom system audit retainers...">${info.services || ''}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="field-products">Products Offered</label>
              <textarea class="textarea-input optional-field-input ${loadClass}" id="field-products" placeholder="e.g. SaaS Founders Playbook (Ebook), Microservice Template Kit...">${info.products || ''}</textarea>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="field-idealClient">Ideal Client Profile (ICP)</label>
            <input type="text" class="input-text optional-field-input ${loadClass}" id="field-idealClient" value="${info.idealClient || ''}" placeholder="e.g. Seed-stage tech founders who need to build their first technical team structure">
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="field-books">Books Written</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-books" value="${info.books || ''}" placeholder="e.g. 'The Async Monolith' (2024)">
            </div>
            <div class="form-group">
              <label class="form-label" for="field-podcasts">Podcasts / Media Work</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-podcasts" value="${info.podcasts || ''}" placeholder="e.g. Co-host on 'Scaling Devs Podcast'">
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="field-speaking">Speaking Engagements</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-speaking" value="${info.speaking || ''}" placeholder="e.g. Keynote at QCon 2025, Lead dev panel at TechCrunch">
            </div>
            <div class="form-group">
              <label class="form-label" for="field-media">Media Mentions / Press</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-media" value="${info.media || ''}" placeholder="e.g. Featured in TechCrunch, quotes in Forbes Tech">
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="field-caseStudies">Case Studies / Client Wins</label>
              <textarea class="textarea-input optional-field-input ${loadClass}" id="field-caseStudies" placeholder="e.g. How we migrated SaaS Corp's DB to Postgres, saving 40% query latency...">${info.caseStudies || ''}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="field-testimonials">Testimonials</label>
              <textarea class="textarea-input optional-field-input ${loadClass}" id="field-testimonials" placeholder="e.g. 'Working with Gaurav changed how we write code...' - Sarah, CEO of Fintech Inc.">${info.testimonials || ''}</textarea>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="field-topicsFavorite">Favorite Topics to Discuss <small>(Core Expertise)</small></label>
              <textarea class="textarea-input optional-field-input ${loadClass}" id="field-topicsFavorite" placeholder="Product Ops, async culture, database scaling logs">${info.topicsFavorite || ''}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label" for="field-topicsAvoid">Topics to Avoid Entirely</label>
              <textarea class="textarea-input optional-field-input ${loadClass}" id="field-topicsAvoid" placeholder="Fundraising gossip, personal politics, tech layoffs">${info.topicsAvoid || ''}</textarea>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label" for="field-competitors">Competitors / Peer Accounts</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-competitors" value="${info.competitors || ''}" placeholder="e.g. John PM Analyst, Dev-Systems consultant">
            </div>
            <div class="form-group">
              <label class="form-label" for="field-inspirations">Inspirations / Style Models</label>
              <input type="text" class="input-text optional-field-input ${loadClass}" id="field-inspirations" value="${info.inspirations || ''}" placeholder="e.g. Linear Blog, Notion voice guidelines">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="field-anythingElse">Anything Else / Client Quirks</label>
            <textarea class="textarea-input optional-field-input ${loadClass}" id="field-anythingElse" placeholder="Any specific formatting quirks, words they hate, or unique scheduling rules...">${info.anythingElse || ''}</textarea>
          </div>
        </div>
      `;
    }

    // Attach text input event bindings for optional fields in tabs
    const optionalInputs = panel.querySelectorAll('.optional-field-input');
    optionalInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const fieldName = e.target.id.replace('field-', '');
        if (!this.client.basicInfo) this.client.basicInfo = {};
        this.client.basicInfo[fieldName] = e.target.value;
        
        // Sync with the quick intake field if it is currently rendered
        const quickInput = document.getElementById(`client-${fieldName}`);
        if (quickInput) {
          quickInput.value = e.target.value;
        }
        
        this.triggerAutosave();
      });
    });
  }

  // Draw uploaded document listings inside knowledge card
  _renderAttachedDocs() {
    const list = document.getElementById('attached-docs-list');
    const badge = document.getElementById('files-count-badge');
    if (!list) return;

    const files = this.client.knowledge.files || [];
    
    if (badge) {
      badge.textContent = `${files.length} items`;
    }

    if (files.length === 0) {
      list.innerHTML = '';
      return;
    }

    list.innerHTML = files.map(file => `
      <div class="doc-item animate-fade-in" data-id="${file.id}">
        <div class="doc-item-left">
          <i data-lucide="${this._getFileIcon(file.type)}"></i>
          <div class="doc-details">
            <span class="doc-name">${file.name}</span>
            <span class="doc-meta">${this._formatBytes(file.size)} &bull; ${file.type.split('/')[1] || 'DOC'}</span>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:var(--space-md); overflow:hidden;">
          <div class="doc-meta" style="max-width: 320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; opacity:0.75;">
            Parsed: "${file.parsedText.replace(/\s+/g, ' ').substring(0, 50)}..."
          </div>
          <button class="btn-icon-only btn-delete-file" data-id="${file.id}" title="Remove Document">
            <i data-lucide="x" data-id="${file.id}"></i>
          </button>
        </div>
      </div>
    `).join('');

    // Bind file delete listeners
    list.querySelectorAll('.btn-delete-file').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const fileId = btn.getAttribute('data-id');
        if (confirm('Delete this file context from client knowledge?')) {
          this.client.knowledge.files = this.client.knowledge.files.filter(f => f.id !== fileId);
          await db.saveClient(this.client);
          toast.success('Document removed.');
          this.draw();
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // Bind core workspace and sub-tab listeners
  _bindWorkspaceEvents() {
    // Back to Dashboard
    document.getElementById('btn-workspace-dashboard').addEventListener('click', () => {
      router.navigate('dashboard');
    });

    // Run strategy redirect
    document.getElementById('btn-workspace-strategy').addEventListener('click', () => {
      if (this.checkRequiredValidation()) {
        router.navigate(`client/${this.client.id}/strategy`);
      } else {
        toast.warning('Please resolve required validation alerts first.');
      }
    });

    // AI Auto-Fill Profile Click
    const autofillBtn = document.getElementById('btn-ai-autofill');
    if (autofillBtn) {
      autofillBtn.addEventListener('click', () => this.autofillProfileWithAI());
    }

    // Tab Clicks
    document.querySelectorAll('.workspace-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.getAttribute('data-tab');
        this.draw();
      });
    });

    // Bind required field inputs
    const requiredInputs = document.querySelectorAll('.required-field-input');
    requiredInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const fieldName = e.target.id.replace('client-', '');
        this.client[fieldName] = e.target.value.trim();
        
        // Update workspace headers live
        if (fieldName === 'name') {
          document.getElementById('workspace-title').textContent = e.target.value || 'Unnamed Client';
        }
        if (fieldName === 'designation' || fieldName === 'company') {
          const des = document.getElementById('client-designation').value.trim() || 'Add Title';
          const comp = document.getElementById('client-company').value.trim() || 'Add Company';
          document.getElementById('workspace-subtitle').textContent = `${des} • ${comp}`;
        }

        this.checkRequiredValidation();
        this.triggerAutosave();
      });
    });

    // Bind quick profile fields (LinkedIn and Website)
    const quickInputs = document.querySelectorAll('.quick-field-input');
    quickInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const fieldName = e.target.id.replace('client-', ''); // 'linkedinUrl' or 'website'
        if (!this.client.basicInfo) this.client.basicInfo = {};
        this.client.basicInfo[fieldName] = e.target.value.trim();
        
        // Sync with the tab field if it is currently rendered
        const tabInput = document.getElementById(`field-${fieldName}`);
        if (tabInput) {
          tabInput.value = e.target.value.trim();
        }
        
        this.triggerAutosave();
      });
    });

    // File Drag/Drop picker
    const dropzone = document.getElementById('knowledge-dropzone');
    const picker = document.getElementById('knowledge-file-picker');
    const additionalInfoArea = document.getElementById('field-additionalInfo');

    if (additionalInfoArea) {
      additionalInfoArea.addEventListener('input', (e) => {
        this.client.knowledge.additionalInfo = e.target.value;
        this.triggerAutosave();
      });
    }

    if (dropzone && picker) {
      dropzone.addEventListener('click', () => picker.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
          this._handleKnowledgeFiles(e.dataTransfer.files);
        }
      });

      picker.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this._handleKnowledgeFiles(e.target.files);
        }
      });
    }

    // Voice Dictation Recorder Event
    const recBtn = document.getElementById('btn-voice-record');
    if (recBtn) {
      recBtn.addEventListener('click', () => this.toggleVoiceDictation());
    }
  }

  // Dynamic AI Profile Autofill Engine (Gemini API + fallback mock parsing)
  async autofillProfileWithAI() {
    // Read directly from DOM to prevent any stale state or race conditions
    const notesEl = document.getElementById('field-additionalInfo');
    const linkedinEl = document.getElementById('client-linkedinUrl') || document.getElementById('field-linkedinUrl');
    const websiteEl = document.getElementById('client-website') || document.getElementById('field-website');

    const notes = notesEl ? notesEl.value : (this.client.knowledge.additionalInfo || '');
    const files = this.client.knowledge.files || [];
    const linkedinUrl = linkedinEl ? linkedinEl.value.trim() : (this.client.basicInfo?.linkedinUrl || '');
    const websiteUrl = websiteEl ? websiteEl.value.trim() : (this.client.basicInfo?.website || '');
    
    if (notes.trim() === '' && files.length === 0 && linkedinUrl.trim() === '' && websiteUrl.trim() === '') {
      toast.warning('Please enter a LinkedIn/Website URL, upload files, or type in call transcripts before triggering AI Auto-Fill.');
      return;
    }

    // Keep the current URLs entered by the user
    const currentLinkedinUrl = linkedinUrl;
    const currentWebsiteUrl = websiteUrl;

    // Reset basicInfo to empty template values to prevent stale data leak from previous extractions
    this.client.basicInfo = {
      ...JSON.parse(JSON.stringify(CLIENT_TEMPLATE.basicInfo)),
      linkedinUrl: currentLinkedinUrl,
      website: currentWebsiteUrl
    };

    // Save this cleared state to IndexedDB immediately before the crawl begins
    await db.saveClient(this.client);

    // Trigger loading UI animation state
    this.isAutofilling = true;
    const btn = document.getElementById('btn-ai-autofill');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="refresh-cw" class="animate-spin"></i> Auto-Filling Profile...`;
      if (window.lucide) window.lucide.createIcons();
    }
    
    // Refresh active tab panel to show skeleton indicators
    this._renderTabContent();

    // Crawl URLs if present
    let linkedinScrapedText = '';
    let websiteScrapedText = '';

    if (linkedinUrl.trim() !== '') {
      toast.info('Fetching LinkedIn profile data...');
      let rawText = await this._crawlURL(linkedinUrl);
      if (this._isAuthwallOrEmpty(rawText)) {
        linkedinScrapedText = this._getLinkedInFallbackText(this.client);
        toast.warning('LinkedIn crawl failed (authwall/no API keys). Falling back to mock template.');
      } else {
        linkedinScrapedText = `\n=== CRAWLED LINKEDIN PROFILE ===\n${rawText}\n`;
        toast.success('LinkedIn profile successfully crawled!');
      }
    }

    if (websiteUrl.trim() !== '') {
      toast.info('Fetching website content...');
      let rawText = await this._crawlURL(websiteUrl);
      if (!rawText || rawText.trim().length < 100) {
        websiteScrapedText = this._getWebsiteFallbackText(this.client);
        toast.warning('Website crawl failed or returned empty content. Falling back to mock template.');
      } else {
        websiteScrapedText = `\n=== CRAWLED WEBSITE CONTENT ===\n${rawText}\n`;
        toast.success('Website content successfully crawled!');
      }
    }

    // Compile entire knowledge text
    const fileTexts = files.map(f => `=== FILE NAME: ${f.name} ===\n${f.parsedText}`).join('\n\n');
    let combinedContext = `=== TRANSCRIPTS / NOTES ===\n${notes}\n\n`;
    if (linkedinScrapedText) combinedContext += `${linkedinScrapedText}\n\n`;
    if (websiteScrapedText) combinedContext += `${websiteScrapedText}\n\n`;
    combinedContext += fileTexts;

    const apiKey = localStorage.getItem('gemini_api_key') || '';
    const useBackend = localStorage.getItem('use_backend_server') === 'true';
    
    if (apiKey || useBackend) {
      // --- REAL GEMINI PARSING AND MAPPING ---
      const systemPrompt = `You are an expert profile extractor. Parse the client's unstructured discovery call transcripts and document files.
Extract actual details to fill in these 45 personal branding variables. Do not make up stories or links. If a details is missing, set it to "".

You MUST return your output as a valid JSON object matching this schema EXACTLY:
{
  "linkedinUrl": "LinkedIn URL",
  "website": "website URL",
  "email": "email",
  "location": "location",
  "experience": "years of experience as integer or approximate string",
  "skillsProfessional": "skills separated by commas",
  "skillsPersonal": "skills separated by commas",
  "education": "education summary",
  "certifications": "certs",
  "achievements": "key achievements list",
  "awards": "awards list",
  "languages": "languages",
  "hobbies": "hobbies list",
  "interests": "interests",
  "targetGeography": "geography",
  "targetCustomers": "customers details",
  "targetAudience": "target audience details",
  "writingStyle": "writing style details",
  "mission": "mission",
  "vision": "vision",
  "values": "core beliefs",
  "storyProfessional": "journey details",
  "storyPersonal": "personal journey milestones",
  "bio": "LinkedIn bio draft",
  "about": "LinkedIn about section draft",
  "headline": "headline suggestions",
  "goalsContent": "content goals",
  "goalsBusiness": "business conversion target",
  "services": "services",
  "products": "products",
  "idealClient": "ICP details",
  "brandPersonality": "brand personality",
  "personalTraits": "quirks",
  "brandVoice": "voice directives",
  "contentPreferences": "formats liked",
  "existingContent": "examples if found",
  "books": "books details",
  "podcasts": "podcasts details",
  "speaking": "speeches list",
  "media": "media mentions",
  "caseStudies": "wins",
  "testimonials": "testimonials",
  "topicsFavorite": "favorite topics",
  "topicsAvoid": "topics to avoid",
  "competitors": "competitors list",
  "inspirations": "inspirations",
  "anythingElse": "extra notes"
}

Do not include markdown wrapper, return raw json string only.`;

      try {
        const response = await this._callGeminiAPI(apiKey, systemPrompt, combinedContext);
        const parsed = this._cleanAndParseJSON(response);
        
        if (parsed) {
          // Merge values into client.basicInfo
          this.client.basicInfo = {
            ...(this.client.basicInfo || {}),
            ...parsed
          };

          // Also auto-fill compulsory fields if empty
          if ((!this.client.designation || this.client.designation === '') && parsed.headline) {
            const headlineParts = parsed.headline.split('|').map(p => p.trim());
            this.client.designation = headlineParts[0] || '';
          }
          
          await db.saveClient(this.client);
          toast.success('SaaS Profile auto-filled using AI extraction!');
        } else {
          throw new Error('Failed to parse response JSON');
        }
      } catch (err) {
        console.error(err);
        toast.error('AI Auto-Fill API call failed. Running high-fidelity local extraction fallback...');
        await this._runMockAutofill(combinedContext);
      }
    } else {
      // --- DEMO MOCK EXTRACTION ---
      await this._runMockAutofill(combinedContext);
    }

    // Stop loading UI animation states
    this.isAutofilling = false;
    this.draw();
  }

  async _runMockAutofill(textContext) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const text = textContext.toLowerCase();
        
        const company = this.client.company || 'our company';
        const ind = (this.client.industry || 'B2B SaaS').toLowerCase();
        const designation = this.client.designation || 'Founder & CEO';
        const name = this.client.name || 'Client';

        // Categorize by industry
        let category = 'generic';
        if (ind.includes('tech') || ind.includes('software') || ind.includes('develop') || ind.includes('systems') || ind.includes('engineering') || ind.includes('cloud')) {
          category = 'tech';
        } else if (ind.includes('market') || ind.includes('growth') || ind.includes('seo') || ind.includes('agency') || ind.includes('copywrite')) {
          category = 'marketing';
        } else if (ind.includes('restaurant') || ind.includes('food') || ind.includes('cafe') || ind.includes('hospitality') || ind.includes('retail') || ind.includes('dining')) {
          category = 'restaurant';
        }

        // Dynamic matches based on text keywords and category
        let inferredSkills = 'Strategic Scaling, Business Operations, Leadership Development';
        let inferredAudience = 'Business owners, founders, executive directors';
        let inferredNiche = 'modern business scaling playbooks';
        let inferredLocation = 'San Francisco, CA';

        if (category === 'tech') {
          inferredSkills = 'Systems Architecture, Caching Optimization, Cloud Scaling, Microservice Migrations';
          inferredAudience = 'Tech Directors, CTOs, VPs of Engineering';
          inferredNiche = 'high-performance systems scaling blueprints';
        } else if (category === 'marketing') {
          inferredSkills = 'Conversion Rate Optimization (CRO), Copywriting, B2B Acquisition Loops, SEO Audits';
          inferredAudience = 'CMOs, Growth Marketing Managers, Startup Founders';
          inferredNiche = 'organic lead acquisition strategy';
        } else if (category === 'restaurant') {
          inferredSkills = 'Hospitality Management, Menu Engineering, Guest Experience Design, Franchise Scaling';
          inferredAudience = 'Dining customers, restaurant owners, culinary entrepreneurs';
          inferredNiche = 'boutique gastronomy branding & hospitality operations';
        }

        // Custom regex pulls for email / linkedin
        const emailMatch = textContext.match(/[\w.-]+@[\w.-]+\.\w+/);
        const linkedinMatch = textContext.match(/linkedin\.com\/in\/[\w-]+/);

        // Dynamically configure fields based on matched category
        let educationVal = '';
        let certsVal = '';
        let achievementsVal = '';
        let storyProfVal = '';
        let storyPersVal = '';
        let bioVal = '';
        let aboutVal = '';
        let headlineVal = '';
        let servicesVal = '';
        let productsVal = '';
        let topicsFavVal = '';
        let customUrlSlug = `${name.toLowerCase().replace(/\s+/g, '-')}`;

        if (category === 'restaurant') {
          educationVal = 'Culinary Arts & Business Management Diploma';
          certsVal = 'ServSafe Manager certification, Food Safety Directives';
          achievementsVal = `Launched ${company} to rave reviews, improved guest table turn times by 25%, and scaled operations.`;
          storyProfVal = `Began in the culinary space, mastering guest hospitality and kitchen logistics. Realized the need for high-quality dining spaces and founded ${company}.`;
          storyPersVal = `Travelling through Europe inspired me to bring local, boutique cafe experiences to our community.`;
          bioVal = `${designation} @ ${company} | Creating memorable dining experiences & boutique branding.`;
          aboutVal = `I help build and scale restaurant brands that diners love.\n\nAt ${company}, we focus on guest satisfaction, high-quality ingredients, and seamless hospitality.`;
          headlineVal = `${designation} @ ${company} | Gastronomy Branding & Restaurant Scaling`;
          servicesVal = `1. Private Event Booking\n2. Franchise Consulting\n3. Guest Experience Design Audit`;
          productsVal = `Recipe Ebook, Kitchen operations checklist`;
          topicsFavVal = `Boutique dining, hospitality branding, culinary entrepreneurship`;
          customUrlSlug += '-dining';
        } else if (category === 'marketing') {
          educationVal = 'BA in Marketing & Communications';
          certsVal = 'Google Analytics Expert, HubSpot Content Marketing';
          achievementsVal = `Boosted lead acquisition by 150% and scaled B2B client pipelines.`;
          storyProfVal = `Started as a copywriter, moving into SEO and performance branding. Built our growth frameworks to help brands capture organic search loops.`;
          storyPersVal = `Writing daily newsletters helped me understand what copy actually connects with real human readers.`;
          bioVal = `${designation} @ ${company} | Organic acquisition loops & B2B growth marketing.`;
          aboutVal = `I help companies build organic customer acquisition loops that convert.\n\nOver the last 10 years, I've designed brand frameworks for growth.`;
          headlineVal = `${designation} @ ${company} | Scale Inbound Leads & SEO Marketing`;
          servicesVal = `1. Growth Strategy Consultation\n2. SEO Audit & Roadmap\n3. LinkedIn Personal Branding`;
          productsVal = `Ebook: Organic Acquisition playbook`;
          topicsFavVal = `SEO growth, conversion copywriting, inbound B2B tactics`;
          customUrlSlug += '-growth';
        } else if (category === 'tech') {
          educationVal = 'BS in Computer Science';
          certsVal = 'AWS Solutions Architect, Certified Scrum Master';
          achievementsVal = `Migrated legacy databases with zero downtime, cut server latency by 42%.`;
          storyProfVal = `Began as a developer at Stripe, learning how high-traffic architectures function. Started coaching founders on system bottlenecks.`;
          storyPersVal = `Building complex open-source libraries taught me to value simplicity and modular code.`;
          bioVal = `${designation} @ ${company} | Systems architecture & caching query optimization.`;
          aboutVal = `I help engineering teams optimize their databases and scale cloud servers.\n\nOver the last 12 years, I've audit-tested 50+ monolithic platforms.`;
          headlineVal = `${designation} @ ${company} | Scalable Systems Architecture & CTO Advisory`;
          servicesVal = `1. Database Query Audit\n2. Systems Scale Retainer\n3. CTO Advisory Sprint`;
          productsVal = `Ebook: Async Monolithic blueprints`;
          topicsFavVal = `Database index rules, caching, async dev workflows`;
          customUrlSlug += '-cto';
        } else {
          // Generic business/leadership fallback
          educationVal = 'Bachelor of Business Administration';
          certsVal = 'Executive Leadership Certificate';
          achievementsVal = `Scaled operations, built high-performing teams, and expanded brand market reach.`;
          storyProfVal = `Led cross-functional business divisions prior to starting my entrepreneurship journey at ${company}. Focused on organizational growth and culture.`;
          storyPersVal = `Learning to manage teams under pressure taught me that empathy is the ultimate leadership multiplier.`;
          bioVal = `${designation} @ ${company} | Strategic Operations & Business Scaling.`;
          aboutVal = `I help companies optimize their internal operations and scale their brand footprint.\n\nAt ${company}, we build frameworks for long-term growth.`;
          headlineVal = `${designation} @ ${company} | Strategic Leadership & Brand Scale`;
          servicesVal = `1. Leadership Coaching Sprints\n2. Operational Audits\n3. Strategic Scaling Consultancy`;
          productsVal = `Playbook: Modern Leadership frameworks`;
          topicsFavVal = `Operational efficiency, team scaling, brand positioning`;
          customUrlSlug += '-ceo';
        }
        
        const extracted = {
          linkedinUrl: this.client.basicInfo?.linkedinUrl || (linkedinMatch ? 'https://' + linkedinMatch[0] : `https://linkedin.com/in/${customUrlSlug}`),
          website: this.client.basicInfo?.website || `https://${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          email: this.client.basicInfo?.email || (emailMatch ? emailMatch[0] : `${name.split(' ')[0].toLowerCase()}@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`),
          location: inferredLocation,
          experience: '12',
          skillsProfessional: inferredSkills,
          skillsPersonal: 'Strategic alignment, negotiation, conflict resolution',
          education: educationVal,
          certifications: certsVal,
          achievements: achievementsVal,
          awards: 'Top Industry Voice 2026',
          languages: 'English',
          hobbies: 'Reading, fitness logs',
          interests: 'Market trends, startup blueprints',
          targetGeography: 'Global',
          targetCustomers: `Businesses looking to scale their operations with ${inferredNiche}`,
          targetAudience: inferredAudience,
          writingStyle: 'Write in clear, authoritative, and direct sentences. First person.',
          mission: `Empower brands to grow in the ${this.client.industry || 'business'} space`,
          vision: `Become the standard blueprint for ${inferredNiche}`,
          values: 'Transparency, excellence, customer satisfaction, modular growth',
          storyProfessional: storyProfVal,
          storyPersonal: storyPersVal,
          bio: bioVal,
          about: aboutVal,
          headline: headlineVal,
          goalsContent: `Establish authority and brand presence in the ${this.client.industry || 'business'} industry`,
          goalsBusiness: 'Secure high-ticket consulting clients and partnerships',
          services: servicesVal,
          products: productsVal,
          idealClient: `Brands looking to optimize their workflow and execute ${inferredNiche}`,
          brandPersonality: 'Professional, direct, expert-driven, welcoming',
          personalTraits: 'Detail-oriented, continuous learner, community advocate',
          brandVoice: 'Clear, helpful, peer-to-peer, authoritative',
          contentPreferences: 'Case studies, listicles, educational tutorials',
          existingContent: `Our client scaling case study in ${this.client.industry || 'our domain'}`,
          books: `Guide: ${inferredNiche} Blueprint`,
          podcasts: 'Industry podcast appearances',
          speaking: 'Host: scaling webinars and panels',
          media: 'Featured in local business digest',
          caseStudies: `How we improved performance metrics by 30% for a recent client`,
          testimonials: `"Working with ${name} completely restructured how we approach our strategy." - Client CEO`,
          topicsFavorite: topicsFavVal,
          topicsAvoid: 'Unconstructive criticisms, political arguments',
          competitors: 'Industry standard providers',
          inspirations: 'Top builders in the industry',
          anythingElse: 'Prefers writing direct value-adds.'
        };

        this.client.basicInfo = {
          ...(this.client.basicInfo || {}),
          ...extracted
        };

        // Populate required fields if blank
        if (!this.client.designation || this.client.designation === '') {
          this.client.designation = designation;
        }
        if (!this.client.company || this.client.company === '') {
          this.client.company = company;
        }
        if (!this.client.industry || this.client.industry === '') {
          this.client.industry = this.client.industry || 'B2B SaaS';
        }

        await db.saveClient(this.client);
        toast.success('Mock Auto-Fill completed successfully!');
        resolve();
      }, 1500);
    });
  }

  // --- API SERVICE UTILITIES ---
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
      throw new Error(`API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error('Empty response from model');
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

  // --- URL SCRApING & CRAWLING UTILITIES ---
  async _crawlURL(url) {
    if (!url) return '';
    
    const useBackend = localStorage.getItem('use_backend_server') === 'true';
    if (useBackend) {
      const backendUrl = localStorage.getItem('backend_server_url') || 'http://127.0.0.1:3000';
      try {
        const response = await fetch(`${backendUrl}/api/crawl`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.combinedText) {
            return data.combinedText;
          }
        }
      } catch (err) {
        console.warn('Backend crawler failed, falling back to AllOrigins proxy:', err);
      }
    }

    try {
      let targetUrl = url.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }
      
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) {
        throw new Error(`Fetch error: ${res.status}`);
      }
      const html = await res.text();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const elementsToRemove = doc.querySelectorAll('script, style, head, nav, footer, iframe, noscript');
      elementsToRemove.forEach(el => el.remove());
      
      let text = doc.body ? doc.body.innerText : doc.documentElement.innerText;
      text = text.replace(/\s+/g, ' ').trim();
      return text;
    } catch (err) {
      console.warn(`Failed to crawl URL ${url}:`, err);
      return '';
    }
  }

  _isAuthwallOrEmpty(text) {
    if (!text || text.trim().length < 200) return true;
    const lower = text.toLowerCase();
    return lower.includes('sign in') || 
           lower.includes('login') || 
           lower.includes('log in') || 
           lower.includes('authwall') || 
           lower.includes('join linkedin') ||
           lower.includes('security challenge') ||
           lower.includes('enable javascript');
  }

  _getLinkedInFallbackText(client) {
    const name = client.name || 'Client';
    const designation = client.designation || 'Founder & CEO';
    const company = client.company || 'our company';
    const industry = client.industry || 'Business';
    const linkedinUrl = client.basicInfo?.linkedinUrl || 'https://linkedin.com/in/client-profile';
    const indLower = industry.toLowerCase();
    
    let category = 'generic';
    if (indLower.includes('tech') || indLower.includes('software') || indLower.includes('develop') || indLower.includes('systems') || indLower.includes('engineering') || indLower.includes('cloud')) {
      category = 'tech';
    } else if (indLower.includes('market') || indLower.includes('growth') || indLower.includes('seo') || indLower.includes('agency') || indLower.includes('copywrite')) {
      category = 'marketing';
    } else if (indLower.includes('restaurant') || indLower.includes('food') || indLower.includes('cafe') || indLower.includes('hospitality') || indLower.includes('retail') || indLower.includes('dining')) {
      category = 'restaurant';
    }

    let headline = '';
    let expCurrent = '';
    let expPast = '';
    let expPastTitle = '';
    let expPastDesc = '';
    let edu = '';
    let skills = '';
    let recommendation = '';
    let summary = '';

    if (category === 'restaurant') {
      headline = `${designation} at ${company} | Expert in Gastronomy & Hospitality Operations | Scaling Brands`;
      expCurrent = `Leading dining operations, menu design, and front-of-house logistics for ${company}.`;
      expPastTitle = 'General Manager at DiningGroup (2018 - 2022)';
      expPastDesc = 'Managed culinary shift scheduling, guest safety, and food safety directives, increasing floor turnaround speed by 20%.';
      edu = 'Culinary Institute of America: Bachelor of Arts in Culinary Arts & Food Service Management';
      skills = 'Menu Engineering, Guest Relations, Food Service Safety, Hospitality Operations, Kitchen Logistics, Team Leadership';
      recommendation = `"Their dedication to high-quality dining and floor efficiency completely transformed our guest experiences." - Sarah, Owner at Dining Ventures.`;
      summary = `Experienced ${designation} with a history of scaling hospitality systems. Passionate about food safety, menu optimization, and guest satisfaction.`;
    } else if (category === 'marketing') {
      headline = `${designation} at ${company} | Expert in Conversion Optimization & B2B Acquisition Loops`;
      expCurrent = `Leading organic B2B acquisition loops and landing page copy optimizations at ${company}.`;
      expPastTitle = 'Senior Content Strategist at GrowthAgency (2018 - 2022)';
      expPastDesc = 'Analyzed customer CTR and conversion funnels, generating 40% organic traffic growth.';
      edu = 'New York University: Bachelor of Science in Marketing & Communications';
      skills = 'Content Strategy, Search Engine Optimization, Acquisition Funnels, Copywriting, B2B Marketing, A/B Testing';
      recommendation = `"Their copywriting templates and traffic acquisition funnel audits saved us thousands in paid ad bills." - Sarah, CMO at ScaleUp Inc.`;
      summary = `Experienced ${designation} with a history of scaling marketing channels. Passionate about organic lead generation and content audits.`;
    } else if (category === 'tech') {
      headline = `${designation} at ${company} | Expert in Systems Architecture & Database Scaling`;
      expCurrent = `Leading product engineering and software scaling models at ${company}.`;
      expPastTitle = 'Lead Systems Engineer at Stripe (2018 - 2022)';
      expPastDesc = 'Handled critical microservice migrations and database caching optimizations.';
      edu = 'Stanford University: Master of Science in Computer Science';
      skills = 'Systems Architecture, Caching Optimization, Database Tuning, Microservice Deployments, Code Auditing';
      recommendation = `"Their systems architecture review restructured our query cache and saved us $3,000/month in cloud bills." - Sarah, CTO at Fintech Inc.`;
      summary = `Experienced ${designation} with a history of scaling database systems. Passionate about building modular applications.`;
    } else {
      headline = `${designation} at ${company} | Expert in Operations Management & Organizational Scaling`;
      expCurrent = `Directing daily operations and scaling task workflows at ${company}.`;
      expPastTitle = 'Operations Manager at Corporate Solutions (2018 - 2022)';
      expPastDesc = 'Designed async documentation guidelines and resolved delivery bottlenecks.';
      edu = 'Harvard Business School: Master of Business Administration (MBA)';
      skills = 'Operations Management, Async Operations, Capacity Planning, Workflow Auditing, Team Leadership';
      recommendation = `"Their operations audit restructured our resource capacities and saved hours of management coordination." - Sarah, COO at Logistics Corp.`;
      summary = `Experienced ${designation} with a history of scaling operational workflows. Passionate about async scaling and capacity planning.`;
    }

    return `
=== LINKEDIN PROFILE (AUTO-GENERATED FALLBACK) ===
LinkedIn Profile URL: ${linkedinUrl}
Name: ${name}
Headline: ${headline}
Location: San Francisco Bay Area
Current Position:
- ${designation} at ${company} (2022 - Present)
  * ${expCurrent}
Past Experience:
- ${expPastTitle}
  * ${expPastDesc}
Education:
- ${edu}
Skills:
- ${skills}
Recommendations:
- ${recommendation}
Summary/About:
- ${summary}
`;
  }

  _getWebsiteFallbackText(client) {
    const name = client.name || 'Client';
    const designation = client.designation || 'Founder & CEO';
    const company = client.company || 'our company';
    const industry = client.industry || 'Business';
    const websiteUrl = client.basicInfo?.website || 'https://example-website.com';
    const indLower = industry.toLowerCase();
    
    let category = 'generic';
    if (indLower.includes('tech') || indLower.includes('software') || indLower.includes('develop') || indLower.includes('systems') || indLower.includes('engineering') || indLower.includes('cloud')) {
      category = 'tech';
    } else if (indLower.includes('market') || indLower.includes('growth') || indLower.includes('seo') || indLower.includes('agency') || indLower.includes('copywrite')) {
      category = 'marketing';
    } else if (indLower.includes('restaurant') || indLower.includes('food') || indLower.includes('cafe') || indLower.includes('hospitality') || indLower.includes('retail') || indLower.includes('dining')) {
      category = 'restaurant';
    }

    let hero = '';
    let about = '';
    let services = [];
    let testimonial = '';
    let blog = [];

    if (category === 'restaurant') {
      hero = `Scaling dining experiences and boutique gastronomy operations.`;
      about = `As the ${designation} of ${company}, I have launched multiple culinary concepts. What I found was that floor efficiency and menu design drive 90% of guest retention.`;
      services = [
        'Menu Engineering Audits: Optimizing food costs and pricing architectures.',
        'Floor Operations Optimization: Streamlining table turnover speeds and expediting queues.',
        'Brand Experience Consultations: Designing boutique atmospheres.'
      ];
      testimonial = `"restructured our floor layout and increased turnaround speed by 25%." - Owner, Dining Corp`;
      blog = [
        'How to maintain kitchen morale during a fully booked weekend cover.',
        'The role of aesthetics in boutique restaurant retention.'
      ];
    } else if (category === 'marketing') {
      hero = `Scaling B2B traffic and organic acquisition loops.`;
      about = `As the ${designation} of ${company}, I have audited dozens of landing page copy variants. What I found was that CTR bottlenecks are easily solved with clear hook copywriting.`;
      services = [
        'Acquisition Funnel Audits: Deep-dive review of lead conversion drops.',
        'Copywriting & Content Strategy: Implementing click-worthy hooks and templates.',
        'SEO Audits & Keywords: Restructuring schema keywords for organic CTR.'
      ];
      testimonial = `"optimized our search copies and increased landing page conversions by 40%." - CMO, ScaleUp Inc`;
      blog = [
        'Why we focus on organic landing page loops over paid campaign spends.',
        'A blueprint for building content pillars that rank on search feeds.'
      ];
    } else if (category === 'tech') {
      hero = `Scaling software architectures and product strategies.`;
      about = `As the ${designation} of ${company}, I have audited dozens of monolithic and microservice apps. What I found was that query optimization solves most database scaling spikes.`;
      services = [
        'Systems Architecture Audits: Reviewing database query performance and cache TTLs.',
        'Database Optimization Retainer: Optimizing Redis and Postgres connection pools.',
        'CTO Advisory Sprint: Alignment guidelines for engineering velocity.'
      ];
      testimonial = `"optimized our database configurations and saved us $3,000/month in cloud bills." - CTO, Fintech Inc`;
      blog = [
        'Why we prefer async monolithic structures over complex microservices.',
        'The early-morning coding routine that keeps my system design clean.'
      ];
    } else {
      hero = `Scaling operational throughput and workflow logistics.`;
      about = `As the ${designation} of ${company}, I have designed async workflows for high-growth businesses. What I found was that workflow micro-managing is the main scaling bottleneck.`;
      services = [
        'Operations Strategy Review: Reviewing onboarding bottlenecks and cycle lags.',
        'Workflow Optimization: Implementing async documentation and capacity models.',
        'Leadership Advisory Sprint: Transitioning founders from task doers to systems designers.'
      ];
      testimonial = `"restructured our operational delivery pipelines and saved hours of management sync." - COO, Logistics Corp`;
      blog = [
        'How to transition your scaling team to 100% async updates.',
        'The checklist for leaders trying to step back from micro-management.'
      ];
    }

    return `
=== WEBSITE HOMEPAGE (AUTO-GENERATED FALLBACK) ===
Title: ${company} | Advisory & Consulting by ${name}
URL: ${websiteUrl}
Hero: ${hero}
About ${name}:
${about}
Services:
1. ${services[0]}
2. ${services[1]}
3. ${services[2]}
Clients & Testimonials:
- ${testimonial}
Latest Blog Posts:
- ${blog[0]}
- ${blog[1]}
Contact: contact@example.com
`;
  }

  // --- FILE PARSER INTEGRATIONS ---
  async _handleKnowledgeFiles(files) {
    layout.setAutosaveState('saving');
    let successfullyAdded = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await this._extractFileText(file);
        
        const docRecord = {
          id: 'doc_' + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          parsedText: text
        };

        if (!this.client.knowledge.files) this.client.knowledge.files = [];
        this.client.knowledge.files.push(docRecord);
        successfullyAdded++;
      } catch (err) {
        console.error(err);
        toast.error(`Failed to parse file: ${file.name}`);
      }
    }

    if (successfullyAdded > 0) {
      await db.saveClient(this.client);
      layout.setAutosaveState('saved');
      toast.success(`Successfully parsed & attached ${successfullyAdded} documents!`);
      this.draw();
    } else {
      layout.setAutosaveState('hidden');
    }
  }

  _extractFileText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      if (file.type.startsWith('text/')) {
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('TXT reading failed'));
        reader.readAsText(file);
      } 
      else if (file.type.startsWith('image/')) {
        Tesseract.recognize(
          file,
          'eng'
        ).then(({ data: { text } }) => {
          resolve(text);
        }).catch(err => reject(err));
      } 
      else if (file.type === 'application/pdf') {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target.result;
            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              const content = await page.getTextContent();
              const pageStr = content.items.map(item => item.str).join(' ');
              fullText += pageStr + '\n';
            }
            resolve(fullText);
          } catch (err) { reject(err); }
        };
        reader.onerror = () => reject(new Error('PDF loading failed'));
        reader.readAsArrayBuffer(file);
      } 
      else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target.result;
            const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            resolve(result.value);
          } catch (err) { reject(err); }
        };
        reader.onerror = () => reject(new Error('DOCX loading failed'));
        reader.readAsArrayBuffer(file);
      } 
      else {
        resolve(`[Non-text context document attached: name=${file.name}, type=${file.type}, size=${file.size}]`);
      }
    });
  }

  // --- SPEECH RECORD DICTATION ---
  toggleVoiceDictation() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Web Speech API is not supported in this browser. Try Google Chrome.');
      return;
    }

    const recBtn = document.getElementById('btn-voice-record');
    const statusText = document.getElementById('record-status-text');
    const helperText = document.getElementById('record-helper');
    const recordIcon = document.getElementById('record-icon');
    const additionalInfoArea = document.getElementById('field-additionalInfo');

    if (!this.recognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isRecording = true;
        recBtn.classList.add('recording');
        statusText.classList.add('recording');
        statusText.textContent = 'Recording live voice note...';
        helperText.textContent = 'Speak clearly. Speech is transcribed directly in the text area below. Click mic again to stop.';
        recordIcon.setAttribute('data-lucide', 'square');
        if (window.lucide) window.lucide.createIcons();
      };

      this.recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        
        if (finalTranscript) {
          const currentText = additionalInfoArea.value;
          const separator = currentText.length > 0 && !currentText.endsWith('\n') ? '\n' : '';
          additionalInfoArea.value = currentText + separator + finalTranscript;
          
          this.client.knowledge.additionalInfo = additionalInfoArea.value;
          this.triggerAutosave();
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone permission denied. Click the lock/settings icon in your browser URL bar and set Microphone to "Allow".');
        } else if (event.error === 'service-not-allowed') {
          toast.error('Speech recognition service blocked. (If using Brave, go to Settings -> Privacy and security -> Shields, or check Web Speech flags).');
        } else if (event.error === 'network') {
          toast.error('Network communication error. Note that browser-native speech recognition requires an internet connection.');
        } else if (event.error === 'audio-capture') {
          toast.error('No microphone found. Please connect a microphone or verify it is not in use by another app.');
        } else if (event.error !== 'no-speech') {
          toast.error(`Voice capture error: ${event.error}`);
        }
        this.stopRecording();
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        recBtn.classList.remove('recording');
        statusText.classList.remove('recording');
        statusText.textContent = 'Voice Dictation Recorder';
        helperText.textContent = 'Click mic to record discovery interview responses...';
        recordIcon.setAttribute('data-lucide', 'mic');
        if (window.lucide) window.lucide.createIcons();
      };
    }

    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.recognition.start();
    }
  }

  stopRecording() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
  }

  // --- VALIDATION AND AUTO SAVE ---
  checkRequiredValidation() {
    const requiredInputs = document.querySelectorAll('.required-field-input');
    const warningBanner = document.getElementById('validation-warning-banner');
    const btnStrategy = document.getElementById('btn-workspace-strategy');
    
    let isAllValid = true;
    const requiredKeys = ['name', 'designation', 'company', 'industry'];
    requiredKeys.forEach(key => {
      const val = this.client[key];
      if (!val || val.trim() === '') {
        isAllValid = false;
      }
    });

    if (requiredInputs.length > 0) {
      requiredInputs.forEach(input => {
        const fieldName = input.id.replace('client-', '');
        if (!this.client[fieldName] || this.client[fieldName].trim() === '') {
          input.classList.add('validation-error');
        } else {
          input.classList.remove('validation-error');
        }
      });
    }

    if (warningBanner) {
      if (isAllValid) warningBanner.classList.add('hidden');
      else warningBanner.classList.remove('hidden');
    }

    if (btnStrategy) {
      if (isAllValid) {
        btnStrategy.removeAttribute('disabled');
        btnStrategy.style.opacity = '1';
        btnStrategy.style.pointerEvents = 'auto';
      } else {
        btnStrategy.setAttribute('disabled', 'true');
        btnStrategy.style.opacity = '0.5';
        btnStrategy.style.pointerEvents = 'none';
      }
    }

    return isAllValid;
  }

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

  destroy() {
    this.stopRecording();
    if (this.autosaveTimeout) clearTimeout(this.autosaveTimeout);
  }

  _getFileIcon(mimeType) {
    if (mimeType.includes('pdf')) return 'file-text';
    if (mimeType.includes('word') || mimeType.includes('officedocument')) return 'file-edit';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('text/')) return 'file-code';
    return 'file';
  }

  _formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

export const clientWorkspace = new ClientWorkspace();
export default clientWorkspace;
