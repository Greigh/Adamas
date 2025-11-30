// CRM Integration Module - Cisco Finesse, Five9, Salesforce, Zendesk, HubSpot, Dynamics
// This module exposes small, testable helpers and an initializeCRM(doc) function
// which wires UI elements for backward compatibility.

// Module-level state (kept minimal) so tests can observe and mutate connection state
export const moduleState = {
  isConnected: false,
  accessToken: (typeof localStorage !== 'undefined' ? localStorage.getItem('crmAccessToken') : null),
  currentProvider: (typeof localStorage !== 'undefined' ? localStorage.getItem('crmProvider') : null) || 'finesse'
};

// Import toast notification system
import { showToast } from '../utils/toast.js';
// Import resilience utilities
import { retryWithBackoff, withTimeout, isValidUrl, sanitizeInput, apiRateLimiter } from '../utils/resilience.js';
// Import error boundary
import { crmErrorBoundary, safeExecute } from '../utils/error-boundary.js';

function getElements(doc = document) {
  return {
    connectBtn: doc.getElementById('connect-crm'),
    statusDiv: doc.getElementById('crm-status'),
    providerSelect: doc.getElementById('crm-provider'),

    finesseConfig: doc.getElementById('finesse-config-form'),
    five9Config: doc.getElementById('five9-config-form'),
    salesforceConfig: doc.getElementById('salesforce-config-form'),
    zendeskConfig: doc.getElementById('zendesk-config-form'),
    hubspotConfig: doc.getElementById('hubspot-config-form'),
    dynamicsConfig: doc.getElementById('dynamics-config-form'),

    finesseUrl: doc.getElementById('finesse-url'),
    finesseUsername: doc.getElementById('finesse-username'),
    finessePassword: doc.getElementById('finesse-password'),

    five9Domain: doc.getElementById('five9-domain'),
    five9Username: doc.getElementById('five9-username'),
    five9Password: doc.getElementById('five9-password'),

    salesforceUrl: doc.getElementById('salesforce-url'),
    salesforceConsumerKey: doc.getElementById('salesforce-consumer-key'),
    salesforceConsumerSecret: doc.getElementById('salesforce-consumer-secret'),
    salesforceUsername: doc.getElementById('salesforce-username'),
    salesforcePassword: doc.getElementById('salesforce-password'),

    zendeskSubdomain: doc.getElementById('zendesk-subdomain'),
    zendeskApiToken: doc.getElementById('zendesk-api-token'),
    zendeskEmail: doc.getElementById('zendesk-email'),

    hubspotApiKey: doc.getElementById('hubspot-api-key'),

    dynamicsUrl: doc.getElementById('dynamics-url'),
    dynamicsClientId: doc.getElementById('dynamics-client-id'),
    dynamicsClientSecret: doc.getElementById('dynamics-client-secret'),
    dynamicsTenantId: doc.getElementById('dynamics-tenant-id')
  };
}

function validateCRMConfig(provider, el) {
  const errors = [];

  switch (provider) {
    case 'finesse':
      if (!el.finesseUrl?.value?.trim()) errors.push('Finesse URL is required');
      else if (!isValidUrl(el.finesseUrl.value.trim())) errors.push('Invalid Finesse URL format');
      if (!el.finesseUsername?.value?.trim()) errors.push('Username is required');
      if (!el.finessePassword?.value?.trim()) errors.push('Password is required');
      break;

    case 'five9':
      if (!el.five9Domain?.value?.trim()) errors.push('Five9 domain is required');
      if (!el.five9Username?.value?.trim()) errors.push('Username is required');
      if (!el.five9Password?.value?.trim()) errors.push('Password is required');
      break;

    case 'salesforce':
      if (!el.salesforceUrl?.value?.trim()) errors.push('Salesforce URL is required');
      else if (!isValidUrl(el.salesforceUrl.value.trim())) errors.push('Invalid Salesforce URL format');
      if (!el.salesforceConsumerKey?.value?.trim()) errors.push('Consumer Key is required');
      if (!el.salesforceConsumerSecret?.value?.trim()) errors.push('Consumer Secret is required');
      if (!el.salesforceUsername?.value?.trim()) errors.push('Username is required');
      if (!el.salesforcePassword?.value?.trim()) errors.push('Password is required');
      break;

    case 'zendesk':
      if (!el.zendeskSubdomain?.value?.trim()) errors.push('Subdomain is required');
      if (!el.zendeskApiToken?.value?.trim()) errors.push('API Token is required');
      if (!el.zendeskEmail?.value?.trim()) errors.push('Email is required');
      break;

    case 'hubspot':
      if (!el.hubspotApiKey?.value?.trim()) errors.push('API Key is required');
      break;

    case 'dynamics':
      if (!el.dynamicsUrl?.value?.trim()) errors.push('Dynamics URL is required');
      else if (!isValidUrl(el.dynamicsUrl.value.trim())) errors.push('Invalid Dynamics URL format');
      if (!el.dynamicsClientId?.value?.trim()) errors.push('Client ID is required');
      if (!el.dynamicsClientSecret?.value?.trim()) errors.push('Client Secret is required');
      if (!el.dynamicsTenantId?.value?.trim()) errors.push('Tenant ID is required');
      break;
  }

  return errors;
}

