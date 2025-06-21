export class FloatingWindowManager {
    constructor() {
        this.floatingWindows = new Map();
    }
    
    floatSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section || this.floatingWindows.has(sectionId)) return;
        
        const floatingWindow = document.createElement('div');
        floatingWindow.className = 'floating-window';
        floatingWindow.id = `floating-${sectionId}`;
        
        const title = section.querySelector('h3')?.textContent || 'Section';
        
        floatingWindow.innerHTML = `
            <div class="floating-header">
                <h3>${title}</h3>
                <div class="floating-controls">
                    <button class="dock-btn" title="Dock">⧈</button>
                    <button class="close-btn" title="Close">×</button>
                </div>
            </div>
            <div class="floating-content"></div>
        `;
        
        // Clone the content and modify IDs to make them unique
        const content = section.querySelector('.section-content').cloneNode(true);
        
        // Update all IDs in the cloned content
        content.querySelectorAll('[id]').forEach(element => {
            const originalId = element.id;
            element.id = `floating-${sectionId}-${originalId}`;
            
            // Update any labels that reference this ID
            const labels = content.querySelectorAll(`label[for="${originalId}"]`);
            labels.forEach(label => {
                label.setAttribute('for', `floating-${sectionId}-${originalId}`);
            });
        });
        
        floatingWindow.querySelector('.floating-content').appendChild(content);
        
        document.body.appendChild(floatingWindow);
        this.floatingWindows.set(sectionId, floatingWindow);
        section.style.display = 'none';
        
        this.setupWindowControls(sectionId, floatingWindow);
        this.makeWindowDraggable(floatingWindow);
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
        
        dockBtn.addEventListener('click', () => this.dockSection(sectionId));
        closeBtn.addEventListener('click', () => this.dockSection(sectionId));
    }
    
    makeWindowDraggable(window) {
        const header = window.querySelector('.floating-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            initialX = e.clientX - window.offsetLeft;
            initialY = e.clientY - window.offsetTop;
        });
        
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