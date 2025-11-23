// Voice Recording Integration Module - Cisco Unified Communications Manager
export function initializeVoiceRecording() {
  const connectBtn = document.getElementById('connect-cucm');
  const startBtn = document.getElementById('start-recording');
  const stopBtn = document.getElementById('stop-recording');
  const statusDiv = document.getElementById('recording-status');
  const recordingsList = document.getElementById('recordings-list');

  let isConnected = false;
  let isRecording = false;
  let mediaRecorder = null;
  let recordedChunks = [];
  let recordings = JSON.parse(localStorage.getItem('recordings')) || [];

  function updateStatus() {
    if (!isConnected) {
      statusDiv.textContent = 'Status: Not Connected to CUCM';
      connectBtn.textContent = 'Connect to CUCM';
      startBtn.disabled = true;
      stopBtn.disabled = true;
    } else if (isRecording) {
      statusDiv.textContent = 'Status: Recording...';
      startBtn.disabled = true;
      stopBtn.disabled = false;
    } else {
      statusDiv.textContent = 'Status: Connected - Ready to Record';
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  }

  async function connectCUCM() {
    if (isConnected) {
      // Disconnect
      isConnected = false;
      updateStatus();
      return;
    }

    try {
      // In real implementation, authenticate with CUCM API
      // For demo, simulate connection
      isConnected = true;
      updateStatus();
      alert('Connected to Cisco Unified Communications Manager (Demo Mode)');
    } catch (error) {
      console.error('CUCM connection failed:', error);
      alert('Failed to connect to CUCM');
    }
  }

  async function startRecording() {
    if (!isConnected) {
      alert('Please connect to CUCM first');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
          timestamp: new Date(),
          url,
          blob
        };

        recordings.push(recording);
        localStorage.setItem('recordings', JSON.stringify(recordings.map(r => ({ ...r, blob: null }))));
        updateRecordingsList();

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      isRecording = true;
      updateStatus();
    } catch (error) {
      console.error('Recording failed:', error);
      alert('Failed to start recording');
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      updateStatus();
    }
  }

  function updateRecordingsList() {
    recordingsList.innerHTML = '';
    recordings.slice(-10).reverse().forEach(recording => {
      const li = document.createElement('li');
      li.className = 'recording-item';
      li.innerHTML = `
        <div class="recording-info">
          <span>${new Date(recording.timestamp).toLocaleString()}</span>
          <audio controls src="${recording.url}"></audio>
        </div>
        <button class="button btn-sm" onclick="downloadRecording(${recording.id})">Download</button>
      `;
      recordingsList.appendChild(li);
    });
  }

  window.downloadRecording = function(recordingId) {
    const recording = recordings.find(r => r.id === recordingId);
    if (recording) {
      const a = document.createElement('a');
      a.href = recording.url;
      a.download = `recording_${recording.timestamp.getTime()}.wav`;
      a.click();
    }
  };

  connectBtn.addEventListener('click', connectCUCM);
  startBtn.addEventListener('click', startRecording);
  stopBtn.addEventListener('click', stopRecording);

  updateStatus();
  updateRecordingsList();
}

// Configuration for Cisco Unified Communications Manager
export const cucmConfig = {
  serverUrl: 'https://your-cucm-server.com',
  username: 'your_username',
  password: 'your_password'
};