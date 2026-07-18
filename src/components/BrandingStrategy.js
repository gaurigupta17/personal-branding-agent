/* ==========================================================================
   BRANDING STRATEGY & PROFILE OPTIMIZATION COMPONENT
   ========================================================================== */

import db from '../db.js';
import router from '../router.js';
import toast from './Toast.js';
import layout from './Layout.js';

class BrandingStrategy {
  constructor() {
    this.container = null;
    this.client = null;
    this.activeSubTab = 'pillars'; // 'pillars' | 'optimizer' | 'voice' | 'engagement'
    this.isGenerating = false;
  }

  // Mount strategy panel
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
    layout.highlightMenu('menu-strategy');
    layout.updateBreadcrumbs([
      { label: client.name, hash: `#client/${client.id}` },
      { label: 'Branding Strategy', hash: `#client/${client.id}/strategy` }
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
        <div class="workspace-tab-bar skeleton-pulse" style="height: 40px; border-radius: var(--radius-sm);"></div>
        <div class="pillars-grid">
          <div class="card skeleton-pulse" style="height: 380px; border-radius: var(--radius-lg);"></div>
          <div class="card skeleton-pulse" style="height: 380px; border-radius: var(--radius-lg);"></div>
          <div class="card skeleton-pulse" style="height: 380px; border-radius: var(--radius-lg);"></div>
        </div>
      </div>
    `;
  }

  // Draw main scaffolding
  draw() {
    if (!this.container) return;

    // Check compulsory fields
    const requiredKeys = ['name', 'designation', 'company', 'industry'];
    const missing = requiredKeys.filter(k => !this.client[k] || this.client[k].trim() === '');
    
    if (missing.length > 0) {
      this.container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:var(--space-md); max-width:1000px; margin:0 auto;">
          <div class="card badge-danger" style="border: 1px solid rgba(239, 68, 68, 0.3); padding: var(--space-xl); display: flex; flex-direction:column; align-items: center; text-align:center; gap: var(--space-md);">
            <i data-lucide="alert-octagon" style="color: var(--color-danger); width:48px; height:48px;"></i>
            <h3>Compulsory Information Missing</h3>
            <p style="color: var(--text-muted); max-width:500px;">
              To generate a custom LinkedIn Brand Strategy, you must specify the client's <strong>Full Name, Job Title, Company, and Industry</strong> in the Client Profile Workspace first.
            </p>
            <button class="btn btn-primary" id="btn-back-to-profile">
              <i data-lucide="user-cog"></i> Go to Profile Workspace
            </button>
          </div>
        </div>
      `;
      document.getElementById('btn-back-to-profile').addEventListener('click', () => {
        router.navigate(`client/${this.client.id}`);
      });
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Checking if strategy is already generated
    const hasStrategy = this.client.strategy && this.client.profileOptimization;

    if (this.isGenerating) {
      this._drawLoadingState();
      return;
    }

    if (!hasStrategy) {
      this._drawEmptyState();
      return;
    }

    // Draw Strategy Workspace Tabs
    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-md); width: 100%; max-width: 1000px; margin: 0 auto; padding-bottom: var(--space-xxl);">
        
        <!-- Header details and re-generate option -->
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-md); flex-wrap: wrap;">
          <div>
            <h2>LinkedIn Brand Strategy & Optimization</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem;">
              Generated LinkedIn content pillars, profile optimization templates, and search SEO directives.
            </p>
          </div>
          <button class="btn btn-secondary" id="btn-regenerate-strategy">
            Re-generate Strategy <i data-lucide="refresh-cw"></i>
          </button>
        </div>

        <!-- Strategy Tabs Navigation -->
        <div class="workspace-tab-bar" style="margin-bottom: var(--space-md);">
          <button class="workspace-tab-btn ${this.activeSubTab === 'pillars' ? 'active' : ''}" data-subtab="pillars">Content Pillars & Ideas</button>
          <button class="workspace-tab-btn ${this.activeSubTab === 'optimizer' ? 'active' : ''}" data-subtab="optimizer">Profile Optimizer</button>
          <button class="workspace-tab-btn ${this.activeSubTab === 'voice' ? 'active' : ''}" data-subtab="voice">Audience & Voice</button>
          <button class="workspace-tab-btn ${this.activeSubTab === 'engagement' ? 'active' : ''}" data-subtab="engagement">SEO & Engagement</button>
        </div>

        <!-- Strategy Viewport -->
        <div class="tab-content-panel" id="strategy-panel">
          <!-- Rendered dynamically -->
        </div>