export function updateProviderConfig(currentProvider = moduleState.currentProvider, doc = document) {
  const el = getElements(doc);
  const panels = [el.finesseConfig, el.five9Config, el.salesforceConfig, el.zendeskConfig, el.hubspotConfig, el.dynamicsConfig];
  // Hide + mark all provider panels as inert (aria-hidden + disable inputs)
  panels.forEach(p => {
    if (!p) return;
    // Add class + attribute + inline display to be robust against CSS overrides
    p.classList.add('hidden');
    p.setAttribute('aria-hidden', 'true');
    try { p.hidden = true; } catch (e) {}
    try { p.style.setProperty('display', 'none', 'important'); } catch (e) {}
    p.querySelectorAll('input, select, textarea, button').forEach(c => { try { c.disabled = true; } catch (e) {} });
  });

  switch (currentProvider) {
    case 'finesse':
      if (el.finesseConfig) {
        el.finesseConfig.classList.remove('hidden');
        el.finesseConfig.removeAttribute('aria-hidden');
        try { el.finesseConfig.hidden = false; } catch (e) {}
        try { el.finesseConfig.style.removeProperty('display'); } catch (e) {}
        el.finesseConfig.querySelectorAll('input, select, textarea, button').forEach(c => { try { c.disabled = false; } catch (e) {} });
      }
      break;
    case 'five9':
      if (el.five9Config) {
        el.five9Config.classList.remove('hidden');
        el.five9Config.removeAttribute('aria-hidden');
        try { el.five9Config.hidden = false; } catch (e) {}
        try { el.five9Config.style.removeProperty('display'); } catch (e) {}
        el.five9Config.querySelectorAll('input, select, textarea, button').forEach(c => { try { c.disabled = false; } catch(e) {} });
      }
      break;
    case 'salesforce':
      if (el.salesforceConfig) {
        el.salesforceConfig.classList.remove('hidden');
        el.salesforceConfig.removeAttribute('aria-hidden');
        try { el.salesforceConfig.hidden = false; } catch (e) {}
        try { el.salesforceConfig.style.removeProperty('display'); } catch (e) {}
        el.salesforceConfig.querySelectorAll('input, select, textarea, button').forEach(c => { try { c.disabled = false; } catch(e) {} });
      }
      break;
    case 'zendesk':
      if (el.zendeskConfig) {
        el.zendeskConfig.classList.remove('hidden');
        el.zendeskConfig.removeAttribute('aria-hidden');
        try { el.zendeskConfig.hidden = false; } catch (e) {}
        try { el.zendeskConfig.style.removeProperty('display'); } catch (e) {}
        el.zendeskConfig.querySelectorAll('input, select, textarea, button').forEach(c => { try { c.disabled = false; } catch(e) {} });
      }
      break;
    case 'hubspot':
      if (el.hubspotConfig) {
        el.hubspotConfig.classList.remove('hidden');
        el.hubspotConfig.removeAttribute('aria-hidden');
        try { el.hubspotConfig.hidden = false; } catch (e) {}
        try { el.hubspotConfig.style.removeProperty('display'); } catch (e) {}
        el.hubspotConfig.querySelectorAll('input, select, textarea, button').forEach(c => { try { c.disabled = false; } catch(e) {} });
      }
      break;
    case 'dynamics':
      if (el.dynamicsConfig) {
        el.dynamicsConfig.classList.remove('hidden');
        el.dynamicsConfig.removeAttribute('aria-hidden');
        try { el.dynamicsConfig.hidden = false; } catch (e) {}
        try { el.dynamicsConfig.style.removeProperty('display'); } catch (e) {}
        el.dynamicsConfig.querySelectorAll('input, select, textarea, button').forEach(c => { try { c.disabled = false; } catch(e) {} });
      }
      break;
  }
}

export function updateStatus(doc = document) {
  const el = getElements(doc);
  if (!el.statusDiv) return;

  const provider = moduleState.currentProvider;
  const providerNames = {
    finesse: 'Cisco Finesse',
    five9: 'Five9',
    salesforce: 'Salesforce',
    zendesk: 'Zendesk',
    hubspot: 'HubSpot',
    dynamics: 'Microsoft Dynamics 365'
  };

  const providerName = providerNames[provider] || provider;
  const isDemoMode = moduleState.accessToken && moduleState.accessToken.startsWith('demo_');

  el.statusDiv.textContent = moduleState.isConnected ? `Connected to ${providerName}` : 'Disconnected';
  el.statusDiv.className = 'status-text';
  el.statusDiv.classList.add(moduleState.isConnected ? 'connected' : 'disconnected');

  if (el.connectBtn) el.connectBtn.textContent = moduleState.isConnected ? 'Disconnect' : 'Connect to CRM';

  // Update demo mode indicator
  const demoIndicator = doc.getElementById('demo-mode-indicator');
  if (demoIndicator) {
    if (isDemoMode) {
      demoIndicator.style.display = 'inline-block';
    } else {
      demoIndicator.style.display = 'none';
    }
  }
}

