// ===== DDrinks Professional App JavaScript =====

class DDrinksApp {
  constructor() {
    this.currentUser = null;
    this.orcamentos = [];
    this.init();
  }

  async init() {
    await this.checkAuth();
    this.setupEventListeners();
    this.setupAnimations();
  }

  // ===== AUTHENTICATION =====
  async checkAuth() {
    try {
      const response = await fetch('/api/auth/check');
      const data = await response.json();
      
      if (!data.authenticated) {
        this.redirectToLogin();
        return;
      }
      
      this.currentUser = data.user;
      localStorage.setItem('usuario', JSON.stringify(data.user));
      
      // Atualiza UI se necessário
      this.updateUserUI();
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      this.redirectToLogin();
    }
  }

  redirectToLogin() {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  updateUserUI() {
    const userElements = document.querySelectorAll('[data-user-name]');
    userElements.forEach(el => {
      if (this.currentUser) {
        el.textContent = this.currentUser.username;
      }
    });
  }

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      localStorage.removeItem('usuario');
      this.currentUser = null;
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Força logout mesmo com erro
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
  }

  // ===== UI UTILITIES =====
  showLoading(element, text = 'Carregando...') {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    
    if (element) {
      element.innerHTML = `
        <div class="flex items-center justify-center gap-2">
          <div class="spinner"></div>
          <span>${text}</span>
        </div>
      `;
      element.classList.add('loading');
    }
  }

  hideLoading(element) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    
    if (element) {
      element.classList.remove('loading');
    }
  }

  showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} fade-in`;
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="notification-icon">${this.getNotificationIcon(type)}</div>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Adiciona estilos se não existirem
    if (!document.querySelector('#notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        .notification {
          position: fixed;
          top: 2rem;
          right: 2rem;
          background: white;
          padding: 1rem 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
          border-left: 4px solid;
          z-index: 1001;
          max-width: 400px;
          animation: slideInRight 0.3s ease-out;
        }
        .notification-success { border-left-color: #10b981; }
        .notification-error { border-left-color: #ef4444; }
        .notification-warning { border-left-color: #f59e0b; }
        .notification-info { border-left-color: #3b82f6; }
        .notification-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: #6b7280;
          margin-left: auto;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Remove automaticamente
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, duration);
    }
  }

  getNotificationIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  // ===== FORM UTILITIES =====
  setupFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        if (!this.validateForm(form)) {
          e.preventDefault();
        }
      });
    });
  }

  validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    
    // Remove mensagens de erro anteriores
    this.clearFieldError(field);
    
    // Validação básica
    if (field.hasAttribute('required') && !value) {
      this.showFieldError(field, 'Este campo é obrigatório');
      isValid = false;
    }
    
    // Validação específica por tipo
    if (value && field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.showFieldError(field, 'Email inválido');
        isValid = false;
      }
    }
    
    if (value && field.type === 'tel') {
      const phoneRegex = /^[\d\s\(\)\-\+]+$/;
      if (!phoneRegex.test(value)) {
        this.showFieldError(field, 'Telefone inválido');
        isValid = false;
      }
    }
    
    return isValid;
  }

  showFieldError(field, message) {
    field.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    // Adiciona estilos se não existirem
    if (!document.querySelector('#field-error-styles')) {
      const styles = document.createElement('style');
      styles.id = 'field-error-styles';
      styles.textContent = `
        .form-input.error {
          border-color: #ef4444;
        }
        .field-error {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
      `;
      document.head.appendChild(styles);
    }
    
    field.parentElement.appendChild(errorDiv);
  }

  clearFieldError(field) {
    field.classList.remove('error');
    const errorDiv = field.parentElement.querySelector('.field-error');
    if (errorDiv) {
      errorDiv.remove();
    }
  }

  // ===== ANIMATIONS =====
  setupAnimations() {
    // Animação de entrada para cards
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card').forEach(card => {
      observer.observe(card);
    });
  }

  // ===== DATA FORMATTING =====
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }

  formatDateTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date);
  }

  // ===== API HELPERS =====
  async apiCall(url, options = {}) {
    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
      throw new Error(error.message || 'Erro na requisição');
    }
    
    return response.json();
  }

  // ===== MODAL UTILITIES =====
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
      // Foco no primeiro input
      const firstInput = modal.querySelector('input, select, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  // ===== EVENT LISTENERS =====
  setupEventListeners() {
    // Logout button
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-logout]')) {
        e.preventDefault();
        this.logout();
      }
    });

    // Modal close
    document.addEventListener('click', (e) => {
      if (e.target.matches('.modal-overlay') || e.target.matches('[data-close-modal]')) {
        const modal = e.target.closest('.modal-overlay');
        if (modal) {
          this.closeModal(modal.id);
        }
      }
    });

    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal-overlay[style*="flex"]');
        if (openModal) {
          this.closeModal(openModal.id);
        }
      }
    });

    // Form validation on blur
    document.addEventListener('blur', (e) => {
      if (e.target.matches('input, select, textarea')) {
        this.validateField(e.target);
      }
    }, true);

    // Real-time validation
    document.addEventListener('input', (e) => {
      if (e.target.matches('input[required], select[required], textarea[required]')) {
        this.clearFieldError(e.target);
      }
    });
  }

  // ===== UTILITY METHODS =====
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// ===== GLOBAL APP INSTANCE =====
window.app = new DDrinksApp();

// ===== GLOBAL HELPER FUNCTIONS =====
window.showNotification = (message, type, duration) => window.app.showNotification(message, type, duration);
window.formatCurrency = (value) => window.app.formatCurrency(value);
window.formatDate = (dateString) => window.app.formatDate(dateString);
window.openModal = (modalId) => window.app.openModal(modalId);
window.closeModal = (modalId) => window.app.closeModal(modalId);

// ===== PAGE-SPECIFIC INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  // Inicializa validação de formulários
  window.app.setupFormValidation();
  
  // Adiciona classes de animação aos elementos
  document.querySelectorAll('.card').forEach(card => {
    card.classList.add('slide-up');
  });
});