      </div>
    `;

    this._renderTabContent();
    this._bindStrategyEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  // Draw strategy content categories
  _renderTabContent() {
    const panel = document.getElementById('strategy-panel');
    if (!panel) return;

    const strategy = this.client.strategy || {};
    const optimization = this.client.profileOptimization || {};

    if (this.activeSubTab === 'pillars') {
      const pillars = strategy.contentPillars || [];
      
      panel.innerHTML = `
        <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-lg);">
          <div class="card" style="padding:var(--space-md) var(--space-lg); border-left:4px solid var(--color-success); background-color: rgba(16, 185, 129, 0.02);">
            <div style="font-size:0.85rem; color:var(--text-bright); font-weight:500;">
              💡 <strong>Ghostwriter Tip:</strong> Click any of the post ideas listed under the pillars below to load them directly into the <strong>Content Generator</strong>.
            </div>
          </div>
          
          <div class="pillars-grid">
            ${pillars.map((pillar, idx) => `
              <div class="pillar-card">
                <div class="pillar-header">
                  <div class="pillar-tag">${idx === 4 ? 'DYNAMIC TRENDS' : `PILLAR 0${idx + 1}`}</div>
                  <h4 class="pillar-title">${pillar.name}</h4>
                </div>
                <div class="pillar-body">
                  <p><strong>Goal:</strong> ${pillar.purpose}</p>
                  <p><strong>Angle:</strong> ${pillar.contentAngle}</p>
                  <p style="color:var(--text-muted); font-size:0.75rem;">${pillar.whyItWorks}</p>
                  
                  ${idx === 4 ? `
                    <div style="margin: var(--space-sm) 0; border: 1px dashed var(--border-color); padding: var(--space-sm); border-radius: var(--radius-md); background: rgba(255,255,255,0.01);">
                      <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 6px; display:flex; align-items:center; gap:4px;">
                        <i data-lucide="globe" style="width:14px; height:14px; color:var(--color-accent);"></i>
                        <span>Live Industry Trends Search</span>
                      </div>
                      <div style="display:flex; gap:4px; margin-bottom:8px;">
                        <input type="text" class="input-text news-query-input" style="font-size:0.75rem; padding: 4px 8px; height: auto;" value="${this.client.industry || ''}" placeholder="Search industry news...">
                        <button class="btn btn-primary btn-fetch-latest-news" style="font-size: 0.75rem; padding: 4px 10px; white-space: nowrap;">
                          Fetch News
                        </button>
                      </div>
                      <div class="live-news-results" style="display:flex; flex-direction:column; gap:6px; max-height: 250px; overflow-y: auto;">
                        <!-- News items render here dynamically -->
                      </div>
                    </div>
                  ` : ''}
                  
                  <div class="pillar-meta">
                    <strong style="font-size:0.75rem; color:var(--text-bright);">Target Post Outlines:</strong>
                    <div class="pillar-post-list">
                      ${(pillar.postIdeas || []).map((idea, ideaIdx) => `
                        <div class="post-idea-card btn-post-idea-trigger" 
                          data-pillar="${pillar.name}" 
                          data-topic="${idea.topic.replace(/"/g, '&quot;')}" 
                          data-format="${idea.formatType}" 
                          data-hook="${idea.hookAngle.replace(/"/g, '&quot;')}">
                          <span class="post-idea-title">${ideaIdx + 1}. ${idea.topic}</span>
                          <div class="post-idea-meta">
                            <span>Format: ${idea.formatType}</span>
                            <div style="display:flex; align-items:center; gap:8px;">
                              <button class="btn btn-secondary btn-icon-only btn-copy-post-idea" data-text="${idea.topic.replace(/"/g, '&quot;')}" title="Copy Outline Topic" style="padding:2px; height:auto; width:auto; border:none; background:transparent;">
                                <i data-lucide="copy" style="width:12px; height:12px;"></i>
                              </button>
                              <span style="color: var(--color-accent);">Draft Post &rarr;</span>
                            </div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                    <button class="btn btn-secondary btn-full btn-add-topic" data-pillar-idx="${idx}" style="margin-top:8px; font-size:0.7rem; padding: 6px 8px; width: 100%;">
                      <i data-lucide="plus" style="width:12px; height:12px; vertical-align:middle; margin-right:4px;"></i> Add More Topics
                    </button>
                  </div>

                  <div style="margin-top:var(--space-sm); border-top:1px solid var(--border-color); padding-top:var(--space-xs);">
                    <small style="color:var(--text-muted);">Keywords: ${pillar.seoKeywords.join(', ')}</small>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      // Bind post idea click handlers
      panel.querySelectorAll('.btn-post-idea-trigger').forEach(btn => {
        btn.addEventListener('click', () => {
          const idea = {
            pillar: btn.getAttribute('data-pillar'),
            topic: btn.getAttribute('data-topic'),
            format: btn.getAttribute('data-format'),
            hook: btn.getAttribute('data-hook')
          };
          localStorage.setItem('selected_post_idea', JSON.stringify(idea));
          toast.success(`Loaded: "${idea.topic.substring(0, 30)}..." into Content Generator!`);
          router.navigate(`client/${this.client.id}/posts`);
        });
      });

      // Bind copy outline buttons
      panel.querySelectorAll('.btn-copy-post-idea').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._copyToClipboard(btn.getAttribute('data-text'), e);
        });
      });

    } 
    
    else if (this.activeSubTab === 'optimizer') {
      const score = optimization.headlineScore || 85;
      
      panel.innerHTML = `
        <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-lg);">
          
          <!-- Scorer and general details -->
          <div class="scorer-container">
            <div class="score-widget" style="--score-pct: ${score};">
              <div style="text-align:center;">
                <div class="score-number">${score}</div>
                <div class="score-lbl">Score</div>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              <h4 style="margin:0;">LinkedIn Profile Optimization Audit</h4>
              <p style="color:var(--text-muted); font-size:0.8rem; margin:0; max-width:600px;">
                Based on current market requirements, your headline structure scores in the <strong>Top ${100 - score}%</strong>. Utilize the audits and banners below to maximize your inbound organic search ranking.
              </p>
              <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:5px;">
                ${(optimization.profileKeywords || []).map(k => `<span class="badge badge-primary">${k}</span>`).join('')}
              </div>
            </div>
          </div>

          <!-- Optimization segments -->
          <div class="form-grid-2">
            <!-- Headline options -->
            <div class="card" style="display:flex; flex-direction:column; gap:var(--space-sm);">
              <h4 style="border-bottom:1px solid var(--border-color); padding-bottom:8px; display:flex; align-items:center; gap:6px;">
                <i data-lucide="heading" style="color:var(--color-accent); width:18px; height:18px;"></i> Suggested Headlines
              </h4>
              ${(optimization.headlineOptions || []).map((h, i) => `
                <div class="copyable-card">
                  <span style="font-size:0.8rem; color:var(--text-bright); line-height:1.4;">${h}</span>
                  <button class="btn btn-secondary btn-icon-only btn-copy-card" data-text="${h.replace(/"/g, '&quot;')}" title="Copy Headline">
                    <i data-lucide="copy" style="width:14px; height:14px;"></i>
                  </button>
                </div>
              `).join('')}
            </div>

            <!-- Banner tags options -->
            <div class="card" style="display:flex; flex-direction:column; gap:var(--space-sm);">
              <h4 style="border-bottom:1px solid var(--border-color); padding-bottom:8px; display:flex; align-items:center; gap:6px;">
                <i data-lucide="image" style="color:var(--color-accent); width:18px; height:18px;"></i> Banner Callouts (One-liners)
              </h4>
              ${(optimization.bannerOptions || []).map((b, i) => `
                <div class="copyable-card">
                  <span style="font-size:0.8rem; color:var(--text-bright); line-height:1.4;">${b}</span>
                  <button class="btn btn-secondary btn-icon-only btn-copy-card" data-text="${b.replace(/"/g, '&quot;')}" title="Copy Banner Text">
                    <i data-lucide="copy" style="width:14px; height:14px;"></i>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- About Section Write-up -->
          <div class="card" style="display:flex; flex-direction:column; gap:var(--space-sm);">
            <h4 style="border-bottom:1px solid var(--border-color); padding-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
              <span style="display:flex; align-items:center; gap:6px;">
                <i data-lucide="user-check" style="color:var(--color-accent); width:18px; height:18px;"></i>
                LinkedIn "About" Section Copywriter
              </span>
              <button class="btn btn-secondary btn-copy-about" data-text-el="about-text-content">
                <i data-lucide="copy"></i> Copy Section
              </button>
            </h4>
            <div class="about-preview-box" id="about-text-content">${optimization.aboutSection || ''}</div>
          </div>

          <!-- Improvement recommendations -->
          <div class="form-grid-2">
            <div class="card" style="display:flex; flex-direction:column; gap:var(--space-sm);">
              <h4 style="border-bottom:1px solid var(--border-color); padding-bottom:8px; display:flex; align-items:center; gap:6px;">
                <i data-lucide="alert-circle" style="color:var(--color-warning); width:18px; height:18px;"></i> Profile Improvements
              </h4>
              <ul style="padding-left:20px; font-size:0.8rem; line-height:1.6; color:var(--text-main); display:flex; flex-direction:column; gap:8px;">
                ${(optimization.improvementSuggestions || []).map(s => `<li>${s}</li>`).join('')}
              </ul>
            </div>

            <div class="card" style="display:flex; flex-direction:column; gap:var(--space-sm);">
              <h4 style="border-bottom:1px solid var(--border-color); padding-bottom:8px; display:flex; align-items:center; gap:6px;">
                <i data-lucide="award" style="color:var(--color-accent); width:18px; height:18px;"></i> Experience & Creator Settings
              </h4>
              <div style="font-size:0.8rem; line-height:1.6; display:flex; flex-direction:column; gap:10px;">
                <div>
                  <strong>Creator Mode Topics:</strong>
                  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                    ${(optimization.creatorModeTopics || []).map(t => `<span class="badge badge-success">${t}</span>`).join('')}
                  </div>
                </div>
                <div>
                  <strong>Custom URL Suggestion:</strong>
                  <code style="display:block; padding:8px; background-color:var(--bg-input); border-radius:4px; margin-top:4px; color:var(--color-accent); font-family:monospace; border:1px solid var(--border-color);">
                    ${optimization.customUrl || 'linkedin.com/in/username'}
                  </code>
                </div>
                <div>
                  <strong>Experience Audits:</strong>
                  <ul style="padding-left:20px; margin-top:4px; font-size:0.775rem;">
                    ${(optimization.experienceAudits || []).map(a => `<li>${a}</li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Bind copy triggers
      panel.querySelectorAll('.btn-copy-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this._copyToClipboard(btn.getAttribute('data-text'), e);
        });
      });
 
      const copyAboutBtn = panel.querySelector('.btn-copy-about');
      if (copyAboutBtn) {
        copyAboutBtn.addEventListener('click', (e) => {
          const content = document.getElementById('about-text-content').textContent;
          this._copyToClipboard(content, e);
        });
      }
    } 
    
    else if (this.activeSubTab === 'voice') {
      const voice = strategy.linkedinVoice || {};
      const audience = strategy.targetAudience || {};

      panel.innerHTML = `
        <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-lg);">
          
          <!-- Voice directives -->
          <div class="card" style="display:flex; flex-direction:column; gap:var(--space-md);">
            <h4 style="border-bottom:1px solid var(--border-color); padding-bottom:8px; display:flex; align-items:center; gap:6px;">
              <i data-lucide="volume-2" style="color:var(--color-accent); width:18px; height:18px;"></i>
              LinkedIn Writing Voice Directives
            </h4>
            <div class="form-grid-3">
              <div class="form-group">
                <label class="form-label" style="color:var(--text-muted);">Recommended Tone</label>
                <div style="font-size:0.875rem; color:var(--text-bright); font-weight:600;">${voice.tone || 'Conversational'}</div>
              </div>
              <div class="form-group">
                <label class="form-label" style="color:var(--text-muted);">Sentence Length</label>
                <div style="font-size:0.875rem; color:var(--text-bright); font-weight:600;">${voice.sentenceLength || 'Varying, punchy'}</div>
              </div>
              <div class="form-group">
                <label class="form-label" style="color:var(--text-muted);">Emoji Policy</label>
                <div style="font-size:0.875rem; color:var(--text-bright); font-weight:600;">${voice.emojiUsage || 'Minimal'}</div>
              </div>
            </div>
            
            <div class="form-grid-3" style="border-top:1px solid var(--border-color); padding-top:var(--space-md);">
              <div class="form-group">
                <label class="form-label" style="color:var(--text-muted);">Storytelling Level</label>
                <div style="font-size:0.875rem; color:var(--text-bright); font-weight:600;">${voice.storytellingLevel || 'Medium'}</div>
              </div>
              <div class="form-group">
                <label class="form-label" style="color:var(--text-muted);">Technical Depth</label>
                <div style="font-size:0.875rem; color:var(--text-bright); font-weight:600;">${voice.technicalDepth || 'High'}</div>
              </div>
              <div class="form-group">
                <label class="form-label" style="color:var(--text-muted);">Frequency & Timing</label>
                <div style="font-size:0.875rem; color:var(--text-bright); font-weight:600;">${voice.frequency || '3 posts / week'} (${voice.idealPostingTime || 'Morning'})</div>
              </div>
            </div>

            <div style="border-top:1px solid var(--border-color); padding-top:var(--space-md); display:flex; flex-direction:column; gap:8px;">
              <div><strong>Writing Style Directives:</strong></div>
              <p style="font-size:0.825rem; color:var(--text-bright); line-height:1.5; margin:0;">${voice.writingStyle || ''}</p>
            </div>
          </div>

          <!-- Target Audience -->
          <div class="card" style="display:flex; flex-direction:column; gap:var(--space-md);">
            <h4 style="border-bottom:1px solid var(--border-color); padding-bottom:8px; display:flex; align-items:center; gap:6px;">
              <i data-lucide="users" style="color:var(--color-accent); width:18px; height:18px;"></i>
              Target Audience Definition
            </h4>
            <div class="form-grid-2">
              <div>
                <ul style="font-size:0.8rem; line-height:1.8; color:var(--text-bright); list-style:none; display:flex; flex-direction:column; gap:8px; padding:0;">
                  <li><strong>👥 Primary Audience:</strong> ${audience.primary || ''}</li>
                  <li><strong>👥 Secondary Audience:</strong> ${audience.secondary || ''}</li>
                  <li><strong>💰 Buying Audience:</strong> ${audience.buying || ''}</li>
                  <li><strong>🤝 Networking Audience:</strong> ${audience.networking || ''}</li>
                </ul>
              </div>
              <div style="border-left:1px solid var(--border-color); padding-left:var(--space-lg); display:flex; flex-direction:column; gap:10px;">
                <div>
                  <span class="form-label" style="color:var(--text-muted); font-size:0.75rem;">AUDIENCE READING LEVEL</span>
                  <div style="font-weight:600; color:var(--text-bright); font-size:0.85rem;">${audience.readingLevel || '8th Grade'}</div>
                </div>
                <div>
                  <span class="form-label" style="color:var(--text-muted); font-size:0.75rem;">BUYING INTENT</span>
                  <div style="font-weight:600; color:var(--text-bright); font-size:0.85rem;">${audience.buyingIntent || 'High'}</div>
                </div>
              </div>
            </div>

            <div class="form-grid-2" style="border-top:1px solid var(--border-color); padding-top:var(--space-md); gap:var(--space-lg);">
              <div>
                <div style="font-weight:600; margin-bottom:6px;">Target Pain Points:</div>
                <ul style="padding-left:20px; font-size:0.8rem; line-height:1.6;">
                  ${(audience.painPoints || []).map(p => `<li>${p}</li>`).join('')}
                </ul>
              </div>
              <div>
                <div style="font-weight:600; margin-bottom:6px;">Target Goals / Desires:</div>
                <ul style="padding-left:20px; font-size:0.8rem; line-height:1.6;">
                  ${(audience.goals || []).map(g => `<li>${g}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        </div>
      `;
    } 
    
    else if (this.activeSubTab === 'engagement') {
      const seo = strategy.seo || {};
      const engage = strategy.engagementStrategy || {};

      panel.innerHTML = `
        <div class="animate-fade-in" style="display:flex; flex-direction:column; gap:var(--space-lg);">
          
          <!-- SEO & Keyword Matrix -->
          <div class="card" style="display:flex; flex-direction:column; gap:var(--space-md);">
            <h4 style="border-bottom:1px solid var(--border-color); padding-bottom:8px; display:flex; align-items:center; gap:6px;">
              <i data-lucide="search" style="color:var(--color-accent); width:18px; height:18px;"></i>
              Search Optimization (SEO) & Hashtag Matrix
            </h4>
            <div class="form-grid-2">
              <div style="display:flex; flex-direction:column; gap:10px;">
                <div>
                  <strong>High-Value Target Keywords:</strong>
                  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                    ${(seo.highValueKeywords || []).map(k => `<span class="badge badge-primary">${k}</span>`).join('')}
                  </div>
                </div>
                <div>
                  <strong>Industry SEO Terms:</strong>
                  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                    ${(seo.searchKeywords || []).map(k => `<span class="badge badge-primary">${k}</span>`).join('')}
                  </div>
                </div>
                <div>
                  <strong>LinkedIn Search Terms:</strong>
                  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                    ${(seo.headlineKeywords || []).map(k => `<span class="badge badge-primary">${k}</span>`).join('')}
                  </div>
                </div>
              </div>

              <div style="display:flex; flex-direction:column; gap:10px; border-left:1px solid var(--border-color); padding-left:var(--space-lg);">
                <div>
                  <strong>Recommended Hashtags:</strong>
                  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                    ${(seo.hashtags || []).map(t => `<span class="badge badge-success">${t}</span>`).join('')}
                  </div>
                </div>
                <div>
                  <strong>Google SEO Search Terms:</strong>
                  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                    ${(seo.googleSeoTerms || []).map(k => `<span class="badge badge-primary">${k}</span>`).join('')}
                  </div>
                </div>
                <div>
                  <strong>Profile SEO Keywords:</strong>
                  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                    ${(seo.profileSeoTerms || []).map(k => `<span class="badge badge-primary">${k}</span>`).join('')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Engagement Strategy -->
          <div class="card" style="display:flex; flex-direction:column; gap:var(--space-md);">
            <h4 style="border-bottom:1px solid var(--border-color); padding-bottom:8px; display:flex; align-items:center; gap:6px;">
              <i data-lucide="shield-check" style="color:var(--color-success); width:18px; height:18px;"></i>
              Profile Engagement & Growth Playbook
            </h4>
            
            <div class="form-grid-3">
              <div class="form-group">
                <label class="form-label" style="color:var(--text-muted);">Who to Comment On</label>
                <ul style="padding-left:16px; font-size:0.775rem;">
                  ${(engage.whoToCommentOn || []).map(x => `<li>${x}</li>`).join('')}
                </ul>
              </div>
              <div class="form-group">
                <label class="form-label" style="color:var(--text-muted);">Who to Connect With</label>
                <ul style="padding-left:16px; font-size:0.775rem;">
                  ${(engage.whoToConnectWith || []).map(x => `<li>${x}</li>`).join('')}
                </ul>
              </div>
              <div class="form-group">
                <label class="form-label" style="color:var(--text-muted);">Target Peer Accounts</label>
                <ul style="padding-left:16px; font-size:0.775rem;">
                  ${(engage.whoToFollow || []).map(x => `<li>${x}</li>`).join('')}
                </ul>
              </div>
            </div>

            <div style="border-top:1px solid var(--border-color); padding-top:var(--space-md); display:flex; flex-direction:column; gap:10px;">
              <div><strong>Comment Policy / Style:</strong></div>
              <p style="font-size:0.8rem; color:var(--text-bright); line-height:1.5; margin:0;">${engage.commentStyle || ''}</p>
            </div>

            <div style="border-top:1px solid var(--border-color); padding-top:var(--space-md); display:flex; flex-direction:column; gap:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>Connection Request Template:</strong>
                <button class="btn btn-secondary btn-icon-only btn-copy-connection" data-text="${engage.connectionTemplate ? engage.connectionTemplate.replace(/"/g, '&quot;') : ''}" title="Copy Template">
                  <i data-lucide="copy" style="width:14px; height:14px;"></i> Copy
                </button>
              </div>
              <code style="display:block; padding:10px; background-color:var(--bg-input); border-radius:var(--radius-md); font-size:0.775rem; line-height:1.4; color:var(--text-bright); border:1px solid var(--border-color);">
                ${engage.connectionTemplate || ''}
              </code>
            </div>

            <div class="form-grid-2" style="border-top:1px solid var(--border-color); padding-top:var(--space-md); gap:var(--space-lg);">
              <div>
                <div style="font-weight:600; margin-bottom:6px;">Weekly Growth Plan:</div>
                <ul style="padding-left:20px; font-size:0.8rem; line-height:1.6; display:flex; flex-direction:column; gap:4px;">
                  ${(engage.weeklyPlan || []).map(w => `<li>${w}</li>`).join('')}
                </ul>
              </div>
              <div>
                <div style="font-weight:600; margin-bottom:6px;">Monthly Targets:</div>
                <ul style="padding-left:20px; font-size:0.8rem; line-height:1.6; display:flex; flex-direction:column; gap:4px;">
                  ${(engage.monthlyPlan || []).map(m => `<li>${m}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        </div>
      `;

      const copyConnBtn = panel.querySelector('.btn-copy-connection');
      if (copyConnBtn) {
        copyConnBtn.addEventListener('click', (e) => {
          this._copyToClipboard(copyConnBtn.getAttribute('data-text'), e);
        });
      }
    }
  }

  // Bind workspace layout handlers
  _bindStrategyEvents() {
    // Regenerate
    const regenBtn = document.getElementById('btn-regenerate-strategy');
    if (regenBtn) {
      regenBtn.addEventListener('click', () => this.generateStrategy());
    }

    // Tabs clicks
    document.querySelectorAll('.workspace-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeSubTab = btn.getAttribute('data-subtab');
        this.draw();
      });
    });

    // Bind Add Topic buttons
    const addTopicBtns = this.container.querySelectorAll('.btn-add-topic');
    addTopicBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const pillarIdx = parseInt(btn.getAttribute('data-pillar-idx'));
        await this.addMoreTopicsToPillar(pillarIdx);
      });
    });

    // Bind News Fetching button
    const fetchNewsBtn = this.container.querySelector('.btn-fetch-latest-news');
    const newsQueryInput = this.container.querySelector('.news-query-input');
    const newsResultsContainer = this.container.querySelector('.live-news-results');
    
    if (fetchNewsBtn && newsQueryInput && newsResultsContainer) {
      fetchNewsBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const query = newsQueryInput.value.trim();
        if (!query) {
          toast.error("Please enter a search query.");
          return;
        }
        
        newsResultsContainer.innerHTML = `
          <div style="display:flex; align-items:center; gap:6px; font-size:0.75rem; color:var(--text-muted); padding: 8px 0;">
            <div class="animate-spin" style="display:inline-block; width:12px; height:12px; border:2px solid var(--text-muted); border-top-color:transparent; border-radius:50%;"></div>
            <span>Fetching live industry news...</span>
          </div>
        `;
        
        try {
          const backendUrl = localStorage.getItem('backend_server_url') || 'https://personal-branding-agent-production.up.railway.app';
          const response = await fetch(`${backendUrl}/api/news-search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
          });
          
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
          }
          
          const data = await response.json();
          if (data.success && data.articles && data.articles.length > 0) {
            newsResultsContainer.innerHTML = data.articles.map((art, idx) => `
              <div class="post-idea-card btn-news-draft-trigger" 
                style="margin-top: 4px; padding: var(--space-sm); cursor: pointer; text-align: left; background-color: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-sm);"
                data-title="${art.title.replace(/"/g, '&quot;')}"
                data-snippet="${art.snippet.replace(/"/g, '&quot;')}"
                data-url="${art.url.replace(/"/g, '&quot;')}">
                <span style="font-weight:600; font-size:0.75rem; display:block; color:var(--text-bright);">${idx + 1}. ${art.title}</span>
                <span style="font-size:0.7rem; color:var(--text-muted); margin-top:2px; display:block; line-height:1.3;">${art.snippet.substring(0, 100)}${art.snippet.length > 100 ? '...' : ''}</span>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; font-size:0.65rem;">
                  <span style="color:var(--text-muted);">Source: ${art.source || 'Tavily'}</span>
                  <span style="color:var(--color-accent); font-weight:600;">Draft Post &rarr;</span>
                </div>
              </div>
            `).join('');
            
            // Bind draft trigger to news items
            newsResultsContainer.querySelectorAll('.btn-news-draft-trigger').forEach(card => {
              card.addEventListener('click', (e) => {
                e.stopPropagation();
                const idea = {
                  pillar: "Industry News & Trends",
                  topic: card.getAttribute('data-title'),
                  format: "News Commentary",
                  hook: card.getAttribute('data-snippet'),
                  referenceUrl: card.getAttribute('data-url')
                };
                localStorage.setItem('selected_post_idea', JSON.stringify(idea));
                toast.success(`Loaded news topic into Content Generator!`);
                router.navigate(`client/${this.client.id}/posts`);
              });
            });
          } else {
            newsResultsContainer.innerHTML = `<div style="font-size:0.75rem; color:var(--text-muted); padding: 8px 0;">No news found. Try a different query.</div>`;
          }
        } catch (err) {
          console.error(err);
          newsResultsContainer.innerHTML = `<div style="font-size:0.75rem; color:var(--color-danger); padding: 8px 0;">Failed to fetch news. Check API settings.</div>`;
        }
      });
    }
  }

  // Draw Strategy Empty UI card
  _drawEmptyState() {
    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-lg); width: 100%; max-width: 600px; margin: 0 auto; text-align: center; padding: 4rem var(--space-md);">
        <div style="background-color: var(--color-primary-light); color: var(--color-primary); padding: 1.25rem; border-radius: 50%; width: 72px; height: 72px; display:flex; align-items:center; justify-content:center; font-size:1.85rem; margin: 0 auto;">
          <i data-lucide="shield-check"></i>
        </div>
        <div>
          <h3>Generate Branding Strategy</h3>
          <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 6px;">
            The strategy engine will analyze your client's bio, years of experience, files, and transcripts to build a customized, high-performing LinkedIn content matrix.
          </p>
        </div>
        <button class="btn btn-primary" id="btn-generate-strategy-start" style="padding: 0.75rem 1.5rem; font-size: 0.95rem; margin: 0 auto;">
          Generate Branding Strategy & Optimization <i data-lucide="sparkles"></i>
        </button>
      </div>
    `;

    document.getElementById('btn-generate-strategy-start').addEventListener('click', () => this.generateStrategy());
    if (window.lucide) window.lucide.createIcons();
  }

  // Loading indicator scaffolding
  _drawLoadingState() {
    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-lg); width: 100%; max-width: 650px; margin: 0 auto; text-align: center; padding: 4rem var(--space-md);">
        <div class="animate-spin" style="color: var(--color-accent); font-size: 2.5rem; margin:0 auto; width:48px; height:48px; display:flex; align-items:center; justify-content:center;">
          <i data-lucide="loader-2" style="width:48px; height:48px;"></i>
        </div>
        <div>
          <h3 id="loading-title">AI is Analysing Profile Context...</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 6px;" id="loading-helper">
            Extracting professional stories, calculating audience reading levels, and mapping content pillars. This may take a few seconds...
          </p>
        </div>

        <div style="display:flex; flex-direction:column; gap:var(--space-md); margin-top:10px;">
          <div class="skeleton-pulse" style="height: 120px; border-radius: var(--radius-lg);"></div>
          <div class="skeleton-pulse" style="height: 200px; border-radius: var(--radius-lg);"></div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  // Gathers keys, prompts model, and writes IndexedDB
  async generateStrategy() {
    this.isGenerating = true;
    this.draw();

    const apiKey = localStorage.getItem('gemini_api_key') || '';
    const useBackend = localStorage.getItem('use_backend_server') === 'true';
    
    // Gathers context
    const basicInfo = this.client.basicInfo || {};
    const notes = this.client.knowledge.additionalInfo || '';
    const files = this.client.knowledge.files || [];
    const fileTexts = files.map(f => `=== FILE: ${f.name} ===\n${f.parsedText}`).join('\n\n');
    
    const clientData = `