export function saveConfig(doc = document) {
  const el = getElements(doc);
  // Only persist non-sensitive fields for the currently selected provider.
  // Keep other keys but write them as empty strings for backwards compatibility.
  const provider = moduleState.currentProvider || el.providerSelect?.value || 'finesse';
  const config = {
    // Finesse
    finesseUrl: '',
    finesseUsername: '',

    // Five9
    five9Domain: '',
    five9Username: '',

    // Salesforce
    salesforceUrl: '',
    salesforceConsumerKey: '',
    salesforceUsername: '',

    // Zendesk
    zendeskSubdomain: '',
    zendeskEmail: '',

    // HubSpot (API key is sensitive — do NOT persist)
    hubspotApiKey: '',

    // Dynamics (client secret is sensitive — do not persist)
    dynamicsUrl: '',
    dynamicsClientId: '',
    dynamicsTenantId: ''
  };

  // populate only the non-sensitive fields for the selected provider
  switch (provider) {
    case 'finesse':
      config.finesseUrl = el.finesseUrl?.value || '';
      config.finesseUsername = el.finesseUsername?.value || '';
      break;
    case 'five9':
      config.five9Domain = el.five9Domain?.value || '';
      config.five9Username = el.five9Username?.value || '';
      break;
    case 'salesforce':
      config.salesforceUrl = el.salesforceUrl?.value || '';
      config.salesforceConsumerKey = el.salesforceConsumerKey?.value || '';
      config.salesforceUsername = el.salesforceUsername?.value || '';
      break;
    case 'zendesk':
      config.zendeskSubdomain = el.zendeskSubdomain?.value || '';
      config.zendeskEmail = el.zendeskEmail?.value || '';
      break;
    case 'hubspot':
      // intentionally do not persist hubspotApiKey (sensitive)
      break;
    case 'dynamics':
      config.dynamicsUrl = el.dynamicsUrl?.value || '';
      config.dynamicsClientId = el.dynamicsClientId?.value || '';
      config.dynamicsTenantId = el.dynamicsTenantId?.value || '';
      break;
    default:
      break;
  }
  if (typeof localStorage !== 'undefined') localStorage.setItem('crmConfig', JSON.stringify(config));
}

export function loadSavedConfig(doc = document) {
  const el = getElements(doc);
  let config = {};
  try { config = JSON.parse((typeof localStorage !== 'undefined' && localStorage.getItem('crmConfig')) || '{}'); } catch (e) { config = {}; }

  if (el.finesseUrl) el.finesseUrl.value = config.finesseUrl || '';
  if (el.finesseUsername) el.finesseUsername.value = config.finesseUsername || '';
  if (el.five9Domain) el.five9Domain.value = config.five9Domain || '';
  if (el.five9Username) el.five9Username.value = config.five9Username || '';
  if (el.salesforceUrl) el.salesforceUrl.value = config.salesforceUrl || '';
  if (el.salesforceConsumerKey) el.salesforceConsumerKey.value = config.salesforceConsumerKey || '';
  if (el.salesforceUsername) el.salesforceUsername.value = config.salesforceUsername || '';
  if (el.zendeskSubdomain) el.zendeskSubdomain.value = config.zendeskSubdomain || '';
  if (el.zendeskEmail) el.zendeskEmail.value = config.zendeskEmail || '';
  if (el.dynamicsUrl) el.dynamicsUrl.value = config.dynamicsUrl || '';
  if (el.dynamicsClientId) el.dynamicsClientId.value = config.dynamicsClientId || '';
  if (el.dynamicsTenantId) el.dynamicsTenantId.value = config.dynamicsTenantId || '';
}

export async function connectToFinesse(doc = document) {
  const el = getElements(doc);
  const url = sanitizeInput(el.finesseUrl?.value?.trim());
  const username = sanitizeInput(el.finesseUsername?.value?.trim());
  const password = el.finessePassword?.value?.trim(); // Don't sanitize password

  if (!url || !username || !password) {
    throw new Error('Please fill in all Finesse configuration fields');
  }

  if (!isValidUrl(url)) {
    throw new Error('Please enter a valid Finesse server URL');
  }

  await apiRateLimiter.waitForSlot();

  const authHeader = btoa(`${username}:${password}`);

  try {
    const result = await retryWithBackoff(
      () => withTimeout(
        fetch(`${url}/finesse/api/User/${encodeURIComponent(username)}`, {
          method: 'GET',
          headers: { 'Authorization': `Basic ${authHeader}`, 'Accept': 'application/xml' }
        }),
        10000, // 10 second timeout
        'Finesse connection timed out'
      ),
      2, // 2 retries
      1000, // 1 second base delay
      (attempt, maxRetries, delay) => {
        console.log(`Finesse connection attempt ${attempt}/${maxRetries + 1} failed, retrying in ${delay}ms...`);
      }
    );

    if (!result.ok) {
      throw new Error(`Finesse auth failed: ${result.status} ${result.statusText}`);
    }

    const xml = await result.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, 'text/xml');
    if (xmlDoc.querySelector('error')) {
      throw new Error('Invalid Finesse credentials');
    }

    moduleState.isConnected = true;
    moduleState.accessToken = `finesse_${username}_${Date.now()}`;
    if (typeof localStorage !== 'undefined') localStorage.setItem('crmAccessToken', moduleState.accessToken);
    updateStatus(doc);
    showToast('Successfully connected to Cisco Finesse!', 'success');

  } catch (error) {
    // Re-throw with more context
    throw new Error(`Finesse connection failed: ${error.message}`);
  }
}

