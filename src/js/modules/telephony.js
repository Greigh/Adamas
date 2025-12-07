// Telephony Integration Module
// Supports Twilio, Asterisk, and other telephony providers

import { config } from '../utils/config.js';

export const telephonyState = {
  provider: localStorage.getItem('telephony-provider') || config.telephony.provider,
  config: JSON.parse(localStorage.getItem('telephony-config') || '{}'),
  connected: false,
  calls: [],
  activeCall: null
};

export function initializeTelephony() {
  loadTelephonyData();
  setupTelephonyEventListeners();
  renderTelephonyUI();
}

function loadTelephonyData() {
  // Load from localStorage or defaults
  telephonyState.config = {
    twilio: config.twilio,
    asterisk: config.telephony.asterisk,
    finesse: config.telephony.finesse,
    ...telephonyState.config
  };
}

function saveTelephonyData() {
  localStorage.setItem('telephony-provider', telephonyState.provider);
  localStorage.setItem('telephony-config', JSON.stringify(telephonyState.config));
}

function setupTelephonyEventListeners() {
  // Provider selection change
  const providerSelect = document.getElementById('telephony-provider-select');
  if (providerSelect) {
    providerSelect.addEventListener('change', (e) => {
      telephonyState.provider = e.target.value;
      saveTelephonyData();
      updateProviderConfigUI();
    });
  }

  // Finesse configuration inputs
  const finesseInputs = ['finesse-host', 'finesse-port', 'finesse-agent-id', 'finesse-password', 'finesse-extension', 'finesse-ssl'];
  finesseInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', () => {
        updateFinesseConfig();
      });
    }
  });

  // Make call button
  const makeCallBtn = document.getElementById('make-call-btn');
  if (makeCallBtn) {
    makeCallBtn.addEventListener('click', async () => {
      const numberInput = document.getElementById('phone-number-input');
      if (numberInput && numberInput.value) {
        try {
          const result = await makeCall(numberInput.value);
          updateCallStatus(`Calling ${numberInput.value}...`);
        } catch (error) {
          updateCallStatus(`Call failed: ${error.message}`);
        }
      }
    });
  }

  // End call button
  const endCallBtn = document.getElementById('end-call-btn');
  if (endCallBtn) {
    endCallBtn.addEventListener('click', async () => {
      try {
        const result = await endCall();
        updateCallStatus('Call ended');
      } catch (error) {
        updateCallStatus(`End call failed: ${error.message}`);
      }
    });
  }
}

function updateProviderConfigUI() {
  const finesseSection = document.getElementById('finesse-config-section');
  if (finesseSection) {
    finesseSection.style.display = telephonyState.provider === 'finesse' ? 'block' : 'none';
  }
}

function updateFinesseConfig() {
  const finesseConfig = {
    host: document.getElementById('finesse-host')?.value || '',
    port: parseInt(document.getElementById('finesse-port')?.value) || 8443,
    agentId: document.getElementById('finesse-agent-id')?.value || '',
    password: document.getElementById('finesse-password')?.value || '',
    extension: document.getElementById('finesse-extension')?.value || '',
    ssl: document.getElementById('finesse-ssl')?.checked || true
  };

  telephonyState.config.finesse = finesseConfig;
  saveTelephonyData();
}

function updateCallStatus(status) {
  const statusElement = document.getElementById('call-status');
  if (statusElement) {
    statusElement.textContent = `Status: ${status}`;
  }
}

function renderTelephonyUI() {
  // Set provider selection
  const providerSelect = document.getElementById('telephony-provider-select');
  if (providerSelect) {
    providerSelect.value = telephonyState.provider;
  }

  // Populate Finesse configuration fields
  const finesseConfig = telephonyState.config.finesse;
  if (finesseConfig) {
    const fields = {
      'finesse-host': finesseConfig.host,
      'finesse-port': finesseConfig.port,
      'finesse-agent-id': finesseConfig.agentId,
      'finesse-password': finesseConfig.password,
      'finesse-extension': finesseConfig.extension,
      'finesse-ssl': finesseConfig.ssl
    };

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = value;
        } else {
          element.value = value;
        }
      }
    });
  }

  // Show/hide configuration sections
  updateProviderConfigUI();

  // Update call status
  updateCallStatus(telephonyState.connected ? 'Connected' : 'Disconnected');
}

