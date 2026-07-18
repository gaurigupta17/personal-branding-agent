/* ==========================================================================
   DASHBOARD VIEW COMPONENT — personal-branding-agent
   ========================================================================== */

import db from '../db.js';
import router from '../router.js';
import toast from './Toast.js';
import layout from './Layout.js';

class Dashboard {
  constructor() {
    this.container = null;
    this.clients = [];
    this.searchQuery = '';
    this.sortBy = 'lastUpdated'; // 'lastUpdated' | 'name' | 'completion'
  }

  // Mounts the dashboard view to the viewport container
  async render(container) {
    this.container = container;
    layout.updateWorkspaceState(null); // Clear active client workspace sidebar links
    layout.updateBreadcrumbs([]);
    layout.highlightMenu('menu-dashboard');

    this.showLoadingSkeleton();
    await this.loadData();
    this.draw();
  }

  // Draw loading skeleton screen
  showLoadingSkeleton() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="dashboard-container animate-fade-in">
        <!-- Stats Skeletons -->
        <div class="dashboard-stats">
          <div class="card stat-card skeleton-pulse" style="height: 100px;"></div>
          <div class="card stat-card skeleton-pulse" style="height: 100px;"></div>
          <div class="card stat-card skeleton-pulse" style="height: 100px;"></div>
        </div>

        <!-- Filter / Search skeleton -->
        <div class="dashboard-toolbar skeleton-pulse" style="height: 48px; border-radius: var(--radius-md);"></div>

        <!-- Cards Skeletons -->
        <div class="client-grid">
          <div class="card skeleton-pulse" style="height: 180px; border-radius: var(--radius-lg);"></div>
          <div class="card skeleton-pulse" style="height: 180px; border-radius: var(--radius-lg);"></div>
          <div class="card skeleton-pulse" style="height: 180px; border-radius: var(--radius-lg);"></div>
        </div>
      </div>
    `;
  }

  // Load clients from DB
  async loadData() {
    try {
      this.clients = await db.getClients();
    } catch (err) {
      console.error(err);
      toast.error('Failed to load clients database.');
    }
  }

  // Drawing Viewport
  draw() {
    if (!this.container) return;

    // Filter and Sort clients
    const filteredClients = this.clients.filter(client => {
      const search = this.searchQuery.toLowerCase();
      return (
        client.name.toLowerCase().includes(search) ||
        client.designation.toLowerCase().includes(search) ||
        client.company.toLowerCase().includes(search) ||
        client.industry.toLowerCase().includes(search)
      );
    });

    // Sort
    filteredClients.sort((a, b) => {
      if (this.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (this.sortBy === 'completion') {
        return b.profileCompletion - a.profileCompletion;
      } else {
        return b.lastUpdated - a.lastUpdated; // Default: lastUpdated
      }
    });

    // Calculate Summary Stats
    const totalClients = this.clients.length;
    const avgCompletion = totalClients > 0
      ? Math.round(this.clients.reduce((acc, c) => acc + c.profileCompletion, 0) / totalClients)
      : 0;
    
    // Find top industry
    const industries = {};
    this.clients.forEach(c => {
      if (c.industry) {
        industries[c.industry] = (industries[c.industry] || 0) + 1;
      }
    });
    let topIndustry = 'N/A';
    let maxCount = 0;
    Object.keys(industries).forEach(ind => {
      if (industries[ind] > maxCount) {
        maxCount = industries[ind];
        topIndustry = ind;
      }
    });

    // Sub-render grid or empty state
    let clientListHTML = '';
    if (totalClients === 0) {
      clientListHTML = `
        <div class="dashboard-empty card animate-fade-in">
          <i data-lucide="user-plus" class="empty-icon"></i>
          <h3>No clients found</h3>
          <p>Get started by adding your first personal branding client profile to generate content pillars and post strategies.</p>
          <button class="btn btn-primary" id="btn-empty-add">
            <i data-lucide="plus"></i> Add New Client
          </button>
        </div>
      `;
    } else if (filteredClients.length === 0) {
      clientListHTML = `
        <div class="dashboard-empty card animate-fade-in">
          <i data-lucide="search" class="empty-icon"></i>
          <h3>No results match your search</h3>
          <p>Try adjusting your search keywords or filter settings.</p>
          <button class="btn btn-secondary" id="btn-clear-search">Clear Search</button>
        </div>
      `;
    } else {
      clientListHTML = `
        <div class="client-grid">
          ${filteredClients.map(client => this._renderClientCard(client)).join('')}
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="dashboard-container">
        <!-- Stats Summary row -->
        <div class="dashboard-stats">
          <div class="card stat-card">
            <span class="stat-label">Total Clients</span>
            <span class="stat-value">${totalClients}</span>
            <span class="stat-desc">Managed profiles in agency store</span>
          </div>
          
