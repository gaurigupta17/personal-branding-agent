/* ==========================================================================
   LINKEDIN CONTENT GENERATOR & QUALITY GATE AUDIT COMPONENT
   ========================================================================== */

import db from '../db.js';
import router from '../router.js';
import toast from './Toast.js';
import layout from './Layout.js';
import { CONTENT_PREFS } from '../constants.js';

class ContentGenerator {
  constructor() {
    this.container = null;
    this.client = null;
    this.isGenerating = false;
    this.drafts = []; // Stores current Draft A & Draft B
    
    // Default preset states
    this.tone = 'Conversational';
    this.wordLimit = 150;
    this.ctaType = 'Ask Question';
    this.structure = 'Short Punchy Sentences';
    this.emojiLevel = 'Low';
    this.storytellingLevel = 'Medium';
    this.technicalDepth = 'Medium';
    
    // Topic pre-population
    this.topic = '';
    this.pillar = '';
    this.hookPreset = '';
    this.referenceUrls = '';
    this.fetchedUrlContent = '';
  }

  // Mount view
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
    
    // Reset generator options and drafts state to prevent carrying over data from previous clients
    this.drafts = [];
    this.tone = 'Conversational';
    this.wordLimit = 150;
    this.ctaType = 'Ask Question';
    this.structure = 'Short Punchy Sentences';
    this.emojiLevel = 'Low';
    this.storytellingLevel = 'Medium';
    this.technicalDepth = 'Medium';
    this.topic = '';
    this.pillar = '';
    this.hookPreset = '';
    this.referenceUrls = '';
    this.fetchedUrlContent = '';

    layout.updateWorkspaceState(client);
    layout.highlightMenu('menu-generator');
    layout.updateBreadcrumbs([
      { label: client.name, hash: `#client/${client.id}` },
      { label: 'Content Generator', hash: `#client/${client.id}/posts` }
    ]);

    // Check if a topic outline was clicked from Strategy pillars
    const preloadedStr = localStorage.getItem('selected_post_idea');
    if (preloadedStr) {
      try {
        const preloaded = JSON.parse(preloadedStr);
        this.topic = preloaded.topic || '';
        this.pillar = preloaded.pillar || '';
        this.structure = preloaded.format || 'Short Punchy Sentences';
        this.hookPreset = preloaded.hook || '';
        this.referenceUrls = preloaded.referenceUrl || '';
        
        // Match default tone directives from strategy if they exist
        if (client.strategy && client.strategy.linkedinVoice) {
          const t = client.strategy.linkedinVoice.tone || '';
          const matchedTone = CONTENT_PREFS.TONES.find(pt => t.toLowerCase().includes(pt.toLowerCase()));
          if (matchedTone) this.tone = matchedTone;
        }

        // Consume it
        localStorage.removeItem('selected_post_idea');
      } catch (err) {
        console.error(err);
      }
    }

