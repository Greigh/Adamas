// Hold timer module
// Instead of importing appSettings directly, we'll use a function to access it
import AppGlobals from '../utils/app-globals.js';
import { saveData, loadData } from './storage.js';
import { playTimerExpiredSound, stopTimerSound } from '../utils/audio.js';
import { formatTime } from '../utils/helpers.js';

// Timer state object
let holdTimer;

// Function to get app settings from the window object to avoid circular dependencies
function getAppSettings() {
  return window.appSettings || {};
}

// Function to save settings without directly importing from settings.js
function saveSettings(settings) {
  if (window.saveSettings) {
    window.saveSettings(settings);
  } else {
    saveData('appSettings', settings);
  }
}

// Function to save timer data with proper handling
export function saveTimerData(data) {
  return saveData('timerData', data);
}

// Update the updateTimerDisplay function to handle editing mode
export function updateTimerDisplay() {
  const appSettings = getAppSettings();
  const timeDisplay = document.getElementById('timer-time');
  const statusDisplay = document.getElementById('timer-status');
  const totalHoldDisplay = document.getElementById('total-hold-time');
  const holdCountDisplay = document.getElementById('hold-count');
  const averageHoldDisplay = document.getElementById('average-hold-time');

  if (!timeDisplay) return;

  let currentTime = 0;

  if (holdTimer.isRunning) {
    if (holdTimer.isCountdown) {
      // Countdown mode
      if (holdTimer.isPaused) {
        // When paused, use the time up to pause
        currentTime =
          holdTimer.countdownSeconds -
          Math.floor(
            (holdTimer.pauseStartTime -
              holdTimer.countdownStartTime -
              holdTimer.totalPausedTime) /
              1000
          );
      } else {
        // When running, calculate remaining time
        currentTime =
          holdTimer.countdownSeconds -
          Math.floor(
            (Date.now() -
              holdTimer.countdownStartTime -
              holdTimer.totalPausedTime) /
              1000
          );
      }

      // Ensure we don't go below zero
      currentTime = Math.max(0, currentTime);

      // Check if timer has expired and play sound
      if (
        currentTime === 0 &&
        !holdTimer.soundPlaying &&
        appSettings.timerSoundAlerts
      ) {
        // Play the selected alert sound
        const soundType = appSettings.timerAlertSound || 'endgame';
        const customUrl = appSettings.timerCustomSoundUrl || null;
        playTimerExpiredSound(soundType, customUrl);
        holdTimer.soundPlaying = true;
      }
    } else {
      // Regular stopwatch mode
      if (holdTimer.isPaused) {
        // When paused, use the time up to pause start
        currentTime = Math.floor(
          (holdTimer.pauseStartTime -
            holdTimer.startTime -
            holdTimer.totalPausedTime) /
            1000
        );
      } else {
        // When running, subtract all accumulated pause time
        currentTime = Math.floor(
          (Date.now() - holdTimer.startTime - holdTimer.totalPausedTime) / 1000
        );
      }
      // For regular timer, check against warning time
      const warningTime = appSettings.timerWarningTime;
      if (currentTime >= warningTime && !holdTimer.warningShown) {
        const timerContainer = document.getElementById('hold-timer');
        timerContainer.classList.add('timer-warning');
        showTimerWarning(currentTime);
        holdTimer.warningShown = true;
      }
    }
  } else if (holdTimer.isCountdown) {
    // Not running but in countdown mode, show the set duration
    currentTime = holdTimer.countdownSeconds;
  }

  // Calculate average hold time
  const averageTime =
    holdTimer.holdCount > 0 ? holdTimer.totalHoldTime / holdTimer.holdCount : 0;

  // Update display with the current time
  timeDisplay.textContent = formatTime(currentTime);

  // Always remove and re-add event listeners for editing
  timeDisplay.setAttribute(
    'contenteditable',
    !holdTimer.isRunning && holdTimer.isCountdown ? 'true' : 'false'
  );
  timeDisplay.classList.toggle(
    'editable',
    !holdTimer.isRunning && holdTimer.isCountdown
  );
  // Remove previous listeners by cloning
  const newTimeDisplay = timeDisplay.cloneNode(true);
  timeDisplay.parentNode.replaceChild(newTimeDisplay, timeDisplay);
  if (!holdTimer.isRunning && holdTimer.isCountdown) {
    newTimeDisplay.addEventListener('blur', handleTimeEdit);
    newTimeDisplay.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.blur();
      }
    });
    newTimeDisplay.addEventListener('click', function () {
      if (this.getAttribute('contenteditable') === 'true') {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(this);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });
  }

  if (totalHoldDisplay)
    totalHoldDisplay.textContent = formatTime(holdTimer.totalHoldTime);
  if (holdCountDisplay)
    holdCountDisplay.textContent = holdTimer.holdCount.toString();
  if (averageHoldDisplay)
    averageHoldDisplay.textContent = formatTime(averageTime);

  // Update timer container classes
  const timerContainer = document.getElementById('hold-timer');
  if (timerContainer) {
    timerContainer.classList.remove(
      'timer-running',
      'timer-paused',
      'timer-warning',
      'timer-expired'
    );

    if (holdTimer.isRunning) {
      if (holdTimer.isPaused) {
        timerContainer.classList.add('timer-paused');
      } else if (holdTimer.isCountdown && currentTime === 0) {
        timerContainer.classList.add('timer-expired');
        if (statusDisplay) statusDisplay.textContent = 'EXPIRED';
      } else {
        timerContainer.classList.add('timer-running');

        // For countdown, show warning when time is low
        if (holdTimer.isCountdown && currentTime <= 10 && currentTime > 0) {
          timerContainer.classList.add('timer-warning');
          if (statusDisplay) statusDisplay.textContent = 'ENDING SOON';
        } else if (!holdTimer.isCountdown) {
          // For regular timer, check against warning time
          const warningTime = appSettings.timerWarningTime;
          if (currentTime >= warningTime && !holdTimer.warningShown) {
            timerContainer.classList.add('timer-warning');
            showTimerWarning(currentTime);
            holdTimer.warningShown = true;
          }
        }
      }
    }
  }
}