=== CLIENT CORE INFO ===
Name: ${this.client.name}
Title: ${this.client.designation}
Company: ${this.client.company}
Industry: ${this.client.industry}

=== ADDITIONAL FIELDS ===
${Object.entries(basicInfo).map(([k, v]) => `${k}: ${v}`).join('\n')}

=== KNOWLEDGE BASE TRANSCRIPTS ===
${notes}

${fileTexts}
    `;

    if (apiKey || useBackend) {
      const systemInstruction = `You are an elite LinkedIn personal branding strategist and executive copywriter. 
Analyze the client profile and context to build a comprehensive, high-quality LinkedIn Strategy.

CRITICAL QUALITY CONTROLS FOR OUTPUT QUALITY:

1. LINKEDIN ABOUT SECTION ("aboutSection"):
- Write a fully written, multi-paragraph LinkedIn About section (approx. 250-350 words) that sounds natural, authentic, human, and founder-like (not like a generic AI or resume dump).
- STRICTLY BAN these buzzwords and robotic setups: "Passionate", "Results-driven", "I thrive", "Dedicated", "In today's world", "Experienced professional", "With X years of experience", "Proven track record", "Synergy", "Leverage", "Unlock", "Revolutionize", "Delve".
- VARY SENTENCE RHYTHM: Mix short, punchy sentences (3-5 words) with medium and longer ones. Avoid repetitive structures (e.g. starting consecutive sentences with "I...").
- COMPOSITION STRUCTURE:
  * Hook / Contrarian Belief: Start with a strong diagnostic question, a bold industry critique, or a core philosophy (e.g. "Most software teams scale by adding servers. We scale by deleting queries.").
  * Storytelling / Journey: Share a brief story about a real operational lesson, friction point, or realization that led to their current work.
  * Credibility / Authority Metrics: Weave concrete achievements and metrics (e.g., "$15k pipeline", "25% floor speed") naturally into the copy.
  * Services / Offerings: List exactly how they help clients solve specific pain points.
  * Direct CTA: End with a direct call to action (e.g., "DM me 'GROWTH' to book an audit" or "Email me at...").

