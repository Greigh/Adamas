// Settings management module
import {
  saveData,
  loadData,
  loadPatterns,
  savePatterns,
  loadSteps,
  saveSteps,
  loadNotes,
  saveNotes,
} from './storage.js';
import { setupThemeToggle } from './themes.js';
import { playAlertSound, initAudio } from '../utils/audio.js';

// Default settings
export let appSettings = {
  showFormatter: true,
  showCallflow: true,
  showNotes: true,
  showHoldtimer: true,
  exportPatterns: true,
  exportSteps: true,
  exportNotes: true,
  exportSettings: true,
  enablePopupWindows: false,
  popupAlwaysOnTop: true,
  popupWidth: 600,
  popupHeight: 400,
  timerAutoStart: true,
  timerSoundAlerts: true,
  timerWarningTime: 300,
  timerShowNotifications: false,
  timerLogHolds: true,
  timerCountdownMode: false,
  timerCountdownDuration: 300, // 5 minutes in seconds
  timerAllowHistoryDeletion: true, // New setting for hold history deletion
  timerAlertSound: 'beep',
  timerCustomSoundUrl: '',
  customTitles: {},
  layoutMode: 'grid',
  gridColumns: 2,
  gridSpacing: 24,
  savedLayouts: {},
  defaultLayout: {
    columns: 2,
    spacing: 24,
    sections: ['pattern-formatter', 'call-flow-builder', 'notes', 'hold-timer'],
  },
  multipleTimers: true,
  multipleNotes: true,
  maxTimers: 3,
  maxNotes: 3,
  finesse: {
    enabled: false,
    url: '',
    autoConnect: false,
    autoStartTimer: true,
    autoStopTimer: true,
  },
};

// Export the saveSettings function
export function saveSettings(settings) {
  return saveData('appSettings', settings);
}

// Export the loadSettings function
export function loadSettings() {
  return loadData('appSettings', {});
}

export function initializeSettings() {
  const saved = loadSettings();
  if (Object.keys(saved).length > 0) {
    appSettings = { ...appSettings, ...saved };
  }
  applySettings();
}

export function applySettings() {
  const toggles = {
    'toggle-formatter': 'formatter',
    'toggle-callflow': 'callflow',
    'toggle-notes': 'notes',
    'toggle-holdtimer': 'holdtimer',
  };

  Object.entries(toggles).forEach(([toggleId, section]) => {
    const toggle = document.getElementById(toggleId);
    const sectionEl = document.querySelector(`[data-section="${section}"]`);
    if (toggle && sectionEl) {
      toggle.checked =
        appSettings[
          `show${section.charAt(0).toUpperCase() + section.slice(1)}`
        ];
      sectionEl.style.display = toggle.checked ? '' : 'none';
    }
  });

  // Apply export settings
  const exportSettings = [
    'export-patterns',
    'export-steps',
    'export-notes',
    'export-settings',
  ];
  exportSettings.forEach((settingId) => {
    const toggle = document.getElementById(settingId);
    if (toggle) {
      const settingKey = settingId.replace(/-/g, '');
      toggle.checked = appSettings[settingKey] !== false;
    }
  });

  // Apply popup settings
  const popupEnable = document.getElementById('enable-popup-windows');
  const popupOptions = document.querySelectorAll('.popup-options');
  if (popupEnable) {
    popupEnable.checked = appSettings.enablePopupWindows;
    popupOptions.forEach((option) => {
      option.style.display = appSettings.enablePopupWindows ? '' : 'none';
    });
  }
  const popupAlwaysOnTop = document.getElementById('popup-always-on-top');
  if (popupAlwaysOnTop) popupAlwaysOnTop.checked = appSettings.popupAlwaysOnTop;
  const popupWidth = document.getElementById('popup-width');
  if (popupWidth) popupWidth.value = appSettings.popupWidth;
  const popupHeight = document.getElementById('popup-height');
  if (popupHeight) popupHeight.value = appSettings.popupHeight;

  // Apply timer settings
  const timerAutoStart = document.getElementById('timer-auto-start');
  if (timerAutoStart) timerAutoStart.checked = appSettings.timerAutoStart;
  const timerSoundAlerts = document.getElementById('timer-sound-alerts');
  if (timerSoundAlerts) timerSoundAlerts.checked = appSettings.timerSoundAlerts;

  // Add the new setting
  const timerAllowHistoryDeletion = document.getElementById(
    'timer-allow-history-deletion'
  );
  if (timerAllowHistoryDeletion)
    timerAllowHistoryDeletion.checked = appSettings.timerAllowHistoryDeletion;

  // Update warning time display
  const timerWarningInput = document.getElementById('timer-warning-time');
  const timerWarningValue = document.getElementById('timer-warning-time-value');
  if (timerWarningInput && timerWarningValue) {
    const val = parseInt(timerWarningInput.value, 10);
    const min = Math.floor(val / 60);
    const sec = val % 60;
    timerWarningValue.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
  }

  // Apply layout settings
  applyLayout();

  // Apply instance settings
  const multipleTimers = document.getElementById('enable-multiple-timers');
  const maxTimers = document.getElementById('max-timers');
  const maxTimersValue = document.getElementById('max-timers-value');
  const multipleNotes = document.getElementById('enable-multiple-notes');
  const maxNotes = document.getElementById('max-notes');
  const maxNotesValue = document.getElementById('max-notes-value');

  if (multipleTimers) multipleTimers.checked = appSettings.multipleTimers;
  if (maxTimers) maxTimers.value = appSettings.maxTimers;
  if (maxTimersValue) maxTimersValue.textContent = appSettings.maxTimers;
  if (multipleNotes) multipleNotes.checked = appSettings.multipleNotes;
  if (maxNotes) maxNotes.value = appSettings.maxNotes;
  if (maxNotesValue) maxNotesValue.textContent = appSettings.maxNotes;

  // Update visibility of max settings based on multiple instances toggles
  document.querySelectorAll('.instance-option').forEach((option) => {
    if (option.querySelector('#max-timers')) {
      option.style.display = appSettings.multipleTimers ? '' : 'none';
    }
    if (option.querySelector('#max-notes')) {
      option.style.display = appSettings.multipleNotes ? '' : 'none';
    }
  });
}

