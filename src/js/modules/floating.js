export class FloatingWindowManager {
    constructor() {
        this.floatingWindows = new Map();
    }
    
    floatSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section || this.floatingWindows.has(sectionId)) return;
        
        // Clone the entire section to preserve exact structure and styles
        const clonedSection = section.cloneNode(true);
        // Give the clone a unique id and add floating-window modifier class
        clonedSection.id = `floating-${sectionId}`;
        clonedSection.classList.add('floating-window');

        // Remove any float button inside the clone (we'll add explicit controls)
        const existingFloatBtn = clonedSection.querySelector('.float-btn');
        if (existingFloatBtn && existingFloatBtn.parentNode) existingFloatBtn.parentNode.removeChild(existingFloatBtn);

        // Add floating controls into the cloned section's .section-controls area (if present)
        const controlsArea = clonedSection.querySelector('.section-controls') || clonedSection.querySelector('.floating-controls');
        if (controlsArea) {
            // append dock/minimize/close buttons (avoid duplicating if already present)
            const addBtn = (cls, title, text) => {
                if (!controlsArea.querySelector(`.${cls}`)) {
                    const b = document.createElement('button');
                    b.className = cls;
                    b.title = title;
                    b.textContent = text;
                    controlsArea.appendChild(b);
                }
            };
            addBtn('dock-btn', 'Dock', '⧈');
            addBtn('minimize-btn', 'Minimize', '−');
            addBtn('close-btn', 'Close Popup', '×');
        }

        // Update all IDs in the cloned section to avoid collisions
        clonedSection.querySelectorAll('[id]').forEach(element => {
            const originalId = element.id;
            const newId = `floating-${sectionId}-${originalId}`;
            element.id = newId;

            // Update labels within the clone that reference this ID
            const labels = clonedSection.querySelectorAll(`label[for="${originalId}"]`);
            labels.forEach(label => {
                label.setAttribute('for', newId);
            });

            // Also update name attributes when present
            if (element.hasAttribute('name')) {
                element.setAttribute('name', `floating-${sectionId}-${element.getAttribute('name')}`);
            }
        });

        // Append the cloned section to the body as the floating window
        document.body.appendChild(clonedSection);

        // If the cloned content contains pattern formatter controls, attach their listeners
        try {
            if (window.patternsModule && typeof window.patternsModule.attachPatternEventListeners === 'function') {
                window.patternsModule.attachPatternEventListeners(clonedSection);
            } else {
                // dynamic import; if unsupported the promise will reject and we ignore
                import('./patterns.js')
                    .then((m) => {
                        if (m && typeof m.attachPatternEventListeners === 'function') {
                            m.attachPatternEventListeners(clonedSection);
                            window.patternsModule = m;
                        }
                    })
                    .catch(() => {});
            }
        } catch (e) {
            // ignore any runtime errors
        }

        // Mark formatter floats so they receive targeted styles
        if (sectionId === 'pattern-formatter' || section.dataset?.section === 'formatter') {
            clonedSection.classList.add('pattern-popup');
        }

        // Register the cloned section as the floating window and hide the original
        this.floatingWindows.set(sectionId, clonedSection);
        section.style.display = 'none';

        this.setupWindowControls(sectionId, clonedSection);
        this.makeWindowDraggable(clonedSection);
    }
    
    dockSection(sectionId) {
        const floatingWindow = this.floatingWindows.get(sectionId);
        if (!floatingWindow) return;
        
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = '';
        }
        
        floatingWindow.remove();
        this.floatingWindows.delete(sectionId);
    }
    
    setupWindowControls(sectionId, window) {
        const dockBtn = window.querySelector('.dock-btn');
        const closeBtn = window.querySelector('.close-btn');
        const minimizeBtn = window.querySelector('.minimize-btn');

        if (dockBtn) {
            dockBtn.addEventListener('click', () => this.dockSection(sectionId));
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.dockSection(sectionId));
        }
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                const fw = this.floatingWindows.get(sectionId);
                if (!fw) return;
                if (fw.classList.contains('minimized')) {
                    fw.classList.remove('minimized');
                    const content = fw.querySelector('.floating-content');
                    if (content) content.style.display = '';
                    minimizeBtn.textContent = '−';
                    minimizeBtn.title = 'Minimize';
                } else {
                    fw.classList.add('minimized');
                    const content = fw.querySelector('.floating-content');
                    if (content) content.style.display = 'none';
                    minimizeBtn.textContent = '+';
                    minimizeBtn.title = 'Restore';
                }
            });
        }
    }
    
    makeWindowDraggable(window) {
    const header = window.querySelector('.section-header') || window.querySelector('.floating-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        
        if (header) {
            header.addEventListener('mousedown', (e) => {
                isDragging = true;
                initialX = e.clientX - window.offsetLeft;
                initialY = e.clientY - window.offsetTop;
            });
        }
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            window.style.left = `${currentX}px`;
            window.style.top = `${currentY}px`;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
}

// Instead of importing from main.js, use window global objects
export function setupAllFloating() {
    document.querySelectorAll('.float-btn').forEach(btn => {
        // Skip if already set up
        if (btn.hasAttribute('data-float-setup')) return;
        
        btn.setAttribute('data-float-setup', 'true');
        
        btn.addEventListener('click', function() {
            const section = btn.closest('.draggable-section');
            if (!section) return;
            
            const sectionId = section.id;
            
            // Use window globals instead of imported functions
            if (window.openSectionInBrowserPopup) {
                window.openSectionInBrowserPopup(sectionId);
            } else if (window.openSectionInFloatingWindow) {
                window.openSectionInFloatingWindow(sectionId);
            }
        });
    });
}

// Update your initialization code to periodically check for new sections
function initFloating() {
    setupAllFloating();
    
    // Periodically check for new floating buttons
    setInterval(setupAllFloating, 2000);
}