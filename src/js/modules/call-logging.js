// Call Logging Module
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

  function updateCallHistory() {
    callHistoryList.innerHTML = '';
    callHistory.slice(0, 10).forEach(call => {
      const li = document.createElement('li');
      li.className = 'call-history-item';
      li.innerHTML = `
        <div class="call-info">
          <strong>${call.callerName}</strong> (${call.callerPhone})
          <span class="call-type ${call.callType}">${call.callType}</span>
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

  startCallBtn.addEventListener('click', startCall);
  endCallBtn.addEventListener('click', endCall);
  saveCallBtn.addEventListener('click', saveCall);

  updateCallHistory();
}

export function getCallHistory() {
  return JSON.parse(localStorage.getItem('callHistory')) || [];
}