          <div class="card stat-card">
            <span class="stat-label">Avg. Completion</span>
            <span class="stat-value">${avgCompletion}%</span>
            <span class="stat-desc">Progress across active cards</span>
          </div>
          
          <div class="card stat-card">
            <span class="stat-label">Top Domain</span>
            <span class="stat-value" style="font-size: 1.5rem; line-height: 2.7rem;">${topIndustry}</span>
            <span class="stat-desc">Most popular client sector</span>
          </div>
        </div>

        <!-- Filter / Search toolbar -->
        <div class="dashboard-toolbar">
          <div class="toolbar-search-wrapper">
            <i data-lucide="search"></i>
            <input type="text" class="input-text" id="dashboard-search" placeholder="Search clients, job titles, or companies..." value="${this.searchQuery}">
          </div>
          
          <div class="toolbar-filters">
            <select class="select-input" id="dashboard-sort" style="width: auto;">
              <option value="lastUpdated" ${this.sortBy === 'lastUpdated' ? 'selected' : ''}>Sort by: Last Updated</option>
              <option value="name" ${this.sortBy === 'name' ? 'selected' : ''}>Sort by: Name (A-Z)</option>
              <option value="completion" ${this.sortBy === 'completion' ? 'selected' : ''}>Sort by: Completion %</option>
            </select>
            
            <button class="btn btn-primary" id="btn-add-client">
              <i data-lucide="plus"></i> Add Client
            </button>
          </div>
        </div>

        <!-- Main client listing grid -->
        ${clientListHTML}
      </div>
    `;

    this._bindEvents();
    if (window.lucide) window.lucide.createIcons();
  }

  // Render HTML for single client card
  _renderClientCard(client) {
    const formattedDate = new Date(client.lastUpdated).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Select color color code for progress indicator
    let progressClass = 'badge-danger';
    if (client.profileCompletion >= 75) {
      progressClass = 'badge-success';
    } else if (client.profileCompletion >= 40) {
      progressClass = 'badge-warning';
    }

    return `
      <div class="card card-hoverable client-card" data-client-id="${client.id}">
        <div class="client-card-header">
          <div class="client-meta-info">
            <h4 class="client-card-name">${client.name}</h4>
            <span class="client-card-headline">${client.designation}</span>
            <span class="client-card-headline" style="color: var(--text-bright); font-weight: 500;">${client.company}</span>
          </div>
          
          <!-- Drop action menu slot -->
          <div class="action-menu-container">
            <button class="btn-icon-only btn-dots-trigger" data-id="${client.id}">
              <i data-lucide="more-horizontal" data-id="${client.id}"></i>
            </button>
            <div class="action-dropdown hidden" id="dropdown-${client.id}">
              <button class="action-dropdown-item btn-act-duplicate" data-id="${client.id}">
                <i data-lucide="copy" data-id="${client.id}"></i> Duplicate
              </button>
              <button class="action-dropdown-item action-dropdown-item-danger btn-act-delete" data-id="${client.id}">
                <i data-lucide="trash-2" data-id="${client.id}"></i> Delete
              </button>
            </div>
          </div>
        </div>

        <!-- Tag row -->
        <div class="client-tag-row">
          <span class="badge badge-primary">${client.industry || 'General'}</span>
        </div>

        <!-- Completion track -->
        <div class="client-progress-container">
          <div class="client-progress-header">
            <span class="client-progress-label">Profile Completion</span>
            <span class="client-progress-percent ${progressClass}">${client.profileCompletion}%</span>
          </div>
          <div class="client-progress-track">
            <div class="client-progress-bar" style="width: ${client.profileCompletion}%"></div>
          </div>
        </div>