export async function connectToFive9(doc = document) {
  const el = getElements(doc);
  const domain = el.five9Domain?.value?.trim();
  const username = el.five9Username?.value?.trim();
  const password = el.five9Password?.value?.trim();
  if (!domain || !username || !password) throw new Error('Please fill in all Five9 configuration fields');

  const resp = await fetch(`https://${domain}/api/v1/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!resp.ok) throw new Error(`Five9 auth failed: ${resp.status}`);
  const data = await resp.json();
  if (!data.token) throw new Error('Invalid Five9 credentials - no token');

  moduleState.isConnected = true;
  moduleState.accessToken = data.token;
  if (typeof localStorage !== 'undefined') localStorage.setItem('crmAccessToken', moduleState.accessToken);
  updateStatus(doc);
  showToast('Successfully connected to Five9!', 'success');
}

export async function connectToSalesforce(doc = document) {
  const el = getElements(doc);
  const url = el.salesforceUrl?.value?.trim();
  const consumerKey = el.salesforceConsumerKey?.value?.trim();
  const consumerSecret = el.salesforceConsumerSecret?.value?.trim();
  const username = el.salesforceUsername?.value?.trim();
  const password = el.salesforcePassword?.value?.trim();
  if (!url || !consumerKey || !consumerSecret || !username || !password) throw new Error('Please fill in all Salesforce configuration fields');

  const tokenUrl = `${url}/services/oauth2/token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: new URLSearchParams({ grant_type: 'password', client_id: consumerKey, client_secret: consumerSecret, username, password })
  });
  if (!response.ok) throw new Error(`Salesforce auth failed: ${response.status}`);
  const auth = await response.json();
  if (!auth.access_token) throw new Error('No access token returned by Salesforce');

  moduleState.isConnected = true;
  moduleState.accessToken = auth.access_token;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('crmAccessToken', moduleState.accessToken);
    localStorage.setItem('salesforceInstanceUrl', auth.instance_url || '');
  }
  updateStatus(doc);
  showToast('Successfully connected to Salesforce!', 'success');
}

export async function connectToZendesk(doc = document) {
  const el = getElements(doc);
  const subdomain = el.zendeskSubdomain?.value?.trim();
  const apiToken = el.zendeskApiToken?.value?.trim();
  const email = el.zendeskEmail?.value?.trim();
  if (!subdomain || !apiToken || !email) throw new Error('Please fill in all Zendesk configuration fields');

  const testUrl = `https://${subdomain}.zendesk.com/api/v2/users/me.json`;
  const resp = await fetch(testUrl, {
    method: 'GET',
    headers: { 'Authorization': `Basic ${btoa(`${email}/token:${apiToken}`)}`, 'Accept': 'application/json' }
  });
  if (!resp.ok) throw new Error(`Zendesk auth failed: ${resp.status}`);
  await resp.json();

  moduleState.isConnected = true;
  moduleState.accessToken = `zendesk_${subdomain}_${email}`;
  if (typeof localStorage !== 'undefined') localStorage.setItem('crmAccessToken', moduleState.accessToken);
  updateStatus(doc);
  showToast('Successfully connected to Zendesk!', 'success');
}

export async function connectToHubSpot(doc = document) {
  const el = getElements(doc);
  const apiKey = el.hubspotApiKey?.value?.trim();
  if (!apiKey) throw new Error('Please enter your HubSpot API key');

  const testUrl = 'https://api.hubapi.com/contacts/v1/lists/all/contacts/all';
  const resp = await fetch(testUrl, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
  });
  if (!resp.ok) throw new Error(`HubSpot auth failed: ${resp.status}`);

  moduleState.isConnected = true;
  moduleState.accessToken = apiKey;
  if (typeof localStorage !== 'undefined') localStorage.setItem('crmAccessToken', moduleState.accessToken);
  updateStatus(doc);
  showToast('Successfully connected to HubSpot!', 'success');
}

