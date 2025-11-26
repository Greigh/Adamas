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
import {
  playAlertSound,
  initAudio,
  setRepeatAlertSoundMode,
} from '../utils/audio.js';

// Draggable helpers for per-section controls (allow settings to be draggable/floating like the main page)
import { setupDraggable, setupFloating, setupSectionToggle } from './draggable.js';

// Default settings
export let appSettings = {
  showFormatter: true,
  showCallflow: true,
  showNotes: true,
  showHoldtimer: true,
  showCalllogging: false,
  showCrm: false,
  showScripts: false,
  showTasks: false,
  showVoicerecording: false,
  showCollaboration: false,
  showWorkflows: false,
  showMultichannel: false,
  showFeedback: false,
  showKnowledgeBase: false,
  showTimeTracking: false,
  showAdvancedAnalytics: false,
  showApiIntegration: false,
  showHoldtimerSettings: true,
  showPerformanceMonitoring: false,
  showCrmIntegration: false,
  exportPatterns: true,
  exportSteps: true,
  exportNotes: true,
  exportSettings: true,
  enablePopupWindows: false,
  popupAlwaysOnTop: true,
  popupWidth: 600,
  popupHeight: 400,
  preferPopupWindows: false,
  timerAutoStart: true,
  timerSoundAlerts: true,
  timerWarningTime: 300,
  timerShowNotifications: false,
  timerLogHolds: true,
  timerCountdownMode: false,
  timerCountdownDuration: 300, // 5 minutes in seconds
  timerAllowHistoryDeletion: true, // New setting for hold history deletion
  timerAlertSound: 'endgame', // default, can be 'endgame', 'bell', 'towerbell', 'custom'
  timerCustomSoundUrl: '',
  repeatAlertSound: true, // New setting for repeat alert sound
  customTitles: {},
  patternManagementExpanded: true,
  // collapsed setting-items stored as map: { '<sectionKey>::<labelKey>': true }
  collapsedSettingItems: {},
  layoutMode: 'grid', // Layout mode: 'vertical' or 'grid'
  gridColumns: 2,
  gridSpacing: 24,
  savedLayouts: {},
  // Per-view saved layouts (keyed by view id, e.g., 'main-app' or 'settings-view')
  savedLayoutsPerView: {},
  defaultLayout: {
    columns: 2,
    spacing: 24,
    sections: ['pattern-formatter', 'call-flow-builder', 'notes', 'hold-timer'],
  },
  multipleTimers: false,
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

// Exportable helper so tests can call this directly
export function addSettingCollapsibles() {
  const svgChevron = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.5 5.5L15.5 12L8.5 18.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.querySelectorAll('#settings-view .settings-section').forEach((section) => {
    const sectionKey = section.id || (section.querySelector('h3')?.textContent?.trim().toLowerCase().replace(/\s+/g, '-') || 'settings');
    const items = Array.from(section.querySelectorAll('.setting-item'));
    items.forEach((item, idx) => {
      // skip if already has a toggle
      if (item.querySelector('.setting-toggle')) return;

      const desc = item.querySelector('.setting-description');
      const ctrl = item.querySelector('.setting-control');
      const hasFile = !!item.querySelector('.file-upload-group');
      const hasExport = !!item.querySelector('.export-options');
      const isDanger = item.classList.contains('danger');

      // heuristics: if the item has a multi-line description long enough, or a file upload/export control
      // or contains multiple controls - make it collapsible.
      const textLength = desc?.textContent?.trim().length || 0;
      const controlCount = ctrl ? ctrl.querySelectorAll('input, button, select, textarea').length : 0;
      const shouldCollapse = textLength > 80 || hasFile || hasExport || controlCount > 1 || isDanger;

      if (!shouldCollapse) return;

      // build a unique key for persistence
      const label = item.querySelector('.setting-label')?.textContent?.trim() || `${sectionKey}-${idx}`;
      const labelKey = label.toLowerCase().replace(/\s+/g, '-');
      const stateKey = `${sectionKey}::${labelKey}`;

      // create button
      const btn = document.createElement('button');
      btn.className = 'setting-toggle';
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('title', 'Collapse');
      btn.innerHTML = '▾';

      // insert toggle in the setting header
      const settingInfo = item.querySelector('.setting-info');
      if (settingInfo) {
        settingInfo.appendChild(btn);
      }

      // set initial collapsed state from saved settings
      if (appSettings.collapsedSettingItems && appSettings.collapsedSettingItems[stateKey]) {
        item.classList.add('collapsed');
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = '▸';
      }

      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        const isCollapsed = item.classList.toggle('collapsed');
        btn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
        btn.innerHTML = isCollapsed ? '▸' : '▾';
        // save state
        appSettings.collapsedSettingItems = appSettings.collapsedSettingItems || {};
        appSettings.collapsedSettingItems[stateKey] = isCollapsed;
        saveSettings(appSettings);
      });
    });
  });
}

