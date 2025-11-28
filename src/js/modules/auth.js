// Auth Module for user authentication
export class Auth {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = null;
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
      localStorage.setItem('token', this.token);
      return true;
    }
    throw new Error(data.error);
  }

  async register(username, email, password) {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      return true;
    }
    throw new Error(data.error);
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }

  getAuthHeader() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  isLoggedIn() {
    return !!this.token;
  }
}

export const auth = new Auth();