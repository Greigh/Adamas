import '../styles/main.scss';

// Import synchronous dependencies
import { initializeSettings, appSettings } from './modules/settings.js';
import { initializeTheme, setupThemeToggle } from './modules/themes.js';
import { setupTimerEventListeners } from './modules/timer.js';
import * as patternsModule from './modules/patterns.js';
import { setupCallFlowEventListeners } from './modules/callflow.js';
import { setupNotesEventListeners } from './modules/notes.js';
import { setupSettingsEventListeners } from './modules/settings.js';
import {
  minimizeSection,
  popOutSection,
  closeFloatingWindow,
  minimizeFloatingWindow,
  openSectionInFloatingWindow,
  openSectionInBrowserPopup,
} from './modules/draggable.js';
import { initFloating, getFloatingManager } from './modules/floating.js';
import { setupKeyboardShortcuts } from './utils/keyboard-shortcuts.js';

// Tab navigation functions
function openNotesTab() {
  document.querySelectorAll('.tab-content').forEach((tab) => {
    tab.style.display = 'none';
  });
  document.getElementById('notes').style.display = 'block';
  document.querySelectorAll('.tab-link').forEach((link) => {
    link.classList.remove('active');
  });
  document.querySelector('[data-section="notes"]').classList.add('active');
}

function openTimerTab() {
  document.querySelectorAll('.tab-content').forEach((tab) => {
    tab.style.display = 'none';
  });
  document.getElementById('hold-timer').style.display = 'block';
  document.querySelectorAll('.tab-link').forEach((link) => {
    link.classList.remove('active');
  });
  document.querySelector('[data-section="timer"]').classList.add('active');
}

// Expose tab functions globally for backward compatibility
window.openNotesTab = openNotesTab;
window.openTimerTab = openTimerTab;

// Expose floating window helpers for inline handlers / popups
window.closeFloatingWindow = closeFloatingWindow;
window.minimizeFloatingWindow = minimizeFloatingWindow;
window.openSectionInFloatingWindow = openSectionInFloatingWindow;
window.openSectionInBrowserPopup = openSectionInBrowserPopup;

// Check if element is in viewport
function isElementInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.bottom >= 0 &&
    rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
    rect.right >= 0
  );
}

// Lazy load modules when element is visible
function lazyLoadOnVisible(elementId, loadCallback) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // If element is already visible, load immediately
  if (isElementInViewport(element)) {
    try {
      loadCallback();
    } catch (err) {
      console.error(`Error loading module for element ${elementId}:`, err);
    }
    return;
  }

  // Otherwise, set up intersection observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          try {
            loadCallback();
          } catch (err) {
            console.error(
              `Error loading module for element ${elementId}:`,
              err
            );
          }
          observer.disconnect();
        }
      });
    },
    { threshold: 0.1 }
  );

  observer.observe(element);
}

// Handle resize events for responsive layout
function handleResize() {
  const width = window.innerWidth;
  document.body.classList.toggle('small-screen', width < 768);
  document.body.classList.toggle('medium-screen', width >= 768 && width < 1024);
  document.body.classList.toggle('large-screen', width >= 1024);
}

// Show the main app content
function showMainApp() {
  document.getElementById('main-app').classList.remove('hidden');
  document.getElementById('settings-view').classList.add('hidden');
  document.getElementById('main-tab')?.classList.add('active');
  document.getElementById('settings-tab')?.classList.remove('active');
}

// Show settings panel
function showSettings() {
  document.getElementById('main-app').classList.add('hidden');
  document.getElementById('settings-view').classList.remove('hidden');
  document.getElementById('main-tab')?.classList.remove('active');
  document.getElementById('settings-tab')?.classList.add('active');
}