// Toggle collapse state for all collapsible setting-items. If `collapse` is
// true, force collapse, if false, force expand, otherwise toggle based on
// current mixed state (if any item expanded -> collapse all, else expand all).
export function toggleCollapseAll(collapse) {
  const buttons = Array.from(document.querySelectorAll('#settings-view .settings-section .setting-item .setting-toggle'));
  if (!buttons.length) return;

  // compute current: if any item is not collapsed, we should collapse all
  const anyExpanded = buttons.some(btn => { const item = btn.closest('.setting-item'); return item && !item.classList.contains('collapsed'); });
  const targetCollapse = (typeof collapse === 'boolean') ? collapse : anyExpanded;

  // helper to build state key like addSettingCollapsibles
  function stateKeyForItem(item) {
    const section = item.closest('.settings-section');
    const sectionKey = section?.id || (section?.querySelector('h3')?.textContent?.trim().toLowerCase().replace(/\s+/g, '-') || 'settings');
    const label = item.querySelector('.setting-label')?.textContent?.trim() || '';
    const labelKey = label.toLowerCase().replace(/\s+/g, '-');
    return `${sectionKey}::${labelKey}`;
  }

  buttons.forEach((btn) => {
    const item = btn.closest('.setting-item');
    if (!item) return;
    const key = stateKeyForItem(item);
    if (targetCollapse) {
      item.classList.add('collapsed');
      btn.setAttribute('aria-expanded', 'false');
      appSettings.collapsedSettingItems = appSettings.collapsedSettingItems || {};
      // compact state update
      appSettings.collapsedSettingItems[key] = true;
    } else {
      item.classList.remove('collapsed');
      btn.setAttribute('aria-expanded', 'true');
      appSettings.collapsedSettingItems = appSettings.collapsedSettingItems || {};
      // compact state update
      appSettings.collapsedSettingItems[key] = false;
    }
  });

  saveSettings(appSettings);
  // update header button text
  const headerBtn = document.querySelector('#settings-view .settings-header .header-actions .collapse-all');
  if (headerBtn) {
    headerBtn.textContent = targetCollapse ? 'Expand all' : 'Collapse all';
    headerBtn.setAttribute('aria-pressed', targetCollapse ? 'false' : 'true');
  }
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

  // Initialize repeat alert sound toggle
  if (repeatAlertSoundToggle) {
    repeatAlertSoundToggle.checked =
      appSettings.timerRepeatAlertSound !== false;
  }
}