// Update the handleTimeEdit function to properly handle time input
function handleTimeEdit(event) {
  const timeDisplay = event.target;
  const inputValue = timeDisplay.textContent.trim();
  const seconds = parseTimeInput(inputValue);

  if (seconds !== null) {
    holdTimer.countdownSeconds = seconds;
    holdTimer.lastSetCountdown = seconds;
    window.appSettings.timerCountdownDuration = seconds;
    if (window.saveSettings) window.saveSettings(window.appSettings);
    updateTimerDisplay();
  } else {
    // Reset display to last valid countdown seconds if input was invalid
    timeDisplay.textContent = formatTime(holdTimer.countdownSeconds);
  }
}

// Function to parse various time input formats
function parseTimeInput(input) {
  // Remove any non-numeric or non-colon characters
  input = input.replace(/[^\d:]/g, '');

  // Handle different formats
  if (input.includes(':')) {
    // Format: MM:SS or HH:MM:SS
    const parts = input.split(':').map((part) => parseInt(part, 10));

    if (parts.length === 2) {
      // MM:SS format
      const [minutes, seconds] = parts;
      if (!isNaN(minutes) && !isNaN(seconds) && seconds < 60) {
        return minutes * 60 + seconds;
      }
    } else if (parts.length === 3) {
      // HH:MM:SS format
      const [hours, minutes, seconds] = parts;
      if (
        !isNaN(hours) &&
        !isNaN(minutes) &&
        !isNaN(seconds) &&
        minutes < 60 &&
        seconds < 60
      ) {
        return hours * 3600 + minutes * 60 + seconds;
      }
    }
  } else {
    // Format: just seconds
    const seconds = parseInt(input, 10);
    if (!isNaN(seconds)) {
      return seconds;
    }
  }

  // Invalid input, return null
  return null;
}

// Modify the startTimer function to ensure proper countdown startup
export function startTimer() {
  stopTimerSound(); // Stop any playing sounds when starting/resuming

  if (!holdTimer.isRunning) {
    // Starting fresh
    holdTimer.isRunning = true;
    holdTimer.warningShown = false;
    holdTimer.pausedTime = 0;
    holdTimer.totalPausedTime = 0;
    holdTimer.isPaused = false;
    holdTimer.pauseStartTime = null;
    holdTimer.soundPlaying = false;

    if (holdTimer.isCountdown) {
      // Countdown mode - set from current countdownSeconds
      // Store the last set countdown value for reuse
      holdTimer.lastSetCountdown = holdTimer.countdownSeconds;
      holdTimer.countdownStartTime = Date.now();
    } else {
      // Regular stopwatch mode
      holdTimer.startTime = Date.now();
      holdTimer.currentHoldStart = new Date();
    }
  } else if (holdTimer.isPaused) {
    // Resuming from pause
    const currentPauseDuration = Date.now() - holdTimer.pauseStartTime;
    holdTimer.totalPausedTime += currentPauseDuration;
    holdTimer.isPaused = false;
    holdTimer.pauseStartTime = null;
  }

  updateTimerButtons();

  if (holdTimer.intervalId) clearInterval(holdTimer.intervalId);
  holdTimer.intervalId = setInterval(updateTimerDisplay, 1000);
  updateTimerDisplay();
}