2. CONTENT PILLARS ("contentPillars"):
- Generate EXACTLY 5 content pillars. Each content pillar MUST contain AT LEAST 5 post ideas.
- Pillars must be highly specific, diverse, non-overlapping, and actionable. They should represent a human LinkedIn strategist's plan, not an AI keyword generator.
- DO NOT use generic pillar names like "Founder POV", "Engineering", "Marketing", or "Leadership". Make them highly contextual and specialized (e.g., "Monolith Query Optimization", "Organic Lead Acquisition Loops", "Hospitality Floor Logistics").
- Base the pillars directly on:
  * The client's specific business model & services.
  * Target audience's core pain points & goals.
  * The client's unique market positioning & expertise.
  * The client's primary conversion goals.
- POST IDEAS: Each of the 5 post ideas per pillar must be detailed, concrete, and actionable Discussion Prompts, Case Studies, or Checklists (e.g., "The step-by-step audit to reduce Postgres query latency by 40%" instead of "Postgres tips").
- The 5th Content Pillar (index 4) MUST ALWAYS be "Industry News & Trends" (or "Market Updates & News") but highly customized to their specific niche (e.g., "F&B Supply Chain Innovations" or "B2B SaaS Compliance Trends in 2026").

You MUST always return a valid JSON object matching this schema EXACTLY:
{
  "strategy": {
    "contentPillars": [
      {
        "name": "Pillar name (highly contextual, e.g. Monolith Query Optimization)",
        "purpose": "What this pillar aims to do",
        "targetAudience": "Who is this pillar for",
        "contentAngle": "What is the unique view/niche",
        "whyItWorks": "Why does this drive results on LinkedIn",
        "seoKeywords": ["kw1", "kw2"],
        "postIdeas": [
          { "topic": "Post topic idea", "formatType": "Listicle/Storytelling/etc", "hookAngle": "Suggested hook strategy" }
        ]
      }
    ],
    "targetAudience": {
      "primary": "Primary audience details",
      "secondary": "Secondary audience details",
      "buying": "Buying intent segments",
      "networking": "Peers/allies",
      "painPoints": ["pain1", "pain2"],
      "goals": ["goal1", "goal2"],
      "readingLevel": "e.g. 8th grade, executive",
      "buyingIntent": "High / Medium"
    },
    "linkedinVoice": {
      "tone": "Direct, conversational, etc",
      "writingStyle": "Punchy, first-person, no filler words",
      "sentenceLength": "Short and punchy",
      "emojiUsage": "None / Minimal",
      "storytellingLevel": "High",
      "technicalDepth": "Medium",
      "hookStyle": "Pain-point / contrarian",
      "ctaStyle": "conversational question",
      "frequency": "3 posts / week",
      "idealPostingTime": "Tuesday/Thursday morning"
    },
    "engagementStrategy": {
      "whoToFollow": ["Category of creators"],
      "whoToConnectWith": ["Job titles"],
      "whoToCommentOn": ["Archetypes"],
      "industries": ["Industries"],
      "commentStyle": "Direct and insightful, adding value",
      "connectionTemplate": "Hi Name, saw your work in...",
      "weeklyPlan": ["task1", "task2"],
      "monthlyPlan": ["target1"]
    },
    "seo": {
      "highValueKeywords": ["kw1"],
      "searchKeywords": ["kw2"],
      "headlineKeywords": ["kw3"],
      "hashtags": ["#tag1"],
      "profileSeoTerms": ["term1"],
      "googleSeoTerms": ["term2"]
    }
  },
  "profileOptimization": {
    "bannerOptions": ["Banner Option 1", "Banner Option 2", "Banner Option 3", "Banner Option 4", "Banner Option 5"],
    "headlineOptions": ["Headline 1", "Headline 2", "Headline 3", "Headline 4", "Headline 5"],
    "bioOptions": ["Bio option 1", "Bio option 2", "Bio option 3", "Bio option 4", "Bio option 5"],
    "aboutSection": "A fully written, multi-paragraph LinkedIn About section complete with a hook, story, credibility metrics, service listings, and direct CTA.",
    "featuredSection": ["Featured suggestion 1", "Featured suggestion 2"],
    "experienceAudits": ["Audit item 1", "Audit item 2"],
    "creatorModeTopics": ["topic1", "topic2", "topic3", "topic4"],
    "customUrl": "linkedin.com/in/username-niche",
    "profileKeywords": ["kw1", "kw2"],
    "headlineScore": 85,
    "improvementSuggestions": ["Suggestion 1", "Suggestion 2"]
  }
}