export function showMainApp() {
  document.getElementById('main-app').style.display = '';
  document.getElementById('settings-view').style.display = 'none';
  document.getElementById('main-tab').classList.add('active');
  document.getElementById('settings-tab').classList.remove('active');
}

export function showSettings() {
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('settings-view').style.display = '';
  document.getElementById('main-tab').classList.remove('active');
  document.getElementById('settings-tab').classList.add('active');
}

export function setupSettingsEventListeners() {
  // Initialize audio context
  initAudio();

  // Setup theme toggle first
  setupThemeToggle();

  // Navigation event listeners
  const mainTab = document.getElementById('main-tab');
  const settingsTab = document.getElementById('settings-tab');
  if (mainTab) mainTab.addEventListener('click', showMainApp);
  if (settingsTab) settingsTab.addEventListener('click', showSettings);

  // Settings toggles
  const settingsToggles = [
    'toggle-formatter',
    'toggle-callflow',
    'toggle-notes',
    'toggle-holdtimer',
  ];
  settingsToggles.forEach((toggleId) => {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.addEventListener('change', function () {
        const section = toggleId.replace('toggle-', '');
        appSettings[
          `show${section.charAt(0).toUpperCase() + section.slice(1)}`
        ] = this.checked;
        saveSettings(appSettings);
        applySettings();
      });
    }
  });

  // Export toggles
  const exportToggles = [
    'export-patterns',
    'export-steps',
    'export-notes',
    'export-settings',
  ];
  exportToggles.forEach((toggleId) => {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.addEventListener('change', function () {
        const settingKey = toggleId.replace(/-/g, '');
        appSettings[settingKey] = this.checked;
        saveSettings(appSettings);
      });
    }
  });

  // Popup settings
  const popupEnable = document.getElementById('enable-popup-windows');
  if (popupEnable) {
    popupEnable.addEventListener('change', function () {
      appSettings.enablePopupWindows = this.checked;
      saveSettings(appSettings);
      applySettings();
    });
  }
  const popupAlwaysOnTop = document.getElementById('popup-always-on-top');
  if (popupAlwaysOnTop) {
    popupAlwaysOnTop.addEventListener('change', function () {
      appSettings.popupAlwaysOnTop = this.checked;
      saveSettings(appSettings);
    });
  }
  const popupWidth = document.getElementById('popup-width');
  if (popupWidth) {
    popupWidth.addEventListener('input', function () {
      appSettings.popupWidth = parseInt(this.value, 10);
      saveSettings(appSettings);
    });
  }
  const popupHeight = document.getElementById('popup-height');
  if (popupHeight) {
    popupHeight.addEventListener('input', function () {
      appSettings.popupHeight = parseInt(this.value, 10);
      saveSettings(appSettings);
    });
  }

  // Timer settings
  const timerToggles = [
    'timer-auto-start',
    'timer-sound-alerts',
    'timer-show-notifications',
    'timer-log-holds',
    'timer-countdown-mode',
  ];
  timerToggles.forEach((toggleId) => {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.addEventListener('change', function () {
        const settingKey = toggleId.replace(/-/g, '');
        appSettings[settingKey] = this.checked;
        saveSettings(appSettings);
      });
    }
  });

  // Timer warning slider - CORRECTED VERSION
  const timerWarningInput = document.getElementById('timer-warning-time');
  const timerWarningValue = document.getElementById('timer-warning-time-value');
  const timerWarningSlider = document.getElementById(
    'timer-warning-time-slider'
  );

  if (timerWarningInput && timerWarningValue && timerWarningSlider) {
    function updateWarningDisplay() {
      const val = parseInt(timerWarningInput.value, 10);
      const min = Math.floor(val / 60);
      const sec = val % 60;
      timerWarningValue.textContent = `${min}:${sec
        .toString()
        .padStart(2, '0')}`;
    }

    function updateSliderValue(slider, value) {
      const val = parseInt(value, 10);
      slider.value = isNaN(val) ? 0 : val;
    }

    // Single event listener for the slider
    timerWarningInput.addEventListener('input', function () {
      appSettings.timerWarningTime = parseInt(this.value, 10);
      updateWarningDisplay();
      saveSettings(appSettings);
    });

    timerWarningSlider.addEventListener('input', function () {
      appSettings.timerWarningTime = parseInt(this.value, 10);
      updateWarningDisplay();
    });

    // Set initial value from settings
    timerWarningInput.value = appSettings.timerWarningTime;
    updateWarningDisplay();
    updateSliderValue(timerWarningSlider, timerWarningValue);
  }

  // Layout Settings
  const movementMode = document.getElementById('movement-mode');
  if (movementMode) {
    movementMode.value = appSettings.layoutMode;
    movementMode.addEventListener('change', function () {
      appSettings.layoutMode = this.value;
      saveSettings(appSettings);
      applyLayout();
    });
  }

  const gridColumns = document.getElementById('grid-columns');
  const gridColumnsValue = document.getElementById('grid-columns-value');
  if (gridColumns && gridColumnsValue) {
    gridColumns.value = appSettings.gridColumns;
    gridColumnsValue.textContent = appSettings.gridColumns;

    gridColumns.addEventListener('input', function () {
      appSettings.gridColumns = parseInt(this.value);
      gridColumnsValue.textContent = this.value;
      saveSettings(appSettings);
      applyLayout();
    });
  }

  const gridSpacing = document.getElementById('grid-spacing');
  const gridSpacingValue = document.getElementById('grid-spacing-value');
  if (gridSpacing && gridSpacingValue) {
    gridSpacing.value = appSettings.gridSpacing;
    gridSpacingValue.textContent = appSettings.gridSpacing + 'px';

    gridSpacing.addEventListener('input', function () {
      appSettings.gridSpacing = parseInt(this.value);
      gridSpacingValue.textContent = this.value + 'px';
      saveSettings(appSettings);
      applyLayout();
    });
  }

  const resetLayoutBtn = document.getElementById('reset-layout-btn');
  if (resetLayoutBtn) {
    resetLayoutBtn.addEventListener('click', resetLayout);
  }

  const saveLayoutBtn = document.getElementById('save-layout-btn');
  if (saveLayoutBtn) {
    saveLayoutBtn.addEventListener('click', saveCurrentLayout);
  }

  // Save settings button
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', function () {
      saveSettings(appSettings);
      // Show confirmation
      const originalText = this.textContent;
      this.textContent = 'Settings Saved!';
      this.style.background = 'var(--success)';
      setTimeout(() => {
        this.textContent = originalText;
        this.style.background = '';
      }, 2000);
    });
  }

  // Import/Export data
  const exportDataBtn = document.getElementById('export-data-btn');
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', exportData);
  }
  const importDataBtn = document.getElementById('import-data-btn');
  const importDataInput = document.getElementById('import-data-input');
  if (importDataBtn && importDataInput) {
    importDataBtn.addEventListener('click', () => {
      importDataInput.click();
    });
    importDataInput.addEventListener('change', importData);
  }
  const resetAllBtn = document.getElementById('reset-all-btn');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', function () {
      if (
        confirm(
          'Are you sure you want to reset ALL data? This cannot be undone!'
        )
      ) {
        localStorage.clear();
        location.reload();
      }
    });
  }

  // Instance settings
  const multipleTimers = document.getElementById('enable-multiple-timers');
  const maxTimers = document.getElementById('max-timers');
  const maxTimersValue = document.getElementById('max-timers-value');
  const multipleNotes = document.getElementById('enable-multiple-notes');
  const maxNotes = document.getElementById('max-notes');
  const maxNotesValue = document.getElementById('max-notes-value');

  if (multipleTimers) {
    multipleTimers.checked = appSettings.multipleTimers;
    multipleTimers.addEventListener('change', function () {
      appSettings.multipleTimers = this.checked;
      document.querySelectorAll('.instance-option').forEach((option) => {
        if (option.querySelector('#max-timers')) {
          option.style.display = this.checked ? '' : 'none';
        }
      });
      saveSettings(appSettings);
    });
  }

  if (maxTimers && maxTimersValue) {
    maxTimers.value = appSettings.maxTimers;
    maxTimersValue.textContent = appSettings.maxTimers;
    maxTimers.addEventListener('input', function () {
      appSettings.maxTimers = parseInt(this.value, 10);
      maxTimersValue.textContent = this.value;
      saveSettings(appSettings);
    });
  }

  if (multipleNotes) {
    multipleNotes.checked = appSettings.multipleNotes;
    multipleNotes.addEventListener('change', function () {
      appSettings.multipleNotes = this.checked;
      document.querySelectorAll('.instance-option').forEach((option) => {
        if (option.querySelector('#max-notes')) {
          option.style.display = this.checked ? '' : 'none';
        }
      });
      saveSettings(appSettings);
    });
  }

  if (maxNotes && maxNotesValue) {
    maxNotes.value = appSettings.maxNotes;
    maxNotesValue.textContent = appSettings.maxNotes;
    maxNotes.addEventListener('input', function () {
      appSettings.maxNotes = parseInt(this.value, 10);
      maxNotesValue.textContent = this.value;
      saveSettings(appSettings);
    });
  }

  // Countdown mode toggle
  const countdownToggle = document.getElementById('timer-countdown-mode');

  if (countdownToggle) {
    countdownToggle.checked = appSettings.timerCountdownMode;

    countdownToggle.addEventListener('change', function () {
      appSettings.timerCountdownMode = this.checked;
      saveSettings(appSettings);

      // If timer instance exists, update its mode
      if (window.holdTimer) {
        window.toggleTimerMode();
      }
    });
  }

  // Alert sound selection
  const alertSound = document.getElementById('timer-alert-sound');
  const customSoundOption = document.querySelector('.custom-sound-option');
  const customSoundUrl = document.getElementById('custom-sound-url');

  if (alertSound) {
    alertSound.value = appSettings.timerAlertSound;

    // Show/hide custom sound URL input
    if (customSoundOption) {
      customSoundOption.style.display =
        alertSound.value === 'custom' ? '' : 'none';
    }

    alertSound.addEventListener('change', function () {
      appSettings.timerAlertSound = this.value;
      saveSettings(appSettings);

      // Play a test sound
      if (this.value !== 'custom') {
        playAlertSound(this.value, null, true);
      }
    });
  }

  // Custom sound URL
  if (customSoundUrl) {
    customSoundUrl.value = appSettings.timerCustomSoundUrl;

    customSoundUrl.addEventListener('change', function () {
      appSettings.timerCustomSoundUrl = this.value;
      saveSettings(appSettings);
    });
  }

  // Test sound button
  const testSoundBtn = document.getElementById('test-sound-btn');
  if (testSoundBtn) {
    testSoundBtn.addEventListener('click', function () {
      const soundType = document.getElementById('timer-alert-sound').value;
      const customUrl = document.getElementById('custom-sound-url').value;
      playAlertSound(soundType, customUrl, true); // Play a short test sound
    });
  }

  // Scroll to top functionality
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  const settingsView = document.getElementById('settings-view');

  if (scrollTopBtn && settingsView) {
    // Show/hide button based on scroll position
    settingsView.addEventListener('scroll', () => {
      if (settingsView.scrollTop > 300) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    });

    // Scroll to top when clicked
    scrollTopBtn.addEventListener('click', () => {
      settingsView.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }

  // Auto Copy Pattern Result toggle
  const autoCopyToggle = document.getElementById('auto-copy-toggle');
  if (autoCopyToggle) {
    autoCopyToggle.checked = loadData('autoCopyPattern', true);
    autoCopyToggle.addEventListener('change', (e) => {
      saveData('autoCopyPattern', e.target.checked);
    });
  }
}

// Data import/export helpers
function exportData() {
  const dataToExport = {};
  if (appSettings.exportPatterns) {
    const patterns = loadPatterns();
    if (patterns.length > 0) dataToExport.patterns = patterns;
  }
  if (appSettings.exportSteps) {
    const steps = loadSteps();
    if (steps.length > 0) dataToExport.steps = steps;
  }
  if (appSettings.exportNotes) {
    const notes = loadNotes();
    if (notes.length > 0) dataToExport.notes = notes;
  }
  if (appSettings.exportSettings) {
    dataToExport.settings = appSettings;
  }
  if (Object.keys(dataToExport).length === 0) {
    alert('No data selected for export.');
    return;
  }
  const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `call-center-helper-data-${
    new Date().toISOString().split('T')[0]
  }.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      if (data.patterns) {
        savePatterns(data.patterns);
      }

      if (data.steps) {
        saveSteps(data.steps);
      }

      if (data.notes) {
        saveNotes(data.notes);
      }

      if (data.settings) {
        appSettings = { ...appSettings, ...data.settings };
        saveSettings(appSettings);
        applySettings();
      }

      alert('Data imported successfully! Refresh the page to see changes.');
    } catch (error) {
      alert('Error importing data: Invalid file format.');
      console.error('Import error:', error);
    }
  };

  reader.readAsText(file);
  event.target.value = ''; // Reset file input
}

// Layout functions
function applyLayout() {
  const container = document.querySelector('.sortable-container');
  if (!container) return;

  if (appSettings.layoutMode === 'grid') {
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${appSettings.gridColumns}, 1fr)`;
    container.style.gap = `${appSettings.gridSpacing}px`;
    container.style.padding = `${appSettings.gridSpacing}px`;

    // Remove any absolute positioning from sections
    document.querySelectorAll('.draggable-section').forEach((section) => {
      section.style.position = '';
      section.style.left = '';
      section.style.top = '';
    });
  } else {
    container.style.display = 'block';
    container.style.position = 'relative';
    container.style.height = '100%';
  }
}