// Export pauseTimer function
export function pauseTimer() {
  if (holdTimer.isRunning && !holdTimer.isPaused) {
    holdTimer.isPaused = true;
    holdTimer.pauseStartTime = Date.now();
    if (holdTimer.intervalId) clearInterval(holdTimer.intervalId);
    updateTimerButtons();
    updateTimerDisplay();
  }
}

// Modify the resetTimer function to restore the last countdown value
export function resetTimer() {
  // Stop any playing sounds
  stopTimerSound();

  // Save the hold time if we were running or paused
  if (holdTimer.isRunning || holdTimer.isPaused) {
    const endTime = holdTimer.isPaused ? holdTimer.pauseStartTime : Date.now();
    let duration = 0;

    if (holdTimer.isCountdown) {
      // For countdown, log the time that has passed since start
      duration = Math.floor(
        (endTime - holdTimer.countdownStartTime - holdTimer.totalPausedTime) /
          1000
      );
    } else {
      // For stopwatch, log the total elapsed time
      duration = Math.floor(
        (endTime - holdTimer.startTime - holdTimer.totalPausedTime) / 1000
      );
    }

    // Only save if duration is greater than 0
    if (duration > 0) {
      logHoldTime(duration);
    }
  }

  // Reset timer state
  holdTimer.isRunning = false;
  holdTimer.isPaused = false;
  holdTimer.startTime = null;
  holdTimer.pausedTime = 0;
  holdTimer.totalPausedTime = 0;
  holdTimer.pauseStartTime = null;
  holdTimer.currentHoldStart = null;
  holdTimer.warningShown = false;
  holdTimer.soundPlaying = false;
  holdTimer.countdownStartTime = null;

  // Check if we need to update countdown mode from settings
  holdTimer.isCountdown = getAppSettings().timerCountdownMode;

  // Restore the last countdown value if we have one, including 0
  if (typeof holdTimer.lastSetCountdown === 'number') {
    holdTimer.countdownSeconds = holdTimer.lastSetCountdown;
  } else {
    holdTimer.countdownSeconds = getAppSettings().timerCountdownDuration;
  }

  if (holdTimer.intervalId) {
    clearInterval(holdTimer.intervalId);
    holdTimer.intervalId = null;
  }

  // Update UI
  updateTimerModeDisplay();
  updateTimerButtons();
  updateTimerDisplay();
  updateHoldHistory();
}

// Function to add time to the countdown timer when it's not running
export function addTime(seconds) {
  if (!holdTimer.isCountdown || holdTimer.isRunning) {
    return; // Only works in countdown mode when stopped
  }
  holdTimer.countdownSeconds += seconds;
  holdTimer.countdownSeconds = Math.max(0, holdTimer.countdownSeconds); // Prevent negative time

  // Persist the new duration and update the display
  updateCountdownDuration(holdTimer.countdownSeconds);
  updateTimerDisplay();
}

// Add missing functions that are imported in main.js
export function clearHoldHistory() {
  // Reset hold history and counts
  holdTimer.holdHistory = [];
  holdTimer.totalHoldTime = 0;
  holdTimer.holdCount = 0;

  // Save cleared data
  saveTimerData({
    // Changed from saveData to saveTimerData
    totalHoldTime: 0,
    holdCount: 0,
    holdHistory: [],
  });

  // Update displays
  updateHoldHistory();
  updateTimerDisplay();
}

export function deleteHoldTime(index) {
  // Check if deletion is allowed in settings
  if (!getAppSettings().timerAllowHistoryDeletion) {
    console.warn('Hold history deletion is disabled in settings');
    return;
  }

  if (index >= 0 && index < holdTimer.holdHistory.length) {
    // Get the duration of the hold time being deleted
    const deletedDuration = holdTimer.holdHistory[index].duration;

    // Remove the hold time from the history
    holdTimer.holdHistory.splice(index, 1);

    // Update the total hold time
    holdTimer.totalHoldTime -= deletedDuration;

    // Update the hold count
    holdTimer.holdCount = Math.max(0, holdTimer.holdCount - 1);

    // Update the UI
    updateHoldHistory();
    updateTimerDisplay();

    // Save the updated data
    saveTimerData({
      // Changed from saveData to saveTimerData
      totalHoldTime: holdTimer.totalHoldTime,
      holdCount: holdTimer.holdCount,
      holdHistory: holdTimer.holdHistory,
    });
  }
}