export async function makeCall(number) {
  // Implement based on provider
  if (telephonyState.provider === 'twilio') {
    return await makeTwilioCall(number);
  } else if (telephonyState.provider === 'asterisk') {
    return await makeAsteriskCall(number);
  } else if (telephonyState.provider === 'finesse') {
    return await makeFinesseCall(number);
  }
  throw new Error(`Unsupported telephony provider: ${telephonyState.provider}`);
}

export async function endCall() {
  // End active call based on provider
  if (telephonyState.provider === 'twilio') {
    return await endTwilioCall();
  } else if (telephonyState.provider === 'asterisk') {
    return await endAsteriskCall();
  } else if (telephonyState.provider === 'finesse') {
    return await endFinesseCall();
  }
  throw new Error(`Unsupported telephony provider: ${telephonyState.provider}`);
}

// Cisco Finesse Implementation
let finesseConnection = null;
let finesseAgent = null;

async function makeFinesseCall(number) {
  try {
    if (!finesseConnection) {
      await connectToFinesse();
    }

    const finesseConfig = telephonyState.config.finesse;
    const baseUrl = `${finesseConfig.ssl ? 'https' : 'http'}://${finesseConfig.host}:${finesseConfig.port}`;

    const response = await fetch(`${baseUrl}/finesse/api/User/${finesseConfig.agentId}/Dialogs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': 'Basic ' + btoa(`${finesseConfig.agentId}:${finesseConfig.password}`)
      },
      body: `<Dialog>
        <requestedAction>MAKE_CALL</requestedAction>
        <toAddress>${number}</toAddress>
        <fromAddress>${finesseConfig.extension}</fromAddress>
      </Dialog>`
    });

    if (response.ok) {
      const callData = await response.text();
      const callId = extractCallId(callData);
      telephonyState.activeCall = { id: callId, number, provider: 'finesse', status: 'calling' };
      return { success: true, callId };
    } else {
      throw new Error(`Finesse call failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Finesse call error:', error);
    throw error;
  }
}

async function endFinesseCall() {
  try {
    if (!telephonyState.activeCall) return;

    const finesseConfig = telephonyState.config.finesse;
    const baseUrl = `${finesseConfig.ssl ? 'https' : 'http'}://${finesseConfig.host}:${finesseConfig.port}`;

    const response = await fetch(`${baseUrl}/finesse/api/User/${finesseConfig.agentId}/Dialogs/${telephonyState.activeCall.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': 'Basic ' + btoa(`${finesseConfig.agentId}:${finesseConfig.password}`)
      },
      body: `<Dialog>
        <requestedAction>DROP</requestedAction>
      </Dialog>`
    });

    if (response.ok) {
      telephonyState.activeCall.status = 'ended';
      telephonyState.calls.push(telephonyState.activeCall);
      telephonyState.activeCall = null;
      return { success: true };
    } else {
      throw new Error(`Finesse end call failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Finesse end call error:', error);
    throw error;
  }
}

async function connectToFinesse() {
  try {
    const finesseConfig = telephonyState.config.finesse;
    const baseUrl = `${finesseConfig.ssl ? 'https' : 'http'}://${finesseConfig.host}:${finesseConfig.port}`;

    // Test connection and get agent state
    const response = await fetch(`${baseUrl}/finesse/api/User/${finesseConfig.agentId}`, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${finesseConfig.agentId}:${finesseConfig.password}`)
      }
    });

    if (response.ok) {
      finesseConnection = { connected: true, baseUrl };
      telephonyState.connected = true;
      return { success: true };
    } else {
      throw new Error(`Finesse connection failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Finesse connection error:', error);
    throw error;
  }
}

function extractCallId(xmlResponse) {
  // Simple XML parsing to extract dialog ID
  const match = xmlResponse.match(/<dialogId>(.*?)<\/dialogId>/);
  return match ? match[1] : null;
}

// Placeholder functions for other providers (to be implemented)
async function makeTwilioCall(number) {
  // TODO: Implement Twilio call logic
  console.log('Twilio call to:', number);
  return { success: false, message: 'Twilio integration not yet implemented' };
}

async function endTwilioCall() {
  // TODO: Implement Twilio end call logic
  console.log('Ending Twilio call');
  return { success: false, message: 'Twilio integration not yet implemented' };
}

async function makeAsteriskCall(number) {
  // TODO: Implement Asterisk call logic
  console.log('Asterisk call to:', number);
  return { success: false, message: 'Asterisk integration not yet implemented' };
}

async function endAsteriskCall() {
  // TODO: Implement Asterisk end call logic
  console.log('Ending Asterisk call');
  return { success: false, message: 'Asterisk integration not yet implemented' };
}

export function getCallHistory() {
  return telephonyState.calls;
}