function resetLayout() {
  if (
    confirm(
      'Reset layout to default? This will restore the original section order and grid settings.'
    )
  ) {
    appSettings.layoutMode = 'grid';
    appSettings.gridColumns = appSettings.defaultLayout.columns;
    appSettings.gridSpacing = appSettings.defaultLayout.spacing;

    // Restore default section order
    const container = document.querySelector('.sortable-container');
    if (container) {
      appSettings.defaultLayout.sections.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
          container.appendChild(section);
        }
      });
    }

    saveSettings(appSettings);
    applyLayout();

    // Update settings controls
    const movementMode = document.getElementById('movement-mode');
    const gridColumns = document.getElementById('grid-columns');
    const gridSpacing = document.getElementById('grid-spacing');

    if (movementMode) movementMode.value = 'grid';
    if (gridColumns) {
      gridColumns.value = appSettings.defaultLayout.columns;
      document.getElementById('grid-columns-value').textContent =
        appSettings.defaultLayout.columns;
    }
    if (gridSpacing) {
      gridSpacing.value = appSettings.defaultLayout.spacing;
      document.getElementById('grid-spacing-value').textContent =
        appSettings.defaultLayout.spacing + 'px';
    }
  }
}

function saveCurrentLayout() {
  const container = document.querySelector('.sortable-container');
  if (!container) return;

  const currentLayout = {
    mode: appSettings.layoutMode,
    columns: appSettings.gridColumns,
    spacing: appSettings.gridSpacing,
    sections: Array.from(container.children).map((section) => section.id),
  };

  appSettings.savedLayouts[new Date().toISOString()] = currentLayout;
  saveSettings(appSettings);

  // Show confirmation
  const saveBtn = document.getElementById('save-layout-btn');
  if (saveBtn) {
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Layout Saved!';
    setTimeout(() => {
      saveBtn.textContent = originalText;
    }, 2000);
  }
}

/**
 * Lazy load module for a dynamically created component
 * @param {string} componentId - ID of the component container
 * @param {string} moduleType - Type of module to load ('timer', 'notes', etc.)
 */
export async function lazyLoadDynamicComponent(componentId, moduleType) {
  if (!componentId) return;

  switch (moduleType) {
    case 'timer':
      const { initializeTimer, setupTimerEventListeners } = await import(
        './timer.js'
      );
      initializeTimer(componentId);
      setupTimerEventListeners(componentId);
      break;

    case 'notes':
      const { initializeNotes } = await import('./notes.js');
      initializeNotes(componentId);
      break;

    // Add other component types as needed
  }
}
