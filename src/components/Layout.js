/* ==========================================================================
   LAYOUT SHELL UI COMPONENT — personal-branding-agent
   ========================================================================== */

import { router } from '../router.js';
import { db } from '../db.js';
import toast from './Toast.js';

class Layout {
  constructor() {
    this.activeClientId = null;
    this.activeClientName = '';
    this.autosaveState = 'hidden'; // 'saving' | 'saved' | 'hidden'
    this._initGlobalShortcuts();
  }

  // Renders the global frame structure into the app root
  render(rootEl) {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const themeIcon = currentTheme === 'dark' ? 'sun' : 'moon';
    rootEl.innerHTML = `
      <!-- Global Top Header -->
      <header class="app-global-header">
        <div class="header-brand-container">
          <div class="global-logo-container">
            <svg class="global-logo-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          </div>
          <span class="global-brand-name">Scribe</span>
          
          <div class="brand-divider"></div>
          
          <div class="header-breadcrumbs" id="breadcrumbs">
            <span class="breadcrumb-item breadcrumb-active" id="crumb-main">All Clients</span>
          </div>
        </div>

        <div class="global-header-right">
          <!-- Autosave Badge -->
          <div class="autosave-status hidden" id="save-status">
            <!-- Injected by setAutosaveState -->
          </div>

          <!-- Client Switcher Container -->
          <div class="sidebar-switcher-container" id="switcher-container" style="margin: 0; width: 190px;"></div>

          <button class="btn btn-secondary btn-icon-only" id="btn-theme-toggle" title="Toggle Theme" style="padding: 6px;">
            <i data-lucide="${themeIcon}"></i>
          </button>
          
          <button class="btn btn-secondary btn-icon-only" id="btn-global-config" title="Settings" style="padding: 6px;">
            <i data-lucide="settings"></i>
          </button>
        </div>
      </header>

      <div class="app-body-container">
        <!-- Left Sidebar -->
        <aside class="app-sidebar">
          <!-- Sidebar Navigation Menu -->
          <nav class="sidebar-menu">
            <div class="menu-item active" id="menu-dashboard">
              <i data-lucide="layout-dashboard"></i>
              <span>All Clients</span>
            </div>
            
            <div class="sidebar-divider"></div>
            
            <div class="sidebar-section-title" id="client-section-title">Client Workspace</div>
            
            <div class="menu-item" id="menu-profile">
              <i data-lucide="user-cog"></i>
              <span>Client Profile</span>
            </div>
            
            <div class="menu-item" id="menu-strategy">
              <i data-lucide="shield-check"></i>
              <span>Branding Strategy</span>
            </div>
            
            <div class="menu-item" id="menu-questions">
              <i data-lucide="help-circle"></i>
              <span>Interview Qs</span>
            </div>
            
            <div class="menu-item" id="menu-generator">
              <i data-lucide="pen-tool"></i>
              <span>Content Generator</span>
            </div>
          </nav>
          
          <!-- Footer user detail slot -->
          <div class="sidebar-footer">
            <div class="user-profile">
              <div class="user-avatar">AG</div>
              <div class="user-info">
                <span class="user-name">Agency Workspace</span>
                <span class="user-role">Premium Admin</span>
              </div>
            </div>
          </div>
        </aside>
        
        <!-- Main Content Layout -->
        <main class="app-main">
          <!-- Content Viewport -->
          <div class="app-viewport animate-fade-in" id="app-viewport"></div>
        </main>
      </div>
    `;

    this._bindSidebarEvents();
    this.updateWorkspaceState(null); // Initially no active client
    this.setAutosaveState('hidden');
    // this._injectCuteCat();
    
    if (window.lucide) window.lucide.createIcons();
  }

