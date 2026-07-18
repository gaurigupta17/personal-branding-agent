/* ==========================================================================
   APPLICATION ENTRY POINT — personal-branding-agent
   ========================================================================== */

import router from './router.js';
import db from './db.js';
import layout from './components/Layout.js';
import dashboard from './components/Dashboard.js';
import clientWorkspace from './components/ClientWorkspace.js';
import brandingStrategy from './components/BrandingStrategy.js';
import interviewQuestions from './components/InterviewQuestions.js';
import contentGenerator from './components/ContentGenerator.js';
import toast from './components/Toast.js';
import { CLIENT_TEMPLATE } from './constants.js';

// Global reference for active page controller lifecycle cleanup
let activeController = null;

// Mount layout container and boot app on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Initialize IndexedDB database
    await db.init();
    
    // 2. Render core layout wrapper shell
    const rootEl = document.getElementById('root');
    layout.render(rootEl);
    
    // 3. Register route callbacks
    _registerRoutes();
    
    // 4. Start Router
    router.start();
    
    // 5. Apply saved theme preference
    const savedTheme = localStorage.getItem('theme') || document.body.getAttribute('data-theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
  } catch (err) {
    console.error('Application boot error:', err);
    document.body.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #080B11; color: #EF4444; font-family: sans-serif; gap: 15px;">
        <h2 style="margin:0;">Database Connection Failed</h2>
        <p style="color:#64748B; margin:0;">Ensure your browser supports IndexedDB storage.</p>
      </div>
    `;
  }
});

// Configure client-side routes
function _registerRoutes() {
  // Hash: #dashboard
  router.add('dashboard', () => {
    _cleanupActiveController();
    const viewport = layout.getViewport();
    dashboard.render(viewport);
  });

  // Hash: #client/new (Creates draft client and navigates to workspace)
  router.add('client/new', async () => {
    _cleanupActiveController();
    try {
      const draftId = 'client_' + Math.random().toString(36).substr(2, 9);
      
      const newClient = {
        ...JSON.parse(JSON.stringify(CLIENT_TEMPLATE)),
        id: draftId,
        name: 'New Client Draft',
        designation: '',
        company: '',
        industry: ''
      };
      
      await db.saveClient(newClient);
      toast.success('Created new client profile.');
      
      // Redirect to edit workspace
      router.navigate(`client/${draftId}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create new client.');
      router.navigate('dashboard');
    }
  });

  // Hash: #client/:id (Workspace details - Profile Tab)
  router.add('client/:id', async (params) => {
    _cleanupActiveController();
    const viewport = layout.getViewport();
    const id = params.id;
    
    activeController = clientWorkspace;
    await clientWorkspace.render(viewport, id);
  });

  // Client Strategy Tab (Milestone 3 focus)
  router.add('client/:id/strategy', async (params) => {
    _cleanupActiveController();
    const viewport = layout.getViewport();
    activeController = brandingStrategy;
    await brandingStrategy.render(viewport, params.id);
  });

  // Client Questions Tab (Milestone 3 focus)
  router.add('client/:id/questions', async (params) => {
    _cleanupActiveController();
    const viewport = layout.getViewport();
    activeController = interviewQuestions;
    await interviewQuestions.render(viewport, params.id);
  });

  // Client Posts Tab (Milestone 4 focus)
  router.add('client/:id/posts', async (params) => {
    _cleanupActiveController();
    const viewport = layout.getViewport();
    activeController = contentGenerator;
    await contentGenerator.render(viewport, params.id);
  });
}

// Clean up active controller before navigation to prevent memory leaks and close voice recorder sessions
function _cleanupActiveController() {
  if (activeController && typeof activeController.destroy === 'function') {
    activeController.destroy();
  }
  activeController = null;
}