// Function to log a hold time
function logHoldTime(duration) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = now.toLocaleDateString();

  // Create the hold time entry
  const holdEntry = {
    time: timeStr,
    date: dateStr,
    duration: duration,
    timestamp: now.getTime(),
  };

  // Add to history
  holdTimer.holdHistory.unshift(holdEntry);

  // Update counters
  holdTimer.holdCount++;
  holdTimer.totalHoldTime += duration;

  // Save data
  saveTimerData({
    // Changed from saveData to saveTimerData
    totalHoldTime: holdTimer.totalHoldTime,
    holdCount: holdTimer.holdCount,
    holdHistory: holdTimer.holdHistory,
  });

  // Update UI
  updateHoldHistory();
}

// Function to show timer warning
function showTimerWarning(currentTime) {
  // Implement warning notification
  console.log(`Timer warning at ${formatTime(currentTime)}`);
  // You might want to add a visual or audible alert here
}

// Initialize the holdTimer with default values
export function initializeTimer() {
  // Load saved timer data
  const savedData = loadData('timerData', {
    totalHoldTime: 0,
    holdCount: 0,
    holdHistory: [],
  });

  // Create the timer object first before using it
  holdTimer = {
    isRunning: false,
    isPaused: false,
    isCountdown: window.appSettings?.timerCountdownMode || false,
    startTime: null,
    pausedTime: 0,
    totalPausedTime: 0,
    pauseStartTime: null,
    intervalId: null,
    holdCount: savedData.holdCount || 0,
    totalHoldTime: savedData.totalHoldTime || 0,
    currentHoldStart: null,
    warningShown: false,
    holdHistory: savedData.holdHistory || [],
    countdownSeconds: window.appSettings?.timerCountdownDuration || 300,
    lastSetCountdown: window.appSettings?.timerCountdownDuration || 300,
    countdownStartTime: null,
    soundPlaying: false,
  };

  // Make it globally accessible
  window.holdTimer = holdTimer;

  // Set up event listeners for the editable time display ONCE
  const timeDisplay = document.getElementById('timer-time');
  if (timeDisplay && !timeDisplay.hasAttribute('data-listeners-attached')) {
    timeDisplay.setAttribute('data-listeners-attached', 'true');

    timeDisplay.addEventListener('blur', handleTimeEdit);

    timeDisplay.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.blur();
      }
    });

    timeDisplay.addEventListener('click', function () {
      if (this.getAttribute('contenteditable') === 'true') {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(this);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });
  }

  // Now call the UI update functions
  updateTimerDisplay();
  updateHoldHistory();
  updateTimerButtons();
  updateTimerModeDisplay();

  // Set up countdown controls
  setupCountdownControls();

  // Expose the timer mode toggle function globally
  window.toggleTimerMode = toggleTimerMode;
}

// Add a new helper function to maintain the countdown value between timer instances
export function updateCountdownDuration(seconds) {
  holdTimer.countdownSeconds = seconds;
  holdTimer.lastSetCountdown = seconds;

  // Also update in settings
  const appSettings = getAppSettings();
  appSettings.timerCountdownDuration = seconds;
  saveSettings(appSettings);

  // Always update the display to reflect the change
  updateTimerDisplay();
}

// Update setupCountdownControls to focus on editable time display functionality
export function setupCountdownControls() {
  const timerContainer = document.getElementById('hold-timer');
  if (!timerContainer) return;

  // Remove existing controls if any (to prevent duplicates)
  const existingControls = timerContainer.querySelector('.countdown-controls');
  if (existingControls) {
    existingControls.remove();
  }

  // Add a small hint below the timer display
  const timerDisplayContainer = timerContainer.querySelector('.timer-display');
  if (!timerDisplayContainer) return;

  // Check if hint already exists
  let hintElement = timerDisplayContainer.querySelector('.timer-edit-hint');
  if (!hintElement) {
    hintElement = document.createElement('div');
    hintElement.className = 'timer-edit-hint';
    hintElement.textContent = 'Click time to edit';
    timerDisplayContainer.appendChild(hintElement);
  }

  // The redundant logic for setting contenteditable and adding listeners has been removed.
  // This is now handled exclusively by the updateTimerDisplay() function.
}

