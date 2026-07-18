/* ==========================================================================
   TOAST NOTIFICATION COMPONENT — personal-branding-agent
   ========================================================================== */

class ToastService {
  constructor() {
    this.container = null;
    this._ensureContainer();
  }

  // Create toast container if it doesn't exist
  _ensureContainer() {
    if (this.container) return;
    
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  }

  // Trigger Notification
  show(message, type = 'info', duration = 3000) {
    this._ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Choose appropriate icon
    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'alert-triangle';
    if (type === 'error') icon = 'alert-circle';

    toast.innerHTML = `
      <i data-lucide="${icon}"></i>
      <span>${message}</span>
    `;

    this.container.appendChild(toast);
    
    // Initialize icons for this injected element
    if (window.lucide) {
      window.lucide.createIcons({
        attrs: {
          class: 'lucide-icon'
        },
        nameAttr: 'data-lucide'
      });
    }

    // Determine actual duration safely
    const activeDuration = typeof duration === 'number' ? duration : 3000;

    // Auto remove toast
    setTimeout(() => {
      toast.style.animation = 'fadeOut var(--transition-fast) forwards';
      
      // Fallback timer to guarantee toast removal even if animationend event doesn't fire
      const safetyTimeout = setTimeout(() => {
        toast.remove();
      }, 400);

      toast.addEventListener('animationend', () => {
        clearTimeout(safetyTimeout);
        toast.remove();
      });
    }, activeDuration);
  }

  success(message, duration) {
    this.show(message, 'success', duration);
  }

  warning(message, duration) {
    this.show(message, 'warning', duration);
  }

  error(message, duration) {
    this.show(message, 'error', duration);
  }

  info(message, duration) {
    this.show(message, 'info', duration);
  }
}

export const toast = new ToastService();
export default toast;
