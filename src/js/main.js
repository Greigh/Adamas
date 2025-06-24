import '../styles/main.scss';

// Import synchronous dependencies
import { initializeSettings, appSettings } from './modules/settings.js';
import { initializeTheme, setupThemeToggle } from './modules/themes.js';
import { setupTimerEventListeners } from './modules/timer.js';
import { setupPatternEventListeners } from './modules/patterns.js';
import { setupCallFlowEventListeners } from './modules/callflow.js';
import { setupNotesEventListeners } from './modules/notes.js';
import { setupSettingsEventListeners } from './modules/settings.js';
import { minimizeSection, popOutSection } from './modules/draggable.js';

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
  document.getElementById('main-app').style.display = '';
  document.getElementById('settings-view').style.display = 'none';
  document.getElementById('main-tab')?.classList.add('active');
  document.getElementById('settings-tab')?.classList.remove('active');
}

// Show settings panel
function showSettings() {
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('settings-view').style.display = '';
  document.getElementById('main-tab')?.classList.remove('active');
  document.getElementById('settings-tab')?.classList.add('active');
}

// Secondary modules loading (lazy-loaded)
function loadSecondaryModules() {
  // Timer functionality
  lazyLoadOnVisible('hold-timer', () => {
    import('./modules/timer.js')
      .then((module) => {
        module.initializeTimer();
        module.setupTimerEventListeners();
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
        popOutSection(section.id, appSettings.enablePopupWindows);
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

    // Set initial UI state
    showMainApp();

    // Start lazy loading of other modules
    setTimeout(loadSecondaryModules, 100);

    // Set up resize handler for responsive behavior
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial responsive state

    // Show "app ready" indication if needed
    document.body.classList.add('app-ready');
  } catch (error) {
    console.error('Error initializing application:', error);
  }
});
