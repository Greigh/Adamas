// Auth Module for user authentication with role-based access
import { showToast } from '../utils/toast.js';

export class Auth {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  async login(email, password) {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('token', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
      return true;
    }
    throw new Error(data.error);
  }

  async register(username, email, password, role = 'agent') {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role }),
    });
    const data = await res.json();
    if (res.ok) {
      return true;
    }
    throw new Error(data.error);
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getAuthHeader() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  isLoggedIn() {
    return !!this.token;
  }

  getUser() {
    return this.user;
  }

  getRole() {
    return this.user?.role || 'agent';
  }

  hasPermission(permission) {
    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'view_reports', 'audit'],
      supervisor: ['read', 'write', 'delete', 'view_reports'],
      agent: ['read', 'write']
    };
    return rolePermissions[this.getRole()]?.includes(permission) || false;
  }

  canManageUsers() {
    return this.hasPermission('manage_users');
  }

  canViewReports() {
    return this.hasPermission('view_reports');
  }

  canAudit() {
    return this.hasPermission('audit');
  }
}

export const auth = new Auth();

// UI functions for login/register forms
export function initializeAuthUI() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const showRegisterBtn = document.getElementById('show-register-btn');
  const showLoginBtn = document.getElementById('show-login-btn');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const success = await auth.login(email, password);
        if (success) {
          showToast('Login successful!', 'success');
          // Redirect to main app
          window.showMainApp();
        }
      } catch (error) {
        showToast(`Login failed: ${error.message}`, 'error');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('register-username').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;

      try {
        const success = await auth.register(username, email, password);
        if (success) {
          showToast('Registration successful! Please login.', 'success');
          // Switch to login form
          showLoginForm();
        }
      } catch (error) {
        showToast(`Registration failed: ${error.message}`, 'error');
      }
    });
  }

  if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showRegisterForm();
    });
  }

  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showLoginForm();
    });
  }

  const skipLoginBtn = document.getElementById('skip-login-btn');
  if (skipLoginBtn) {
    skipLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Continue to main app without login
      window.showMainApp();
    });
  }
}

function showLoginForm() {
  document.getElementById('login-form-container').classList.add('active');
  document.getElementById('register-form-container').classList.remove('active');
}

function showRegisterForm() {
  document.getElementById('login-form-container').classList.remove('active');
  document.getElementById('register-form-container').classList.add('active');
}