Important:
- Content Pillars: You must generate EXACTLY 5 content pillars. Each content pillar MUST contain AT LEAST 5 post ideas initially.
- Headlines, Banners, Bios: Generate EXACTLY 5 high-quality options for each.
- Ensure the output is a valid JSON string. Do not wrap it in markdown block, just return raw json string.`;

      try {
        const titleEl = document.getElementById('loading-title');
        if (titleEl) titleEl.textContent = 'AI is Analysing Profiles & Writing Copy...';
        
        const responseText = await this._callGeminiAPI(apiKey, systemInstruction, clientData);
        const parsed = this._cleanAndParseJSON(responseText);
        
        if (parsed && parsed.strategy && parsed.profileOptimization) {
          this.client.strategy = parsed.strategy;
          this.client.profileOptimization = parsed.profileOptimization;
          await db.saveClient(this.client);
          toast.success('Branding Strategy & Profile Optimization successfully generated!');
        } else {
          throw new Error('Malformed JSON received');
        }
      } catch (err) {
        console.error(err);
        toast.error('AI generation failed. Loading local strategy engine fallback...');
        await this._runMockStrategy();
      }
    } else {
      // Offline fallback
      await this._runMockStrategy();
    }

    this.isGenerating = false;
    this.draw();
  }

  // Online REST connector
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
        temperature: 0.2
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
    
    throw new Error('Empty response candidates from Gemini Model');
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

  // High-fidelity local template fallback engine
  async _runMockStrategy() {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const ind = (this.client.industry || 'B2B SaaS').toLowerCase();
        const des = this.client.designation || 'Founder & CEO';
        const comp = this.client.company || 'our company';
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

        let niche = 'Product Leadership & SaaS Growth';
        let keyword = 'SaaS PM frameworks';
        let customUrlSlug = `${name.toLowerCase().replace(/\s+/g, '-')}`;

        let strategy = {};
        let profileOptimization = {};

        if (category === 'restaurant') {
          niche = 'Hospitality Brand Scaling & Operations';
          keyword = 'restaurant customer loyalty';
          customUrlSlug += '-dining';

          strategy = {
            contentPillars: [
              {
                name: `Founder POV & Culinary Stories`,
                purpose: `Humanize the restaurant brand by sharing menu creation logs, delegation struggles, and gastronomy values.`,
                targetAudience: `Foodies, dining enthusiasts, local community, prospective franchise partners.`,
                contentAngle: `Personal stories about why we care about guest dining and local ingredients.`,
                whyItWorks: `Draws customers to the cafe/restaurant by forming a warm personal connection with the owner.`,
                seoKeywords: [`dining experience`, `founder perspective`, `culinary entrepreneur`],
                postIdeas: [
                  { topic: `The biggest delegation lesson I learned running a busy dinner service.`, formatType: `Storytelling`, hookAngle: `Vulnerable kitchen operations failure hook` },
                  { topic: `Why I opened Cafe Pink Roseś and what the first 6 months taught me about hospitality.`, formatType: `Founder POV`, hookAngle: `Startup concept pivot story` },
                  { topic: `Behind the scenes: How we structure our daily cafe prep schedules.`, formatType: `Listicle`, hookAngle: `Actionable logistics hook` },
                  { topic: `The costly vendor mistake that cost us $10,000 but saved our food quality standard.`, formatType: `Framework`, hookAngle: `Product sourcing lesson` },
                  { topic: `The customer conversation that changed our menu options forever.`, formatType: `Storytelling`, hookAngle: `Customer feedback shift` }
                ]
              },
              {
                name: `Thought Leadership in ${niche}`,
                purpose: `Establish authority on gastropub metrics and guest experience scaling.`,
                targetAudience: `Hospitality directors, franchise leads, fellow cafe entrepreneurs.`,
                contentAngle: `Direct perspectives debunking standard myths about fast expansion vs quality.`,
                whyItWorks: `Validates expertise in premium hospitality and branding.`,
                seoKeywords: [`${keyword}`, `thought leadership`, `hospitality standards`],
                postIdeas: [
                  { topic: `Why 90% of cafe concepts fail before their official opening day.`, formatType: `Analytical`, hookAngle: `Busting hospitality myths` },
                  { topic: `The step-by-step audit we use to improve restaurant table turnover.`, formatType: `Framework`, hookAngle: `Operations flowchart` },
                  { topic: `3 popular kitchen tools that are actually slowing down your prep teams.`, formatType: `Listicle`, hookAngle: `Utility speed warning` },
                  { topic: `Stop cutting food costs. Do this 1 thing to optimize guest satisfaction instead.`, formatType: `Founder POV`, hookAngle: `Contrarian ingredient quality argument` }
                ]
              },
              {
                name: `Gastronomy Sprints & Brand Audits`,
                purpose: `Attract private event bookings and franchise partnerships.`,
                targetAudience: `Event planners, local businesses, prospective franchisees.`,
                contentAngle: `Mini case studies showing successful bookings and table layout efficiency wins.`,
                whyItWorks: `Acts as social proof showing the restaurant is thriving and operational.`,
                seoKeywords: [`franchise audits`, `menu engineering`, `guest satisfaction wins`],
                postIdeas: [
                  { topic: `How we optimized our table layout to increase seating capacity by 25% organically.`, formatType: `Problem Solution`, hookAngle: `Space utilization win` },
                  { topic: `Case Study: Hosting a 100-person private branding launch event with zero logistics issues.`, formatType: `Framework`, hookAngle: `Event hosting metrics` },
                  { topic: `The questions you must ask your kitchen lead before designing a seasonal menu.`, formatType: `Listicle`, hookAngle: `Seasonal menu checklist` }
                ]
              },
              {
                name: `Hospitality Playbooks & Operational Skills`,
                purpose: `Share actionable guidelines to help peer dining startups scale.`,
                targetAudience: `Restaurant managers, head chefs, hospitality students.`,
                contentAngle: `Actionable guides sharing staff checklists and food safety recommendations.`,
                whyItWorks: `Drives high engagement and shares by providing immediate management templates.`,
                seoKeywords: [`restaurant playbook`, `staff scheduling checklist`, `dining operations`],
                postIdeas: [
                  { topic: `Our staff training checklist that replaced 2 hours of daily shift meetings.`, formatType: `Bullets`, hookAngle: `Operational download hook` },
                  { topic: `5 culinary business books that changed how I view multi-unit brand growth.`, formatType: `Listicle`, hookAngle: `Business book recommendations` },
                  { topic: `How I structure our seasonal food cost audits to avoid supply lag.`, formatType: `Framework`, hookAngle: `Audit tracking frameworks` }
                ]
              },
              {
                name: `Industry News & Recent Trends`,
                purpose: `Comment on emerging trends in gastronomy, local sourcing, and dining technology.`,
                targetAudience: `Local business reporters, industry commentators, dining reviewers.`,
                contentAngle: `Timely commentary on restaurant technologies, farm-to-table supply chains, and food regulations.`,
                whyItWorks: `Keeps the founder active on search spikes and current industry conversations.`,
                seoKeywords: [`farm-to-table trends`, `restaurant tech updates`, `dining industry updates`],
                postIdeas: [
                  { topic: `My thoughts on the transition to farm-to-table organic sourcing in 2026.`, formatType: `Opinion`, hookAngle: `Sustainable sourcing critique` },
                  { topic: `How QR ordering and digital checkouts are altering guest experience metrics.`, formatType: `Opinion`, hookAngle: `Tech integration hook` },
                  { topic: `Why boutique dining micro-concepts are the biggest industry trend of 2026.`, formatType: `Analytical`, hookAngle: `Macro dining shift opinion` }
                ]
              }
            ],
            targetAudience: {
              primary: `Ambitious dining managers and event planners looking to book premium services.`,
              secondary: `Franchisees, local community organizers, and hospitality consultants.`,
              buying: `Clients looking to book corporate parties, catering, or franchise consults.`,
              painPoints: [
                `High operational costs and low customer retention metrics.`,
                `Inefficient menu prep cycles causing slow table service.`,
                `Difficulty training front-of-house staff to deliver consistent luxury service.`
              ],
              goals: [
                `Maximize guest table turn efficiency while maintaining food quality standards.`,
                `Secure consistent private event bookings and local partnerships.`,
                `Build a recognizable hospitality brand that attracts high-caliber culinary talent.`
              ],
              readingLevel: `Accessible (8th-10th Grade level, welcoming and hospitality-focused)`,
              buyingIntent: `High (Targeting local corporations and high-end catering bookers)`
            },
            linkedinVoice: {
              tone: `Welcoming, direct, professional, passion-driven`,
              writingStyle: `First person singular. Empathetic, story-led, clear paragraphs, zero corporate jargon, focused on gastronomy and customer outcomes.`,
              sentenceLength: `Friendly and rhythmic, mixing sensory descriptors with clear operation stats.`,
              emojiUsage: `Moderate (2-3 per post to list amenities or highlight milestones)`,
              storytellingLevel: `Advanced (Shares chef/kitchen logs and local sourcing stories)`,
              technicalDepth: `Intermediate (Shares kitchen logistics, floor plans, and hospitality workflows)`,
              hookStyle: `Sensory or problem-focused hooks addressing dining and community experience.`,
              ctaStyle: `Invitations to try new menu items, book events, or share local dining reviews.`,
              frequency: `3 times a week`,
              idealPostingTime: `Wednesday & Friday at 9:00 AM EST`
            },
            engagementStrategy: {
              whoToFollow: [`Hospitality entrepreneurs, food critics, local business directories`],
              whoToConnectWith: [`Event planners, corporate administrators, local food suppliers`],
              whoToCommentOn: [`Community events, culinary awards accounts, business launch posts`],
              industries: [`Restaurants, Food & Beverage, Gastronomy, Boutique Hospitality`],
              commentStyle: `Supportive, value-rich comments sharing local business support or culinary tips.`,
              connectionTemplate: `Hi {{Name}}, saw your post on local dining. Loved your point about sourcing. Let's connect. - ${this.client.name}`,
              weeklyPlan: [`Comment on 5 local brand accounts daily.`, `Send 10 custom connection requests to event planners.`],
              monthlyPlan: [`Publish 12 high-value lifestyle/dining posts.`, `Secure 2 high-ticket event bookings.`]
            },
            seo: {
              highValueKeywords: [`${keyword}`, `gastronomy branding`, `restaurant scaling`],
              searchKeywords: [`local catering`, `cafe franchise consultant`, `menu engineering`],
              headlineKeywords: [`Hospitality Founder`, `Cafe Owner`, `Dining Consultant`],
              hashtags: [`#Hospitality`, `#RestaurantOperations`, `#Gastronomy`, `#LocalDining`],
              profileSeoTerms: [`restaurant branding`, `guest experience optimization`, `food services`],
              googleSeoTerms: [`${this.client.name} dining`, `${comp} events`]
            }
          };

          profileOptimization = {
            bannerOptions: [
              `I help food and hospitality brands scale guest experience and customer loyalty.`,
              `Gastronomy branding & restaurant operations audits that scale.`,
              `Host your next corporate branding event at ${comp}.`,
              `Building guest-first hospitality teams.`
            ],
            headlineOptions: [
              `${des} @ ${comp} | Scaling Hospitality Brands & Boutique Dining Concepts`,
              `Founder @ ${comp} | Menu Engineering & Guest Experience Consultation`,
              `Hospitality Advisor | Helping cafe and restaurant owners optimize operational yields`,
              `Bespoke Event Curator & Gastronomy Director | Ex-Culinary Consultant`
            ],
            bioOptions: [
              `Boutique dining founder specializing in hospitality scaling. Helping F&B brands grow operations.`,
              `Advising cafe owners on menu engineering, floor plan design, and guest loyalty protocols.`,
              `Culinary Entrepreneur. Creating community hubs with memorable dining experiences.`
            ],
            aboutSection: `I help food and hospitality brands scale their footprint and customer loyalty.

Over the last 12 years, I have audit-tested multiple restaurant and cafe layouts. What I found was that 90% of table delays are caused by simple floor-plan bottlenecks.

I run Custom Operations Sprints designed to:
• Audit your current menu engineering and ingredient margins.
• Refine your front-of-house hospitality training protocols.
• Design local community outreach and private booking loops.

Diners get high-quality hospitality, and operations teams scale yields by 25%.

DM me "DINING" to review your hospitality layout.`,
            featuredSection: [
              `Link to '${comp} private bookings' event package page.`,
              `Post: 'How we scaled our boutique cafe concept' (800+ shares).`,
              `Guide: 'Restaurant operational checksheets' download template.`
            ],
            experienceAudits: [
              `Add specific dining volume metrics in your Founder role description.`,
              `Highlight the Cafe layout optimization timeline (e.g. 25% table turn efficiency win).`,
              `Ensure a booking link for private dining events is placed in your profile.`
            ],
            creatorModeTopics: [`Hospitality`, `RestaurantOperations`, `Gastronomy`, `BoutiqueDining`],
            customUrl: `linkedin.com/in/${customUrlSlug}`,
            profileKeywords: [`restaurant founder`, `hospitality advisor`, `cafe entrepreneur`, `catering consultant`],
            headlineScore: 88,
            improvementSuggestions: [
              `Your headline is missing a direct customer outcome. Change to Option 1.`,
              `Ensure your 'Featured' section contains a direct catering booking link.`,
              `Turn on Creator Mode to highlight topics: #Hospitality, #BoutiqueDining.`
            ]
          };

        } else if (category === 'marketing') {
          niche = 'Organic Acquisition & Performance Branding';
          keyword = 'B2B lead generation';
          customUrlSlug += '-growth';
          
          strategy = {
            contentPillars: [
              {
                name: `Founder POV & Marketing Stories`,
                purpose: `Showcase the entrepreneur's journey in building campaigns and agency growth.`,
                targetAudience: `CMOs, startup executives, and prospective marketing hires.`,
                contentAngle: `Vulnerable stories of marketing pivots, metrics won, and client scaling.`,
                whyItWorks: `Establishes creative credibility and authentic campaign leadership.`,
                seoKeywords: [`marketing lessons`, `founder perspective`, `agency pivots`],
                postIdeas: [
                  { topic: `The biggest campaign mistake I made in my first 5 years and what it taught me about CTR.`, formatType: `Storytelling`, hookAngle: `Vulnerable ad campaign failure hook` },
                  { topic: `Why I left my secure marketing role to build ${comp} and the realities of client acquisition.`, formatType: `Founder POV`, hookAngle: `Corporate breakout story` },
                  { topic: `Behind the scenes: The daily writing routine that keeps our newsletter list growing by 20% weekly.`, formatType: `Listicle`, hookAngle: `Actionable copy routine` }
                ]
              },
              {
                name: `Thought Leadership in ${niche}`,
                purpose: `Establish authority as a premier growth strategist and copywriter.`,
                targetAudience: `Startup founders, marketing directors, B2B founders.`,
                contentAngle: `Myth-busting perspectives on organic growth, SEO, and paid channels.`,
                whyItWorks: `Validates skills in driving ROI and high conversions.`,
                seoKeywords: [`${keyword}`, `thought leadership`, `growth marketing`],
                postIdeas: [
                  { topic: `Why 90% of paid ad loops fail before they write a single line of landing page copy.`, formatType: `Analytical`, hookAngle: `Contrarian marketing advice` },
                  { topic: `The step-by-step audit we use to double conversion rates on SaaS websites.`, formatType: `Framework`, hookAngle: `CRO audit steps` }
                ]
              },
              {
                name: `B2B Acquisition Sprints & Case Studies`,
                purpose: `Drive inbound consultations and retainer deals.`,
                targetAudience: `SaaS founders, tech leaders, agency leads.`,
                contentAngle: `Metrics-driven posts highlighting real conversion improvements and search rankings.`,
                whyItWorks: `Leverages absolute social proof to show copy creates revenue.`,
                seoKeywords: [`case studies`, `organic acquisition`, `lead generation wins`],
                postIdeas: [
                  { topic: `How we generated $15k in monthly pipeline using zero ad spend.`, formatType: `Problem Solution`, hookAngle: `Organic ROI win` },
                  { topic: `Case Study: Scaling organic B2B leads by 150% in 90 days.`, formatType: `Framework`, hookAngle: `Organic growth timelines` }
                ]
              },
              {
                name: `Marketing Playbooks & Templates`,
                purpose: `Share free templates to build immediate trust and generate bookmark saves.`,
                targetAudience: `Junior marketers, copywriters, startup PMs.`,
                contentAngle: `Actionable guides showing landing page checklists and email structures.`,
                whyItWorks: `Highly shared format that expands network reach.`,
                seoKeywords: [`copy template`, `lead gen checklist`, `growth playbook`],
                postIdeas: [
                  { topic: `My top 5 landing page header templates that double click-through rates.`, formatType: `Bullets`, hookAngle: `Direct copy blueprints` }
                ]
              },
              {
                name: `Industry News & Recent Trends`,
                purpose: `Provide commentary on emerging trends in SEO, AI search algorithms, and social media networks.`,
                targetAudience: `Network administrators, search commentators, CMO networks.`,
                contentAngle: `Timely opinions on Google update parameters, OpenAI search updates, and LinkedIn shifts.`,
                whyItWorks: `Captures search traffic from trending marketing topics.`,
                seoKeywords: [`Google update trends`, `AI search updates`, `B2B algorithm shifts`],
                postIdeas: [
                  { topic: `How OpenAI's SearchGPT is changing search optimization tactics in 2026.`, formatType: `Opinion`, hookAngle: `AI search impact forecast` }
                ]
              }
            ],
            targetAudience: {
              primary: `Startup founders and CMOs looking to grow search traffic and conversions.`,
              secondary: `SEO specialists, copywriters, agency leads.`,
              buying: `Startups needing inbound conversion funnels or growth retainers.`,
              painPoints: [
                `High customer acquisition costs (CAC) burning early-stage budgets.`,
                `Landing pages that get traffic but don't convert visitors.`,
                `Inefficient marketing staff spending hours on manual outbound.`
              ],
              goals: [
                `Establish a sustainable organic inbound pipeline.`,
                `Improve website conversion rates by 2x.`,
                `Position the brand as an authority to secure high-ticket clients.`
              ],
              readingLevel: `Professional (10th Grade level, persuasive but clean)`,
              buyingIntent: `High (Targeting decision-makers looking to scale MRR)`
            },
            linkedinVoice: {
              tone: `Persuasive, authoritative, clear, analytical`,
              writingStyle: `First person singular. Rhythmic, persuasive copywriting techniques, zero corporate fluff, actionable growth tips.`,
              sentenceLength: `Varies to build reading momentum. Short hooks, structured bullet points.`,
              emojiUsage: `Minimal (1-2 per post, used for readability in lists)`,
              storytellingLevel: `High (Integrates client campaign wins and copy lessons)`,
              technicalDepth: `Intermediate (Shares concrete funnel statistics, landing page tests, and conversion copy formats)`,
              hookStyle: `Direct pain-point or contrarian headline that challenges standard marketing spends.`,
              ctaStyle: `Conversational prompts requesting comment audits, or links to download marketing checklists.`,
              frequency: `4 times a week`,
              idealPostingTime: `Tuesday & Thursday at 8:30 AM EST`
            },
            engagementStrategy: {
              whoToFollow: [`CMOs, copywriters, acquisition specialists, SaaS founders`],
              whoToConnectWith: [`Startup CEOs, marketing heads, venture partners`],
              whoToCommentOn: [`Conversion rate audit posts, industry reports, founder updates`],
              industries: [`Growth Marketing, Conversion Copywriting, SEO, B2B SaaS`],
              commentStyle: `Insightful copy recommendations, landing page optimization advice, metric critique.`,
              connectionTemplate: `Hi {{Name}}, saw your post on acquisition. Loved your tip on headers. Let's connect. - ${this.client.name}`,
              weeklyPlan: [`Comment on 5 target accounts daily.`, `Send 10 custom connection requests to SaaS CEOs.`],
              monthlyPlan: [`Publish 16 organic branding posts.`, `Book 3 growth audits.`]
            },
            seo: {
              highValueKeywords: [`${keyword}`, `organic acquisition`, `lead generation`],
              searchKeywords: [`inbound pipeline`, `copy audit consultant`, `cro optimization`],
              headlineKeywords: [`Growth Strategist`, `Marketing Consultant`, `SEO advisor`],
              hashtags: [`#LeadGeneration`, `#ConversionCopy`, `#SEO`, `#GrowthMarketing`],
              profileSeoTerms: [`growth strategy`, `website optimization`, `b2b marketing`],
              googleSeoTerms: [`${this.client.name} growth`, `${comp} conversion`]
            }
          };

          profileOptimization = {
            bannerOptions: [
              `I help B2B companies scale customer acquisition loops and lead pipelines.`,
              `Conversion audits & organic growth frameworks that scale.`,
              `Book a Growth advisory sprint to optimize your funnels.`,
              `Zero ad spend. Just raw organic inbound.`
            ],
            headlineOptions: [
              `${des} @ ${comp} | Scaling Inbound Pipelines & B2B Organic Acquisition Loops`,
              `Founder @ ${comp} | Landing Page Conversion & SEO Growth Specialist`,
              `Growth Marketing Consultant | Helping startups double their conversion metrics`,
              `Copywriter & Content Strategist | Crafting organic B2B brand copy`
            ],
            bioOptions: [
              `Growth Strategist specializing in organic lead generation. Ex-agency head.`,
              `Advising early-stage founders on conversion loops and inbound SEO frameworks.`,
              `Marketing Entrepreneur. Building search authority and organic pipelines.`
            ],
            aboutSection: `I help B2B startups scale their organic customer acquisition loops and double conversions.

Over the last 10 years, I have audit-tested multiple landing pages. What I found was that 90% of conversion drop-offs are caused by confusing copy.

I run Custom Growth Sprints designed to:
• Audit your current SEO frameworks and organic indexing.
• Redesign your landing page headers using conversion copywriting standards.
• Structure a LinkedIn personal branding playbook for your executive team.

Clients double their conversion metrics and build high-efficiency B2B lead pipelines.

DM me "GROWTH" to book a conversion audit.`,
            featuredSection: [
              `Link to '${comp} consultation' audit package page.`,
              `Post: 'How we generated $15k monthly pipeline organically' (1,200+ bookmarks).`,
              `Ebook: 'The Organic Lead Gen Playbook' downloadable template.`
            ],
            experienceAudits: [
              `Add specific client conversion metrics in your Founder role description.`,
              `Highlight the landing page copy optimization timeline (e.g. 150% CTR win).`,
              `Ensure a booking link for a conversion sprint is placed in your profile.`
            ],
            creatorModeTopics: [`LeadGeneration`, `ConversionCopy`, `SEO`, `GrowthMarketing`],
            customUrl: `linkedin.com/in/${customUrlSlug}`,
            profileKeywords: [`growth consultant`, `seo strategist`, `marketing advisor`, `lead gen specialist`],
            headlineScore: 88,
            improvementSuggestions: [
              `Your headline is missing a direct customer outcome. Change to Option 1.`,
              `Ensure your 'Featured' section contains a direct audit booking link.`,
              `Turn on Creator Mode to highlight topics: #LeadGeneration, #GrowthMarketing.`
            ]
          };

        } else if (category === 'tech') {
          niche = 'Systems Architecture & Scalable Dev Workflows';
          keyword = 'database caching scaling';
          customUrlSlug += '-cto';
          
          strategy = {
            contentPillars: [
              {
                name: `Founder POV & Developer Stories`,
                purpose: `Humanize the technical brand by sharing developer logs, coding updates, and technical leadership pivots.`,
                targetAudience: `CTOs, developers, and tech directors.`,
                contentAngle: `Vulnerable technical stories sharing architectural mistakes and pivots.`,
                whyItWorks: `Builds massive developer trust and validates coding experience.`,
                seoKeywords: [`dev lessons`, `founder perspective`, `tech pivots`],
                postIdeas: [
                  { topic: `The biggest system scaling mistake I made and what it taught me about database caching.`, formatType: `Storytelling`, hookAngle: `Vulnerable engineering failure hook` },
                  { topic: `Why I left my secure developer role to build ${comp} and the realities of system consulting.`, formatType: `Founder POV`, hookAngle: `Corporate developer breakout story` }
                ]
              },
              {
                name: `Thought Leadership in ${niche}`,
                purpose: `Establish authority on cloud architecture and query scaling.`,
                targetAudience: `Engineering managers, startup leads, software architects.`,
                contentAngle: `Contrarian guidelines debunking modern framework trends.`,
                whyItWorks: `Validates structural systems thinking and technical depth.`,
                seoKeywords: [`${keyword}`, `thought leadership`, `system design`],
                postIdeas: [
                  { topic: `Why 90% of scaling efforts fail before they write a single line of server code.`, formatType: `Analytical`, hookAngle: `Contrarian engineering advice` }
                ]
              },
              {
                name: `Systems Sprints & Technical Audits`,
                purpose: `Attract high-intent clients for consulting sprints and cloud audits.`,
                targetAudience: `Startup CEOs, VPs of Engineering, Cloud Directors.`,
                contentAngle: `Detailed case studies sharing server latency optimizations and database index wins.`,
                whyItWorks: `Leverages concrete metrics to prove technical consulting value.`,
                seoKeywords: [`cloud audits`, `caching optimization`, `system wins`],
                postIdeas: [
                  { topic: `How we saved a B2B SaaS startup $3,000/month in cloud hosting bills.`, formatType: `Problem Solution`, hookAngle: `Database cost savings win` },
                  { topic: `Case Study: Migrating a Stripe integration in 24 hours with zero server downtime.`, formatType: `Framework`, hookAngle: `System migration timeline` }
                ]
              },
              {
                name: `Developer Blueprints & Tool recommendations`,
                purpose: `Provide downloadable templates to drive saves, shares, and networking reach.`,
                targetAudience: `Junior developers, PMs, tech commentators.`,
                contentAngle: `Actionable checksheets, modular coding guidelines, and database tools.`,
                whyItWorks: `Drives high engagement by offering immediate utility.`,
                seoKeywords: [`caching checksheet`, `dev blueprints`, `architecture tools`],
                postIdeas: [
                  { topic: `My top 3 tools to audit legacy codebases for query bottlenecks.`, formatType: `Listicle`, hookAngle: `Developer utility recommendations` }
                ]
              },
              {
                name: `Industry News & Recent Trends`,
                purpose: `Provide commentary on emerging database technologies, AI infrastructure, and cloud systems.`,
                targetAudience: `Tech commentators, developers, enterprise architects.`,
                contentAngle: `Opinions on cloud database shifts, AI agent caching workloads, and tech laws.`,
                whyItWorks: `Positions the founder on the cutting edge of tech updates.`,
                seoKeywords: [`database trends`, `AI architecture updates`, `tech shifts`],
                postIdeas: [
                  { topic: `Why the shift back to monolithic software is the biggest development trend of 2026.`, formatType: `Analytical`, hookAngle: `Contrarian macro coding trend` }
                ]
              }
            ],
            targetAudience: {
              primary: `Startup founders and VPs of Engineering looking to scale software databases.`,
              secondary: `CTOs, developers, cloud architects.`,
              buying: `Startups needing custom database tuning or cloud migration sprints.`,
              painPoints: [
                `High cloud bills caused by unoptimized database queries.`,
                `Engineering teams burned out by slow, manual release standups.`,
                `Server lag during high traffic loads causing user churn.`
              ],
              goals: [
                `Reduce infrastructure spending by 30%.`,
                `Improve page loading speed by 2x.`,
                `Build high-performing async dev workflows.`
              ],
              readingLevel: `Technical (11th Grade level, precise engineering terms)`,
              buyingIntent: `High (Targeting decision-makers looking to resolve database bottlenecks)`
            },
            linkedinVoice: {
              tone: `Direct, authoritative, developer-friendly, slightly contrarian`,
              writingStyle: `First person singular. Zero consultant speak, developer-focused terminology, short paragraphs, concrete code or query examples.`,
              sentenceLength: `Precise and punchy. Stacks details using structured bullets.`,
              emojiUsage: `Very minimal (Max 1 per post, only to structure code items)`,
              storytellingLevel: `Advanced (Shares server crashes and database migrations)`,
              technicalDepth: `Advanced (Shares real system flowcharts, cache timings, index queries)`,
              hookStyle: `Pain-point or index-error hooks addressing server latency and cloud bills.`,
              ctaStyle: `Technical discussions inviting dev feedback, or audit package offers.`,
              frequency: `3 times a week`,
              idealPostingTime: `Tuesday & Thursday at 8:00 AM EST`
            },
            engagementStrategy: {
              whoToFollow: [`CTOs, system design newsletter writers, database engineers`],
              whoToConnectWith: [`VPs of Engineering, seed-stage founders, startup CEOs`],
              whoToCommentOn: [`Database updates, developer logs, system incident reports`],
              industries: [`Cloud Infrastructure, Database Technologies, B2B SaaS`],
              commentStyle: `Insightful code suggestions, query improvements, performance critique.`,
              connectionTemplate: `Hi {{Name}}, saw your post on systems. Loved your caching tip. Let's connect. - ${this.client.name}`,
              weeklyPlan: [`Comment on 5 target accounts daily.`, `Send 10 custom connection requests to VPs of Engineering.`],
              monthlyPlan: [`Publish 12 high-value system design posts.`, `Book 2 system scaling audits.`]
            },
            seo: {
              highValueKeywords: [`${keyword}`, `caching optimization`, `systems architecture`],
              searchKeywords: [`database scale`, `startup cto advisor`, `query cache tuning`],
              headlineKeywords: [`Systems Architect`, `CTO Advisor`, `Database Consultant`],
              hashtags: [`#SystemDesign`, `#SaaSScale`, `#SoftwareEngineering`, `#CTO`],
              profileSeoTerms: [`cto consulting`, `database caching optimization`, `tech founder coach`],
              googleSeoTerms: [`${this.client.name} database`, `${comp} scaling`]
            }
          };

          profileOptimization = {
            bannerOptions: [
              `I help B2B SaaS teams cut cloud bills by 30% without database down time.`,
              `Systems architecture & query caching optimization that scale.`,
              `Book a CTO advisory sprint to optimize your server.`,
              `No corporate fluff. Just raw systems audits.`
            ],
            headlineOptions: [
              `${des} @ ${comp} | Scalable Systems Architecture & Caching Query Optimization`,
              `Founder @ ${comp} | CTO Consultant & Legacy Database Migration Lead`,
              `Systems Architect | Helping startup VPs of Engineering optimize cloud workloads`,
              `Technical Advisor | Designing async development workflow blueprints`
            ],
            bioOptions: [
              `Systems Architect specializing in database scale. Ex-systems lead.`,
              `Advising startup teams on database queries, microservice design, and server latency.`,
              `Technical Entrepreneur. Building high-performance software frameworks.`
            ],
            aboutSection: `I help early-stage startup teams scale their software infrastructure without database lag.

Over the last 12 years, I have audit-tested 50+ architectures. What I found was that 90% of scaling bugs are database index mistakes.

I run Custom CTO Sprints designed to:
• Audit your current query caching and database queries.
• Migrate legacy databases with zero downtime.
• Train your development team on high-efficiency async workflow standards.

Clients save an average of 30% on infrastructure bills and speed up their code delivery schedules by 2x.

DM me "MONOLITH" to check your system blueprint.`,
            featuredSection: [
              `Link to '${comp} system sprints' advisory page.`,
              `Post: 'How we saved a SaaS startup $3,000/month' (1,500+ saves).`,
              `Guide: 'The Async Monolithic Blueprint' downloadable template.`
            ],
            experienceAudits: [
              `Add specific server performance metrics in your CTO role description.`,
              `Highlight database migration timelines (e.g. 42% latency cut win).`,
              `Ensure a booking link for systems audits is placed in your profile.`
            ],
            creatorModeTopics: [`SystemDesign`, `SoftwareEngineering`, `CTOAdvisory`, `SaaSGrowth`],
            customUrl: `linkedin.com/in/${customUrlSlug}`,
            profileKeywords: [`systems architect`, `cto advisor`, `database consultant`, `stripe systems`],
            headlineScore: 88,
            improvementSuggestions: [
              `Your headline is missing a direct customer outcome. Change to Option 1.`,
              `Ensure your 'Featured' section contains a direct audit booking link.`,
              `Turn on Creator Mode to highlight topics: #SystemDesign, #CTOAdvisory.`
            ]
          };

        } else {
          // Generic business/leadership fallback
          niche = 'Strategic Operations & Business Scaling';
          keyword = 'business operations scaling';
          customUrlSlug += '-ceo';
          
          strategy = {
            contentPillars: [
              {
                name: `Founder POV & Leadership Stories`,
                purpose: `Humanize the personal brand by sharing operations pivots, co-founder dynamics, and startup management logs.`,
                targetAudience: `Founders, investors, and prospective business partners.`,
                contentAngle: `Vulnerable business stories sharing mistakes, pivots, and team delegation lessons.`,
                whyItWorks: `Builds operational credibility and forms trust with peer business builders.`,
                seoKeywords: [`business lessons`, `founder perspective`, `startup pivots`],
                postIdeas: [
                  { topic: `The biggest operational delegation mistake I made and what it taught me about company culture.`, formatType: `Storytelling`, hookAngle: `Vulnerable management failure hook` },
                  { topic: `Why I founded ${comp} and the realities of scaling operations in the first year.`, formatType: `Founder POV`, hookAngle: `Corporate founder breakout story` }
                ]
              },
              {
                name: `Thought Leadership in ${niche}`,
                purpose: `Establish authority as a seasoned business consultant and strategist.`,
                targetAudience: `Business owners, directors, operations heads.`,
                contentAngle: `Perspectives debunking standard myths about fast hiring vs operational scaling.`,
                whyItWorks: `Validates skills in streamlining organizational bottlenecks.`,
                seoKeywords: [`${keyword}`, `thought leadership`, `business scaling`],
                postIdeas: [
                  { topic: `Why 90% of business expansions stall before they optimize their team structure.`, formatType: `Analytical`, hookAngle: `Contrarian business advice` }
                ]
              },
              {
                name: `Operations Sprints & Scaling Case Studies`,
                purpose: `Attract high-intent clients for operational consults and leadership advisory.`,
                targetAudience: `Startup CEOs, board members, directors.`,
                contentAngle: `Detailed case studies sharing team productivity gains and process optimization wins.`,
                whyItWorks: `Demonstrates proof that optimized workflows drive bottom-line profits.`,
                seoKeywords: [`operations audit`, `process optimization`, `scaling wins`],
                postIdeas: [
                  { topic: `How we improved process efficiency by 35% using simple async meeting rules.`, formatType: `Problem Solution`, hookAngle: `Operational metrics win` },
                  { topic: `Case Study: Scaling team output from 5 to 50 members with zero operational friction.`, formatType: `Framework`, hookAngle: `Team scaling roadmap` }
                ]
              },
              {
                name: `Management Playbooks & Operations Guides`,
                purpose: `Offer free tools and checksheets to increase network reach and saves.`,
                targetAudience: `Managers, entrepreneurs, business consultants.`,
                contentAngle: `Actionable checksheets, remote workflow templates, and meeting guidelines.`,
                whyItWorks: `Generates high virality by offering immediate management solutions.`,
                seoKeywords: [`meeting template`, `leadership guide`, `operations checklist`],
                postIdeas: [
                  { topic: `My top 3 weekly meeting templates to streamline team alignment.`, formatType: `Listicle`, hookAngle: `Manager checklist download` }
                ]
              },
              {
                name: `Industry News & Recent Trends`,
                purpose: `Comment on emerging trends in remote work regulations, operational technology, and social shifts.`,
                targetAudience: `Industry commentators, news writers, corporate heads.`,
                contentAngle: `Opinions on remote working laws, digital business integrations, and market trends.`,
                whyItWorks: `Validates macro business foresight.`,
                seoKeywords: [`business trends`, `operations technology`, `market shifts`],
                postIdeas: [
                  { topic: `The future of async work in 2026: Why local hybrid frameworks are winning.`, formatType: `Opinion`, hookAngle: `Workplace trend forecast` }
                ]
              }
            ],
            targetAudience: {
              primary: `Startup founders and business owners looking to optimize workflows.`,
              secondary: `Directors, operators, HR managers.`,
              buying: `CEOs needing operational strategy design or executive leadership coaching.`,
              painPoints: [
                `Organizational friction causing slow execution cycles.`,
                `Hiring team members without clear role definitions.`,
                `Founder bottlenecked by minor daily task management.`
              ],
              goals: [
                `Streamline operations to allow founder to focus on core growth.`,
                `Improve team output and alignment metrics.`,
                `Expand business operations sustainably.`
              ],
              readingLevel: `Professional (10th Grade level, strategic and motivating)`,
              buyingIntent: `High (Targeting founders ready to scale operations)`
            },
            linkedinVoice: {
              tone: `Authoritative, direct, encouraging, pragmatic`,
              writingStyle: `First person singular. Pragmatic business phrasing, short paragraphs, clear outcomes.`,
              sentenceLength: `Clear and rhythmically varied. Bullet lists for actionable checklists.`,
              emojiUsage: `Minimal (1 per post to structure points)`,
              storytellingLevel: `Advanced (Shares leadership conflicts and pivot stories)`,
              technicalDepth: `Intermediate (Shares operational KPIs, hiring metrics, and workflow designs)`,
              hookStyle: `Management-focused hooks addressing meeting bloat and workflow friction.`,
              ctaStyle: `Conversational prompts requesting comment audits, or audit package offers.`,
              frequency: `3 times a week`,
              idealPostingTime: `Wednesday at 8:30 AM EST`
            },
            engagementStrategy: {
              whoToFollow: [`Business founders, VC partners, operational authors`],
              whoToConnectWith: [`CEO candidates, startup founders, executive directors`],
              whoToCommentOn: [`Leadership reports, company announcements, business launch posts`],
              industries: [`Business Operations, Executive Coaching, Management Consulting`],
              commentStyle: `Constructive leadership ideas, business advice, management critique.`,
              connectionTemplate: `Hi {{Name}}, saw your post on operations. Loved your workflow tip. Let's connect. - ${this.client.name}`,
              weeklyPlan: [`Comment on 5 target accounts daily.`, `Send 10 custom connection requests to startup founders.`],
              monthlyPlan: [`Publish 12 high-value operations posts.`, `Book 2 executive coaching clients.`]
            },
            seo: {
              highValueKeywords: [`${keyword}`, `process scaling`, `strategic leadership`],
              searchKeywords: [`operations audit`, `management sprints`, `workflow coaching`],
              headlineKeywords: [`Strategic Consultant`, `Management Advisor`, `Operations Director`],
              hashtags: [`#Leadership`, `#OperationsScale`, `#StartupGrowth`, `#Management`],
              profileSeoTerms: [`business scaling`, `workflow optimization`, `executive coaching`],
              googleSeoTerms: [`${this.client.name} consultant`, `${comp} operations`]
            }
          };

          profileOptimization = {
            bannerOptions: [
              `I help ambitious brands scale operations and brand footprint.`,
              `Operations audits & business scaling frameworks that scale.`,
              `Book a Leadership coaching sprint to align your team.`,
              `Zero fluff. Just raw operational efficiency.`
            ],
            headlineOptions: [
              `${des} @ ${comp} | Strategic Operations & Business Scaling Consultancy`,
              `Founder @ ${comp} | Executive Leadership & Organization Growth Advisor`,
              `Operations Director | Helping startup founders optimize workflow bottlenecks`,
              `Business Strategy Consultant | Designing high-performing async team cultures`
            ],
            bioOptions: [
              `Strategic Strategist specializing in operations scale. Ex-corporate leader.`,
              `Advising business owners on workflow optimization, team building, and performance metrics.`,
              `Business Entrepreneur. Creating structured scaling frameworks.`
            ],
            aboutSection: `I help business founders scale their internal operations and align their teams without workflow lag.

Over the last 12 years, I have audit-tested multiple organizational workflows. What I found was that 90% of scaling friction is caused by confusing role definitions.

I run Custom Operations Sprints designed to:
• Audit your current communication workflows and meeting schedules.
• Restructure staff onboarding and delegation checksheets.
• Guide your leadership team on async coordination templates.

Teams save 15 operational hours weekly and execute products faster.

DM me "OPERATIONS" to review your business workflow.`,
            featuredSection: [
              `Link to '${comp} advisory' services page.`,
              `Post: 'How we scaled output from 5 to 50 organically' (900+ saves).`,
              `Playbook: 'Modern Leadership Frameworks' downloadable templates.`
            ],
            experienceAudits: [
              `Add specific volume metrics in your Founder role description.`,
              `Highlight the operational efficiency gains timeline (e.g. 35% time saved win).`,
              `Ensure a booking link for leadership sprints is placed in your profile.`
            ],
            creatorModeTopics: [`Leadership`, `BusinessStrategy`, `Operations`, `StartupGrowth`],
            customUrl: `linkedin.com/in/${customUrlSlug}`,
            profileKeywords: [`business consultant`, `management advisor`, `operations strategist`, `founder`],
            headlineScore: 88,
            improvementSuggestions: [
              `Your headline is missing a direct customer outcome. Change to Option 1.`,
              `Ensure your 'Featured' section contains a direct audit booking link.`,
              `Turn on Creator Mode to highlight topics: #Leadership, #StartupGrowth.`
            ]
          };
        }

        this.client.strategy = strategy;
        this.client.profileOptimization = profileOptimization;
        await db.saveClient(this.client);
        resolve();
      }, 1500);
    });

    toast.info(`Generating fresh topics for: ${pillar.name}...`);
    
    // Disable all add buttons during load
    const btns = this.container.querySelectorAll('.btn-add-topic');
    btns.forEach(b => b.disabled = true);

    const apiKey = localStorage.getItem('gemini_api_key') || '';
    const useBackend = localStorage.getItem('use_backend_server') === 'true';
    let newIdeas = [];

    if (apiKey || useBackend) {
      const basicInfo = this.client.basicInfo || {};
      const notes = this.client.knowledge.additionalInfo || '';
      const files = this.client.knowledge.files || [];
      const fileTexts = files.map(f => `=== FILE: ${f.name} ===\n${f.parsedText}`).join('\n\n');
      
      const context = `
Client Name: ${this.client.name}
Title: ${this.client.designation}
Company: ${this.client.company}
Industry: ${this.client.industry}
Pillar Name: ${pillar.name}
Pillar Purpose: ${pillar.purpose}
Pillar Angle: ${pillar.contentAngle}
Existing Topics: ${(pillar.postIdeas || []).map(i => i.topic).join(', ')}

=== CONTEXT ===
${notes}
${fileTexts}
      `;

      const systemPrompt = `You are a LinkedIn branding consultant. Generate exactly 3 new, original LinkedIn post topic ideas for the specified content pillar.
Avoid repeating the existing topics.

Return your response as a valid JSON array of objects matching this schema exactly:
[
  { "topic": "Short post idea topic", "formatType": "Listicle/Storytelling/Framework/Founder POV", "hookAngle": "Hook strategy suggestion" }
]

Do not include markdown wraps. Return raw json string only.`;

      try {
        const response = await this._callGeminiAPI(apiKey, systemPrompt, context);
        const parsed = this._cleanAndParseJSON(response);
        if (Array.isArray(parsed)) {
          newIdeas = parsed;
        } else {
          throw new Error('Response is not an array');
        }
      } catch (err) {
        console.error(err);
        toast.error('AI topic generation failed. Loading local fallback ideas...');
        newIdeas = this._getMockTopicsForPillar(pillar.name);
      }
    } else {
      // Offline fallback
      await new Promise(r => setTimeout(r, 800));
      newIdeas = this._getMockTopicsForPillar(pillar.name);
    }

    if (newIdeas.length > 0) {
      if (!pillar.postIdeas) pillar.postIdeas = [];
      pillar.postIdeas.push(...newIdeas);
      
      await db.saveClient(this.client);
      toast.success(`Added ${newIdeas.length} new topics to ${pillar.name}!`);
      this.draw();
    } else {
      btns.forEach(b => b.disabled = false);
    }
  }

  _getMockTopicsForPillar(pillarName) {
    if (pillarName.includes('Founder POV') || pillarName.includes('Stories')) {
      return [
        { topic: `The conversation with my co-founder that changed how we share equity.`, formatType: `Storytelling`, hookAngle: `Co-founder conflict resolution` },
        { topic: `How climbing Mt. Rainier taught me to manage high-stress launch cycles.`, formatType: `Storytelling`, hookAngle: `Analogous lessons from climbing` },
        { topic: `What we spent our first $10k seed capital check on (and what we should have bought instead).`, formatType: `Founder POV`, hookAngle: `Startup capital allocation mistake` }
      ];
    } 
    else if (pillarName.includes('Thought Leadership') || pillarName.includes('niche')) {
      return [
        { topic: `Why async-first communication is a competitive advantage in B2B SaaS.`, formatType: `Analytical`, hookAngle: `Business efficiency comparison` },
        { topic: `How to build a technical culture where deleting code is celebrated.`, formatType: `Founder POV`, hookAngle: `Deletes vs additions metric` },
        { topic: `The architectural cost of microservices: Why monolithic platforms are staging a comeback.`, formatType: `Analytical`, hookAngle: `Contrarian software systems choice` }
      ];
    }
    else if (pillarName.includes('Sprints') || pillarName.includes('Audits') || pillarName.includes('Wins')) {
      return [
        { topic: `The exact query cache speeds that saved an ecommerce client 3 seconds on load time.`, formatType: `Problem Solution`, hookAngle: `Speed win metrics hook` },
        { topic: `What we discovered during our last custom systems performance audit.`, formatType: `Framework`, hookAngle: `Audit findings breakdown` },
        { topic: `Why we turned down a $20k retainer consulting contract to protect team capacity.`, formatType: `Storytelling`, hookAngle: `Ethical boundary decisions` }
      ];
    }
    else if (pillarName.includes('Industry News') || pillarName.includes('Trends') || pillarName.includes('Updates')) {
      return [
        { topic: `The future of remote tech hiring in 2026: Why local talent hubs are winning.`, formatType: `Opinion`, hookAngle: `Hiring trends forecast` },
        { topic: `How database caching architectures are adapting to real-time agent workloads.`, formatType: `Analytical`, hookAngle: `AI developer trend comment` },
        { topic: `The impact of regional cloud sovereignty directives on B2B SaaS caching clusters.`, formatType: `Analytical`, hookAngle: `SaaS infrastructure policy trend` }
      ];
    }
    else {
      return [
        { topic: `3 principles that govern our client onboarding process.`, formatType: `Listicle`, hookAngle: `Client relationship guidelines` },
        { topic: `How we handle team misalignment when launching a critical sprint.`, formatType: `Storytelling`, hookAngle: `Conflict resolution story` },
        { topic: `The tools we use to maintain 100% async documentation.`, formatType: `Bullets`, hookAngle: `Software checklist hook` }
      ];
    }
  }

  // Clipboard helper
  async _copyToClipboard(text, eventOrElement) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
      
      let targetEl = null;
      if (eventOrElement) {
        targetEl = eventOrElement.target ? eventOrElement.target.closest('button') : eventOrElement;
      }
      
      if (targetEl) {
        const originalHTML = targetEl.innerHTML;
        targetEl.innerHTML = `<i data-lucide="check" style="width:14px; height:14px; color:var(--color-success);"></i> Copied!`;
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
      toast.error('Failed to copy. Please copy manually.');
    }
  }
}

export const brandingStrategy = new BrandingStrategy();
export default brandingStrategy;
