// CRM Integration Module - Cisco Finesse and Five9
export function initializeCRM() {
  const connectBtn = document.getElementById('connect-crm');
  const statusDiv = document.getElementById('crm-status');
  const providerSelect = document.getElementById('crm-provider');
  const searchInput = document.getElementById('crm-search');
  const searchBtn = document.getElementById('search-crm');
  const resultsDiv = document.getElementById('crm-results');

  let isConnected = false;
  let accessToken = localStorage.getItem('crmAccessToken');
  let currentProvider = localStorage.getItem('crmProvider') || 'finesse';

  // Set initial provider selection
  providerSelect.value = currentProvider;
  providerSelect.addEventListener('change', () => {
    currentProvider = providerSelect.value;
    localStorage.setItem('crmProvider', currentProvider);
    isConnected = false;
    accessToken = null;
    localStorage.removeItem('crmAccessToken');
    updateStatus();
  });

  function updateStatus() {
    const providerName = currentProvider === 'finesse' ? 'Cisco Finesse' : 'Five9';
    statusDiv.textContent = isConnected ? `Status: Connected to ${providerName}` : 'Status: Disconnected';
    connectBtn.textContent = isConnected ? 'Disconnect' : `Connect to ${providerName}`;
  }

  async function connectCRM() {
    if (isConnected) {
      // Disconnect
      isConnected = false;
      accessToken = null;
      localStorage.removeItem('crmAccessToken');
      updateStatus();
      return;
    }

    // In a real implementation, this would authenticate with the selected provider
    // For demo purposes, we'll simulate connection
    try {
      if (currentProvider === 'finesse') {
        // Cisco Finesse authentication
        const finesseUrl = 'https://finesse-server:8445/finesse/api/User/' + encodeURIComponent('agent_username');
        // For demo, simulate successful connection
        isConnected = true;
        accessToken = 'demo_finesse_token_' + Date.now();
        localStorage.setItem('crmAccessToken', accessToken);
        updateStatus();
        alert('Connected to Cisco Finesse (Demo Mode)');
      } else if (currentProvider === 'five9') {
        // Five9 authentication
        const five9Url = 'https://api.five9.com/v1/admin/';
        // For demo, simulate successful connection
        isConnected = true;
        accessToken = 'demo_five9_token_' + Date.now();
        localStorage.setItem('crmAccessToken', accessToken);
        updateStatus();
        alert('Connected to Five9 (Demo Mode)');
      }
    } catch (error) {
      console.error('CRM connection failed:', error);
      alert('Failed to connect to CRM');
    }
  }

  async function searchContacts() {
    if (!isConnected) {
      alert('Please connect to CRM first');
      return;
    }

    const query = searchInput.value.trim();
    if (!query) return;

    try {
      // In real implementation, call Cisco Webex Contact Center API
      // For demo, return mock data
      const mockResults = [
        { id: 1, name: 'John Doe', phone: '+1234567890', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', phone: '+0987654321', email: 'jane@example.com' }
      ].filter(contact =>
        contact.name.toLowerCase().includes(query.toLowerCase()) ||
        contact.phone.includes(query)
      );

      displayResults(mockResults);
    } catch (error) {
      console.error('CRM search failed:', error);
      resultsDiv.innerHTML = '<p>Error searching contacts</p>';
    }
  }

  function displayResults(results) {
    if (results.length === 0) {
      resultsDiv.innerHTML = '<p>No contacts found</p>';
      return;
    }

    resultsDiv.innerHTML = '<h4>Search Results</h4>' +
      results.map(contact => `
        <div class="crm-contact">
          <h5>${contact.name}</h5>
          <p>Phone: ${contact.phone}</p>
          <p>Email: ${contact.email}</p>
          <button class="button" onclick="selectContact(${contact.id})">Select</button>
        </div>
      `).join('');
  }

  window.selectContact = function(contactId) {
    // Handle contact selection
    alert(`Selected contact ${contactId}`);
  };

  connectBtn.addEventListener('click', connectCRM);
  searchBtn.addEventListener('click', searchContacts);

  // Check if previously connected
  if (accessToken) {
    isConnected = true;
  }
  updateStatus();
}

// Configuration for Cisco Webex Contact Center
export const crmConfig = {
  clientId: 'your_client_id_here',
  clientSecret: 'your_client_secret_here',
  redirectUri: window.location.origin + '/oauth/callback',
  baseUrl: 'https://api.wxcc-us1.cisco.com'
};