export function applySettings() {
  const toggles = {
    'toggle-formatter': 'formatter',
    'toggle-callflow': 'callflow',
    'toggle-notes': 'notes',
    'toggle-holdtimer': 'holdtimer',
    'toggle-calllogging': 'calllogging',
    'toggle-scripts': 'scripts',
    'toggle-tasks': 'tasks',
    'toggle-voicerecording': 'voicerecording',
    'toggle-collaboration': 'collaboration',
    'toggle-workflows': 'workflows',
    'toggle-multichannel': 'multichannel',
    'toggle-feedback': 'feedback',
    'toggle-knowledge-base': 'knowledgebase',
    'toggle-time-tracking': 'timetracking',
    'toggle-advanced-analytics': 'advancedanalytics',
    'toggle-api-integration': 'apiintegration',
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

  // Apply advanced settings toggles
  const advancedToggles = {
    'toggle-holdtimer-settings': 'hold-timer-settings',
    'toggle-performance-monitoring': 'performance-monitoring-section',
    'toggle-crm-integration': 'crm-integration-section',
  };

  Object.entries(advancedToggles).forEach(([toggleId, sectionId]) => {
    const toggle = document.getElementById(toggleId);
    const sectionEl = document.getElementById(sectionId);
    if (toggle && sectionEl) {
      const settingKey = toggleId.replace('toggle-', '').replace(/-/g, '');
      toggle.checked = appSettings[`show${settingKey.charAt(0).toUpperCase() + settingKey.slice(1)}`] !== false;
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
  const preferPopup = document.getElementById('prefer-popup-windows');
  if (preferPopup) preferPopup.checked = appSettings.preferPopupWindows;
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

  // Repeat alert sound toggle
  if (repeatAlertSoundToggle)
    repeatAlertSoundToggle.checked = appSettings.repeatAlertSound;

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
  const layoutModeSelect = document.getElementById('layout-mode');
  if (layoutModeSelect) {
    layoutModeSelect.value = appSettings.layoutMode;
  }

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

  // Update multiple timers visibility
  updateMultipleTimersVisibility(appSettings.multipleTimers);

  // Apply repeat alert sound mode
    // Apply pattern management subsection expand/collapse
    try {
      const patternSubsection = document.getElementById('pattern-management-subsection');
      const toggle = patternSubsection?.querySelector('.subsection-toggle');
      if (patternSubsection) {
        if (!appSettings.patternManagementExpanded) {
          patternSubsection.classList.add('collapsed');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        } else {
          patternSubsection.classList.remove('collapsed');
          if (toggle) toggle.setAttribute('aria-expanded', 'true');
        }
      }
    } catch (e) {}
  if (repeatAlertSoundToggle) {
    repeatAlertSoundToggle.checked =
      appSettings.timerRepeatAlertSound !== false;
    setRepeatAlertSoundMode(repeatAlertSoundToggle.checked);
  }

  // Apply any persisted collapse states for individual setting-items
  try {
    const map = appSettings.collapsedSettingItems || {};
    Object.keys(map).forEach((k) => {
      try {
        const [sectionKey, labelKey] = k.split('::');
        const sectionEl = sectionKey ? document.getElementById(sectionKey) : null;
        // fallback: attempt to find by header text
        let target = null;
        if (sectionEl) {
          target = Array.from(sectionEl.querySelectorAll('.setting-item')).find(si => {
            const label = si.querySelector('.setting-label')?.textContent?.trim() || '';
            return label.toLowerCase().replace(/\s+/g,'-') === labelKey;
          });
        } else {
          // search globally
          target = Array.from(document.querySelectorAll('.setting-item')).find(si => {
            const label = si.querySelector('.setting-label')?.textContent?.trim() || '';
            return label.toLowerCase().replace(/\s+/g,'-') === labelKey;
          });
        }
        if (target && map[k]) target.classList.add('collapsed');
      } catch (e) {}
    });
  } catch (e) {}

  // Update collapse-all button initial state (if present)
  try {
    const headerBtn = document.querySelector('#settings-view .settings-header .header-actions .collapse-all');
    if (headerBtn) {
      const anyExpanded = Array.from(document.querySelectorAll('#settings-view .settings-section .setting-item')).some(si => !si.classList.contains('collapsed'));
      headerBtn.textContent = anyExpanded ? 'Collapse all' : 'Expand all';
      headerBtn.setAttribute('aria-pressed', anyExpanded ? 'false' : 'true');
    }
  } catch (e) {}

  // Apply any custom titles saved in settings so settings sections match main page
  try {
    const titles = appSettings.customTitles || {};
    Object.entries(titles).forEach(([key, val]) => {
      if (!val) return;
      // find by data-section or id
      // apply to settings view and main app if present
      const el = document.querySelector(`#settings-view [data-section="${key}"]`) ||
                 document.querySelector(`[data-section="${key}"]`) ||
                 document.getElementById(key);
      if (el) {
        const titleElem = el.querySelector('.section-title') || el.querySelector('h2, h3');
        if (titleElem) titleElem.textContent = val;
      }
    });
  } catch (e) {}
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
    'toggle-calllogging',
    'toggle-scripts',
    'toggle-tasks',
    'toggle-voicerecording',
    'toggle-collaboration',
    'toggle-workflows',
    'toggle-multichannel',
    'toggle-feedback',
    'toggle-knowledge-base',
    'toggle-time-tracking',
    'toggle-advanced-analytics',
    'toggle-api-integration',
    'toggle-holdtimer-settings',
    'toggle-performance-monitoring',
    'toggle-crm-integration',
  ];
  settingsToggles.forEach((toggleId) => {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.addEventListener('change', function () {
        let settingKey;
        if (toggleId.startsWith('toggle-')) {
          const section = toggleId.replace('toggle-', '');
          // Handle advanced settings with different naming
          if (section === 'holdtimer-settings') {
            settingKey = 'showHoldtimerSettings';
          } else if (section === 'performance-monitoring') {
            settingKey = 'showPerformanceMonitoring';
          } else if (section === 'crm-integration') {
            settingKey = 'showCrmIntegration';
          } else {
            settingKey = `show${section.charAt(0).toUpperCase() + section.slice(1)}`;
          }
        }
        appSettings[settingKey] = this.checked;
        saveSettings(appSettings);
        applySettings();
      });
    }
  });
  
  // Add global listener for subsection toggles (collapsible)
  document.querySelectorAll('.subsection-toggle').forEach((btn) => {
    btn.addEventListener('click', function () {
      const subsection = this.closest('.pattern-management-subsection');
      if (!subsection) return;
      const expanded = this.getAttribute('aria-expanded') === 'true';
      const newVal = !expanded;
      this.setAttribute('aria-expanded', newVal ? 'true' : 'false');
      subsection.classList.toggle('collapsed', !newVal);
      appSettings.patternManagementExpanded = newVal;
      saveSettings(appSettings);
    });
  });

  // Insert collapse toggles for setting-items that are complex or verbose so the
  // Settings view stays tidy. Persist collapsed state in appSettings.collapsedSettingItems.
  // Note: Toggles removed from settings page per user request
  // try {
  //   addSettingCollapsibles();
  //   // Add a header-wide Collapse all / Expand all control
  //   try {
  //     const header = document.querySelector('#settings-view .settings-header');
  //     if (header) {
  //       let actions = header.querySelector('.header-actions');
  //       if (!actions) {
  //         actions = document.createElement('div');
  //         actions.className = 'header-actions';
  //         header.appendChild(actions);
  //       }

  //       // Only add if not present
  //       if (!actions.querySelector('.collapse-all')) {
  //         const btn = document.createElement('button');
  //         btn.className = 'collapse-all';
  //         btn.setAttribute('aria-pressed', 'false');
  //         btn.textContent = 'Collapse all';
  //         btn.title = 'Collapse all setting items';

  //         btn.addEventListener('click', (e) => {
  //           // toggleCollapseAll will update the button text
  //           const anyExpanded = Array.from(document.querySelectorAll('#settings-view .settings-section .setting-item')).some(si => !si.classList.contains('collapsed'));
  //           toggleCollapseAll(anyExpanded);
  //         });

  //         actions.appendChild(btn);
  //       }
  //     }
  //   } catch (e) {}
  // } catch (e) { /* non-fatal */ }

  // Ensure settings sections behave like main page sections
  try {
    document.querySelectorAll('#settings-view .settings-section').forEach((section) => {
      if (!section) return;
      section.classList.add('draggable-section');
      if (typeof setupDraggable === 'function') setupDraggable(section);
      if (typeof setupFloating === 'function') setupFloating(section);
      if (typeof setupSectionToggle === 'function') setupSectionToggle(section);
    });
  } catch (e) {}


// NOTE: addSettingCollapsibles is implemented at top-level below (kept here
// temporarily in setup flow call so tests can invoke it separately)
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
  const preferPopup = document.getElementById('prefer-popup-windows');
  if (preferPopup) {
    preferPopup.addEventListener('change', function () {
      appSettings.preferPopupWindows = this.checked;
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

  // Repeat alert sound toggle
  if (repeatAlertSoundToggle) {
    repeatAlertSoundToggle.addEventListener('change', function () {
      appSettings.timerRepeatAlertSound = this.checked;
      saveSettings(appSettings);
      setRepeatAlertSoundMode(this.checked);
    });
  }

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

  // Layout mode select
  const layoutModeSelect = document.getElementById('layout-mode');
  if (layoutModeSelect) {
    layoutModeSelect.addEventListener('change', function () {
      appSettings.layoutMode = this.value;
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
  const importDataInput = document.getElementById('import-data-file');
  const importFileInfo = document.getElementById('import-file-info');
  if (importDataBtn && importDataInput) {
    importDataBtn.addEventListener('click', () => {
      importDataInput.click();
    });
    importDataInput.addEventListener('change', importData);
    importDataInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file && importFileInfo) {
        importFileInfo.textContent = `Selected: ${file.name}`;
        importFileInfo.style.display = 'block';
      } else if (importFileInfo) {
        importFileInfo.style.display = 'none';
      }
    });
  }

  // Restore backup functionality
  const restoreDataBtn = document.getElementById('restore-data-btn');
  const restoreDataInput = document.getElementById('restore-data-file');
  const restoreFileInfo = document.getElementById('restore-file-info');
  if (restoreDataBtn && restoreDataInput) {
    restoreDataBtn.addEventListener('click', () => {
      restoreDataInput.click();
    });
    restoreDataInput.addEventListener('change', restoreData);
    restoreDataInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (file && restoreFileInfo) {
        restoreFileInfo.textContent = `Selected: ${file.name}`;
        restoreFileInfo.style.display = 'block';
      } else if (restoreFileInfo) {
        restoreFileInfo.style.display = 'none';
      }
    });
  }

  // Backup functionality
  const backupDataBtn = document.getElementById('backup-data-btn');
  if (backupDataBtn) {
    backupDataBtn.addEventListener('click', createBackup);
  }
  const resetAllBtn = document.getElementById('reset-all-btn');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', function () {
      (async () => {
        const { showConfirmModal } = await import('../utils/modal.js');
        const ok = await showConfirmModal({ title: 'Reset All Data', message: 'Are you sure you want to reset ALL data? This cannot be undone!', confirmLabel: 'Reset All', cancelLabel: 'Cancel', danger: true });
        if (ok) {
          localStorage.clear();
          location.reload();
        }
      })();
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
      // Update multiple timers visibility
      updateMultipleTimersVisibility(this.checked);
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

  // Show/hide custom sound URL input based on alert sound selection
  // Use the already-declared alertSound and customSoundOption
  if (alertSound && customSoundOption && customSoundUrl) {
    function updateCustomUrlVisibility() {
      if (alertSound.value === 'custom') {
        customSoundOption.style.display = '';
        customSoundUrl.focus();
      } else {
        customSoundOption.style.display = 'none';
        customSoundUrl.blur();
      }
    }
    alertSound.addEventListener('change', updateCustomUrlVisibility);
    // Initial state
    updateCustomUrlVisibility();
  }

  // Test sound button
  const testSoundBtn = document.getElementById('test-sound-btn');
  if (testSoundBtn) {
    testSoundBtn.addEventListener('click', function () {
      const soundType = document.getElementById('timer-alert-sound').value;
      const customUrl = document.getElementById('custom-sound-url').value;
      playAlertSound(soundType, customUrl, true); // Play a short test sound immediately
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(`${soundType === 'custom' ? customUrl : soundType}`)
          .then(() => {
            testSoundBtn.textContent = 'Copied!';
            setTimeout(() => (testSoundBtn.textContent = 'Test Sound'), 1000);
          })
          .catch(() => {
            alert('Copy failed. Please copy manually.');
          });
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = soundType === 'custom' ? customUrl : soundType;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          testSoundBtn.textContent = 'Copied!';
          setTimeout(() => (testSoundBtn.textContent = 'Test Sound'), 1000);
        } catch (err) {
          alert('Copy failed. Please copy manually.');
        }
        document.body.removeChild(textarea);
      }
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

async function restoreData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const { showConfirmModal } = await import('../utils/modal.js');
  if (!(await showConfirmModal({ title: 'Restore Backup', message: 'Are you sure you want to restore from this backup? This will overwrite all existing data.', confirmLabel: 'Restore', cancelLabel: 'Cancel', danger: true }))) {
    event.target.value = ''; // Reset file input
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      // Clear existing data
      localStorage.clear();

      // Restore data
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
        appSettings = data.settings;
        saveSettings(appSettings);
        applySettings();
      }

      alert('Data restored successfully! The page will now reload.');
      location.reload();
    } catch (error) {
      alert('Error restoring data: Invalid backup file format.');
      console.error('Restore error:', error);
    }
  };

  reader.readAsText(file);
  event.target.value = ''; // Reset file input
}

function createBackup() {
  const dataToBackup = {
    patterns: loadPatterns(),
    steps: loadSteps(),
    notes: loadNotes(),
    settings: appSettings,
    timestamp: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(dataToBackup, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `call-center-helper-backup-${
    new Date().toISOString().split('T')[0]
  }.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  alert('Backup created successfully!');
}

// Layout functions
function applyLayout() {
  // Apply layout & ordering to every sortable container (main + settings)
  const containers = Array.from(document.querySelectorAll('.sortable-container'));
  if (!containers.length) return;

  containers.forEach((container) => {
    // Set data attribute for CSS-based layout
    container.setAttribute('data-layout', appSettings.layoutMode);

    if (appSettings.layoutMode === 'grid') {
      container.style.display = 'grid';
      // Avoid inline gridTemplateColumns — instead add a safe utility class
      // (e.g. "grid-cols-2-safe") so CSS controls min widths and prevents
      // skinny multi-column collapse. This also makes the layout easier to
      // override in devtools.
      // remove any existing safe classes first
      Array.from(container.classList).forEach((cn) => {
        const m = cn.match(/^grid-cols-(\d+)-safe$/);
        if (m) container.classList.remove(cn);
      });
      const cols = Math.max(1, Math.min(4, parseInt(appSettings.gridColumns, 10) || 2));
      container.classList.add(`grid-cols-${cols}-safe`);
      container.style.gap = `${appSettings.gridSpacing}px`;
      container.style.padding = `${appSettings.gridSpacing}px`;

      // Remove any absolute positioning from sections in this container
      container.querySelectorAll('.draggable-section').forEach((section) => {
        section.style.position = '';
        section.style.left = '';
        section.style.top = '';
      });
    } else {
      // Reset to default (let CSS manage layout)
      container.style.display = '';
      // remove our safe grid classes when leaving grid mode
      Array.from(container.classList).forEach((cn) => {
        const m = cn.match(/^grid-cols-(\d+)-safe$/);
        if (m) container.classList.remove(cn);
      });
      container.style.gap = '';
      container.style.padding = '';
      container.style.position = 'relative';
      container.style.height = '100%';
    }

    // Attempt to apply any saved-per-view ordering for this container if present
    try {
      const view = container.closest('.app-view');
      const viewKey = view?.id || 'root';
      const saved = appSettings.savedLayoutsPerView && appSettings.savedLayoutsPerView[viewKey];
      if (saved && Array.isArray(saved.sections) && saved.sections.length) {
        saved.sections.forEach((sectionId) => {
          const sec = document.getElementById(sectionId);
          if (sec && container !== sec.parentElement) container.appendChild(sec);
        });
      }
    } catch (e) {
      // non-fatal
    }
  });
}

async function resetLayout() {
  const { showConfirmModal } = await import('../utils/modal.js');
  const confirmed = await showConfirmModal({
    title: 'Reset Layout',
    message: 'Reset layout to default? This will restore the original section order and grid settings.',
    confirmLabel: 'Reset',
    cancelLabel: 'Cancel',
    danger: false,
  });

  if (!confirmed) return;

  // Restore to default layout values
  appSettings.layoutMode = 'grid';
  appSettings.gridColumns = appSettings.defaultLayout.columns;
  appSettings.gridSpacing = appSettings.defaultLayout.spacing;

  // Restore default section order for the primary container
  const container = document.querySelector('.sortable-container');
  if (container) {
    appSettings.defaultLayout.sections.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) container.appendChild(section);
    });
  }

  saveSettings(appSettings);
  applyLayout();

  // Update settings controls if present
  const movementMode = document.getElementById('movement-mode');
  const gridColumns = document.getElementById('grid-columns');
  const gridSpacing = document.getElementById('grid-spacing');

  if (movementMode) movementMode.value = 'grid';
  if (gridColumns) {
    gridColumns.value = appSettings.defaultLayout.columns;
    const gridColumnsValue = document.getElementById('grid-columns-value');
    if (gridColumnsValue) gridColumnsValue.textContent = appSettings.defaultLayout.columns;
  }
  if (gridSpacing) {
    gridSpacing.value = appSettings.defaultLayout.spacing;
    const gridSpacingValue = document.getElementById('grid-spacing-value');
    if (gridSpacingValue) gridSpacingValue.textContent = appSettings.defaultLayout.spacing + 'px';
  }
}

function saveCurrentLayout() {
  // Save the current layout for each sortable container separately. This will
  // persist a layout keyed by the surrounding app-view container so the main
  // page and the settings page can keep their own layouts.
  const containers = Array.from(document.querySelectorAll('.sortable-container'));
  if (!containers.length) return;

  containers.forEach((container) => {
    const view = container.closest('.app-view');
    const viewKey = view?.id || 'root';

    const currentLayout = {
      mode: appSettings.layoutMode,
      columns: appSettings.gridColumns,
      spacing: appSettings.gridSpacing,
      sections: Array.from(container.children).map((section) => section.id),
    };

    // keep a rolling history (compat) and store per-view layout
    appSettings.savedLayouts[new Date().toISOString()] = currentLayout;
    appSettings.savedLayoutsPerView = appSettings.savedLayoutsPerView || {};
    appSettings.savedLayoutsPerView[viewKey] = currentLayout;
  });

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

// Declare once at the top of the module scope
const repeatAlertSoundToggle = document.getElementById(
  'repeat-alert-sound-toggle'
);

// Update multiple timers visibility
function updateMultipleTimersVisibility(enabled) {
  const multipleTimersSection = document.querySelector('.multiple-timers');
  if (multipleTimersSection) {
    multipleTimersSection.style.display = enabled ? '' : 'none';
  }
}

// Add new sound options to the alert sound dropdown if present
document.addEventListener('DOMContentLoaded', () => {
  const alertSound = document.getElementById('timer-alert-sound');
  if (alertSound) {
    // Remove all existing options except custom
    Array.from(alertSound.options).forEach((opt) => {
      if (opt.value !== 'custom') alertSound.removeChild(opt);
    });
    // Add only the three allowed options
    alertSound.insertAdjacentHTML(
      'afterbegin',
      `
      <option value="endgame">End Game</option>
      <option value="bell">Bell</option>
      <option value="towerbell">Tower Bell</option>
    `
    );
  }
});