// Show service worker update notification
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="update-notification-content">
      <div class="update-notification-icon">🔄</div>
      <div class="update-notification-text">
        <div class="update-notification-title">Update Available</div>
        <div class="update-notification-message">A new version of the app is available.</div>
      </div>
      <div class="update-notification-actions">
        <button class="update-btn update-refresh">Refresh</button>
        <button class="update-btn update-dismiss">Later</button>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Add event listeners
  notification.querySelector('.update-refresh').addEventListener('click', () => {
    window.location.reload();
  });

  notification.querySelector('.update-dismiss').addEventListener('click', () => {
    notification.remove();
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}

// Secondary modules loading (lazy-loaded)
function loadSecondaryModules() {
  // Timer functionality
  lazyLoadOnVisible('hold-timer', () => {
    import('./modules/timer.js')
      .then((module) => {
        module.initializeTimer();
        module.setupTimerEventListeners();
        module.initializeMultipleTimers();
      })
      .catch((err) => {
        console.error('Error loading timer module:', err);
      });
  });

  // Patterns functionality
  lazyLoadOnVisible('pattern-formatter', () => {
    import('./modules/patterns.js')
      .then((module) => {
        module.initializePatterns();
        module.setupPatternEventListeners();
      })
      .catch((err) => {
        console.error('Error loading patterns module:', err);
      });
  });

  // Call flow functionality
  lazyLoadOnVisible('call-flow-builder', () => {
    import('./modules/callflow.js')
      .then((module) => {
        module.initializeCallFlow();
        module.setupCallFlowEventListeners();
      })
      .catch((err) => {
        console.error('Error loading callflow module:', err);
      });
  });

  // Notes functionality
  lazyLoadOnVisible('notes', () => {
    import('./modules/notes.js')
      .then((module) => {
        module.initializeNotes();
        module.setupNotesEventListeners();
      })
      .catch((err) => {
        console.error('Error loading notes module:', err);
      });
  });

  // Initialize audio system on first user interaction
  document.addEventListener(
    'click',
    () => {
      if (!window.audioInitialized) {
        import('./utils/audio.js')
          .then((module) => {
            module.initAudio();
            window.audioInitialized = true;
          })
          .catch((err) => {
            console.error('Error loading audio module:', err);
          });
      }
    },
    { once: true }
  );
}

// Ensure floating overlay exists for floating windows
if (!document.getElementById('floating-overlay')) {
  const overlay = document.createElement('div');
  overlay.id = 'floating-overlay';
  overlay.className = 'floating-overlay';
  document.body.appendChild(overlay);
}

function setupAllEventListeners() {
  // Main navigation
  document.getElementById('main-tab')?.addEventListener('click', showMainApp);
  document
    .getElementById('settings-tab')
    ?.addEventListener('click', showSettings);

  // Event delegation for section controls (minimize, float, etc.)
  const container = document.querySelector('.container');
  if (container) {
    container.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const section = button.closest('.draggable-section');
      if (!section) return;

      if (button.classList.contains('minimize-btn')) {
        minimizeSection(section.id);
      } else if (button.classList.contains('float-btn')) {
        // Always open in a browser popup when the popout/float button is clicked
        popOutSection(section.id, true);
      }
      // Add handling for edit-title-btn if needed
      else if (button.classList.contains('edit-title-btn')) {
        const titleContainer = button.closest('.title-container');
        if (!titleContainer) return;
        const titleElem = titleContainer.querySelector('.section-title');
        if (!titleElem) return;
        // Prevent multiple inputs
        if (titleContainer.querySelector('.title-input')) return;
        const currentTitle = titleElem.textContent;
        // Create input
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentTitle;
        input.className = 'title-input';
        input.style.marginLeft = '0.5rem';
        input.style.fontSize = '1.1em';
        input.style.fontWeight = '600';
        input.style.width = Math.max(120, currentTitle.length * 12) + 'px';
        titleElem.style.display = 'none';
        button.style.display = 'none';
        titleContainer.appendChild(input);
        input.focus();
        input.select();
        // Save on blur or Enter
        function saveTitle() {
          const newTitle = input.value.trim() || currentTitle;
          titleElem.textContent = newTitle;
          titleElem.style.display = '';
          button.style.display = '';
          input.remove();
        }
        input.addEventListener('blur', saveTitle);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            saveTitle();
          } else if (e.key === 'Escape') {
            input.value = currentTitle;
            saveTitle();
          }
        });
      }
    });
  }

  // Only setup listeners for components that are NOT lazy-loaded
  setupSettingsEventListeners(); // This will handle settings page events
}

// Main initialization function
document.addEventListener('DOMContentLoaded', function () {
  try {
    initializeSettings();
    window.appSettings = appSettings;
    initializeTheme();
    setupThemeToggle();

    // Set up all event listeners for the application
    setupAllEventListeners();

    // Initialize keyboard shortcuts
    setupKeyboardShortcuts();

    // Initialize the enhanced floating system
    initFloating();
    
    // Make floating manager globally available
    window.floatingManager = getFloatingManager();

    // Ensure patterns module is available and wired (eagerly attach listeners)
    try {
      if (patternsModule && typeof patternsModule.setupPatternEventListeners === 'function') {
        patternsModule.setupPatternEventListeners();
        window.patternsModule = patternsModule;
      }
    } catch (e) {
      console.error('Error initializing patterns module eagerly:', e);
    }
    // If floating clones are created dynamically, the opener will dispatch
    // a `floating:created` CustomEvent with detail.root = cloned root.
    // Ensure any loaded patternsModule attaches to those clones.
    try {
      document.addEventListener('floating:created', (ev) => {
        try {
          const root = ev && ev.detail && ev.detail.root;
          if (!root) return;
          if (window.patternsModule && typeof window.patternsModule.attachPatternEventListeners === 'function') {
            window.patternsModule.attachPatternEventListeners(root);
            try { root.setAttribute && root.setAttribute('data-patterns-attached', 'true'); } catch (e) {}
          }
        } catch (err) {
          console.error('Error handling floating:created event:', err);
        }
      });
    } catch (err) {
      console.error('Error registering floating:created listener:', err);
    }

    // Set initial UI state
    showMainApp();

    // Start lazy loading of other modules
    setTimeout(loadSecondaryModules, 100);

    // Set up resize handler for responsive behavior
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial responsive state

    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  showUpdateNotification();
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Show "app ready" indication if needed
    document.body.classList.add('app-ready');
  } catch (error) {
    console.error('Error initializing application:', error);
  }
});