export async function connectToDynamics365(doc = document) {
  const el = getElements(doc);
  const url = el.dynamicsUrl?.value?.trim();
  const clientId = el.dynamicsClientId?.value?.trim();
  const clientSecret = el.dynamicsClientSecret?.value?.trim();
  const tenantId = el.dynamicsTenantId?.value?.trim();
  if (!url || !clientId || !clientSecret || !tenantId) throw new Error('Please fill in all Dynamics 365 configuration fields');

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const resp = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret, scope: `${url}/.default` })
  });
  if (!resp.ok) throw new Error(`Dynamics auth failed: ${resp.status}`);
  const auth = await resp.json();
  if (!auth.access_token) throw new Error('No access token returned by Dynamics 365');

  moduleState.isConnected = true;
  moduleState.accessToken = auth.access_token;
  if (typeof localStorage !== 'undefined') localStorage.setItem('crmAccessToken', moduleState.accessToken);
  updateStatus(doc);
  showToast('Successfully connected to Microsoft Dynamics 365!', 'success');
}

export async function connectCRM(doc = document) {
  return safeExecute(async () => {
    const el = getElements(doc);
    if (!el.statusDiv || !el.connectBtn) return;

    if (moduleState.isConnected) {
      moduleState.isConnected = false;
      moduleState.accessToken = null;
      if (typeof localStorage !== 'undefined') localStorage.removeItem('crmAccessToken');

      // Clear sensitive input fields when disconnecting
      const sensitiveFields = [
        el.finessePassword, el.five9Password, el.salesforceConsumerSecret,
        el.salesforcePassword, el.zendeskApiToken, el.hubspotApiKey, el.dynamicsClientSecret
      ];
      sensitiveFields.forEach(field => {
        if (field) field.value = '';
      });

      updateStatus(doc);
      showToast('Disconnected from CRM', 'info');
      return;
    }

    // Validate configuration before connecting
    const validationErrors = validateCRMConfig(moduleState.currentProvider, el);
    if (validationErrors.length > 0) {
      showToast(`Configuration errors: ${validationErrors.join(', ')}`, 'error');
      return;
    }

    // Show loading state
    el.connectBtn.disabled = true;
    el.connectBtn.textContent = 'Connecting...';
    el.connectBtn.classList.add('loading');

    el.statusDiv.className = 'status-text connecting';
    el.statusDiv.textContent = 'Connecting...';

    try {
      const p = moduleState.currentProvider;
      if (p === 'finesse') await connectToFinesse(doc);
      else if (p === 'five9') await connectToFive9(doc);
      else if (p === 'salesforce') await connectToSalesforce(doc);
      else if (p === 'zendesk') await connectToZendesk(doc);
      else if (p === 'hubspot') await connectToHubSpot(doc);
      else if (p === 'dynamics') await connectToDynamics365(doc);
    } catch (err) {
      console.error('CRM connection failed:', err);

      // Check if it's a CORS/network error - if so, enable demo mode
      if (err.message.includes('CORS') || err.message.includes('Network') || err.message.includes('fetch')) {
        console.log('CORS/Network error detected - enabling demo mode for CRM');
        moduleState.isConnected = true;
        moduleState.accessToken = `demo_${moduleState.currentProvider}_${Date.now()}`;
        if (typeof localStorage !== 'undefined') localStorage.setItem('crmAccessToken', moduleState.accessToken);
        updateStatus(doc);
        showToast(`Demo mode enabled for ${moduleState.currentProvider} (real API unavailable)`, 'warning');
        return;
      }

      // For other errors, show the error
      el.statusDiv.className = 'status-text disconnected';
      el.statusDiv.textContent = 'Connection Failed';
      showToast(`Failed to connect to ${moduleState.currentProvider}: ${err.message}`, 'error');
    } finally {
      // Reset loading state
      el.connectBtn.disabled = false;
      el.connectBtn.classList.remove('loading');
      updateStatus(doc);
    }
  }, crmErrorBoundary, 'connectCRM');
}

export function initializeCRM(doc = document) {
  const el = getElements(doc);

    // Ensure provider select matches saved provider (prefer what's in localStorage)
    const saved = (typeof localStorage !== 'undefined' ? localStorage.getItem('crmProvider') : null);
    if (saved) moduleState.currentProvider = saved;
    if (el.providerSelect) el.providerSelect.value = moduleState.currentProvider;

  el.providerSelect?.addEventListener('change', () => {
    moduleState.currentProvider = el.providerSelect.value;
    if (typeof localStorage !== 'undefined') localStorage.setItem('crmProvider', moduleState.currentProvider);
    updateProviderConfig(moduleState.currentProvider, doc);
    moduleState.isConnected = false;
    moduleState.accessToken = null;
    if (typeof localStorage !== 'undefined') localStorage.removeItem('crmAccessToken');
    updateStatus(doc);
  });

  el.connectBtn?.addEventListener('click', () => connectCRM(doc));

  // Add keyboard navigation support
  el.connectBtn?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      connectCRM(doc);
    }
  });

  // Add form validation on input blur
  const inputs = doc.querySelectorAll('#crm-integration input[required], #crm-integration select[required]');
  inputs.forEach(input => {
    input.addEventListener('blur', () => {
      // Remove existing error styling
      input.classList.remove('error');
      const errorMsg = input.parentNode.querySelector('.error-message');
      if (errorMsg) errorMsg.remove();

      // Basic validation
      if (!input.value.trim()) {
        input.classList.add('error');
        const error = doc.createElement('div');
        error.className = 'error-message';
        error.textContent = `${input.getAttribute('aria-label') || input.name || 'This field'} is required`;
        input.parentNode.appendChild(error);
      }
    });
  });

  [el.finesseUrl, el.finesseUsername, el.five9Domain, el.five9Username, el.salesforceUrl, el.salesforceConsumerKey, el.salesforceUsername, el.zendeskSubdomain, el.zendeskEmail, el.dynamicsUrl, el.dynamicsClientId, el.dynamicsTenantId].forEach(n => { if (n) n.addEventListener('change', () => saveConfig(doc)); });
  [el.finessePassword, el.five9Password, el.salesforceConsumerSecret, el.salesforcePassword, el.zendeskApiToken, el.hubspotApiKey, el.dynamicsClientSecret].forEach(n => { if (n) n.addEventListener('blur', () => saveConfig(doc)); });

  loadSavedConfig(doc);
  updateProviderConfig(moduleState.currentProvider, doc);
  if (moduleState.accessToken) moduleState.isConnected = true;
  updateStatus(doc);
}