        <!-- Footer -->
        <div class="client-card-footer">
          <span>Last modified: ${formattedDate}</span>
        </div>
      </div>
    `;
  }

  // Set up event listeners
  _bindEvents() {
    // Add Client Buttons
    const btnAdd = document.getElementById('btn-add-client');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => router.navigate('client/new'));
    }

    const btnEmptyAdd = document.getElementById('btn-empty-add');
    if (btnEmptyAdd) {
      btnEmptyAdd.addEventListener('click', () => router.navigate('client/new'));
    }

    const btnClearSearch = document.getElementById('btn-clear-search');
    if (btnClearSearch) {
      btnClearSearch.addEventListener('click', () => {
        this.searchQuery = '';
        this.draw();
      });
    }

    // Search bar input
    const searchInput = document.getElementById('dashboard-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        // Re-draw grid list only (prevents losing focus by redrawing entire DOM container)
        this._updateGridList();
      });
    }

    // Sort Dropdown
    const sortSelect = document.getElementById('dashboard-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.draw();
      });
    }

    // Global document listener to close open action dropdowns when clicking outside
    const documentClickHandler = (e) => {
      if (!e.target.closest('.action-menu-container')) {
        this._closeAllDropdowns();
        document.removeEventListener('click', documentClickHandler);
      }
    };
    document.addEventListener('click', documentClickHandler);

    // Bind card elements triggers
    this._bindCardListenersOnly();
  }

  // Swaps client grid lists on live typing search
  _updateGridList() {
    const listContainer = this.container.querySelector('.client-grid') || this.container.querySelector('.dashboard-empty');
    if (!listContainer) return;

    const filteredClients = this.clients.filter(client => {
      const search = this.searchQuery.toLowerCase();
      return (
        client.name.toLowerCase().includes(search) ||
        client.designation.toLowerCase().includes(search) ||
        client.company.toLowerCase().includes(search) ||
        client.industry.toLowerCase().includes(search)
      );
    });

    filteredClients.sort((a, b) => {
      if (this.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (this.sortBy === 'completion') {
        return b.profileCompletion - a.profileCompletion;
      } else {
        return b.lastUpdated - a.lastUpdated;
      }
    });

    const listHtml = filteredClients.length === 0
      ? `
        <div class="dashboard-empty card animate-fade-in" style="grid-column: 1 / -1;">
          <i data-lucide="search" class="empty-icon"></i>
          <h3>No results match your search</h3>
          <p>Try adjusting your search keywords or filter settings.</p>
        </div>
      `
      : filteredClients.map(client => this._renderClientCard(client)).join('');

    // If grid exists, update innerHTML, else redraw fully
    const grid = this.container.querySelector('.client-grid');
    if (grid) {
      grid.innerHTML = listHtml;
    } else {
      this.draw();
    }
    
    // Bind listeners specifically for dynamically updated items
    this._bindCardListenersOnly();
    if (window.lucide) window.lucide.createIcons();
  }

  _bindCardListenersOnly() {
    const cards = document.querySelectorAll('.client-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.action-menu-container') || e.target.closest('.action-dropdown')) {
          return;
        }
        const clientId = card.getAttribute('data-client-id');
        router.navigate(`client/${clientId}`);
      });
    });

    const dotTriggers = document.querySelectorAll('.btn-dots-trigger');
    dotTriggers.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this._toggleDropdown(id);
      });
    });

    // Duplicate client clicks
    const duplicateBtns = document.querySelectorAll('.btn-act-duplicate');
    duplicateBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this._closeAllDropdowns();
        try {
          await db.duplicateClient(id);
          toast.success('Client duplicated successfully!');
          await this.loadData();
          this.draw();
        } catch (err) {
          console.error(err);
          toast.error('Failed to duplicate client.');
        }
      });
    });

    // Delete client clicks
    const deleteBtns = document.querySelectorAll('.btn-act-delete');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        this._closeAllDropdowns();
        
        const client = this.clients.find(c => c.id === id);
        if (confirm(`Are you sure you want to delete ${client ? client.name : 'this client'} and all their generated content strategy data?`)) {
          try {
            await db.deleteClient(id);
            toast.success('Client profile deleted.');
            await this.loadData();
            this.draw();
          } catch (err) {
            console.error(err);
            toast.error('Failed to delete client profile.');
          }
        }
      });
    });
  }

  _toggleDropdown(id) {
    const dropdown = document.getElementById(`dropdown-${id}`);
    if (!dropdown) return;
    
    const wasHidden = dropdown.classList.contains('hidden');
    this._closeAllDropdowns();
    
    if (wasHidden) {
      dropdown.classList.remove('hidden');
    }
  }

  _closeAllDropdowns() {
    document.querySelectorAll('.action-dropdown').forEach(dropdown => {
      dropdown.classList.add('hidden');
    });
  }
}

export const dashboard = new Dashboard();
export default dashboard;