// Function to update timer mode display
export function updateTimerModeDisplay() {
  const timerContainer = document.getElementById('hold-timer');
  const timerMode = document.getElementById('timer-mode');
  const countdownControls = timerContainer?.querySelector(
    '.countdown-controls'
  );

  if (timerContainer && timerMode) {
    // Update the mode indicator
    if (holdTimer.isCountdown) {
      timerMode.textContent = 'COUNTDOWN';
      timerContainer.classList.add('countdown-mode');
      if (countdownControls) countdownControls.style.display = 'block';
    } else {
      timerMode.textContent = 'STOPWATCH';
      timerContainer.classList.remove('countdown-mode');
      if (countdownControls) countdownControls.style.display = 'none';
    }
  }
}

// Function to update hold history display
export function updateHoldHistory() {
  const historyList = document.getElementById('hold-history');
  if (!historyList) return;

  historyList.innerHTML = '';

  holdTimer.holdHistory.forEach((entry, index) => {
    const li = document.createElement('li');
    li.className = 'history-item';

    // Only show delete button if allowed in settings
    const deleteButton = getAppSettings().timerAllowHistoryDeletion
      ? `<button class="delete-hold-btn" data-index="${index}">Delete</button>`
      : '';

    li.innerHTML = `
            <div class="hold-duration">${formatTime(entry.duration)}</div>
            <div class="hold-info">
                <div class="hold-timestamp">${entry.time}<br>${entry.date}</div>
                ${deleteButton}
            </div>
        `;
    historyList.appendChild(li);
  });

  // Add event listeners to delete buttons
  const deleteButtons = historyList.querySelectorAll('.delete-hold-btn');
  deleteButtons.forEach((button) => {
    button.addEventListener('click', function () {
      const index = parseInt(this.dataset.index, 10);
      deleteHoldTime(index);
    });
  });
}

// Function to update timer buttons
function updateTimerButtons() {
  const startBtn = document.getElementById('start-timer');
  const pauseBtn = document.getElementById('pause-timer');
  const resetBtn = document.getElementById('reset-timer');
  const clearHistoryBtn = document.getElementById('clear-history-btn');

  if (startBtn && pauseBtn && resetBtn && clearHistoryBtn) {
    if (holdTimer.isRunning) {
      if (holdTimer.isPaused) {
        startBtn.textContent = 'Resume';
        startBtn.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
      } else {
        startBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
      }
      resetBtn.classList.remove('hidden');
    } else {
      startBtn.textContent = 'Start';
      startBtn.classList.remove('hidden');
      pauseBtn.classList.add('hidden');
      resetBtn.classList.add('hidden');
    }

    // Show clear history button only if there is history
    clearHistoryBtn.style.display =
      holdTimer.holdHistory.length > 0 ? '' : 'none';
  }
}

// Export the setupTimerEventListeners function
export function setupTimerEventListeners() {
  document.getElementById('start-timer')?.addEventListener('click', startTimer);
  document.getElementById('pause-timer')?.addEventListener('click', pauseTimer);
  document.getElementById('reset-timer')?.addEventListener('click', resetTimer);
  document
    .getElementById('clear-history-btn')
    ?.addEventListener('click', clearHoldHistory);
  document
    .getElementById('add-5-min-btn')
    ?.addEventListener('click', () => addTime(300));
  document
    .getElementById('add-30-sec-btn')
    ?.addEventListener('click', () => addTime(30));
  document
    .getElementById('toggle-mode-btn')
    ?.addEventListener('click', toggleTimerMode);
}

// Toggle timer mode
export function toggleTimerMode() {
  if (holdTimer.isRunning) {
    alert('Please reset the timer before changing modes.');
    return;
  }

  holdTimer.isCountdown = !holdTimer.isCountdown;

  // Update settings to match the current mode
  const appSettings = getAppSettings();
  appSettings.timerCountdownMode = holdTimer.isCountdown;
  saveSettings(appSettings);

  // Update the mode toggle UI to match
  const modeToggle = document.getElementById('timer-countdown-mode');
  if (modeToggle) {
    modeToggle.checked = holdTimer.isCountdown;
  }

  updateTimerModeDisplay();
  updateTimerDisplay();

  // Show a visual indication that the mode changed
  const timerContainer = document.getElementById('hold-timer');
  if (timerContainer) {
    timerContainer.classList.add('mode-changed');
    setTimeout(() => {
      timerContainer.classList.remove('mode-changed');
    }, 500);
  }
}

// Make holdTimer accessible to window for communication between modules
window.holdTimer = holdTimer;

// Ensure form-fixer.js is created
export function ensureFormFixerExists() {
  // This is a utility function to help identify if the form-fixer script exists
  return true;
}