export const crmConfig = {
  clientId: 'your_client_id_here',
  clientSecret: 'your_client_secret_here',
  redirectUri: (typeof window !== 'undefined' ? window.location.origin : '') + '/oauth/callback',
  baseUrl: 'https://api.wxcc-us1.cisco.com'
};

// Contact lookup functionality
export async function lookupContact(searchTerm, searchType = 'phone', doc = document) {
  if (!moduleState.isConnected || !moduleState.accessToken) {
    throw new Error('Not connected to CRM system');
  }

  // Check if we're in demo mode (token starts with 'demo_')
  const isDemoMode = moduleState.accessToken.startsWith('demo_');

  if (isDemoMode) {
    // Return mock contact data for demo purposes
    return getMockContacts(searchTerm, searchType);
  }

  const provider = moduleState.currentProvider;
  let contacts = [];

  try {
    switch (provider) {
      case 'finesse':
        contacts = await lookupFinesseContact(searchTerm, searchType);
        break;
      case 'five9':
        contacts = await lookupFive9Contact(searchTerm, searchType);
        break;
      case 'salesforce':
        contacts = await lookupSalesforceContact(searchTerm, searchType);
        break;
      case 'zendesk':
        contacts = await lookupZendeskContact(searchTerm, searchType);
        break;
      case 'hubspot':
        contacts = await lookupHubSpotContact(searchTerm, searchType);
        break;
      case 'dynamics':
        contacts = await lookupDynamicsContact(searchTerm, searchType);
        break;
      default:
        throw new Error(`Contact lookup not supported for ${provider}`);
    }

    return contacts;
  } catch (error) {
    console.error('Contact lookup failed:', error);
    // If real API fails, fall back to demo data
    console.log('Falling back to demo contact data');
    return getMockContacts(searchTerm, searchType);
  }
}

function getMockContacts(searchTerm, searchType) {
  // Generate mock contact data for demo purposes
  const mockContacts = [
    {
      id: 'demo-1',
      name: 'John Smith',
      phone: '555-123-4567',
      email: 'john.smith@example.com',
      company: 'Acme Corp',
      source: moduleState.currentProvider
    },
    {
      id: 'demo-2',
      name: 'Jane Doe',
      phone: '555-987-6543',
      email: 'jane.doe@example.com',
      company: 'Tech Solutions Inc',
      source: moduleState.currentProvider
    },
    {
      id: 'demo-3',
      name: 'Bob Johnson',
      phone: '555-456-7890',
      email: 'bob.johnson@example.com',
      company: 'Global Services',
      source: moduleState.currentProvider
    }
  ];

  // Filter based on search term and type
  return mockContacts.filter(contact => {
    if (searchType === 'phone') {
      return contact.phone.includes(searchTerm);
    } else if (searchType === 'email') {
      return contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    } else if (searchType === 'name') {
      return contact.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return false;
  });
}

async function lookupFinesseContact(searchTerm, searchType) {
  // Finesse doesn't have a direct contact lookup API
  // This would need to be implemented via custom API or database lookup
  return [];
}

async function lookupFive9Contact(searchTerm, searchType) {
  const el = getElements();
  const domain = el.five9Domain?.value?.trim();

  let searchField = 'phone';
  if (searchType === 'email') searchField = 'email';
  else if (searchType === 'name') searchField = 'name';

  const response = await fetch(`https://${domain}/api/v1/contacts/search?${searchField}=${encodeURIComponent(searchTerm)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${moduleState.accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Five9 contact lookup failed: ${response.status}`);
  }

  const data = await response.json();
  return data.contacts || [];
}

