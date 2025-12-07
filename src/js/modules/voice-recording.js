// Voice Recording Integration Module - Cisco Unified Communications Manager
export function initializeVoiceRecording() {
  const connectBtn = document.getElementById('connect-cucm');
  const startBtn = document.getElementById('start-recording');
  const stopBtn = document.getElementById('stop-recording');
  const statusDiv = document.getElementById('recording-status');
  const recordingsList = document.getElementById('recordings-list');

  if (!connectBtn || !startBtn || !stopBtn || !statusDiv || !recordingsList) {
    console.warn('Voice recording elements not found');
    return;
  }

  let isConnected = false;
  let isRecording = false;
  let mediaRecorder = null;
  let recordedChunks = [];
  let recordings = JSON.parse(localStorage.getItem('recordings')) || [];

  function updateStatus() {
    const statusIndicator = statusDiv.querySelector('.status-indicator');
    const statusText = statusDiv.querySelector('.status-text');
    const statusDetails = statusDiv.querySelector('.status-details');

    if (!statusIndicator || !statusText || !statusDetails) return;

    if (!isConnected) {
      statusIndicator.className = 'status-indicator status-disconnected';
      statusText.textContent = 'Status: Not Connected';
      statusDetails.textContent = 'CUCM integration required';
      connectBtn.textContent = '🔗 Connect to CUCM';
      startBtn.disabled = true;
      stopBtn.disabled = true;
    } else if (isRecording) {
      statusIndicator.className = 'status-indicator status-recording';
      statusText.textContent = 'Status: Recording...';
      statusDetails.textContent = 'Recording in progress';
      startBtn.disabled = true;
      stopBtn.disabled = false;
    } else {
      statusIndicator.className = 'status-indicator status-connected';
      statusText.textContent = 'Status: Connected - Ready to Record';
      statusDetails.textContent = 'Click Start Recording to begin';
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  }

  function connectCUCM() {
    isConnected = !isConnected;
    updateStatus();
    if (isConnected) {
      alert('Connected to CUCM (simulated)');
    } else {
      alert('Disconnected from CUCM (simulated)');
    }
  }

  function startRecording() {
    if (!isConnected) return;
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          const recording = {
            id: Date.now(),
            url: url,
            timestamp: new Date(),
            duration: 0
          };
          recordings.push(recording);
          localStorage.setItem('recordings', JSON.stringify(recordings));
          updateRecordingsList();
        };
        
        mediaRecorder.start();
        isRecording = true;
        updateStatus();
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
        alert('Failed to access microphone');
      });
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      isRecording = false;
      updateStatus();
    }
  }

  function updateRecordingsList() {
    recordingsList.innerHTML = '';
    recordings.slice(-5).reverse().forEach(recording => {
      const li = document.createElement('li');
      li.className = 'recording-item';
      li.innerHTML = `
        <div class="recording-info">
          <span>${new Date(recording.timestamp).toLocaleString()}</span>
          <audio controls src="${recording.url}"></audio>
        </div>
      `;
      recordingsList.appendChild(li);
    });
  }

  // Event listeners
  connectBtn.addEventListener('click', connectCUCM);
  startBtn.addEventListener('click', startRecording);
  stopBtn.addEventListener('click', stopRecording);

  // Initialize
  updateStatus();
  updateRecordingsList();
}