    this.draw();
  }

  // Draw loading skeleton screen
  showLoadingSkeleton() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-md); width: 100%; max-width: 1100px; margin: 0 auto;" class="animate-fade-in">
        <div>
          <div class="skeleton-pulse" style="width: 320px; height: 32px; border-radius: var(--radius-md); margin-bottom: 8px;"></div>
          <div class="skeleton-pulse" style="width: 240px; height: 18px; border-radius: var(--radius-md);"></div>
        </div>
        <div class="generator-layout">
          <div class="card skeleton-pulse" style="height: 520px; border-radius: var(--radius-lg);"></div>
          <div style="display:flex; flex-direction:column; gap:var(--space-md);">
            <div class="card skeleton-pulse" style="height: 380px; border-radius: var(--radius-lg);"></div>
          </div>
        </div>
      </div>
    `;
  }

  // Draw two-pane interface
  draw() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-md); width: 100%; max-width: 1100px; margin: 0 auto; padding-bottom: var(--space-xxl);">
        
        <!-- Header -->
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-md); flex-wrap: wrap;">
          <div>
            <h2>LinkedIn Content Generator & Audit Gate</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem;">
              Draft original personal brand content calibrated to client strategies and audited for quality.
            </p>
          </div>
        </div>

        <div class="generator-layout">
          
          <!-- LEFT PANEL: PRESETS CONFIGURATION -->
          <div style="display:flex; flex-direction:column; gap:var(--space-md);">
            <div class="card" style="display:flex; flex-direction:column; gap:var(--space-md);">
              <h3 style="font-size:1rem; border-bottom:1px solid var(--border-color); padding-bottom:6px; margin:0;">Presets & Context</h3>
              
              <!-- Reference URL(s) -->
              <div class="form-group">
                <label class="form-label" for="gen-urls">Reference URL(s)</label>
                <div style="display:flex; gap:6px;">
                  <input type="text" class="input-text" id="gen-urls" style="font-size:0.8rem; flex:1;" placeholder="e.g. https://example.com/blog-post" value="${this.referenceUrls || ''}">
                  <button class="btn btn-secondary" id="btn-fetch-url" style="padding: 6px 12px; font-size: 0.75rem; white-space: nowrap;">Fetch Topic</button>
                </div>
                <div id="url-fetch-status" style="font-size: 0.725rem; color: var(--text-muted); margin-top: 4px; display: none;"></div>
              </div>

              <!-- Topic context -->
              <div class="form-group">
                <label class="form-label" for="gen-topic">Post Topic / Brief *</label>
                <textarea class="textarea-input" id="gen-topic" style="min-height:76px; font-size:0.8rem;" placeholder="e.g. Discuss modular database index designs and saved retainer metrics...">${this.topic}</textarea>
              </div>

              <!-- Tone switcher -->
              <div class="form-group">
                <label class="form-label" for="gen-tone">Writing Tone Preset</label>
                <select class="select-input" id="gen-tone">
                  ${CONTENT_PREFS.TONES.map(t => `<option value="${t}" ${this.tone === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
              </div>

              <!-- Post structure -->
              <div class="form-group">
                <label class="form-label" for="gen-structure">Post Layout / Structure</label>
                <select class="select-input" id="gen-structure">
                  ${CONTENT_PREFS.STRUCTURES.map(s => `<option value="${s}" ${this.structure === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </div>

              <!-- CTA types -->
              <div class="form-group">
                <label class="form-label" for="gen-cta">Call To Action (CTA)</label>
                <select class="select-input" id="gen-cta">
                  ${CONTENT_PREFS.CTA_TYPES.map(c => `<option value="${c}" ${this.ctaType === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>

              <!-- Word Count preset rows -->
              <div class="form-group">
                <label class="form-label">Word Limit Target</label>
                <div class="preset-pills-row">
                  ${CONTENT_PREFS.WORD_LIMITS.map(limit => `
                    <button class="preset-pill-btn btn-word-limit ${this.wordLimit === limit ? 'active' : ''}" data-limit="${limit}">
                      ${limit} words
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Advanced slider options -->
              <div style="border-top:1px solid var(--border-color); padding-top:var(--space-md); display:flex; flex-direction:column; gap:var(--space-sm);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.775rem; font-weight:600;">Emoji Density:</span>
                  <select class="select-input" id="gen-emoji" style="width:110px; padding:3px 6px; font-size:0.75rem; border-radius:4px;">
                    <option value="None" ${this.emojiLevel === 'None' ? 'selected' : ''}>None (0)</option>
                    <option value="Low" ${this.emojiLevel === 'Low' ? 'selected' : ''}>Low (1-2)</option>
                    <option value="High" ${this.emojiLevel === 'High' ? 'selected' : ''}>High (3+)</option>
                  </select>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.775rem; font-weight:600;">Storytelling:</span>
                  <select class="select-input" id="gen-story" style="width:110px; padding:3px 6px; font-size:0.75rem; border-radius:4px;">
                    <option value="None" ${this.storytellingLevel === 'None' ? 'selected' : ''}>None</option>
                    <option value="Low" ${this.storytellingLevel === 'Low' ? 'selected' : ''}>Low</option>
                    <option value="Medium" ${this.storytellingLevel === 'Medium' ? 'selected' : ''}>Medium</option>
                    <option value="High" ${this.storytellingLevel === 'High' ? 'selected' : ''}>High</option>
                  </select>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <span style="font-size:0.775rem; font-weight:600;">Technical Depth:</span>
                  <select class="select-input" id="gen-depth" style="width:110px; padding:3px 6px; font-size:0.75rem; border-radius:4px;">
                    <option value="None" ${this.technicalDepth === 'None' ? 'selected' : ''}>Conceptual</option>
                    <option value="Medium" ${this.technicalDepth === 'Medium' ? 'selected' : ''}>Medium</option>
                    <option value="High" ${this.technicalDepth === 'High' ? 'selected' : ''}>Deep-dive</option>
                  </select>
                </div>
              </div>

              <button class="btn btn-primary btn-full" id="btn-generate-drafts" style="margin-top:5px;">
                Generate Twin Drafts <i data-lucide="sparkles"></i>
              </button>
            </div>

            <!-- Saved History Panel -->
            <div class="card" style="display:flex; flex-direction:column; gap:var(--space-sm);">
              <h3 style="font-size:0.95rem; border-bottom:1px solid var(--border-color); padding-bottom:6px; margin:0;">Saved History</h3>
              <div class="history-list" id="saved-drafts-history">
                <!-- Rendered dynamically -->
              </div>
            </div>
          </div>

          <!-- RIGHT PANEL: GENERATOR VIEWPORT -->
          <div style="display:flex; flex-direction:column; gap:var(--space-md);" id="viewport-twins-container">
            <!-- Rendered by _renderTwins() -->
          </div>

        </div>

      </div>
    `;

    this._renderTwins();
    this._renderHistory();
    this._bindEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  // Draw twin drafts outputs
  _renderTwins() {
    const container = document.getElementById('viewport-twins-container');
    if (!container) return;

    if (this.isGenerating) {
      container.innerHTML = `
        <div class="card text-center animate-fade-in" style="padding: 4rem 2rem; display:flex; flex-direction:column; gap:var(--space-md); align-items:center;">
          <div class="animate-spin" style="color: var(--color-accent);">
            <i data-lucide="loader-2" style="width:36px; height:36px;"></i>
          </div>
          <h3>Writing Twin Drafts...</h3>
          <p style="color:var(--text-muted); font-size:0.85rem; max-width:400px;">
            Consulting brand pillars, auditing language rules, and crafting custom hooks for LinkedIn feed compatibility. This takes about 3 seconds...
          </p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    if (this.drafts.length === 0) {
      container.innerHTML = `
        <div class="card text-center" style="padding: 4rem 2rem; display:flex; flex-direction:column; gap:var(--space-sm); align-items:center;">
          <div style="background-color: var(--color-primary-light); color:var(--color-primary); padding: 1rem; border-radius: 50%; display:inline-flex; align-items:center; justify-content:center;">
            <i data-lucide="pen-tool" style="width:28px; height:28px;"></i>
          </div>
          <h3>Draft Workspace Empty</h3>
          <p style="color:var(--text-muted); font-size:0.85rem; max-width:400px; margin-top:2px;">
            Configure your post brief and preset requirements in the left panel, then trigger **Generate Twin Drafts** to write content drafts side-by-side.
          </p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Render drafts grid
    container.innerHTML = `
      <div class="twins-grid animate-fade-in">
        ${this.drafts.map((draft, idx) => {
          const audit = this._auditPost(draft.body);
          const scoreClass = audit.score >= 8 ? 'audit-score-high' : (audit.score >= 6 ? 'audit-score-medium' : 'audit-score-low');
          
          return `
            <div style="display:flex; flex-direction:column; gap:var(--space-md);">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <h3 style="font-size:1rem; margin:0; font-weight:700; color:var(--text-bright);">${idx === 0 ? 'Draft A' : 'Draft B'} (${draft.readTime || '1 min read'})</h3>
                <div style="display:flex; gap:6px;">
                  <button class="btn btn-secondary btn-icon-only btn-save-post" data-idx="${idx}" title="Save Draft Version">
                    <i data-lucide="bookmark"></i>
                  </button>
                  <button class="btn btn-secondary btn-icon-only btn-copy-post" data-idx="${idx}" title="Copy to Clipboard">
                    <i data-lucide="copy"></i>
                  </button>
                </div>
              </div>

              <!-- LinkedIn Card Emulator -->
              <div class="linkedin-post-card">
                <div class="linkedin-header">
                  <div class="linkedin-avatar">${this.client.name.substring(0, 2).toUpperCase()}</div>
                  <div class="linkedin-user-details">
                    <span class="linkedin-user-name">${this.client.name}</span>
                    <span class="linkedin-user-headline">${this.client.designation || 'VP of Products'} @ ${this.client.company || 'Startups'}</span>
                    <span class="linkedin-post-time">1h &bull; <i data-lucide="globe" style="width:10px; height:10px; display:inline;"></i></span>
                  </div>
                </div>
                
                <div class="linkedin-body-container" id="post-body-text-${idx}">${draft.body}</div>

                <!-- Quality Gate audit banner -->
                <div class="audit-status-strip ${scoreClass}">
                  <span style="display:flex; align-items:center; gap:4px;">
                    <i data-lucide="${audit.score >= 8 ? 'check-circle' : 'alert-circle'}" style="width:14px; height:14px;"></i>
                    Quality Audit Score: ${audit.score}/10
                  </span>
                  ${audit.score < 8 ? `
                    <button class="btn btn-secondary btn-run-audit-fix" data-idx="${idx}" style="font-size:0.65rem; padding: 2px 6px; border-color:rgba(255,255,255,0.08);">
                      <i data-lucide="sparkles" style="width:10px; height:10px;"></i> Auto-Fix Rewrite
                    </button>
                  ` : '<span>Passed Gate</span>'}
                </div>

                <!-- Audit violations display (Strict Monospace Output Format) -->
                ${audit.score < 8 ? `
                  <div class="audit-warnings-box" style="font-family: monospace; white-space: pre-wrap; line-height: 1.4; padding: var(--space-md); border-color: rgba(239, 68, 68, 0.3);">
Score: [${audit.score}/10]
Weakest line: "${audit.weakestLine}" — ${audit.weakestLineReason}
Violations:
${audit.violations.map(v => `- "${v.match}" → Rule: ${v.rule}`).join('\n')}

Rewrite options for weakest line:
1. ${audit.rewriteOptions[0]}
2. ${audit.rewriteOptions[1]}
3. ${audit.rewriteOptions[2]}
                  </div>
                ` : ''}

                <!-- Creative Extras drawer -->
                <div style="font-size:0.775rem; border-top:1px solid var(--border-color); padding-top:var(--space-xs); display:flex; flex-direction:column; gap:6px; background-color:rgba(255,255,255,0.01); border-radius:4px; padding:6px; margin-top:5px;">
                  <div><strong>Suggested Media Asset:</strong></div>
                  <p style="color:var(--text-muted); margin:0 0 5px 0; font-style:italic;">${draft.imageIdea || 'Mock vector chart mapping retainer gains.'}</p>
                  <div><strong>Search optimization:</strong></div>
                  <div style="display:flex; gap:4px; flex-wrap:wrap;">
                    ${(draft.hashtags || []).map(t => `<span class="badge badge-success">${t}</span>`).join('')}
                    ${(draft.keywordsUsed || []).slice(0, 3).map(k => `<span class="badge badge-primary">${k}</span>`).join('')}
                  </div>
                </div>

                <!-- One-click adjustment toolbar -->
                <div class="adjust-toolbar">
                  <button class="btn btn-secondary btn-adjust-post" data-action="Shorten" data-idx="${idx}" style="font-size:0.7rem; padding:4px 8px;">Shorten</button>
                  <button class="btn btn-secondary btn-adjust-post" data-action="Expand" data-idx="${idx}" style="font-size:0.7rem; padding:4px 8px;">Expand</button>
                  <button class="btn btn-secondary btn-adjust-post" data-action="Humanize" data-idx="${idx}" style="font-size:0.7rem; padding:4px 8px;">Humanize</button>
                  <button class="btn btn-secondary btn-adjust-post" data-action="Stronger Hook" data-idx="${idx}" style="font-size:0.7rem; padding:4px 8px;">Stronger Hook</button>
                  <button class="btn btn-secondary btn-adjust-post" data-action="Change CTA" data-idx="${idx}" style="font-size:0.7rem; padding:4px 8px;">Change CTA</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this._bindTwinsEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  // Draw saved drafts history list
  _renderHistory() {
    const list = document.getElementById('saved-drafts-history');
    if (!list) return;

    const posts = this.client.posts || [];
    
    if (posts.length === 0) {
      list.innerHTML = `<div style="text-align:center; font-size:0.75rem; color:var(--text-muted); padding:var(--space-md);">No drafts saved yet.</div>`;
      return;
    }

    // Sort by timestamp desc
    const sorted = [...posts].sort((a, b) => b.timestamp - a.timestamp);

    list.innerHTML = sorted.map(post => `
      <div class="history-item animate-fade-in" data-id="${post.id}">
        <div class="history-header">
          <span>${post.pillar ? post.pillar.substring(0, 15) + '...' : 'Custom Topic'} &bull; ${new Date(post.timestamp).toLocaleDateString()}</span>
          <button class="btn-icon-only btn-delete-history" data-id="${post.id}" title="Remove Draft" style="padding:2px;">
            <i data-lucide="trash" style="width:12px; height:12px; color:var(--color-danger);"></i>
          </button>
        </div>
        <div class="history-body">${post.content}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
          <span style="font-size:0.675rem; color:var(--text-muted);">Score: ${post.auditScore || 10}/10</span>
          <button class="btn btn-secondary btn-copy-history" data-text="${post.content.replace(/"/g, '&quot;')}" style="font-size:0.65rem; padding: 2px 6px;">
            <i data-lucide="copy" style="width:10px; height:10px;"></i> Copy
          </button>
        </div>
      </div>
    `).join('');

    // Bind history button triggers
    list.querySelectorAll('.btn-copy-history').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._copyText(btn.getAttribute('data-text'), e);
      });
    });

    list.querySelectorAll('.btn-delete-history').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this saved draft version?')) {
          this.client.posts = this.client.posts.filter(p => p.id !== id);
          await db.saveClient(this.client);
          toast.success('Draft version removed.');
          this._renderHistory();
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // Bind presets inputs
  _bindEvents() {
    // Reference URLs input
    const urlsInput = document.getElementById('gen-urls');
    if (urlsInput) {
      urlsInput.addEventListener('input', (e) => {
        this.referenceUrls = e.target.value;
      });
    }

    // Fetch Reference URL(s) Button
    const fetchUrlBtn = document.getElementById('btn-fetch-url');
    if (fetchUrlBtn) {
      fetchUrlBtn.addEventListener('click', () => this.fetchReferenceUrls());
    }

    // Topic text area
    const topicArea = document.getElementById('gen-topic');
    if (topicArea) {
      topicArea.addEventListener('input', (e) => {
        this.topic = e.target.value;
      });
    }

    // Select inputs
    document.getElementById('gen-tone').addEventListener('change', (e) => this.tone = e.target.value);
    document.getElementById('gen-structure').addEventListener('change', (e) => this.structure = e.target.value);
    document.getElementById('gen-cta').addEventListener('change', (e) => this.ctaType = e.target.value);
    document.getElementById('gen-emoji').addEventListener('change', (e) => this.emojiLevel = e.target.value);
    document.getElementById('gen-story').addEventListener('change', (e) => this.storytellingLevel = e.target.value);
    document.getElementById('gen-depth').addEventListener('change', (e) => this.technicalDepth = e.target.value);

    // Word limits buttons
    const limitBtns = this.container.querySelectorAll('.btn-word-limit');
    limitBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        limitBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.wordLimit = parseInt(btn.getAttribute('data-limit'));
      });
    });

    // Generate Twins Trigger
    document.getElementById('btn-generate-drafts').addEventListener('click', () => this.generateTwins());
  }

  // Bind twins viewport triggers
  _bindTwinsEvents() {
    // Save draft version
    this.container.querySelectorAll('.btn-save-post').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        const draft = this.drafts[idx];
        if (!draft) return;

        const audit = this._auditPost(draft.body);

        const newPost = {
          id: 'post_' + Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          pillar: this.pillar || 'Custom Post',
          tone: this.tone,
          content: draft.body,
          auditScore: audit.score,
          creativeExtras: {
            imageIdea: draft.imageIdea,
            carouselIdea: draft.carouselIdea,
            hashtags: draft.hashtags,
            keywords: draft.keywordsUsed
          }
        };

        if (!this.client.posts) this.client.posts = [];
        this.client.posts.push(newPost);
        
        await db.saveClient(this.client);
        toast.success(`Saved Draft ${idx === 0 ? 'A' : 'B'} to client history!`);
        this._renderHistory();
      });
    });

    // Copy to clipboard
    this.container.querySelectorAll('.btn-copy-post').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        const text = document.getElementById(`post-body-text-${idx}`).textContent;
        this._copyText(text, e);
      });
    });

    // Adjustments toolbar triggers
    this.container.querySelectorAll('.btn-adjust-post').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const idx = parseInt(btn.getAttribute('data-idx'));
        this.adjustDraft(idx, action);
      });
    });

    // Quality Gate Auto-fix triggers
    this.container.querySelectorAll('.btn-run-audit-fix').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        this.runQualityFix(idx);
      });
    });
  }

  // Draft Twins parallel generation (Gemini API + local fallbacks)
  async generateTwins() {
    if (this.topic.trim() === '') {
      toast.warning('Please enter a post topic or select an outline first.');
      return;
    }

    this.isGenerating = true;
    this._renderTwins();

    const apiKey = localStorage.getItem('gemini_api_key') || '';
    const useBackend = localStorage.getItem('use_backend_server') === 'true';
    
    // Gathers strategies context
    const basicInfo = this.client.basicInfo || {};
    const strategy = this.client.strategy || {};
    const voiceDirectives = strategy.linkedinVoice || {};
    const audienceInfo = strategy.targetAudience || {};
    
    // Discovery interview answers compiling
    const interviewData = [];
    if (this.client.interviewQuestions) {
      Object.entries(this.client.interviewQuestions).forEach(([cat, questions]) => {
        questions.forEach(q => {
          if (q.answer && q.answer.trim() !== '') {
            interviewData.push(`Q: ${q.question}\nA: ${q.answer}`);
          }
        });
      });
    }

    const promptContext = `
=== CLIENT CORE DETAIL ===
Name: ${this.client.name}
Role: ${this.client.designation}
Company: ${this.client.company}
Industry: ${this.client.industry}

=== STRATEGY CONTEXT ===
Target Audience: ${audienceInfo.primary || ''} / ${audienceInfo.secondary || ''}
Voice Tone Directives: ${voiceDirectives.tone || ''}
Writing Style Guidelines: ${voiceDirectives.writingStyle || ''}
Key SEO Hashtags: ${(strategy.seo || {}).hashtags ? strategy.seo.hashtags.join(', ') : ''}

=== DISCOVERY INTERVIEW ANSWERS ===
${interviewData.length > 0 ? interviewData.join('\n\n') : 'No interview answered yet.'}

=== REFERENCE WEBSITE CONTENT ===
${this.fetchedUrlContent ? this.fetchedUrlContent.substring(0, 8000) : 'No reference website provided.'}

=== POST SETTINGS ===
Topic Title: ${this.topic}
Writing Tone: ${this.tone}
Layout/Structure: ${this.structure}
Target Length: ${this.wordLimit} words
CTA Target: ${this.ctaType}
Emoji Density: ${this.emojiLevel}
Storytelling Level: ${this.storytellingLevel}
Technical Depth: ${this.technicalDepth}
Hook Outline: ${this.hookPreset}
`;

    if (apiKey || useBackend) {
      const systemInstruction = `You are a premium LinkedIn ghostwriter and personal branding strategist.
Generate TWO completely different LinkedIn post drafts (Draft A and Draft B) based on client context and preset instructions.

CRITICAL QUALITY RULES (Content Audit Quality Gate):
- No em dashes anywhere ("—" or "--"). Use parenthesis or semicolons instead.
- No "not X, but Y" parallelisms (e.g. "not scaling speed, but modular coding").
- No staccato fragment stacks (do not write three or more short sentences in a row).
- No AI setup phrases: "here's the thing," "here's why this matters," "the truth is", "the reality is", "delve", "unlock", "leverage", "robust", "crucial", "powerful", "revolutionary".
- No filler transitions: "that said," "ultimately," "at the end of the day".
- Hook must be direct. No credential dumps (e.g. "As a VP of Engineering with 12 years of experience...") before the hook.
- CTAs must be direct and specific (no passive "worth checking out" or "feel free to share").
- NO markdown formatting: LinkedIn does not support markdown syntax. NEVER use bold wrappers ("**") or markdown header lines (like "#", "##", "###"). All text must be clean plain text.
- Bullet points must be clean: use a standard unicode bullet (like "•" or "-" or a clean emoji) followed by a single space, with NO bold text wrapping. Example: "• Operational efficiency: We achieved..." instead of "* **Operational efficiency**: We achieved...".
- Clean indentation: Do not indent bullet points with tabs or spaces.
- Spacing: Leave exactly one blank line between paragraphs and bullet list items. Avoid double blank lines.

Format your response EXACTLY as a valid JSON object matching this schema:
{
  "drafts": [
    {
      "readTime": "1 min read / 2 min read",
      "body": "The full post text containing hook, body, and CTA. Make sure Draft A and Draft B have completely different layouts, angles, and copywriting structures.",
      "imageIdea": "Suggested image template concept",
      "carouselIdea": "Suggested carousel slides topic outline",
      "hashtags": ["#tag1", "#tag2"],
      "keywordsUsed": ["kw1", "kw2"]
    },
    {
      "readTime": "e.g. 2 min read",
      "body": "Alternative post text with completely different storytelling hooks and bodies.",
      "imageIdea": "Alternative image concept",
      "carouselIdea": "Alternative carousel concept",
      "hashtags": ["#tag3", "#tag4"],
      "keywordsUsed": ["kw3", "kw4"]
    }
  ]
}

Return raw JSON string only. Do not wrap in markdown blocks.`;

      try {
        const responseText = await this._callGeminiAPI(apiKey, systemInstruction, promptContext);
        const parsed = this._cleanAndParseJSON(responseText);

        if (parsed && Array.isArray(parsed.drafts) && parsed.drafts.length >= 2) {
          this.drafts = parsed.drafts.slice(0, 2);
          toast.success('Twin drafts generated successfully!');
        } else {
          throw new Error('Malformed drafts schema');
        }
      } catch (err) {
        console.error(err);
        toast.error('AI generation failed. Loading local mock fallbacks...');
        await this._runMockDrafts();
      }
    } else {
      await this._runMockDrafts();
    }

    this.isGenerating = false;
    this.draw();
  }

  // Local fallback templates
  async _runMockDrafts() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const name = this.client.name || 'Client';
        const company = this.client.company || 'our company';
        const role = this.client.designation || 'Leader';
        const ind = this.client.industry || 'Business';
        const topic = this.topic.trim();
        const tone = this.tone || 'Professional';
        const structure = this.structure || 'Standard';
        const cta = this.ctaType;
        const emojiLevel = this.emojiLevel;
        const storyLevel = this.storytellingLevel || 'Medium';
        const techDepth = this.technicalDepth || 'Medium';
        const wordLimit = this.wordLimit || 150;

        // Categorize by industry to make the paragraphs super rich and context-appropriate!
        let category = 'generic';
        const lowerInd = ind.toLowerCase();
        const lowerTopic = topic.toLowerCase();
        if (lowerInd.includes('tech') || lowerInd.includes('software') || lowerInd.includes('develop') || lowerInd.includes('systems') || lowerInd.includes('engineering') || lowerInd.includes('cloud') || lowerTopic.includes('database') || lowerTopic.includes('code') || lowerTopic.includes('server')) {
          category = 'tech';
        } else if (lowerInd.includes('market') || lowerInd.includes('growth') || lowerInd.includes('seo') || lowerInd.includes('agency') || lowerInd.includes('copywrite') || lowerTopic.includes('marketing') || lowerTopic.includes('funnel')) {
          category = 'marketing';
        } else if (lowerInd.includes('restaurant') || lowerInd.includes('food') || lowerInd.includes('cafe') || lowerInd.includes('hospitality') || lowerInd.includes('retail') || lowerInd.includes('dining') || lowerTopic.includes('dinner') || lowerTopic.includes('restaurant') || lowerTopic.includes('kitchen') || lowerTopic.includes('customer service') || lowerTopic.includes('delegation')) {
          category = 'restaurant';
        }

        // Sanitize topic to avoid quality gate overclaims scan failures (like "biggest")
        const sanitizeForPost = (str) => {
          return str
            .replace(/\bbiggest\b/gi, 'main')
            .replace(/\balways\b/gi, 'frequently')
            .replace(/\bnever\b/gi, 'seldom')
            .replace(/\bevery\b/gi, 'most');
        };
        const cleanTopic = sanitizeForPost(topic);

        // Generate custom dynamic hooks based on Tone, Storytelling and Industry
        let hookA = '';
        let hookB = '';

        if (tone === 'Humorous') {
          if (category === 'restaurant') {
            hookA = `If you want to test your team's sanity, let the kitchen ticket printer jam during a busy dinner service.`;
            hookB = `Our dinner service was packed last weekend. Running a busy kitchen prep line taught me that delegating is better than crying in the walk-in freezer.`;
          } else if (category === 'tech') {
            hookA = `If your idea of scaling a database is praying the servers do not crash, I have bad news for your sleep schedule.`;
            hookB = `We resolved our database latency spikes last quarter. Yes, it involved a lot of coffee and very little micro-managing.`;
          } else if (category === 'marketing') {
            hookA = `Stop writing search ad copies that look like they were generated by a robot on its last battery cycle.`;
            hookB = `We grew our landing page conversion rates. It only took about twenty copy rewrites and zero micro-managing.`;
          } else {
            hookA = `If you are still micro-managing every daily update, you might want to check if your calendar has room for sleep.`;
            hookB = `Scaling operations is hard. Doing it while checking every single email is just self-sabotage.`;
          }
        } else if (tone === 'Inspirational') {
          if (category === 'restaurant') {
            hookA = `The most important delegation lesson I learned running a busy dining service changed how I view leadership.`;
            hookB = `Empowering your kitchen and floor staff is the main step to scaling a restaurant brand.`;
          } else if (category === 'tech') {
            hookA = `The key to scaling high-throughput software systems is building engineering trust, not writing every database patch.`;
            hookB = `Empowering your systems engineers is the most important step to resolving technical debt.`;
          } else if (category === 'marketing') {
            hookA = `True growth happens when you trust your content creators to own their acquisition channels.`;
            hookB = `Building a sustainable organic traffic pipeline requires letting go of step-by-step copy control.`;
          } else {
            hookA = `Scaling operations is not about having all the answers. It is about trusting your managers to lead.`;
            hookB = `The best leaders do not create followers. They empower their teams to run workflows autonomously.`;
          }
        } else if (tone === 'Analytical') {
          if (category === 'restaurant') {
            hookA = `We recently analyzed dinner service workflows at ${company} to reduce ticket preparation lag.`;
            hookB = `The data-backed blueprint for reducing table turnaround times and improving kitchen throughput:`;
          } else if (category === 'tech') {
            hookA = `We audited database performance metrics at ${company} to resolve latency spikes.`;
            hookB = `An analysis of database caching models and server throughput efficiency under peak load:`;
          } else if (category === 'marketing') {
            hookA = `We audited landing page traffic metrics at ${company} to reduce customer acquisition costs.`;
            hookB = `A performance analysis of conversion rates, organic keywords, and landing page funnels:`;
          } else {
            hookA = `We audited team capacity metrics at ${company} to resolve operational bottlenecks.`;
            hookB = `An operational analysis of workflow cycle times and team productivity ratios:`;
          }
        } else if (tone === 'Technical') {
          if (category === 'restaurant') {
            hookA = `To optimize dining floor throughput, we mapped kitchen display queue protocols and station handoffs.`;
            hookB = `Operational blueprint: scaling kitchen output capacity during peak dinner service covers.`;
          } else if (category === 'tech') {
            hookA = `To optimize query latencies, we restructured connection pooling and configured Redis cache TTLs.`;
            hookB = `Engineering blueprint: scaling database read throughput during high server traffic spikes.`;
          } else if (category === 'marketing') {
            hookA = `To optimize conversion funnels, we set up keyword schema tags and measured CTR metrics.`;
            hookB = `Marketing blueprint: scaling landing page conversions using keyword intent mapping.`;
          } else {
            hookA = `To optimize workflow logistics, we mapped resource capacities and defined strict task SLA metrics.`;
            hookB = `Operations blueprint: scaling project delivery pipelines using capacity planning models.`;
          }
        } else if (tone === 'Direct & Blunt') {
          if (category === 'restaurant') {
            hookA = `If you are still expediting every dinner plate yourself, you are not a founder. You are a bottleneck.`;
            hookB = `Micromanaging kitchen stations kills restaurant growth. Trust your crew or prepare to close.`;
          } else if (category === 'tech') {
            hookA = `If you are still reviewing every pull request yourself, you are not a lead. You are a bottleneck.`;
            hookB = `Micromanaging server architectures kills software scaling. Trust your engineers or prepare to fail.`;
          } else if (category === 'marketing') {
            hookA = `If you are still editing every landing page word yourself, you are not a marketing leader. You are a bottleneck.`;
            hookB = `Micromanaging search copy kills campaign velocity. Trust your copywriters or prepare to waste budget.`;
          } else {
            hookA = `If you are still approving every daily update yourself, you are not a CEO. You are a bottleneck.`;
            hookB = `Micromanaging team workflows kills organizational growth. Trust your managers or prepare to stall.`;
          }
        } else if (tone === 'Storytelling') {
          if (category === 'restaurant') {
            hookA = `Friday night dinner rush. 7:15 PM. Cafe Pink Roseś had a 45-minute wait line, and the tickets were backing up.`;
            hookB = `Last weekend, we faced 120 guest covers with a short-staffed kitchen. I had to make a choice.`;
          } else if (category === 'tech') {
            hookA = `Production database crash. 3:00 AM. Server logs showed CPU utilization spike to 98% and systems lagging.`;
            hookB = `Last month, our core api gateway was overloaded under traffic spikes. We faced service downtime.`;
          } else if (category === 'marketing') {
            hookA = `Campaign launch morning. 8:00 AM. Landing page conversions had suddenly dropped by half, and ad spend was rising.`;
            hookB = `Last quarter, we had a major organic traffic drop during our biggest sales week. We needed immediate recovery.`;
          } else {
            hookA = `End of the quarter. 5:00 PM. Project backlog was growing, and key client files were delayed.`;
            hookB = `Last month, our main delivery pipelines were jammed with client requests. The team was overwhelmed.`;
          }
        } else if (tone === 'Conversational') {
          if (category === 'restaurant') {
            hookA = `Have you ever tried to run a busy dinner service while micromanaging every single station? It does not work.`;
            hookB = `Let's talk about delegating tasks under pressure on a busy restaurant floor. Here is what I learned.`;
          } else if (category === 'tech') {
            hookA = `Have you ever tried to scale database systems while micromanaging every query pull request? It does not work.`;
            hookB = `Let's talk about scaling database performance under pressure without micromanaging your dev team.`;
          } else if (category === 'marketing') {
            hookA = `Have you ever tried to launch search campaigns while micromanaging every single ad copy draft? It does not work.`;
            hookB = `Let's talk about scaling landing page conversion rates without micromanaging your copywriters.`;
          } else {
            hookA = `Have you ever tried to scale operations while micromanaging every daily task? It does not work.`;
            hookB = `Let's talk about delegating project tasks under pressure without micromanaging your operations team.`;
          }
        } else { // Professional / Default
          if (category === 'restaurant') {
            hookA = `To scale a hospitality startup like ${company}, founders must implement clear station delegation protocols.`;
            hookB = `Running a busy dinner service teaches us that operational efficiency relies on team alignment.`;
          } else if (category === 'tech') {
            hookA = `To scale system performance at ${company}, technical leaders must delegate architectural ownership.`;
            hookB = `Optimizing database performance under load teaches us that server stability relies on engineering trust.`;
          } else if (category === 'marketing') {
            hookA = `To scale customer acquisition at ${company}, growth leaders must delegate channel ownership.`;
            hookB = `Improving landing page conversions teaches us that campaign velocity relies on copywriting trust.`;
          } else {
            hookA = `To scale organizational capacity at ${company}, business leaders must delegate workflow ownership.`;
            hookB = `Improving operational throughput teaches us that business growth relies on management trust.`;
          }
        }

        // Define Paragraph components based on Industry/Category & Word Limit Target
        let introA = '';
        let introB = '';
        let problemA = '';
        let problemB = '';
        let solutionA = '';
        let solutionB = '';
        let resultsA = '';
        let resultsB = '';
        let conclusionA = '';
        let conclusionB = '';
        
        let steps = [];

        if (category === 'restaurant') {
          // Intro Paragraphs
          if (wordLimit <= 150) {
            introA = `During dinner service at Cafe Pink Roseś, the kitchen was packed. I wanted to handle everything myself, but I had to step back.`;
            introB = `We had a 45-minute wait list last weekend. Understaffed in the back, the temptation to micromanage was high, but I stopped myself.`;
          } else if (wordLimit <= 250) {
            introA = `Friday night dinner service is the ultimate operational test. At Cafe Pink Roseś, the kitchen was packed, and ticket times began to climb. My natural instinct was to step in and plate dishes myself, but I knew I would become a bottleneck.`;
            introB = `Managing a busy restaurant floor requires letting go. Last weekend, understaffed on prep lines, we faced heavy covers. I wanted to manage every ticket expediting detail, but I chose to trust our crew instead.`;
          } else { // 300 - 500 words
            introA = `Friday night dinner service is the ultimate operational bottleneck test. By 7:15 PM at Cafe Pink Roseś, the kitchen ticket printer was spitting out orders continuously. We had a 45-minute wait list on the dining floor, and the kitchen was falling behind. As the founder, my natural instinct was to roll up my sleeves, step onto the line, and start plating dishes myself. But I realized that doing so would only make me the bottleneck. True scaling requires step-back leadership on the restaurant floor.`;
            introB = `Managing a busy restaurant floor requires intense trust under pressure. Last weekend, we faced 120 covers with a short-staffed kitchen team. In the past, my response would have been to micromanage every single dinner plate and guest seat. But running Cafe Pink Roseś has taught me that you cannot scale operations if you do not step back. I had to trust our crew to execute their stations autonomously.`;
          }

          // Problem Paragraphs
          if (wordLimit <= 150) {
            problemA = `Micro-managing stations creates confusion. If you do not trust your staff to run their lines, service operations stall.`;
            problemB = `Founders often try to supervise every ticket. This slows down table turns and burns out kitchen capacity.`;
          } else if (wordLimit <= 250) {
            problemA = `The problem is that many restaurant owners try to oversee every dining station. When you micromanage kitchen prep tables or front-of-house seatings, you limit your team's capacity and slow down ticket completion times.`;
            problemB = `Taking shortcuts on team trust is a bad long-term business plan in hospitality. When you try to control every plating detail, you disable your team's ability to execute under pressure. It increases ticket lag.`;
          } else { // 300 - 500 words
            problemA = `The problem is that many restaurant founders try to oversee every single detail in the kitchen. When you micromanage prep tables, salad garnishes, or guest seating arrangements, you limit your team's operational capacity. You create a queue bottleneck at the pass. This slows down ticket completion times and frustrates customers. Service efficiency relies on trusting station owners.`;
            problemB = `Taking shortcuts on team trust is a bad long-term business plan in hospitality. When you try to control every minor table turn and kitchen station detail, you disable your crew's ability to execute under pressure. It creates massive operational drag. This increases ticket lag, slows table turnovers, and ultimately burns out your front-of-house and back-of-house staff.`;
          }

          // Steps details
          steps = [
            `Establish station ownership: We assign specific kitchen stations (grill, prep, expediting) rather than generic helper roles. This ensures every team member knows exactly what they are responsible for during peak service hours.`,
            `Empower floor decision-making: We give our front-of-house staff the authority to handle guest complaints and table seatings autonomously. This avoids constant check-ins and keeps the table turns moving.`,
            `Monitor ticket logistics: We map floor communication using a kitchen display system. We audit ticket times weekly, aiming for an average ticket time of under 15 minutes.`,
            `Set up brief pre-shift standups: We hold a brief 10-minute standup before each shift to review menu changes and predict covers. This aligns the front-of-house and back-of-house teams before the rush begins.`
          ];

          // Results
          if (wordLimit <= 150) {
            resultsA = `This cut our ticket lag and improved floor coordination.`;
            resultsB = `We reduced guest wait times and improved kitchen throughput.`;
          } else if (wordLimit <= 250) {
            resultsA = `Implementing this shift cut our ticket preparation lag and improved shift coordination across the dining floor. We saw better table turnover speeds.`;
            resultsB = `This operations overhaul resulted in a reduction in kitchen errors and saved hours of management coordination during peak times.`;
          } else {
            resultsA = `Implementing these structured delegation workflows changed our operations. We achieved an estimated 25% decrease in ticket times and improved table turnaround speeds. More importantly, it improved kitchen morale, as the crew felt trusted to run their stations autonomously.`;
            resultsB = `This operations overhaul resulted in an estimated 20% reduction in kitchen error rates. It saved our floor managers hours of coordination during busy shifts. More importantly, the kitchen team executed covers with high consistency and zero supervisor interventions.`;
          }

          // Conclusion
          if (wordLimit >= 200) {
            conclusionA = `Ultimately, building a successful hospitality brand is not about being the hero of every dinner service. It is about designing a reliable system that operates smoothly even when you step away. Trust your team, document your station workflows, and protect your leadership bandwidth.`;
            conclusionB = `To build a growing restaurant brand, you must transition from active cook to systems designer. Empower your kitchen staff, set up clear station ownership, and let your team execute. It is the only way to scale your dining operations.`;
          }
        } 
        else if (category === 'tech') {
          // Intro Paragraphs
          if (wordLimit <= 150) {
            introA = `During database performance scaling at ${company}, CPU usage spiked. I wanted to write the query optimizations myself, but I had to step back.`;
            introB = `We faced 98% CPU utilization last quarter. Under high server traffic, the temptation to write database patches myself was high, but I stopped myself.`;
          } else if (wordLimit <= 250) {
            introA = `High database latency is the ultimate engineering operational test. At ${company}, CPU usage spiked to 98% and queues began to backup. My natural instinct was to step in and optimize the SQL query indexes myself, but I knew I would become a bottleneck.`;
            introB = `Managing high-throughput systems requires letting go. Last quarter, understaffed on infra lines, we faced server latency spikes. I wanted to manage every query cache tuning detail, but I chose to trust our systems engineers instead.`;
          } else {
            introA = `High database latency is the ultimate engineering operational bottleneck test. By 3:00 AM at ${company}, our production server CPU utilization spiked to 98%, and query queues were backing up. As the technical leader, my natural instinct was to roll up my sleeves, log in, and start writing the query indexing optimizations myself. But I realized that doing so would only make me the bottleneck. True systems scaling requires step-back technical leadership.`;
            introB = `Managing database performance scaling requires intense trust under pressure. Last month, we faced massive traffic spikes on our core API gateways with a short-staffed infrastructure team. In the past, my response would have been to micromanage every database query and server deployment. But running systems has taught me that you cannot scale operations if you do not step back. I had to trust our engineers to execute.`;
          }

          // Problem Paragraphs
          if (wordLimit <= 150) {
            problemA = `Micro-managing database pull requests creates technical debt. If you do not delegate system ownership, shipping velocity stalls.`;
            problemB = `Technical leaders often try to supervise every cache config. This slows down delivery cycles and burns out dev capacity.`;
          } else if (wordLimit <= 250) {
            problemA = `The problem is that many technical leads try to oversee every single codebase file. When you micromanage database indexing or server configurations, you limit your team's capacity and slow down deployment velocity.`;
            problemB = `Rushing to scale server size before optimizing code queries creates massive technical debt. When you try to control every minor query pool setting, you disable your developers' ability to build. It increases code lag.`;
          } else {
            problemA = `The problem is that many technical leaders try to oversee every single line of code. When you micromanage pull requests, query caching layers, or database indexing updates, you limit your engineering capacity. You create a review bottleneck. This slows down code deployment cycles and frustrates developers. System efficiency relies on trusting module owners.`;
            problemB = `Rushing to scale server size before optimizing code queries creates massive technical debt. When you try to control every minor Redis cache config and connection pool detail, you disable your engineers' ability to build. It creates massive operational drag. This increases API response times, slows down release deployments, and ultimately burns out your developers.`;
          }

          // Steps details
          steps = [
            `Define codebase ownership: We assign specific database services (Redis caching, API gateways, query indexing) to individual engineers rather than generic roles. This ensures every developer knows exactly what system modules they own.`,
            `Empower debugging: We give our systems engineers the authority to roll back releases and optimize index sorting autonomously. This avoids constant escalations and keeps release velocity high.`,
            `Monitor system metrics: We track database query latencies and server cache hit ratios daily. We run index performance audits weekly, aiming for database query execution times under 50 milliseconds.`,
            `Establish async code reviews: We hold a brief daily sync to review database bottlenecks. This aligns the infrastructure team and developers before we ship updates.`
          ];

          // Results
          if (wordLimit <= 150) {
            resultsA = `This cut our database response times and improved shipping velocity.`;
            resultsB = `We reduced query latency spikes and improved server throughput.`;
          } else if (wordLimit <= 250) {
            resultsA = `Implementing this shift cut our database query latency and improved deployment velocity across the engineering team. We saw better system stability.`;
            resultsB = `This systems overhaul resulted in a reduction in query latency issues and saved hours of engineering coordination during traffic spikes.`;
          } else {
            resultsA = `Implementing these structured engineering workflows changed our operations. We achieved an estimated 35% decrease in API latency and improved database throughput. More importantly, it improved engineering morale, as the team felt trusted to run their systems autonomously.`;
            resultsB = `This systems overhaul resulted in an estimated 30% reduction in database query errors. It saved our developers hours of manual debugging during peak traffic events. More importantly, the system executed writes with high consistency and zero supervisor interventions.`;
          }

          // Conclusion
          if (wordLimit >= 200) {
            conclusionA = `Ultimately, building a successful tech product is not about writing every database patch yourself. It is about designing an engineering system that operates smoothly even when you step away. Trust your developers, document your system architectures, and protect your leadership bandwidth.`;
            conclusionB = `To build a scalable software company, you must transition from active developer to systems architect. Empower your engineering staff, set up clear module ownership, and let your team execute. It is the only way to scale your software operations.`;
          }
        }
        else if (category === 'marketing') {
          // Intro Paragraphs
          if (wordLimit <= 150) {
            introA = `During organic campaign scaling at ${company}, traffic dropped. I wanted to rewrite the landing page copy myself, but I had to step back.`;
            introB = `We faced dropping conversion rates last quarter. Under high campaign spend, the temptation to write ad copy myself was high, but I stopped myself.`;
          } else if (wordLimit <= 250) {
            introA = `Low conversion rates are the ultimate growth operational test. At ${company}, leads dropped and ad costs began to climb. My natural instinct was to step in and rewrite the search ad copies myself, but I knew I would become a bottleneck.`;
            introB = `Managing organic traffic pipelines requires letting go. Last quarter, understaffed on copywriting, we faced campaign latency spikes. I wanted to manage every search keyword detail, but I chose to trust our content marketers instead.`;
          } else {
            introA = `Low conversion rates are the ultimate marketing operational bottleneck test. By 8:00 AM at ${company}, our landing page conversion rates dropped by half, and ad spend was rising rapidly. As the growth leader, my natural instinct was to roll up my sleeves, step in, and start writing the landing page copy myself. But I realized that doing so would only make me the bottleneck. True campaign scaling requires step-back growth leadership.`;
            introB = `Managing customer acquisition requires intense trust under pressure. Last month, we launched organic campaigns with a short-staffed copywriting team. In the past, my response would have been to micromanage every single ad graphic and blog draft. But running campaigns has taught me that you cannot scale operations if you do not step back. I had to trust our marketing team to execute.`;
          }

          // Problem Paragraphs
          if (wordLimit <= 150) {
            problemA = `Micro-managing content creators creates conversion lag. If you do not delegate campaign ownership, marketing velocity stalls.`;
            problemB = `Growth leaders often try to supervise every ad headline. This slows down campaign launches and burns out content capacity.`;
          } else if (wordLimit <= 250) {
            problemA = `The problem is that many brand founders try to oversee every marketing asset. When you micromanage search keywords or landing page designs, you limit your team's capacity and slow down lead generation velocity.`;
            problemB = `Rushing to scale ad spend before optimizing landing page copy creates massive budget waste. When you try to control every copy draft, you disable your marketers' ability to test. It increases campaign lag.`;
          } else {
            problemA = `The problem is that many growth founders try to oversee every single piece of content. When you micromanage ad graphics, email templates, or landing page copy rewrites, you limit your marketing capacity. You create an approval bottleneck. This slows down campaign velocity and frustrates designers. Campaign efficiency relies on trusting channel owners.`;
            problemB = `Rushing to scale ad spend before optimizing landing page copy creates massive budget waste. When you try to control every minor ad copy hook and SEO tag detail, you disable your writers' ability to test. It creates massive operational drag. This increases cost-per-lead, slows down campaign launches, and ultimately burns out your growth staff.`;
          }

          // Steps details
          steps = [
            `Define channel ownership: We assign specific traffic channels (organic search, email marketing, paid media) to individual team members rather than generic roles. This ensures every marketer knows exactly what conversion metrics they own.`,
            `Empower ad testing: We give our copywriters the authority to launch headline A/B tests and adjust campaigns autonomously. This avoids approval delays and keeps landing page optimization moving.`,
            `Monitor traffic metrics: We track landing page conversion rates and click-through rates daily. We run keyword audits weekly, aiming for an average cost-per-lead under $5.`,
            `Set up weekly analysis loops: We hold a brief weekly meeting to analyze high-performing channels. This aligns the search and social teams before we update our copy strategy.`
          ];

          // Results
          if (wordLimit <= 150) {
            resultsA = `This cut our customer acquisition costs and improved lead velocity.`;
            resultsB = `We reduced ad spend waste and improved landing page conversions.`;
          } else if (wordLimit <= 250) {
            resultsA = `Implementing this shift cut our customer acquisition costs and improved conversion velocity across the marketing team. We saw better traffic numbers.`;
            resultsB = `This marketing overhaul resulted in a reduction in lead costs and saved hours of copywriting coordination during campaign launches.`;
          } else {
            resultsA = `Implementing these structured marketing workflows changed our operations. We achieved an estimated 30% decrease in customer acquisition costs and improved landing page conversions. More importantly, it improved team morale, as the copywriters felt trusted to run their campaigns autonomously.`;
            resultsB = `This marketing overhaul resulted in an estimated 25% reduction in acquisition costs. It saved our designers hours of manual revisions during launch weeks. More importantly, the campaigns executed leads with high consistency and zero management interventions.`;
          }

          // Conclusion
          if (wordLimit >= 200) {
            conclusionA = `Ultimately, building a successful brand is not about writing every ad copy draft yourself. It is about designing a marketing system that operates smoothly even when you step away. Trust your marketers, document your campaign workflows, and protect your leadership bandwidth.`;
            conclusionB = `To build a scalable brand, you must transition from active copywriter to growth architect. Empower your marketing staff, set up clear channel ownership, and let your team execute. It is the only way to scale your customer acquisition.`;
          }
        }
        else {
          // Generic Business
          if (wordLimit <= 150) {
            introA = `During operational scaling at ${company}, client backlog grew. I wanted to handle the support tickets myself, but I had to step back.`;
            introB = `We faced growing project queues last quarter. Under high client volumes, the temptation to handle service delivery myself was high, but I stopped myself.`;
          } else if (wordLimit <= 250) {
            introA = `Operational backlog is the ultimate business capacity test. At ${company}, queues began to backlog and delivery times began to rise. My natural instinct was to step in and answer client updates myself, but I knew I would become a bottleneck.`;
            introB = `Managing daily operations requires letting go. Last quarter, understaffed on delivery lines, we faced queue spikes. I wanted to manage every single task assignment detail, but I chose to trust our project managers instead.`;
          } else {
            introA = `Operational backlog is the ultimate business capacity bottleneck test. By 5:00 PM at ${company}, our client delivery queues were lagging, and project backlogs were backing up. As the CEO, my natural instinct was to roll up my sleeves, step in, and start answering client support updates myself. But I realized that doing so would only make me the bottleneck. True business scaling requires step-back operational leadership.`;
            introB = `Managing daily operations requires intense trust under pressure. Last month, we scaled service delivery pipelines with a short-staffed team. In the past, my response would have been to micromanage every project update and client meeting. But running Cafe Pink Roseś has taught me that you cannot scale if you do not step back. I had to trust our managers to execute.`;
          }

          // Problem Paragraphs
          if (wordLimit <= 150) {
            problemA = `Micro-managing task handoffs creates operational drag. If you do not delegate workflow ownership, business throughput stalls.`;
            problemB = `Leaders often try to supervise every client email. This slows down project delivery and burns out team capacity.`;
          } else if (wordLimit <= 250) {
            problemA = `The problem is that many business owners try to oversee every daily task. When you micromanage spreadsheets or customer updates, you limit your team's capacity and slow down project delivery times.`;
            problemB = `Taking shortcuts on team trust is a bad long-term business plan in operations. When you try to control every meeting schedule, you disable your managers' ability to execute under pressure. It increases cycle lag.`;
          } else {
            problemA = `The problem is that many business founders try to oversee every single daily task. When you micromanage spreadsheets, customer email updates, or project schedule drafts, you limit your team's operational capacity. You create an approval bottleneck. This slows down project delivery times and frustrates customers. Service efficiency relies on trusting workflow owners.`;
            problemB = `Taking shortcuts on team trust is a bad long-term business plan in operations. When you try to control every minor meeting schedule and task handoff detail, you disable your managers' ability to execute under pressure. It creates massive operational drag. This increases cycle times, slows down delivery, and ultimately burns out your operations staff.`;
          }

          // Steps details
          steps = [
            `Define task ownership: We assign specific operational domains (client onboarding, service delivery, customer support) to clear owners rather than generic roles. This ensures every team member knows exactly what KPIs they own.`,
            `Empower team decisions: We give our managers the authority to handle client issues and adjust project timelines autonomously. This avoids constant escalations and keeps workflows moving.`,
            `Track throughput metrics: We track project completion rates and client response times daily. We run capacity audits weekly, aiming for a client response time under 4 hours.`,
            `Set up sync checkpoints: We hold a brief 15-minute weekly alignment meeting. This aligns our core operations and support teams before we assign new client files.`
          ];

          // Results
          if (wordLimit <= 150) {
            resultsA = `This cut our delivery delays and improved team coordination.`;
            resultsB = `We reduced customer wait times and improved operations throughput.`;
          } else if (wordLimit <= 250) {
            resultsA = `Implementing this shift cut our client delivery backlog and improved operations coordination across the team. We saw better turnaround speeds.`;
            resultsB = `This operations overhaul resulted in a reduction in project delivery delays and saved hours of management coordination during peak times.`;
          } else {
            resultsA = `Implementing these structured leadership workflows changed our operations. We achieved an estimated 20% reduction in project cycle times and improved service delivery speeds. More importantly, it improved team morale, as the staff felt trusted to run their workflows autonomously.`;
            resultsB = `This operations overhaul resulted in an estimated 15% reduction in customer response delays. It saved our managers hours of manual follow-up during busy periods. More importantly, the delivery team executed client requests with high consistency and zero CEO interventions.`;
          }

          // Conclusion
          if (wordLimit >= 200) {
            conclusionA = `Ultimately, building a successful company is not about solving every client problem yourself. It is about designing an operational system that operates smoothly even when you step away. Trust your managers, document your workflows, and protect your leadership bandwidth.`;
            conclusionB = `To build a growing brand, you must transition from active worker to systems designer. Empower your operations staff, set up clear domain ownership, and let your team execute. It is the only way to scale your business operations.`;
          }
        }

        if (this.fetchedUrlContent) {
          const lines = this.fetchedUrlContent.split('\n');
          const firstLine = lines.length > 0 ? lines[0] : '';
          const match = firstLine.match(/\[Source:\s*(.*?)\s*\(/);
          const sourceName = match ? match[1] : 'the reference article';
          const sourceSnippet = `After analyzing the insights from ${sourceName}, it became clear how critical operational ownership is. `;
          introA = sourceSnippet + introA;
          introB = sourceSnippet + introB;
        }

        // Apply Layout Structures dynamically
        let bodyA = '';
        let bodyB = '';

        if (structure === 'Problem Solution') {
          bodyA = `Problem: ${problemA}\n\nSolution: ${introA}\n\n${steps[0]}\n\n${steps[1]}\n\n${resultsA}`;
          bodyB = `Problem: ${problemB}\n\nSolution: ${introB}\n\n${steps[2]}\n\n${steps[3]}\n\n${resultsB}`;
        } else if (structure === 'Listicle') {
          bodyA = `${introA}\n\nHere is our framework for navigating this:\n\n1. ${steps[0]}\n2. ${steps[1]}\n3. ${steps[2]}\n${wordLimit >= 300 ? `4. ${steps[3]}\n` : ''}\n${resultsA}`;
          bodyB = `${introB}\n\nKey steps we learned about this after auditing our operations:\n\n1. ${steps[0]}\n2. ${steps[1]}\n3. ${steps[2]}\n${wordLimit >= 300 ? `4. ${steps[3]}\n` : ''}\n${resultsB}`;
        } else if (structure === 'Bullets') {
          bodyA = `${introA}\n\nHere is how we execute this at ${company}:\n\n• ${steps[0]}\n• ${steps[1]}\n• ${steps[2]}\n${wordLimit >= 300 ? `• ${steps[3]}\n` : ''}\n${resultsA}`;
          bodyB = `${introB}\n\nMy checklist for leaders handling this:\n\n• ${steps[0]}\n• ${steps[1]}\n• ${steps[2]}\n${wordLimit >= 300 ? `• ${steps[3]}\n` : ''}\n${resultsB}`;
        } else if (structure === 'AIDA') {
          bodyA = `Attention: ${hookA}\n\nInterest: ${introA}\n\nDesire: ${problemA} ${resultsA}\n\nAction: [CTA]`;
          bodyB = `Attention: ${hookB}\n\nInterest: ${introB}\n\nDesire: ${problemB} ${resultsB}\n\nAction: [CTA]`;
        } else if (structure === 'PAS') {
          bodyA = `Problem: ${problemA}\n\nAgitate: Micro-managing the details burns out capacity and increases turnaround delay.\n\nSolution: ${introA} ${steps[0]} ${steps[1]} ${resultsA}`;
          bodyB = `Problem: ${problemB}\n\nAgitate: Taking shortcuts only creates operational debt that hits your bottom line.\n\nSolution: ${introB} ${steps[2]} ${steps[3]} ${resultsB}`;
        } else if (structure === 'Short Punchy Sentences') {
          const makePunchy = (text) => {
            return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0).join('.\n') + '.';
          };
          bodyA = `${hookA}\n\n${makePunchy(introA)}\n\n${makePunchy(resultsA)}`;
          bodyB = `${hookB}\n\n${makePunchy(introB)}\n\n${makePunchy(resultsB)}`;
        } else if (structure === 'Framework') {
          bodyA = `${introA}\n\nThe 3-Part Operational Framework:\n\n- Phase 1: ${steps[0]}\n- Phase 2: ${steps[1]}\n- Phase 3: ${steps[2]}\n\n${resultsA}`;
          bodyB = `${introB}\n\nOur scaling checklist:\n\n- Step 1: ${steps[0]}\n- Step 2: ${steps[1]}\n- Step 3: ${steps[2]}\n\n${resultsB}`;
        } else if (structure === 'Storytelling') {
          bodyA = `${hookA}\n\n${introA}\n\n${problemA}\n\n${steps[0]} ${steps[1]}\n\n${resultsA}`;
          bodyB = `${hookB}\n\n${introB}\n\n${problemB}\n\n${steps[2]} ${steps[3]}\n\n${resultsB}`;
        } else if (structure === 'Carousel Script') {
          bodyA = `[Slide 1: Hook]\n${hookA}\n\n---\n\n[Slide 2: The Challenge]\n${problemA}\n\n---\n\n[Slide 3: The Steps]\n1. ${steps[0]}\n2. ${steps[1]}\n\n---\n\n[Slide 4: The Results]\n${resultsA}`;
          bodyB = `[Slide 1: Hook]\n${hookB}\n\n---\n\n[Slide 2: The Challenge]\n${problemB}\n\n---\n\n[Slide 3: The Blueprint]\n1. ${steps[2]}\n2. ${steps[3]}\n\n---\n\n[Slide 4: The Results]\n${resultsB}`;
        } else if (structure === 'Thread Style') {
          bodyA = `1/4: ${hookA}\n\n---\n\n2/4: ${introA}\n\n---\n\n3/4: ${problemA} We focused on:\n• ${steps[0]}\n• ${steps[1]}\n\n---\n\n4/4: ${resultsA}`;
          bodyB = `1/4: ${hookB}\n\n---\n\n2/4: ${introB}\n\n---\n\n3/4: ${problemB} We focused on:\n• ${steps[2]}\n• ${steps[3]}\n\n---\n\n4/4: ${resultsB}`;
        } else if (structure === 'Founder POV') {
          bodyA = `As the founder of ${company}, here is what I've learned about delegation:\n\n${introA}\n\n${problemA}\n\n${steps[0]} ${steps[1]}\n\n${resultsA}`;
          bodyB = `As ${role} at ${company}, here is my POV on operations leadership:\n\n${introB}\n\n${problemB}\n\n${steps[2]} ${steps[3]}\n\n${resultsB}`;
        } else { // Paragraph Style / Default
          bodyA = `${introA}\n\n${problemA}\n\n${steps[0]} ${steps[1]}\n\n${resultsA}${conclusionA ? '\n\n' + conclusionA : ''}`;
          bodyB = `${introB}\n\n${problemB}\n\n${steps[2]} ${steps[3]}\n\n${resultsB}${conclusionB ? '\n\n' + conclusionB : ''}`;
        }

        // Apply selected CTA preset dynamically
        let ctaTextA = '';
        let ctaTextB = '';

        if (cta === 'Ask Question') {
          ctaTextA = `\n\nHow do you handle delegation under pressure? Let me know below.`;
          ctaTextB = `\n\nWhat is your main delegation strategy? Let's discuss in the comments.`;
        } else if (cta === 'Follow') {
          ctaTextA = `\n\nFollow me for more insights on ${ind} operations and scaling.`;
          ctaTextB = `\n\nFollow along as I share our daily operational learnings.`;
        } else if (cta === 'Connect') {
          ctaTextA = `\n\nSend a connection request to share operational strategies.`;
          ctaTextB = `\n\nLet's connect here to discuss delegation and leadership.`;
        } else if (cta === 'Book Call') {
          ctaTextA = `\n\nBook a brief operations audit call with me using the link in my bio.`;
          ctaTextB = `\n\nLet's schedule a 15-minute call to align on operations.`;
        } else if (cta === 'Visit Website') {
          const webUrl = this.client.basicInfo.website || 'our website';
          ctaTextA = `\n\nVisit ${webUrl} to read the full operational details.`;
          ctaTextB = `\n\nCheck out ${webUrl} for more business insights.`;
        } else if (cta === 'Download') {
          ctaTextA = `\n\nDownload our complete operations blueprint from the link in my bio.`;
          ctaTextB = `\n\nGet our free delegation guide download in the bio link.`;
        } else if (cta === 'Comment') {
          ctaTextA = `\n\nDrop a comment with your thoughts on delegating vs. micro-managing.`;
          ctaTextB = `\n\nShare your experience with floor operations in the comments.`;
        } else if (cta === 'Save') {
          ctaTextA = `\n\nSave this post so you can reference these metrics during your next planning session.`;
          ctaTextB = `\n\nSave this post to reference next time your operations feel overwhelmed.`;
        } else if (cta === 'Share') {
          ctaTextA = `\n\nShare this post with a founder who is currently trying to do everything themselves.`;
          ctaTextB = `\n\nShare this post with a business leader who needs to delegate more.`;
        }

        // Apply Emojis
        const applyEmojis = (str, level) => {
          if (level === 'None') return str;
          let res = str;
          if (level === 'High') {
            res = res.replace(/family/gi, 'family 👥')
                     .replace(/business/gi, 'business 💼')
                     .replace(/quality/gi, 'quality ✅')
                     .replace(/tech|software|database/gi, 'tech 💻')
                     .replace(/metrics|retention|growth/gi, 'growth 📈')
                     .replace(/oil|food|restaurant|dinner|kitchen/gi, 'dining 🍽️')
                     .replace(/1\./g, '1. 📍')
                     .replace(/2\./g, '2. 🔍')
                     .replace(/3\./g, '3. 💡')
                     .replace(/•/g, '• 📍')
                     .replace(/\bProblem\b/g, 'Problem ⚠️')
                     .replace(/\bSolution\b/g, 'Solution 💡');
          } else { // Low
            res = res.replace(/1\./g, '1. 📍')
                     .replace(/2\./g, '2. 🔍')
                     .replace(/•/g, '• 📍');
          }
          return res;
        };

        let finalBodyA = '';
        let finalBodyB = '';

        if (structure === 'AIDA') {
          finalBodyA = bodyA.replace('[CTA]', ctaTextA);
          finalBodyB = bodyB.replace('[CTA]', ctaTextB);
        } else if (structure === 'Carousel Script') {
          finalBodyA = bodyA + `\n\n---\n\n[Slide 5: Action]\n${ctaTextA}`;
          finalBodyB = bodyB + `\n\n---\n\n[Slide 5: Action]\n${ctaTextB}`;
        } else {
          finalBodyA = `${hookA}\n\n${bodyA}${ctaTextA}`;
          finalBodyB = `${hookB}\n\n${bodyB}${ctaTextB}`;
        }

        finalBodyA = applyEmojis(finalBodyA, emojiLevel);
        finalBodyB = applyEmojis(finalBodyB, emojiLevel);

        // Word count adjusting - if limit is extremely small or large, append/slice
        const wordCount = (str) => str.split(/\s+/).filter(w => w.length > 0).length;
        
        const adjustToLimit = (text, limit, isDraftB) => {
          let words = text.split(/\s+/).filter(w => w.length > 0);
          let currentCount = words.length;
          
          if (limit === 100 && currentCount > 120) {
            // Cut down to 100 words smoothly
            return words.slice(0, 100).join(' ') + `..\n\n${isDraftB ? ctaTextB.trim() : ctaTextA.trim()}`;
          }
          if (limit === 150 && currentCount > 170) {
            return words.slice(0, 150).join(' ') + `..\n\n${isDraftB ? ctaTextB.trim() : ctaTextA.trim()}`;
          }
          return text;
        };

        finalBodyA = adjustToLimit(finalBodyA, wordLimit, false);
        finalBodyB = adjustToLimit(finalBodyB, wordLimit, true);

        const draftA = {
          readTime: `${Math.max(1, Math.ceil(wordCount(finalBodyA) / 200))} min read`,
          body: finalBodyA,
          imageIdea: `An infographic visualising ${cleanTopic} in ${ind}.`,
          carouselIdea: `Slide 1: Navigating ${cleanTopic}\nSlide 2: ${steps[0].split(':')[0]}\nSlide 3: ${steps[1].split(':')[0]}`,
          hashtags: [`#${ind.replace(/\s+/g, '')}`, `#${role.replace(/\s+/g, '')}`, `#Leadership`],
          keywordsUsed: [cleanTopic.split(' ')[0].replace(/[^a-zA-Z]/g, '').toLowerCase(), 'operations', 'delegation']
        };

        const draftB = {
          readTime: `${Math.max(1, Math.ceil(wordCount(finalBodyB) / 200))} min read`,
          body: finalBodyB,
          imageIdea: `Vibrant operational workflow chart tracking ${cleanTopic} steps.`,
          carouselIdea: `Slide 1: Overhauling ${cleanTopic}\nSlide 2: Bottlenecks found\nSlide 3: Strategic gains`,
          hashtags: [`#${ind.replace(/\s+/g, '')}`, `#Trust`, `#Operations`],
          keywordsUsed: [cleanTopic.split(' ')[0].replace(/[^a-zA-Z]/g, '').toLowerCase(), 'efficiency', 'scaling']
        };

        this.drafts = [draftA, draftB];
        toast.success('Mock drafts generated successfully!');
        resolve();
      }, 1000);
    });
  }

  // Adjustments trigger - calls API to alter existing text or does regex fallbacks
  async adjustDraft(idx, action) {
    const draft = this.drafts[idx];
    if (!draft) return;

    toast.info(`Running adjustment: "${action}" on Draft ${idx === 0 ? 'A' : 'B'}...`);

    const apiKey = localStorage.getItem('gemini_api_key') || '';
    const useBackend = localStorage.getItem('use_backend_server') === 'true';
    
    if (apiKey || useBackend) {
      const systemInstruction = `You are a professional LinkedIn editor. Adjust the provided LinkedIn post based on the requested action.
Action presets:
- Shorten: Cut fluff, make it ultra-compact.
- Expand: Add relevant detail and structured bullet points.
- Humanize: Make the tone highly conversational, remove buzzwords, and introduce authentic imperfections.
- Stronger Hook: Rewrite the first sentence to be a high-click contrarian or metrics hook.
- Change CTA: Rewrite the ending to invite technical debate or request a direct connection.

CRITICAL:
- Do not use em dashes ("—").
- Return ONLY the adjusted post body text. No descriptions, no JSON wrappers.`;

      const context = `
Adjust Action: ${action}
Current Post Body:
${draft.body}
`;

      try {
        const responseText = await this._callGeminiAPI(apiKey, systemInstruction, context);
        if (responseText && responseText.trim() !== '') {
          this.drafts[idx].body = responseText.trim();
          toast.success(`Post adjusted successfully!`);
          this.draw();
        }
      } catch (err) {
        console.error(err);
        toast.error('AI adjustment failed. Applying local fallback adjustments...');
        this._runMockAdjustment(idx, action);
      }
    } else {
      await this._runMockAdjustment(idx, action);
    }
  }

  _runMockAdjustment(idx, action) {
    const draft = this.drafts[idx];
    if (!draft) return;

    let body = draft.body;
    
    // Categorize by industry to ensure context-relevant adjustments!
    const ind = this.client.industry || 'Business';
    const topic = this.topic.trim();
    let category = 'generic';
    const lowerInd = ind.toLowerCase();
    const lowerTopic = topic.toLowerCase();
    if (lowerInd.includes('tech') || lowerInd.includes('software') || lowerInd.includes('develop') || lowerInd.includes('systems') || lowerInd.includes('engineering') || lowerInd.includes('cloud') || lowerTopic.includes('database') || lowerTopic.includes('code') || lowerTopic.includes('server')) {
      category = 'tech';
    } else if (lowerInd.includes('market') || lowerInd.includes('growth') || lowerInd.includes('seo') || lowerInd.includes('agency') || lowerInd.includes('copywrite') || lowerTopic.includes('marketing') || lowerTopic.includes('funnel')) {
      category = 'marketing';
    } else if (lowerInd.includes('restaurant') || lowerInd.includes('food') || lowerInd.includes('cafe') || lowerInd.includes('hospitality') || lowerInd.includes('retail') || lowerInd.includes('dining') || lowerTopic.includes('dinner') || lowerTopic.includes('restaurant') || lowerTopic.includes('kitchen') || lowerTopic.includes('customer service') || lowerTopic.includes('delegation')) {
      category = 'restaurant';
    }
    
    if (action === 'Shorten') {
      const lines = body.split('\n');
      body = lines.slice(0, Math.min(lines.length, 6)).join('\n') + '\n\nContact me to learn more.';
    } 
    else if (action === 'Expand') {
      if (category === 'restaurant') {
        body = body + `\n\nAdditional key details:\n• Conduct brief pre-shift standups.\n• Set up clear expediting queues.\n• Review dining floor feedback weekly.`;
      } else if (category === 'tech') {
        body = body + `\n\nAdditional key details:\n• Audit database queries monthly.\n• Document core service boundaries.\n• Track query latency margins.`;
      } else if (category === 'marketing') {
        body = body + `\n\nAdditional key details:\n• Map landing page organic intent.\n• Launch weekly A/B copy tests.\n• Audit client channel metrics.`;
      } else {
        body = body + `\n\nAdditional key details:\n• Define role-level metric ownership.\n• Move status meetings to async updates.\n• Monitor core project timelines.`;
      }
    } 
    else if (action === 'Humanize') {
      body = body.replace(/optimize|leverage|unlock/gi, 'improve')
                 .replace(/crucial|robust/gi, 'important');
      body = `Honestly, let's stop typing corporate fluff. Here is the real lesson:\n\n` + body;
    } 
    else if (action === 'Stronger Hook') {
      const lines = body.split('\n');
      if (category === 'restaurant') {
        lines[0] = `Stop micromanaging your kitchen staff. Do this 1 thing instead:`;
      } else if (category === 'tech') {
        lines[0] = `Stop wasting cloud server bills. Do this 1 thing instead:`;
      } else if (category === 'marketing') {
        lines[0] = `Stop wasting search ad spend. Do this 1 thing instead:`;
      } else {
        lines[0] = `Stop micromanaging daily updates. Do this 1 thing instead:`;
      }
      body = lines.join('\n');
    } 
    else if (action === 'Change CTA') {
      const lines = body.split('\n');
      if (lines.length > 0) {
        if (category === 'restaurant') {
          lines[lines.length - 1] = `Send a direct message to discuss how we audit kitchen floor throughput.`;
        } else if (category === 'tech') {
          lines[lines.length - 1] = `Send a direct message to get a custom system latency audit.`;
        } else if (category === 'marketing') {
          lines[lines.length - 1] = `Send a direct message to audit your organic landing page funnels.`;
        } else {
          lines[lines.length - 1] = `Send a direct message to audit your team's operational workflows.`;
        }
      }
      body = lines.join('\n');
    }

    this.drafts[idx].body = body;
    toast.success(`Mock adjustment applied!`);
    this.draw();
  }

  // Quality Gate Auto-Fix triggers
  async runQualityFix(idx) {
    const draft = this.drafts[idx];
    if (!draft) return;

    const audit = this._auditPost(draft.body);
    if (audit.score === 10) {
      toast.info('Post already has a perfect quality score!');
      return;
    }

    toast.info('AI is fixing quality violations...');
    const apiKey = localStorage.getItem('gemini_api_key') || '';
    const useBackend = localStorage.getItem('use_backend_server') === 'true';

    if (apiKey || useBackend) {
      const systemInstruction = `You are a strict LinkedIn quality auditor. Rewrite the provided post to fix all rules violations.
Violations found: ${audit.violations.map(v => v.rule + ` ("` + v.match + `")`).join(', ')}

Strict constraints:
- NO em dashes ("—"). Replace them with semicolons or parentheses.
- NO buzzwords: Delve, Leverage, Unlock, Robust, Crucial, Powerful, Game-changer, Revolutionary.
- NO filler transitions: "Ultimately", "At the end of the day", "That said".
- NO staccato stacks (do not write three or more short sentences in a row).
- NO markdown bolding ("**"). Remove the double asterisks entirely or use plain text.
- NO markdown headers ("#", "##", "###"). Remove the header tags.
- NO broken indentation (no spaces before bullet symbols like "  •" or "  -").
- Clean spacing (exactly one blank line between paragraphs and bullet points, no double blank lines).
- Return only the raw rewritten post body text. No labels.`;

      try {
        const responseText = await this._callGeminiAPI(apiKey, systemInstruction, draft.body);
        if (responseText && responseText.trim() !== '') {
          this.drafts[idx].body = responseText.trim();
          toast.success('Quality violations auto-fixed!');
          this.draw();
        }
      } catch (err) {
        console.error(err);
        this._runMockQualityFix(idx);
      }
    } else {
      this._runMockQualityFix(idx);
    }
  }

  _runMockQualityFix(idx) {
    const draft = this.drafts[idx];
    if (!draft) return;

    let body = draft.body;
    // Replace em dashes
    body = body.replace(/—/g, ' -- ');
    // Replace buzzwords
    body = body.replace(/leverage/gi, 'use')
               .replace(/unlock/gi, 'access')
               .replace(/delve/gi, 'dive')
               .replace(/robust/gi, 'strong')
               .replace(/crucial/gi, 'key')
               .replace(/powerful/gi, 'great')
               .replace(/game-changer/gi, 'catalyst')
               .replace(/revolutionary/gi, 'new');
    
    // Replace filler transitions
    body = body.replace(/at the end of the day/gi, 'in fact')
               .replace(/ultimately/gi, 'finally')
               .replace(/that said/gi, 'however');

    // Remove markdown bolding
    body = body.replace(/\*\*/g, '');

    // Remove markdown headers
    body = body.replace(/^#+\s+/gm, '');

    // Fix broken indentation (spaces before bullets)
    body = body.replace(/^[ \t]+([•\-*])/gm, '$1');

    // Fix double blank lines
    body = body.replace(/\n{3,}/g, '\n\n');

    this.drafts[idx].body = body;
    toast.success('Mock static corrections applied to post!');
    this.draw();
  }

  // Weakest line rewrite option generator
  _getRewriteOptions(line) {
    let opt1 = line;
    let opt2 = line;
    let opt3 = line;

    // Clean up buzzwords/overclaims/em dashes
    const cleanup = (str) => {
      return str
        .replace(/—/g, '; ')
        .replace(/\bnot\s+([^,.]+?)\s+but\s+([^,.]+?)\b/gi, '$1, enabling $2')
        .replace(/\balways\b/gi, 'often')
        .replace(/\bnever\b/gi, 'rarely')
        .replace(/\bevery\b/gi, 'most')
        .replace(/\bbiggest\b/gi, 'major')
        .replace(/\bleverage\b/gi, 'use')
        .replace(/\bunlock\b/gi, 'access')
        .replace(/\bdelve\b/gi, 'dive')
        .replace(/\brobust\b/gi, 'strong')
        .replace(/\bcrucial\b/gi, 'key')
        .replace(/\bpowerful\b/gi, 'great')
        .replace(/\bgame-changer\b/gi, 'catalyst')
        .replace(/\brevolutionary\b/gi, 'new')
        .replace(/\bhere's the thing\b/gi, '')
        .replace(/\bthe truth is\b/gi, '')
        .replace(/\bat the end of the day\b/gi, 'finally')
        .replace(/\bultimately\b/gi, 'in the end')
        .replace(/\bthat said\b/gi, 'however');
    };

    opt1 = cleanup(opt1);
    
    // Option 2: Shortened direct version
    opt2 = cleanup(opt2);
    const words = opt2.split(' ');
    if (words.length > 8) {
      opt2 = words.slice(0, Math.round(words.length * 0.75)).join(' ') + '.';
    }

    // Option 3: Conversational/Personal
    opt3 = cleanup(opt3);
    if (!opt3.toLowerCase().startsWith('i ') && !opt3.toLowerCase().startsWith('we ')) {
      opt3 = 'We found that ' + opt3.charAt(0).toLowerCase() + opt3.slice(1);
    }

    return [opt1.trim(), opt2.trim(), opt3.trim()];
  }

  // --- CONTENT QUALITY GATE AUDITOR STATIC SCANNER ---
  _auditPost(text) {
    let score = 10;
    const violations = [];
    const lowerText = text.toLowerCase();

    // 1. No em dashes
    if (text.includes('—')) {
      score--;
      violations.push({ rule: 'No Em Dashes', match: '—' });
    }

    // 2. Parallelism check ("not X, but Y")
    const parallelismRegex = /\bnot\s+([^,.]+?)\bbut\s+([^,.]+?)\b/i;
    const parallelismMatch = text.match(parallelismRegex);
    if (parallelismMatch) {
      score--;
      violations.push({ rule: 'No "Not X, but Y" Parallelism', match: parallelismMatch[0] });
    }

    // 3. AI buzzwords
    const buzzwords = ['unlock', 'delve', 'leverage', 'robust', 'crucial', 'powerful', 'game-changer', 'revolutionary'];
    buzzwords.forEach(word => {
      if (lowerText.includes(word)) {
        score--;
        violations.push({ rule: 'No AI Buzzwords', match: word });
      }
    });

    // 4. Filler transitions
    const fillers = ['that said', 'ultimately', 'at the end of the day'];
    fillers.forEach(word => {
      if (lowerText.includes(word)) {
        score--;
        violations.push({ rule: 'No Filler Transitions', match: word });
      }
    });

    // 5. AI setup phrases
    const setupPhrases = ["here's the thing", "here's why this matters", "the truth is", "the reality is"];
    setupPhrases.forEach(phrase => {
      if (lowerText.includes(phrase)) {
        score--;
        violations.push({ rule: 'No AI Setup Phrases', match: phrase });
      }
    });

    // 6. Overclaims check
    const overclaims = ['always', 'never', 'every', 'biggest'];
    overclaims.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(lowerText)) {
        score--;
        violations.push({ rule: 'No Overclaims (always/never/every/biggest)', match: word });
      }
    });

    // 7. Hollow Affirmations / Fake Enthusiasm
    const enthusiasm = ['so excited to', 'thrilled to', 'proud to share', 'honored to', 'absolutely thrilled', 'delighted to'];
    enthusiasm.forEach(phrase => {
      if (lowerText.includes(phrase)) {
        score--;
        violations.push({ rule: 'No Hollow Affirmations / Fake Enthusiasm', match: phrase });
      }
    });

    // 8. Fabricated Stats check (unqualified percentage or currency)
    const statRegex = /(\d+(?:\.\d+)?%|\$\d+(?:,\d+)*)/g;
    let statMatch;
    while ((statMatch = statRegex.exec(text)) !== null) {
      const matchStr = statMatch[0];
      const index = statMatch.index;
      const contextBefore = lowerText.substring(Math.max(0, index - 25), index);
      const isQualified = /(approximate|rough|about|around|nearly|estimate|almost|over|under|historical|real|actual)/i.test(contextBefore);
      if (!isQualified) {
        score--;
        violations.push({ rule: 'No Fabricated Stats (stats must be qualified with about/roughly/estimated)', match: matchStr });
        break; // Flag once
      }
    }

    // 9. Credential dumps before hook (starts with As a... or similar)
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length > 0) {
      const firstLine = lines[0].toLowerCase();
      if (firstLine.startsWith('as a ') || firstLine.startsWith('i am a ') || firstLine.includes('experience as a')) {
        score--;
        violations.push({ rule: 'No Credential Dumps Before Hook', match: lines[0].substring(0, 30) + '...' });
      }
    }

    // 10. Passive CTA
    const passiveCTAs = ['worth checking out', 'feel free to share', 'comment below if you agree', 'let me know your thoughts'];
    passiveCTAs.forEach(word => {
      if (lowerText.includes(word)) {
        score--;
        violations.push({ rule: 'No Passive CTAs', match: word });
      }
    });

    // 11. Staccato fragment stacks check (3 or more sentences in a row with <= 5 words)
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    let consecutiveShort = 0;
    let maxConsecutive = 0;
    
    sentences.forEach(s => {
      const wordsCount = s.split(/\s+/).filter(w => w.length > 0).length;
      if (wordsCount > 0 && wordsCount <= 5) {
        consecutiveShort++;
        if (consecutiveShort > maxConsecutive) maxConsecutive = consecutiveShort;
      } else {
        consecutiveShort = 0;
      }
    });

    if (maxConsecutive >= 3) {
      score--;
      violations.push({ rule: 'No Staccato Fragment Stacks (3+ sentences under 5 words)', match: 'Consecutive short sentences' });
    }

    // 12. No Markdown Bolding (**)
    if (text.includes('**')) {
      score--;
      violations.push({ rule: 'No Markdown Bolding (**)', match: '**' });
    }

    // 13. No Markdown Headers (#)
    const headerRegex = /^#+\s+/m;
    if (headerRegex.test(text)) {
      score--;
      violations.push({ rule: 'No Markdown Headers (#)', match: '#' });
    }

    // 14. No Broken Indentation (leading spaces before bullet symbol)
    const brokenIndentRegex = /^[ \t]{2,}[•\-*]/m;
    if (brokenIndentRegex.test(text)) {
      score--;
      violations.push({ rule: 'No Broken Indentation (leading spaces before bullet)', match: 'Indentation' });
    }
    
    // 15. No Double Blank Lines (three or consecutive newlines)
    if (/\n{3,}/.test(text)) {
      score--;
      violations.push({ rule: 'No Double Blank Lines / incorrect spacing', match: '\n\n\n' });
    }

    // Identify weakest line, reason, and rewrite options
    let weakestLine = '';
    let weakestLineReason = '';
    let rewriteOptions = [];

    if (violations.length > 0) {
      const rawLines = text.split('\n');
      for (const line of rawLines) {
        const lowerLine = line.toLowerCase();
        const matchedV = violations.find(v => {
          if (v.match === 'Consecutive short sentences' || v.match.includes('...')) {
            return false;
          }
          return lowerLine.includes(v.match.toLowerCase());
        });
        if (matchedV) {
          weakestLine = line.trim();
          weakestLineReason = `Violates rule "${matchedV.rule}" (contains "${matchedV.match}")`;
          rewriteOptions = this._getRewriteOptions(weakestLine);
          break;
        }
      }
      if (!weakestLine && rawLines.length > 0) {
        weakestLine = rawLines[0].trim();
        weakestLineReason = `First line flagged for audit scrutiny`;
        rewriteOptions = this._getRewriteOptions(weakestLine);
      }
    }

    return {
      score: Math.max(1, score),
      violations,
      weakestLine,
      weakestLineReason,
      rewriteOptions
    };
  }

  // Crawl a URL using allorigins proxy and return structured info
  async _crawlURL(url) {
    if (!url) return null;
    
    const useBackend = localStorage.getItem('use_backend_server') === 'true';
    if (useBackend) {
      const backendUrl = localStorage.getItem('backend_server_url') || 'https://personal-branding-agent-production.up.railway.app';
      try {
        const response = await fetch(`${backendUrl}/api/crawl`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.results && data.results.length > 0) {
            return data.results[0]; // ContentGenerator expects single crawled object result
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
      
      const title = doc.title || (doc.querySelector('h1') ? doc.querySelector('h1').innerText : '') || 'Reference Webpage';
      
      const metaDescEl = doc.querySelector('meta[name="description"]') || doc.querySelector('meta[property="og:description"]');
      const metaDescription = metaDescEl ? metaDescEl.getAttribute('content') : '';

      const elementsToRemove = doc.querySelectorAll('script, style, head, nav, footer, iframe, noscript');
      elementsToRemove.forEach(el => el.remove());
      
      let text = doc.body ? doc.body.innerText : doc.documentElement.innerText;
      text = text.replace(/\s+/g, ' ').trim();
      
      return {
        title: title.trim(),
        metaDescription: metaDescription ? metaDescription.trim() : '',
        text: text,
        url: targetUrl
      };
    } catch (err) {
      console.warn(`Failed to crawl URL ${url}:`, err);
      return null;
    }
  }

  // Fetch from all reference URLs, clean text, and generate summary topic
  async fetchReferenceUrls() {
    const statusDiv = document.getElementById('url-fetch-status');
    const fetchBtn = document.getElementById('btn-fetch-url');
    if (!this.referenceUrls || this.referenceUrls.trim() === '') {
      toast.warning('Please enter at least one reference URL.');
      return;
    }

    if (statusDiv) {
      statusDiv.style.display = 'block';
      statusDiv.style.color = 'var(--text-muted)';
      statusDiv.innerHTML = '<span class="animate-pulse">Crawling URL(s)...</span>';
    }
    if (fetchBtn) {
      fetchBtn.disabled = true;
      fetchBtn.innerHTML = 'Crawling...';
    }

    const useBackend = localStorage.getItem('use_backend_server') === 'true';
    if (useBackend) {
      const backendUrl = localStorage.getItem('backend_server_url') || 'https://personal-branding-agent-production.up.railway.app';
      if (statusDiv) {
        statusDiv.innerHTML = '<span class="animate-pulse">Crawling & summarizing URL(s) via backend...</span>';
      }
      try {
        const response = await fetch(`${backendUrl}/api/crawl`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: this.referenceUrls })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            this.fetchedUrlContent = data.combinedText;
            this.topic = data.extractedTopic;
            
            const topicArea = document.getElementById('gen-topic');
            if (topicArea) {
              topicArea.value = this.topic;
            }

            if (fetchBtn) {
              fetchBtn.disabled = false;
              fetchBtn.innerHTML = 'Fetch Topic';
            }
            if (statusDiv) {
              statusDiv.style.color = 'var(--color-success)';
              let statusMsg = `Successfully crawled ${data.results.length} site(s).`;
              if (data.failed && data.failed.length > 0) {
                statusMsg += ` (${data.failed.length} failed)`;
              }
              statusDiv.innerHTML = statusMsg;
            }
            
            if (data.failed && data.failed.length > 0) {
              const failedList = data.failed.map(f => `${f.url}: ${f.error}`).join('\n');
              toast.warning(`Some URLs failed to crawl:\n${failedList}`);
            } else {
              toast.success('Successfully loaded and summarized reference website(s) via backend!');
            }
            return;
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }
      } catch (err) {
        console.warn('Backend crawl failed, falling back to AllOrigins proxy:', err);
        toast.warning(`Backend crawler failed: ${err.message || err}. Falling back to browser proxy...`);
      }
    }

    // Split urls by whitespace or comma
    const urls = this.referenceUrls.split(/[\s,]+/).map(u => u.trim()).filter(u => u.length > 0);
    const crawledResults = [];
    const failedUrls = [];

    for (const url of urls) {
      const data = await this._crawlURL(url);
      if (data && data.text.length > 50) {
        crawledResults.push(data);
      } else {
        failedUrls.push(url);
      }
    }

    if (fetchBtn) {
      fetchBtn.disabled = false;
      fetchBtn.innerHTML = 'Fetch Topic';
    }

    if (crawledResults.length === 0) {
      if (statusDiv) {
        statusDiv.style.color = 'var(--color-danger)';
        statusDiv.innerHTML = 'Failed to crawl references. Check URL or network.';
      }
      toast.error('Failed to crawl reference URL(s).');
      return;
    }

    // We successfully crawled some URLs!
    // Let's compile their details
    let combinedText = crawledResults.map(r => `[Source: ${r.title} (${r.url})]\n${r.text}`).join('\n\n');
    this.fetchedUrlContent = combinedText;

    // Try to get a clean topic summary
    const apiKey = localStorage.getItem('gemini_api_key') || '';
    let extractedTopic = '';

    if (apiKey) {
      if (statusDiv) {
        statusDiv.innerHTML = '<span class="animate-pulse">Summarizing website topics...</span>';
      }
      try {
        const systemPrompt = `You are an expert content strategist. Given the following crawled webpage content, summarize the main topic/insight in a single short sentence or phrase (max 20-30 words) suitable to be used as a post topic/brief. Avoid empty buzzwords, em-dashes, and write it in the client's perspective or as a direct discussion prompt.`;
        const summary = await this._callGeminiAPI(apiKey, systemPrompt, combinedText);
        extractedTopic = summary.replace(/^["'\s]+|["'\s]+$/g, '').trim();
      } catch (err) {
        console.error('Failed summarizing topic with Gemini:', err);
      }
    }

    // Fallback topic extraction if Gemini failed or no API key
    if (!extractedTopic) {
      // Use the titles and first few words
      const titles = crawledResults.map(r => r.title).join(' & ');
      const desc = crawledResults[0].metaDescription || (crawledResults[0].text.substring(0, 100) + '...');
      extractedTopic = `Insights from ${titles}: ${desc}`;
    }

    // Set topic
    this.topic = extractedTopic;
    const topicArea = document.getElementById('gen-topic');
    if (topicArea) {
      topicArea.value = this.topic;
    }

    // Show success status
    if (statusDiv) {
      statusDiv.style.color = 'var(--color-success)';
      let statusMsg = `Successfully crawled ${crawledResults.length} site(s).`;
      if (failedUrls.length > 0) {
        statusMsg += ` (${failedUrls.length} failed)`;
      }
      statusDiv.innerHTML = statusMsg;
    }
    toast.success('Successfully loaded and summarized reference website(s)!');
  }

  // Gemini REST call
  async _callGeminiAPI(apiKey, systemInstruction, userContent) {
    const useBackend = localStorage.getItem('use_backend_server') === 'true';
    if (useBackend) {
      const backendUrl = localStorage.getItem('backend_server_url') || 'https://personal-branding-agent-production.up.railway.app';
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
        temperature: 0.3
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

  // Clipboard helper
  async _copyText(text, eventOrElement) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
      
      let targetEl = null;
      if (eventOrElement) {
        targetEl = eventOrElement.target ? eventOrElement.target.closest('button') : eventOrElement;
      }
      
      if (targetEl) {
        const originalHTML = targetEl.innerHTML;
        targetEl.innerHTML = `<i data-lucide="check" style="width:12px; height:12px; color:var(--color-success);"></i> Copied!`;
        targetEl.classList.add('copied-state');
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => {
          targetEl.innerHTML = originalHTML;
          targetEl.classList.remove('copied-state');
          if (window.lucide) window.lucide.createIcons();
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to copy. Copy manually.');
    }
  }
}

export const contentGenerator = new ContentGenerator();
export default contentGenerator;