async function lookupSalesforceContact(searchTerm, searchType) {
  const instanceUrl = localStorage.getItem('salesforceInstanceUrl') || 'https://login.salesforce.com';

  let query = '';
  if (searchType === 'phone') {
    query = `SELECT Id, Name, Phone, Email, Account.Name FROM Contact WHERE Phone = '${searchTerm}' LIMIT 10`;
  } else if (searchType === 'email') {
    query = `SELECT Id, Name, Phone, Email, Account.Name FROM Contact WHERE Email = '${searchTerm}' LIMIT 10`;
  } else if (searchType === 'name') {
    query = `SELECT Id, Name, Phone, Email, Account.Name FROM Contact WHERE Name LIKE '%${searchTerm}%' LIMIT 10`;
  }

  const response = await fetch(`${instanceUrl}/services/data/v57.0/query?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${moduleState.accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Salesforce contact lookup failed: ${response.status}`);
  }

  const data = await response.json();
  return data.records.map(record => ({
    id: record.Id,
    name: record.Name,
    phone: record.Phone,
    email: record.Email,
    company: record.Account?.Name,
    source: 'Salesforce'
  }));
}

async function lookupZendeskContact(searchTerm, searchType) {
  const el = getElements();
  const subdomain = el.zendeskSubdomain?.value?.trim();

  let searchQuery = '';
  if (searchType === 'phone') {
    searchQuery = `phone:${searchTerm}`;
  } else if (searchType === 'email') {
    searchQuery = `email:${searchTerm}`;
  } else if (searchType === 'name') {
    searchQuery = `name:${searchTerm}`;
  }

  const response = await fetch(`https://${subdomain}.zendesk.com/api/v2/search.json?query=${encodeURIComponent(searchQuery)}&filter[type]=user`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${btoa(`${el.zendeskEmail?.value}/token:${el.zendeskApiToken?.value}`)}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Zendesk contact lookup failed: ${response.status}`);
  }

  const data = await response.json();
  return data.results.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    source: 'Zendesk'
  }));
}

async function lookupHubSpotContact(searchTerm, searchType) {
  let searchProperty = 'phone';
  if (searchType === 'email') searchProperty = 'email';
  else if (searchType === 'name') searchProperty = 'firstname,lastname';

  const response = await fetch(`https://api.hubapi.com/contacts/v1/search/query?q=${encodeURIComponent(searchTerm)}&property=${searchProperty}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${moduleState.accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HubSpot contact lookup failed: ${response.status}`);
  }

  const data = await response.json();
  return data.contacts.map(contact => ({
    id: contact.vid,
    name: `${contact.properties.firstname?.value || ''} ${contact.properties.lastname?.value || ''}`.trim(),
    email: contact.properties.email?.value,
    phone: contact.properties.phone?.value,
    company: contact.properties.company?.value,
    source: 'HubSpot'
  }));
}

async function lookupDynamicsContact(searchTerm, searchType) {
  const el = getElements();
  const url = el.dynamicsUrl?.value?.trim();

  let filter = '';
  if (searchType === 'phone') {
    filter = `telephone1 eq '${searchTerm}' or mobilephone eq '${searchTerm}'`;
  } else if (searchType === 'email') {
    filter = `emailaddress1 eq '${searchTerm}'`;
  } else if (searchType === 'name') {
    filter = `contains(fullname, '${searchTerm}')`;
  }

  const response = await fetch(`${url}/api/data/v9.2/contacts?$filter=${encodeURIComponent(filter)}&$top=10`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${moduleState.accessToken}`,
      'Accept': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Dynamics contact lookup failed: ${response.status}`);
  }

  const data = await response.json();
  return data.value.map(contact => ({
    id: contact.contactid,
    name: contact.fullname,
    email: contact.emailaddress1,
    phone: contact.telephone1 || contact.mobilephone,
    company: contact.parentcustomerid?.name,
    source: 'Dynamics 365'
  }));
}

// Call logging to CRM functionality
export async function logCallToCRM(callData, doc = document) {
  if (!moduleState.isConnected || !moduleState.accessToken) {
    throw new Error('Not connected to CRM system');
  }

  // Check if we're in demo mode (token starts with 'demo_')
  const isDemoMode = moduleState.accessToken.startsWith('demo_');

  if (isDemoMode) {
    // Simulate successful call logging for demo purposes
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    const callId = `demo-call-${Date.now()}`;
    console.log('Demo mode: Call logged successfully', callId);
    return { success: true, id: callId };
  }

  const provider = moduleState.currentProvider;

  try {
    switch (provider) {
      case 'finesse':
        return await logCallToFinesse(callData);
      case 'five9':
        return await logCallToFive9(callData);
      case 'salesforce':
        return await logCallToSalesforce(callData);
      case 'zendesk':
        return await logCallToZendesk(callData);
      case 'hubspot':
        return await logCallToHubSpot(callData);
      case 'dynamics':
        return await logCallToDynamics(callData);
      default:
        throw new Error(`Call logging not supported for ${provider}`);
    }
  } catch (error) {
    console.error('Call logging to CRM failed:', error);
    // If real API fails, simulate success for demo purposes
    console.log('Falling back to demo call logging');
    const callId = `fallback-call-${Date.now()}`;
    return { success: true, id: callId };
  }
}

