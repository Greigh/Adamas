// Call Logging Module
import { lookupContact, logCallToCRM, moduleState as crmState } from './crm.js';
import { startHoldTimer } from './timer.js';
import { initializeCallTemplates } from './call-templates.js';

export function initializeCallLogging() {
  // Initialize call templates first
  initializeCallTemplates();

  const startCallBtn = document.getElementById('start-call-log');
  const endCallBtn = document.getElementById('end-call-log');
  const saveCallBtn = document.getElementById('save-call-log');
  const callHistoryList = document.getElementById('call-history-list');
  const searchInput = document.getElementById('call-search');
  const filterSelect = document.getElementById('call-filter');
  const analyticsBtn = document.getElementById('show-analytics');
  const exportBtn = document.getElementById('export-calls');
  const callerNameInput = document.getElementById('caller-name');
  const callerPhoneInput = document.getElementById('caller-phone');
  const callTypeSelect = document.getElementById('call-type');
  const callNotesTextarea = document.getElementById('call-notes');
  const callTimer = document.getElementById('call-timer');
  const totalCallsEl = document.getElementById('total-calls');
  const avgDurationEl = document.getElementById('avg-duration');

  // Check if required elements exist
  if (!startCallBtn || !endCallBtn || !saveCallBtn || !callHistoryList ||
      !searchInput || !filterSelect || !analyticsBtn || !exportBtn ||
      !callerNameInput || !callerPhoneInput || !callTypeSelect ||
      !callNotesTextarea || !callTimer || !totalCallsEl || !avgDurationEl) {
    return;
  }

  let currentCall = null;
  let callHistory = JSON.parse(localStorage.getItem('callHistory')) || [];
  let callTimerInterval = null;

  function updateCallHistory(filter = 'all', searchTerm = '') {
    callHistoryList.innerHTML = '';

    let filteredCalls = callHistory.filter(call => {
      const matchesFilter = filter === 'all' || call.callType === filter;
      const matchesSearch = !searchTerm ||
        call.callerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.callerPhone.includes(searchTerm) ||
        (call.notes && call.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesFilter && matchesSearch;
    });

    filteredCalls.slice(0, 20).forEach(call => {
      const li = document.createElement('li');
      li.className = 'call-history-item';
      li.innerHTML = `
        <div class="call-icon">${getCallIcon(call.callType)}</div>
        <div class="call-info">
          <div class="call-header">
            <strong class="caller-name">${call.callerName}</strong>
            <span class="call-type type-${call.callType}">${call.callType}</span>
            ${call.crmId ? '<span class="crm-badge">CRM</span>' : ''}
          </div>
          <div class="call-details">
            <span class="caller-phone">📞 ${call.callerPhone}</span>
            <span class="call-date">📅 ${new Date(call.startTime).toLocaleDateString()}</span>
            <span class="call-time">⏰ ${new Date(call.startTime).toLocaleTimeString()}</span>
            ${call.duration ? `<span class="call-duration">⏱️ ${formatDuration(call.duration)}</span>` : ''}
          </div>
          ${call.notes ? `<div class="call-notes-preview">${call.notes.substring(0, 100)}${call.notes.length > 100 ? '...' : ''}</div>` : ''}
        </div>
        <div class="call-actions">
          <button class="action-btn btn-view" data-id="${call.id}">
            <span class="btn-icon">👁️</span>
          </button>
          <button class="action-btn btn-edit" data-id="${call.id}">
            <span class="btn-icon">✏️</span>
          </button>
          <button class="action-btn btn-delete" data-id="${call.id}">
            <span class="btn-icon">🗑️</span>
          </button>
        </div>
      `;

      // Add event listeners
      li.querySelector('.btn-view').addEventListener('click', () => viewCallDetails(call));
      li.querySelector('.btn-edit').addEventListener('click', () => editCall(call));
      li.querySelector('.btn-delete').addEventListener('click', () => deleteCall(call.id));

      callHistoryList.appendChild(li);
    });

    updateStats();
  }

  function getCallIcon(type) {
    const icons = {
      inbound: '📥',
      outbound: '📤',
      internal: '🏢',
      transfer: '🔄',
      callback: '📞'
    };
    return icons[type] || '📞';
  }

  function formatDuration(durationMs) {
    const minutes = Math.floor(durationMs / 1000 / 60);
    const seconds = Math.floor((durationMs / 1000) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function updateStats() {
    const totalCalls = callHistory.length;
    const totalDuration = callHistory.reduce((sum, call) => sum + (call.duration || 0), 0);
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;

    totalCallsEl.textContent = totalCalls;
    avgDurationEl.textContent = formatDuration(avgDuration);
  }

  function startCall() {
    const callerName = callerNameInput.value.trim();
    const callerPhone = callerPhoneInput.value.trim();
    const callType = callTypeSelect.value;

    if (!callerName || !callerPhone) {
      showToast('Please enter caller name and phone number', 'error');
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

    // Start timer
    updateCallTimer();
    callTimerInterval = setInterval(updateCallTimer, 1000);

    // Auto-start hold timer if enabled
    if (window.appSettings && window.appSettings.timerAutoStart) {
        startHoldTimer();
    }

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

    showToast('Call started', 'success');
  }

  function updateCallTimer() {
    if (!currentCall) return;

    const duration = Date.now() - currentCall.startTime;
    callTimer.textContent = formatDuration(duration);
  }

  function endCall() {
    if (currentCall) {
      clearInterval(callTimerInterval);
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
            showToast('Call logged to CRM successfully', 'success');
          }
        }).catch(error => {
          console.error('Failed to log call to CRM:', error);
          showToast('Failed to log call to CRM', 'error');
        });
      }

      currentCall = null;
      startCallBtn.disabled = false;
      endCallBtn.disabled = true;
      saveCallBtn.disabled = false;
      callTimer.textContent = '00:00';

      showToast('Call ended and saved', 'success');
    }
  }

  function saveCall() {
    if (callNotesTextarea.value.trim() === '' && !currentCall) return;

    if (currentCall && currentCall.id) {
      // Update existing call/log
      currentCall.callerName = callerNameInput.value;
      currentCall.callerPhone = callerPhoneInput.value;
      currentCall.callType = callTypeSelect.value;
      currentCall.notes = callNotesTextarea.value;
      
      // Check if this is an active call or a historical one being edited
      const existingIndex = callHistory.findIndex(c => c.id === currentCall.id);
      
      if (existingIndex !== -1) {
        // Update history
        callHistory[existingIndex] = currentCall;
        localStorage.setItem('callHistory', JSON.stringify(callHistory));
        updateCallHistory();
        showToast('Call log updated successfully', 'success');
        
        // If we were editing a historical call, clear the form
        if (currentCall.status !== 'active') {
          clearForm();
        }
      } else {
        // Should not happen for active calls usually unless history was cleared
        callHistory.unshift(currentCall);
        localStorage.setItem('callHistory', JSON.stringify(callHistory));
        updateCallHistory();
      }
    } else {
      // Creating a new log from scratch (manually) layout
      const newCall = {
        id: Date.now(),
        callerName: callerNameInput.value,
        callerPhone: callerPhoneInput.value,
        callType: callTypeSelect.value,
        startTime: new Date(),
        duration: 0,
        notes: callNotesTextarea.value,
        status: 'completed' // Manual logs are completed
      };
      
      callHistory.unshift(newCall);
      localStorage.setItem('callHistory', JSON.stringify(callHistory));
      updateCallHistory();
      showToast('Call logged manually', 'success');
      clearForm();
    }
  }

  function clearForm() {
    currentCall = null;
    callerNameInput.value = '';
    callerPhoneInput.value = '';
    callTypeSelect.value = 'inbound';
    callNotesTextarea.value = '';
    callTimer.textContent = '00:00';
    
    startCallBtn.disabled = false;
    endCallBtn.disabled = true;
    saveCallBtn.textContent = 'Save Call Log';
    
    // Remove CRM info if present
    const contactInfo = document.getElementById('contact-info-display');
    if (contactInfo) contactInfo.remove();
  }

  function viewCallDetails(call) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content call-details-modal">
        <div class="modal-header">
          <h3>Call Details</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="call-detail-grid">
            <div class="detail-item">
              <label>Caller:</label>
              <span>${call.callerName}</span>
            </div>
            <div class="detail-item">
              <label>Phone:</label>
              <span>${call.callerPhone}</span>
            </div>
            <div class="detail-item">
              <label>Type:</label>
              <span class="call-type type-${call.callType}">${call.callType}</span>
            </div>
            <div class="detail-item">
              <label>Start Time:</label>
              <span>${new Date(call.startTime).toLocaleString()}</span>
            </div>
            <div class="detail-item">
              <label>Duration:</label>
              <span>${call.duration ? formatDuration(call.duration) : 'N/A'}</span>
            </div>
            <div class="detail-item">
              <label>CRM Status:</label>
              <span>${call.crmId ? 'Synced ✓' : 'Not synced'}</span>
            </div>
          </div>
          <div class="call-notes-full">
            <label>Notes:</label>
            <div class="notes-content">${call.notes || 'No notes'}</div>
          </div>
        </div>
      </div>
    `;

    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  }

  function editCall(call) {
    currentCall = { ...call }; // Clone to avoid direct mutation issues until save
    
    callerNameInput.value = call.callerName;
    callerPhoneInput.value = call.callerPhone;
    callTypeSelect.value = call.callType;
    callNotesTextarea.value = call.notes || '';

    // Scroll to form
    document.querySelector('.call-log-form').scrollIntoView({ behavior: 'smooth' });
    
    // Update UI state
    saveCallBtn.textContent = 'Update Call Log';
    startCallBtn.disabled = true; // Cannot start new call while editing
    
    showToast('Call loaded for editing', 'info');
  }

  function deleteCall(id) {
    if (confirm('Are you sure you want to delete this call?')) {
      callHistory = callHistory.filter(call => call.id !== id);
      localStorage.setItem('callHistory', JSON.stringify(callHistory));
      updateCallHistory();
      showToast('Call deleted', 'success');
    }
  }

  function performContactLookup(phoneNumber) {
    if (!phoneNumber || !crmState.isConnected) return;

    lookupContact(phoneNumber, 'phone').then(contacts => {
      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        if (!callerNameInput.value.trim()) {
          callerNameInput.value = contact.name || '';
        }
        if (currentCall) {
          currentCall.contactId = contact.id;
          currentCall.contactSource = contact.source;
        }
        showContactInfo(contact);
      }
    }).catch(error => {
      console.log('Contact lookup failed:', error.message);
    });
  }

  function showContactInfo(contact) {
    let contactInfo = document.getElementById('contact-info-display');
    if (!contactInfo) {
      contactInfo = document.createElement('div');
      contactInfo.id = 'contact-info-display';
      contactInfo.className = 'contact-info-display';
      document.querySelector('.call-log-form').appendChild(contactInfo);
    }

    contactInfo.innerHTML = `
      <div class="contact-card">
        <div class="contact-header">
          <div class="contact-icon">👤</div>
          <div class="contact-title">
            <h4>CRM Contact Found</h4>
            <span class="contact-source">Source: ${contact.source}</span>
          </div>
        </div>
        <div class="contact-details">
          <div class="contact-name">${contact.name}</div>
          <div class="contact-company">${contact.company || 'N/A'}</div>
          <div class="contact-email">${contact.email || 'N/A'}</div>
        </div>
      </div>
    `;
  }

  function showAnalytics() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content analytics-modal">
        <div class="modal-header">
          <h3>Call Analytics</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="analytics-grid">
            <div class="analytics-card">
              <h4>Total Calls</h4>
              <div class="metric">${callHistory.length}</div>
            </div>
            <div class="analytics-card">
              <h4>Average Duration</h4>
              <div class="metric">${formatDuration(callHistory.reduce((sum, call) => sum + (call.duration || 0), 0) / Math.max(callHistory.length, 1))}</div>
            </div>
            <div class="analytics-card">
              <h4>Inbound Calls</h4>
              <div class="metric">${callHistory.filter(call => call.callType === 'inbound').length}</div>
            </div>
            <div class="analytics-card">
              <h4>Outbound Calls</h4>
              <div class="metric">${callHistory.filter(call => call.callType === 'outbound').length}</div>
            </div>
          </div>
          <div class="analytics-chart">
            <h4>Calls by Type</h4>
            <div class="chart-placeholder">Chart visualization would go here</div>
          </div>
        </div>
      </div>
    `;

    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  }

  function exportCalls() {
    const csvContent = [
      ['Caller Name', 'Phone', 'Type', 'Start Time', 'Duration', 'Notes', 'CRM ID'],
      ...callHistory.map(call => [
        call.callerName,
        call.callerPhone,
        call.callType,
        new Date(call.startTime).toLocaleString(),
        call.duration ? formatDuration(call.duration) : '',
        call.notes || '',
        call.crmId || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Call history exported successfully', 'success');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Event listeners
  startCallBtn.addEventListener('click', startCall);
  endCallBtn.addEventListener('click', endCall);
  saveCallBtn.addEventListener('click', saveCall);
  analyticsBtn.addEventListener('click', showAnalytics);
  exportBtn.addEventListener('click', exportCalls);

  searchInput.addEventListener('input', () => {
    updateCallHistory(filterSelect.value, searchInput.value);
  });

  filterSelect.addEventListener('change', () => {
    updateCallHistory(filterSelect.value, searchInput.value);
  });

  callerPhoneInput.addEventListener('blur', () => {
    const phone = callerPhoneInput.value.trim();
    if (phone && crmState.isConnected) {
      performContactLookup(phone);
    }
  });

  // Initialize
  updateCallHistory();
  updateStats();
}

export function getCallHistory() {
  return JSON.parse(localStorage.getItem('callHistory')) || [];
}