  _injectCuteCat() {
    const existing = document.getElementById('cute-cat-widget');
    if (existing) {
      if (existing._quoteInterval) {
        clearInterval(existing._quoteInterval);
      }
      existing.remove();
    }

    const catContainer = document.createElement('div');
    catContainer.className = 'cute-cat-container';
    catContainer.id = 'cute-cat-widget';
    catContainer.title = "Click me for magic!";

    catContainer.innerHTML = `
      <div class="cat-bubble" id="cat-speech-bubble">Meow! ✨</div>
      <div class="cute-cat">
        <svg class="pixel-cat-svg" width="140" height="140" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
          <!-- Ginger body/head base -->
          <path d="M3 2h1v1H3zm-1 1h3v1H2zm10-1h1v1h-1zm-1 1h3v1h-3zm-9 1h10v1H3zm-1 1h12v1H2zm0 1h12v1H2zm1 1h10v1H3zm2 1h6v1H5zm-2 1h10v1H3zm-1 1h12v1H2zm0 1h12v1H2zm0 1h12v1H2zm0 1h12v1H2zm1 1h10v1H3z" fill="#E9965B"/>
          <!-- Stripes / Shadows -->
          <path d="M7 4h2v1H7V4z M2 11h1v2H2v-2z M13 11h1v2h-1v-2z" fill="#D47B3D"/>
          <!-- Inner ears & Cheeks (Pink) -->
          <path d="M3 3h1v1H3V3z M12 3h1v1h-1V3z M3 6h1v1H3V6z M12 6h1v1h-1V6z" fill="#FFB5A7"/>
          <!-- Eyes, Nose, Mouth, & Whiskers (Dark Cocoa) -->
          <path d="M4 5h1v1H4V5z M11 5h1v1h-1V5z M7 6h2v1H7V6z M7 7h2v1H7V7z M0 6h2v1H0V6z M1 7h2v1H1V7z M14 6h2v1H14V6z M13 7h2v1H13V7z" fill="#2D2321"/>
          <!-- Cream belly & Paws -->
          <path d="M6 10h4v4H6v-4z M4 14h2v1H4V14z M10 14h2v1h-2V14z" fill="#FAF0EF"/>
          <!-- Wiggling tail -->
          <g class="cat-tail-pixel">
            <path d="M13 11h1v1h-1v-1z M14 10h1v1h-1v-1z M14 9h1v1h-1v-1z M14 8h1v1h-1v-1z M13 7h1v1h-1v-1z M12 6h1v1h-1v-1z M11 6h1v1H11V6z" fill="#E9965B"/>
            <path d="M14 9h1v1h-1V9z M12 6h1v1h-1V6z" fill="#D47B3D"/>
          </g>
        </svg>
      </div>
    `;

    document.body.appendChild(catContainer);

    const quotes = [
      "Meow! ✨",
      "Purr... 🐾",
      "You're doing amazing! 🌸",
      "Let's write a cute post! 🎀",
      "Sparkle sparkle! ✨",
      "Feed me coffee! ☕",
      "Did you run an audit? 🔍",
      "Cat power! 🐱",
      "Coffee & Whimsy is my favorite place! ☕✨",
      "Looking fabulous today! 💅",
      "Time for a little micro-nap? 😴",
      "Remember to stretch! 🐾"
    ];
    let quoteIdx = 0;

    const showBubbleWithRandomQuote = () => {
      quoteIdx = Math.floor(Math.random() * quotes.length);
      const bubble = document.getElementById('cat-speech-bubble');
      if (bubble) {
        bubble.textContent = quotes[quoteIdx];
        catContainer.classList.add('active');
        
        if (catContainer._hideTimeout) {
          clearTimeout(catContainer._hideTimeout);
        }
        catContainer._hideTimeout = setTimeout(() => {
          catContainer.classList.remove('active');
        }, 5000);
      }
    };

    const startInterval = () => {
      return setInterval(() => {
        showBubbleWithRandomQuote();
      }, 15000);
    };

    catContainer._quoteInterval = startInterval();

    catContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (catContainer._quoteInterval) {
        clearInterval(catContainer._quoteInterval);
      }
      
      showBubbleWithRandomQuote();
      
      // Visual bounce click effect
      catContainer.style.transform = 'scale(1.15) translateY(-8px)';
      setTimeout(() => {
        catContainer.style.transform = '';
      }, 200);
      
      catContainer._quoteInterval = startInterval();
    });
  }

  // Returns the DOM container where the active pages should render
  getViewport() {
    return document.getElementById('app-viewport');
  }

  // Handles updating navigation item highlighting and sidebar availability
  updateWorkspaceState(client) {
    const titleEl = document.getElementById('client-section-title');
    const menuProfile = document.getElementById('menu-profile');
    const menuStrategy = document.getElementById('menu-strategy');
    const menuGenerator = document.getElementById('menu-generator');
    const menuQuestions = document.getElementById('menu-questions');
    const switcherContainer = document.getElementById('switcher-container');
    
    if (client) {
      this.activeClientId = client.id;
      this.activeClientName = client.name;
      
      // Update sidebar workspace context
      titleEl.style.display = 'block';
      titleEl.textContent = `${client.name}`;
      
      // Enable client routes
      [menuProfile, menuStrategy, menuGenerator, menuQuestions].forEach(item => {
        item.style.display = 'flex';
        item.style.opacity = '1';
        item.style.pointerEvents = 'auto';
      });
    } else {
      this.activeClientId = null;
      this.activeClientName = '';
      
      // Disable client routes
      titleEl.style.display = 'none';
      [menuProfile, menuStrategy, menuGenerator, menuQuestions].forEach(item => {
        item.style.display = 'none';
        item.style.opacity = '0.4';
        item.style.pointerEvents = 'none';
      });
    }

    // Render switcher container content
    if (switcherContainer) {
      const activeName = client ? client.name : 'Select Client...';
      switcherContainer.innerHTML = `
        <button class="sidebar-switcher-btn" id="switcher-toggle-btn">
          <span>${activeName}</span>
          <i data-lucide="chevrons-up-down"></i>
        </button>
        <div class="sidebar-switcher-dropdown hidden" id="switcher-dropdown"></div>
      `;
      
      this._bindSwitcherEvents();
    }
  }

  // Update Breadcrumbs
  updateBreadcrumbs(items) {
    const container = document.getElementById('breadcrumbs');
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `<span class="breadcrumb-item breadcrumb-active">All Clients</span>`;
      return;
    }

    let html = `<span class="breadcrumb-item"><a href="#dashboard">All Clients</a></span>`;
    items.forEach((item, idx) => {
      html += ` <span class="breadcrumb-sep">></span> `;
      if (idx === items.length - 1) {
        html += `<span class="breadcrumb-item breadcrumb-active">${item.label}</span>`;
      } else {
        html += `<span class="breadcrumb-item"><a href="${item.hash}">${item.label}</a></span>`;
      }
    });

    container.innerHTML = html;
  }

  // Highlights active sidebar menu button
  highlightMenu(activeId) {
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
      if (item.id === activeId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Updates the top header auto-save indicator badge
  setAutosaveState(state) {
    const statusEl = document.getElementById('save-status');
    if (!statusEl) return;

    this.autosaveState = state;

    if (state === 'saving') {
      statusEl.classList.remove('hidden');
      statusEl.innerHTML = `<i data-lucide="refresh-cw" class="autosave-saving animate-spin"></i> <span>Saving changes...</span>`;
      statusEl.querySelector('i').style.animation = 'spin 1.5s linear infinite';
    } else if (state === 'saved') {
      statusEl.classList.remove('hidden');
      statusEl.innerHTML = `<i data-lucide="check" class="autosave-saved"></i> <span>Saved to local DB</span>`;
    } else {
      statusEl.classList.add('hidden');
    }

    if (window.lucide) {
      window.lucide.createIcons({
        attrs: { class: 'lucide-icon' },
        nameAttr: 'data-lucide'
      });
    }
  }

  _bindSidebarEvents() {
    document.getElementById('menu-dashboard').addEventListener('click', () => {
      router.navigate('dashboard');
    });

    document.getElementById('menu-profile').addEventListener('click', () => {
      if (this.activeClientId) router.navigate(`client/${this.activeClientId}`);
    });

    document.getElementById('menu-strategy').addEventListener('click', () => {
      if (this.activeClientId) router.navigate(`client/${this.activeClientId}/strategy`);
    });

    document.getElementById('menu-questions').addEventListener('click', () => {
      if (this.activeClientId) router.navigate(`client/${this.activeClientId}/questions`);
    });

    document.getElementById('menu-generator').addEventListener('click', () => {
      if (this.activeClientId) router.navigate(`client/${this.activeClientId}/posts`);
    });

    // Theme toggle
    const themeBtn = document.getElementById('btn-theme-toggle');
    themeBtn.addEventListener('click', () => {
      const currentTheme = document.body.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      themeBtn.innerHTML = newTheme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
      if (window.lucide) window.lucide.createIcons();
    });

    // Global Settings Toggle
    const configBtn = document.getElementById('btn-global-config');
    if (configBtn) {
      configBtn.addEventListener('click', () => this.showSettingsModal());
    }
  }

  _bindSwitcherEvents() {
    const toggleBtn = document.getElementById('switcher-toggle-btn');
    const dropdown = document.getElementById('switcher-dropdown');
    
    if (!toggleBtn || !dropdown) return;

    toggleBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isHidden = dropdown.classList.contains('hidden');
      
      if (isHidden) {
        // Load clients from DB
        const clients = await db.getClients();
        
        let dropdownHtml = `
          <button class="sidebar-switcher-item ${!this.activeClientId ? 'active' : ''}" data-id="dashboard">
            All Clients Dashboard
          </button>
        `;
        
        if (clients.length > 0) {
          dropdownHtml += `<div class="sidebar-divider" style="margin: 4px 8px;"></div>`;
          dropdownHtml += clients.map(client => `
            <button class="sidebar-switcher-item ${this.activeClientId === client.id ? 'active' : ''}" data-id="${client.id}">
              ${client.name}
            </button>
          `).join('');
        }

        dropdown.innerHTML = dropdownHtml;
        dropdown.classList.remove('hidden');

        // Bind dropdown items click
        dropdown.querySelectorAll('.sidebar-switcher-item').forEach(item => {
          item.addEventListener('click', () => {
            const id = item.getAttribute('data-id');
            dropdown.classList.add('hidden');
            if (id === 'dashboard') {
              router.navigate('dashboard');
            } else {
              router.navigate(`client/${id}`);
            }
          });
        });

        // Click outside handler
        const closeSwitcher = (evt) => {
          if (!evt.target.closest('.sidebar-switcher-container')) {
            dropdown.classList.add('hidden');
            document.removeEventListener('click', closeSwitcher);
          }
        };
        document.addEventListener('click', closeSwitcher);

      } else {
        dropdown.classList.add('hidden');
      }
    });
  }

  showSettingsModal() {
    if (document.getElementById('settings-modal')) return;

    const savedKey = localStorage.getItem('gemini_api_key') || '';
    const useBackend = localStorage.getItem('use_backend_server') === 'true';
    const backendUrl = localStorage.getItem('backend_server_url') || 'http://127.0.0.1:3000';

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'settings-modal';
    
    modalOverlay.innerHTML = `
      <style>
        .switch-toggle input:checked + .slider-round {
          background-color: var(--color-accent) !important;
        }
        .switch-toggle input:checked + .slider-round::before {
          transform: translateX(20px);
        }
        .slider-round::before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }
      </style>
      <div class="modal animate-fade-in" style="max-width: 450px;">
        <div class="modal-header">
          <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">
            <i data-lucide="settings" style="color: var(--color-accent); width: 20px; height: 20px;"></i>
            Global Settings
          </h3>
          <button class="btn-icon-only" id="btn-close-settings" style="padding: 4px;">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="modal-body" style="display:flex; flex-direction:column; gap:12px;">
          <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
            Configure API keys and integrations for Coffee & Whimsy.
          </p>
          
          <div class="form-group">
            <label class="form-label" for="settings-gemini-key">
              Gemini API Key
              <span style="font-weight: normal; color: var(--text-muted); font-size: 0.75rem;">(Stored locally in browser)</span>
            </label>
            <div style="position: relative; display: flex; align-items: center;">
              <input type="password" class="input-text" id="settings-gemini-key" value="${savedKey}" placeholder="AI Studio API Key (AIzaSy...)" style="padding-right: 40px; border-radius: var(--radius-md);">
              <button class="btn-icon-only" id="btn-toggle-key-visibility" style="position: absolute; right: 8px; background: none; border: none; cursor: pointer; color: var(--text-muted);" title="Toggle Visibility">
                <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
              </button>
            </div>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 4px 0 0 0;">
              Get a free API key from the <a href="https://aistudio.google.com/" target="_blank" style="color: var(--color-accent); text-decoration: underline;">Google AI Studio Console</a>.
            </p>
          </div>

          <!-- Backend Server Proxy Toggle -->
          <div class="form-group" style="border-top: 1px solid var(--border-color); padding-top: 12px; margin: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <label class="form-label" style="margin: 0; font-weight: 600;">Use Backend Server Proxy</label>
              <label class="switch-toggle" style="position: relative; display: inline-block; width: 44px; height: 22px;">
                <input type="checkbox" id="settings-use-backend" ${useBackend ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                <span class="slider-round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--bg-card-hover); transition: .3s; border-radius: 22px; border: 1px solid var(--border-color);"></span>
              </label>
            </div>
            <p style="font-size: 0.725rem; color: var(--text-muted); margin: 0 0 8px 0;">
              Securely routes LLM calls and crawlers to a backend server. If checked, the local Gemini API Key is ignored and not exposed.
            </p>
            <div id="backend-url-container" style="display: ${useBackend ? 'block' : 'none'}; margin-top: 8px;">
              <label class="form-label" for="settings-backend-url" style="font-size: 0.75rem; margin-bottom: 4px;">Backend Server URL</label>
              <input type="text" class="input-text" id="settings-backend-url" value="${backendUrl}" placeholder="e.g. http://127.0.0.1:3000" style="font-size: 0.8rem;">
            </div>
          </div>

          <div style="background-color: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.15); border-radius: var(--radius-md); padding: var(--space-md); margin-top: 2px;">
            <h4 style="margin: 0 0 var(--space-xs) 0; font-size: 0.85rem; color: var(--text-bright); display: flex; align-items: center; gap: 6px;">
              <i data-lucide="mic" style="width: 14px; height: 14px; color: var(--color-accent);"></i> Voice Dictation Settings
            </h4>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">
              The discovery call voice dictation feature uses the browser's native <strong>Web Speech API</strong> and does not require any external Speech API Keys. Make sure you grant microphone access in Chrome or Safari.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-settings-cancel">Cancel</button>
          <button class="btn btn-primary" id="btn-settings-save">Save Settings</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);
    if (window.lucide) window.lucide.createIcons();

    const closeBtn = document.getElementById('btn-close-settings');
    const cancelBtn = document.getElementById('btn-settings-cancel');
    const saveBtn = document.getElementById('btn-settings-save');
    const keyInput = document.getElementById('settings-gemini-key');
    const useBackendCheckbox = document.getElementById('settings-use-backend');
    const backendUrlContainer = document.getElementById('backend-url-container');
    const visibilityBtn = document.getElementById('btn-toggle-key-visibility');

    const closeModal = () => {
      document.body.removeChild(modalOverlay);
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    if (useBackendCheckbox && backendUrlContainer) {
      useBackendCheckbox.addEventListener('change', (e) => {
        backendUrlContainer.style.display = e.target.checked ? 'block' : 'none';
      });
    }

    visibilityBtn.addEventListener('click', () => {
      const type = keyInput.getAttribute('type') === 'password' ? 'text' : 'password';
      keyInput.setAttribute('type', type);
      const icon = visibilityBtn.querySelector('i');
      if (type === 'text') {
        icon.setAttribute('data-lucide', 'eye-off');
      } else {
        icon.setAttribute('data-lucide', 'eye');
      }
      if (window.lucide) window.lucide.createIcons();
    });

    saveBtn.addEventListener('click', () => {
      const keyVal = keyInput.value.trim();
      const useBackendVal = useBackendCheckbox ? useBackendCheckbox.checked : false;
      const backendUrlVal = document.getElementById('settings-backend-url') ? document.getElementById('settings-backend-url').value.trim() : 'http://127.0.0.1:3000';

      localStorage.setItem('gemini_api_key', keyVal);
      localStorage.setItem('use_backend_server', useBackendVal ? 'true' : 'false');
      localStorage.setItem('backend_server_url', backendUrlVal);

      if (useBackendVal) {
        toast.success(`Settings saved! Operating securely via backend server at ${backendUrlVal}`);
      } else {
        if (keyVal) {
          toast.success('Gemini API key saved successfully! Operating client-side.');
        } else {
          toast.info('Gemini API key cleared. Operating in local fallback mock mode.');
        }
      }
      closeModal();
    });
  }

  // Global Keyboard Shortcuts Initializer
  _initGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      // 1. Esc Key to close active modals
      if (e.key === 'Escape') {
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
          document.body.removeChild(settingsModal);
          return;
        }
        const cmdMenu = document.getElementById('command-menu-modal');
        if (cmdMenu) {
          document.body.removeChild(cmdMenu);
          return;
        }
      }

      // 2. Cmd/Ctrl + K Toggle Command Menu
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggleCommandMenu();
      }

      // 3. Alt + ArrowLeft / ArrowRight to cycle client workspace sub-tabs
      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        if (!this.activeClientId) return;
        
        const subTabs = [
          `client/${this.activeClientId}`,
          `client/${this.activeClientId}/strategy`,
          `client/${this.activeClientId}/questions`,
          `client/${this.activeClientId}/posts`
        ];
        
        const currentHash = window.location.hash || '#dashboard';
        const cleanHash = currentHash.replace(/^#/, '');
        
        let currentIdx = -1;
        if (cleanHash === `client/${this.activeClientId}`) {
          currentIdx = 0;
        } else if (cleanHash === `client/${this.activeClientId}/strategy`) {
          currentIdx = 1;
        } else if (cleanHash === `client/${this.activeClientId}/questions`) {
          currentIdx = 2;
        } else if (cleanHash === `client/${this.activeClientId}/posts`) {
          currentIdx = 3;
        }
        
        if (currentIdx !== -1) {
          e.preventDefault();
          let nextIdx = currentIdx;
          if (e.key === 'ArrowLeft') {
            nextIdx = (currentIdx - 1 + subTabs.length) % subTabs.length;
          } else {
            nextIdx = (currentIdx + 1) % subTabs.length;
          }
          router.navigate(subTabs[nextIdx]);
        }
      }
    });
  }

  // Toggle Command Menu Visibility
  toggleCommandMenu() {
    const existing = document.getElementById('command-menu-modal');
    if (existing) {
      document.body.removeChild(existing);
    } else {
      this.showCommandMenu();
    }
  }

  // Command Switer Menu Spotlight Dialog
  async showCommandMenu() {
    if (document.getElementById('command-menu-modal')) return;

    // Load clients to offer as destinations
    const clients = await db.getClients();

    const overlay = document.createElement('div');
    overlay.className = 'command-menu-overlay';
    overlay.id = 'command-menu-modal';

    overlay.innerHTML = `
      <div class="command-menu animate-fade-in">
        <div class="command-menu-search-wrapper">
          <i data-lucide="search"></i>
          <input type="text" class="command-menu-search-input" id="cmd-menu-search" placeholder="Type a command or client name..." autofocus>
        </div>
        
        <div class="command-menu-list" id="cmd-menu-list">
          <!-- Rendered dynamically -->
        </div>

        <div class="command-menu-footer">
          <div class="command-menu-tips">
            <span><kbd>↑↓</kbd> Navigation</span>
            <span><kbd>Enter</kbd> Select</span>
            <span><kbd>Esc</kbd> Close</span>
          </div>
          <div>
            <span>Press <kbd>⌘ K</kbd> or <kbd>Ctrl K</kbd> to toggle</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    if (window.lucide) window.lucide.createIcons();

    const searchInput = document.getElementById('cmd-menu-search');
    const listContainer = document.getElementById('cmd-menu-list');

    // Define commands
    const actions = [
      { id: 'go-dashboard', label: 'Go to All Clients Dashboard', icon: 'layout-dashboard', category: 'Navigation', execute: () => router.navigate('dashboard') },
      { id: 'toggle-theme', label: 'Toggle Light / Dark Mode', icon: 'sun', category: 'System', execute: () => {
          const currentTheme = document.body.getAttribute('data-theme') || 'light';
          const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
          document.body.setAttribute('data-theme', newTheme);
          localStorage.setItem('theme', newTheme);
          const themeBtn = document.getElementById('btn-theme-toggle');
          if (themeBtn) {
            themeBtn.innerHTML = newTheme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
            if (window.lucide) window.lucide.createIcons();
          }
          toast.success(`Switched to ${newTheme} mode.`);
        }
      },
      { id: 'open-settings', label: 'Open Global Settings Modal', icon: 'settings', category: 'System', execute: () => this.showSettingsModal() }
    ];

    let selectedIndex = 0;
    let items = []; // Holds matching elements currently rendered in command menu

    const drawList = () => {
      const query = searchInput.value.trim().toLowerCase();
      
      // Filter actions
      const matchedActions = actions.filter(act => act.label.toLowerCase().includes(query));
      
      // Filter clients and generate sub-destinations
      const matchedClients = [];
      clients.forEach(c => {
        const matchName = c.name.toLowerCase().includes(query) || 
                          c.company.toLowerCase().includes(query) || 
                          c.industry.toLowerCase().includes(query);
                          
        if (matchName) {
          matchedClients.push({
            id: `client-profile-${c.id}`,
            label: `${c.name} — Profile Workspace`,
            icon: 'user-cog',
            category: 'Clients',
            execute: () => router.navigate(`client/${c.id}`)
          });
          matchedClients.push({
            id: `client-strategy-${c.id}`,
            label: `${c.name} — Branding Strategy`,
            icon: 'shield-check',
            category: 'Clients',
            execute: () => router.navigate(`client/${c.id}/strategy`)
          });
          matchedClients.push({
            id: `client-questions-${c.id}`,
            label: `${c.name} — Discovery Notepad`,
            icon: 'help-circle',
            category: 'Clients',
            execute: () => router.navigate(`client/${c.id}/questions`)
          });
          matchedClients.push({
            id: `client-generator-${c.id}`,
            label: `${c.name} — LinkedIn Generator`,
            icon: 'pen-tool',
            category: 'Clients',
            execute: () => router.navigate(`client/${c.id}/posts`)
          });
        }
      });

      items = [...matchedActions, ...matchedClients];

      if (items.length === 0) {
        listContainer.innerHTML = `<div style="padding:var(--space-md); text-align:center; font-size:0.8rem; color:var(--text-muted);">No matching commands or clients.</div>`;
        return;
      }

      // Constrain selection
      if (selectedIndex >= items.length) selectedIndex = items.length - 1;
      if (selectedIndex < 0) selectedIndex = 0;

      // Group by category
      const grouped = {};
      items.forEach((item, idx) => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push({ item, idx });
      });

      let html = '';
      Object.entries(grouped).forEach(([cat, list]) => {
        html += `<div class="command-menu-section-title">${cat}</div>`;
        list.forEach(({ item, idx }) => {
          const isActive = idx === selectedIndex;
          html += `
            <button class="command-menu-item ${isActive ? 'active' : ''}" data-idx="${idx}">
              <div class="command-menu-item-left">
                <i data-lucide="${item.icon}"></i>
                <span>${item.label}</span>
              </div>
              <div class="command-menu-item-right">
                ${item.category === 'Clients' ? 'Navigate' : 'Action'}
              </div>
            </button>
          `;
        });
      });

      listContainer.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      // Bind mouse click events
      listContainer.querySelectorAll('.command-menu-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-idx'));
          executeItem(items[idx]);
        });
      });
    };

    const executeItem = (item) => {
      if (overlay.parentNode) {
        document.body.removeChild(overlay);
      }
      if (item && typeof item.execute === 'function') {
        item.execute();
      }
    };

    // Close overlays
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        if (overlay.parentNode) document.body.removeChild(overlay);
      }
    });

    // Inputs bindings
    searchInput.addEventListener('input', () => {
      selectedIndex = 0;
      drawList();
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        drawList();
        // Scroll focused item into view
        const activeBtn = listContainer.querySelector('.command-menu-item.active');
        if (activeBtn) activeBtn.scrollIntoView({ block: 'nearest' });
      } 
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        drawList();
        // Scroll focused item into view
        const activeBtn = listContainer.querySelector('.command-menu-item.active');
        if (activeBtn) activeBtn.scrollIntoView({ block: 'nearest' });
      } 
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) executeItem(items[selectedIndex]);
      }
    });

    // Focus input
    searchInput.focus();

    // Initial render
    drawList();
  }
}

// Add CSS keyframe for spinner since it's not standard
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
  display: inline-block;
}
`;
document.head.appendChild(styleSheet);

export const layout = new Layout();
export default layout;