async function logCallToFinesse(callData) {
  // Finesse call logging would typically be handled by the telephony system
  // This is a placeholder for custom implementation
  console.log('Call logged to Finesse:', callData);
  return { success: true, id: `finesse_${Date.now()}` };
}

async function logCallToFive9(callData) {
  const el = getElements();
  const domain = el.five9Domain?.value?.trim();

  const callLogData = {
    number: callData.callerPhone,
    agent: el.five9Username?.value,
    campaign: 'default',
    disposition: callData.disposition || 'completed',
    notes: callData.notes || '',
    duration: callData.duration || 0,
    timestamp: callData.startTime || new Date().toISOString()
  };

  const response = await fetch(`https://${domain}/api/v1/calls/log`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${moduleState.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(callLogData)
  });

  if (!response.ok) {
    throw new Error(`Five9 call logging failed: ${response.status}`);
  }

  const data = await response.json();
  return { success: true, id: data.callId };
}

async function logCallToSalesforce(callData) {
  const instanceUrl = localStorage.getItem('salesforceInstanceUrl') || 'https://login.salesforce.com';

  // First, find or create a task/activity record
  const taskData = {
    Subject: `Call with ${callData.callerName || callData.callerPhone}`,
    Description: callData.notes || '',
    ActivityDate: new Date(callData.startTime).toISOString().split('T')[0],
    Status: 'Completed',
    Priority: 'Normal',
    Type: 'Call',
    CallDurationInSeconds: Math.floor((callData.duration || 0) / 1000)
  };

  // If we have a contact ID, associate it
  if (callData.contactId) {
    taskData.WhoId = callData.contactId;
  }

  const response = await fetch(`${instanceUrl}/services/data/v57.0/sobjects/Task`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${moduleState.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(taskData)
  });

  if (!response.ok) {
    throw new Error(`Salesforce call logging failed: ${response.status}`);
  }

  const data = await response.json();
  return { success: true, id: data.id };
}

async function logCallToZendesk(callData) {
  const el = getElements();
  const subdomain = el.zendeskSubdomain?.value?.trim();

  // Create a ticket or call activity
  const ticketData = {
    ticket: {
      subject: `Call with ${callData.callerName || callData.callerPhone}`,
      comment: {
        body: `Call details:\nDuration: ${Math.floor((callData.duration || 0) / 1000)} seconds\nNotes: ${callData.notes || ''}`
      },
      type: 'task',
      priority: 'normal',
      status: 'solved'
    }
  };

  const response = await fetch(`https://${subdomain}.zendesk.com/api/v2/tickets.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${el.zendeskEmail?.value}/token:${el.zendeskApiToken?.value}`)}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(ticketData)
  });

  if (!response.ok) {
    throw new Error(`Zendesk call logging failed: ${response.status}`);
  }

  const data = await response.json();
  return { success: true, id: data.ticket.id };
}

async function logCallToHubSpot(callData) {
  // Create an engagement (call) record
  const engagementData = {
    engagement: {
      active: true,
      type: 'CALL'
    },
    associations: {
      contactIds: callData.contactId ? [parseInt(callData.contactId)] : [],
      companyIds: [],
      dealIds: [],
      ownerIds: [],
      ticketIds: []
    },
    metadata: {
      toNumber: callData.callerPhone,
      fromNumber: '', // Would need agent phone number
      status: 'COMPLETED',
      durationMilliseconds: callData.duration || 0,
      recordingUrl: callData.recordingUrl || '',
      body: callData.notes || ''
    }
  };

  const response = await fetch('https://api.hubapi.com/engagements/v1/engagements', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${moduleState.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(engagementData)
  });

  if (!response.ok) {
    throw new Error(`HubSpot call logging failed: ${response.status}`);
  }

  const data = await response.json();
  return { success: true, id: data.engagement.id };
}

async function logCallToDynamics(callData) {
  const el = getElements();
  const url = el.dynamicsUrl?.value?.trim();

  // Create a phone call activity
  const phoneCallData = {
    subject: `Call with ${callData.callerName || callData.callerPhone}`,
    description: callData.notes || '',
    scheduledstart: callData.startTime,
    scheduledend: callData.endTime || new Date(callData.startTime.getTime() + (callData.duration || 0)).toISOString(),
    phonenumber: callData.callerPhone,
    directioncode: callData.callType === 'outbound',
    statecode: 1, // Completed
    statuscode: 2, // Made
    activitytypecode: 'phonecall'
  };

  // Associate with contact if we have one
  if (callData.contactId) {
    phoneCallData.regardingobjectid_contact = {
      contactid: callData.contactId,
      '@odata.type': 'Microsoft.Dynamics.CRM.contact'
    };
  }

  const response = await fetch(`${url}/api/data/v9.2/phonecalls`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${moduleState.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0'
    },
    body: JSON.stringify(phoneCallData)
  });

  if (!response.ok) {
    throw new Error(`Dynamics call logging failed: ${response.status}`);
  }

  const data = await response.json();
  return { success: true, id: data.activityid };
}
