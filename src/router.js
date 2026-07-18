/* ==========================================================================
   CLIENT-SIDE HASH ROUTER — personal-branding-agent
   ========================================================================== */

class Router {
  constructor() {
    this.routes = [];
    this.currentPath = null;
    this.currentParams = {};
    
    // Bind hash change listener
    window.addEventListener('hashchange', () => this._handleHashChange());
  }

  // Register route callback
  add(pathPattern, callback) {
    // Convert e.g. "client/:id/strategy" to a regular expression
    // "client/:id/strategy" -> ^client/([^/]+)/strategy$
    const regexSource = pathPattern
      .replace(/:[a-zA-Z0-9_]+/g, '([^/]+)')
      .replace(/\//g, '\\/');
    
    const regex = new RegExp(`^#${regexSource}$`);
    
    // Find parameters keys e.g. ["id"]
    const paramNames = (pathPattern.match(/:[a-zA-Z0-9_]+/g) || [])
      .map(name => name.substring(1));

    this.routes.push({
      pattern: pathPattern,
      regex,
      paramNames,
      callback
    });
  }

  // Programmatic navigation
  navigate(path) {
    window.location.hash = path.startsWith('#') ? path : `#${path}`;
  }

  // Start route matching
  start() {
    this._handleHashChange();
  }

  // Current route helper
  getRouteParams() {
    return this.currentParams;
  }

  _handleHashChange() {
    const hash = window.location.hash || '#dashboard';
    
    // Reset state
    let matched = false;

    for (const route of this.routes) {
      const match = hash.match(route.regex);
      if (match) {
        matched = true;
        
        // Extract parameters
        const params = {};
        route.paramNames.forEach((name, idx) => {
          params[name] = decodeURIComponent(match[idx + 1]);
        });

        this.currentPath = route.pattern;
        this.currentParams = params;
        
        // Fire callback
        route.callback(params);
        break;
      }
    }

    if (!matched) {
      console.warn(`No route matched for hash: ${hash}. Redirecting to dashboard.`);
      this.navigate('dashboard');
    }
  }
}

export const router = new Router();
export default router;
