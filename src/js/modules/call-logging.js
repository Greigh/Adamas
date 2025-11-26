// Call Logging Module
import { lookupContact, logCallToCRM, moduleState as crmState } from './crm.js';

export function initializeCallLogging() {
  const startCallBtn = document.getElementById('start-call-log');
  const endCallBtn = document.getElementById('end-call-log');
  const saveCallBtn = document.getElementById('save-call-log');
  const callHistoryList = document.getElementById('call-history-list');
  const callerNameInput = document.getElementById('caller-name');
  const callerPhoneInput = document.getElementById('caller-phone');
  const callTypeSelect = document.getElementById('call-type');
  const callNotesTextarea = document.getElementById('call-notes');

  let currentCall = null;
  let callHistory = JSON.parse(localStorage.getItem('callHistory')) || [];

  function updateCallHistory() {
    callHistoryList.innerHTML = '';
    callHistory.slice(0, 10).forEach(call => {
      const li = document.createElement('li');
      li.className = 'call-history-item';
      li.innerHTML = `
        <div class="call-info">
          <strong>${call.callerName}</strong> (${call.callerPhone})
          <span class="call-type ${call.callType}">${call.callType}</span>
          ${call.crmId ? '<span class="crm-synced">✓ CRM</span>' : ''}
        </div>
        <div class="call-meta">
          ${new Date(call.startTime).toLocaleString()}
          ${call.duration ? ` - ${Math.floor(call.duration / 1000 / 60)}:${(Math.floor(call.duration / 1000) % 60).toString().padStart(2, '0')}` : ''}
        </div>
        ${call.notes ? `<div class="call-notes">${call.notes}</div>` : ''}
      `;
      callHistoryList.appendChild(li);
    });
  }

  function startCall() {
    const callerName = callerNameInput.value.trim();
    const callerPhone = callerPhoneInput.value.trim();
    const callType = callTypeSelect.value;

    if (!callerName || !callerPhone) {
      alert('Please enter caller name and phone number');
      return;
    }

    currentCall = {
      id: Date.now(),
      callerName,
      callerPhone,
      callType,
      startTime: new Date(),
      notes: '',
      status: 'active'
    };

    startCallBtn.disabled = true;
    endCallBtn.disabled = false;
    saveCallBtn.disabled = true;

    // Auto-save notes
    setInterval(() => {
      if (currentCall) {
        currentCall.notes = callNotesTextarea.value;
      }
    }, 5000);

    // Trigger CRM lookup if connected
    if (crmState.isConnected) {
      performContactLookup(callerPhone);
    }
  }

  function endCall() {
    if (currentCall) {
      currentCall.endTime = new Date();
      currentCall.duration = currentCall.endTime - currentCall.startTime;
      currentCall.status = 'completed';
      currentCall.notes = callNotesTextarea.value;

      callHistory.unshift(currentCall);
      localStorage.setItem('callHistory', JSON.stringify(callHistory));

      updateCallHistory();

      // Log call to CRM if connected
      if (crmState.isConnected) {
        logCallToCRM(currentCall).then(result => {
          if (result.success) {
            currentCall.crmId = result.id;
            localStorage.setItem('callHistory', JSON.stringify(callHistory));
            console.log('Call logged to CRM:', result.id);
          }
        }).catch(error => {
          console.error('Failed to log call to CRM:', error);
        });
      }

      currentCall = null;
      startCallBtn.disabled = false;
      endCallBtn.disabled = true;
      saveCallBtn.disabled = false;

      // Clear form
      callerNameInput.value = '';
      callerPhoneInput.value = '';
      callNotesTextarea.value = '';
    }
  }

  function saveCall() {
    if (currentCall) {
      currentCall.notes = callNotesTextarea.value;
      callHistory.unshift(currentCall);
      localStorage.setItem('callHistory', JSON.stringify(callHistory));
      updateCallHistory();
    }
  }

  function performContactLookup(phoneNumber) {
    if (!phoneNumber || !crmState.isConnected) return;

    lookupContact(phoneNumber, 'phone').then(contacts => {
      if (contacts && contacts.length > 0) {
        const contact = contacts[0]; // Use first match
        if (!callerNameInput.value.trim()) {
          callerNameInput.value = contact.name || '';
        }
        currentCall.contactId = contact.id;
        currentCall.contactSource = contact.source;

        // Show contact info
        showContactInfo(contact);
      }
    }).catch(error => {
      console.log('Contact lookup failed:', error.message);
    });
  }

  function showContactInfo(contact) {
    // Create or update contact info display
    let contactInfo = document.getElementById('contact-info-display');
    if (!contactInfo) {
      contactInfo = document.createElement('div');
      contactInfo.id = 'contact-info-display';
      contactInfo.className = 'contact-info-display';
      document.querySelector('.call-log-form').appendChild(contactInfo);
    }

    contactInfo.innerHTML = `
      <div class="contact-card">
        <h4>CRM Contact Found</h4>
        <div class="contact-details">
          <div class="contact-name">${contact.name}</div>
          <div class="contact-company">${contact.company || ''}</div>
          <div class="contact-email">${contact.email || ''}</div>
          <div class="contact-source">Source: ${contact.source}</div>
        </div>
      </div>
    `;
  }

  // Add phone input listener for CRM lookup
  callerPhoneInput.addEventListener('blur', () => {
    const phone = callerPhoneInput.value.trim();
    if (phone && crmState.isConnected) {
      performContactLookup(phone);
    }
  });

  startCallBtn.addEventListener('click', startCall);
  endCallBtn.addEventListener('click', endCall);
  saveCallBtn.addEventListener('click', saveCall);

  updateCallHistory();
}

export function getCallHistory() {
  return JSON.parse(localStorage.getItem('callHistory')) || [];
}