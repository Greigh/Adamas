// Draggable sections and floating windows module
import { appSettings } from './settings.js';

export let draggedElement = null;
export let floatingWindows = new Map();

export function minimizeSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const btn = section.querySelector('.minimize-btn');
    
    section.classList.toggle('minimized');
    
    if (section.classList.contains('minimized')) {
        btn.textContent = '+';
        btn.title = 'Restore';
    } else {
        btn.textContent = '−';
        btn.title = 'Minimize';
    }
}

export function popOutSection(sectionId, enablePopupWindows = false) {
    if (enablePopupWindows) {
        openSectionInBrowserPopup(sectionId);
    } else {
        openSectionInFloatingWindow(sectionId);
    }
}

export function closeFloatingWindow(sectionId) {
    const floatingWindow = floatingWindows.get(sectionId);
    const section = document.getElementById(sectionId);
    
    if (floatingWindow) {
        if (floatingWindow.close) {
            floatingWindow.close(); // Browser popup
        } else {
            floatingWindow.remove(); // Floating div
        }
        floatingWindows.delete(sectionId);
    }
    
    if (section) {
        // Show original section
        section.style.display = '';
        
        // Reset pop-out button
        const popBtn = section.querySelector('.popup-btn');
        if (popBtn) {
            popBtn.textContent = '⧉';
            popBtn.title = 'Pop Out';
        }
    }
}

export function minimizeFloatingWindow(sectionId) {
    const floatingWindow = floatingWindows.get(sectionId);
    if (!floatingWindow || floatingWindow.close) return; // Skip if browser popup
    
    const content = floatingWindow.querySelector('.floating-content');
    const btn = floatingWindow.querySelector('.floating-controls button[title="Minimize"]');
    
    if (content && btn) {
        if (content.style.display === 'none') {
            // Restore
            content.style.display = '';
            btn.textContent = '−';
            btn.title = 'Minimize';
            floatingWindow.style.height = 'auto';
        } else {
            // Minimize
            content.style.display = 'none';
            btn.textContent = '+';
            btn.title = 'Restore';
            floatingWindow.style.height = '40px';
        }
    }
}

// Update initDragAndDrop function
export function initDragAndDrop() {
    const container = document.querySelector('.sortable-container');
    if (!container) return;
    
    const draggableSections = document.querySelectorAll('.draggable-section');
    
    draggableSections.forEach(section => {
        const dragHandle = section.querySelector('.drag-handle');
        if (!dragHandle) return;
        
        dragHandle.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Left click only
            
            draggedElement = section;
            section.classList.add('dragging');
            
            const rect = section.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            // Store initial position
            const initialX = e.clientX - rect.left;
            const initialY = e.clientY - rect.top;
            
            function onMouseMove(e) {
                if (!draggedElement) return;
                
                if (appSettings.layoutMode === 'free') {
                    // Free movement mode
                    let newX = e.clientX - containerRect.left - initialX;
                    let newY = e.clientY - containerRect.top - initialY;
                    
                    // Keep within container bounds
                    newX = Math.max(0, Math.min(newX, containerRect.width - section.offsetWidth));
                    newY = Math.max(0, Math.min(newY, containerRect.height - section.offsetHeight));
                    
                    section.style.position = 'absolute';
                    section.style.left = `${newX}px`;
                    section.style.top = `${newY}px`;
                    
                } else {
                    // Grid mode - find nearest grid position
                    const mouseY = e.clientY - containerRect.top;
                    let nextElement = null;
                    
                    draggableSections.forEach(child => {
                        if (child !== draggedElement) {
                            const box = child.getBoundingClientRect();
                            const childCenter = box.top + box.height / 2;
                            
                            if (mouseY < childCenter) {
                                if (!nextElement || nextElement.getBoundingClientRect().top > box.top) {
                                    nextElement = child;
                                }
                            }
                        }
                    });
                    
                    if (nextElement) {
                        container.insertBefore(draggedElement, nextElement);
                    } else {
                        container.appendChild(draggedElement);
                    }
                }
            }
            
            function onMouseUp() {
                if (draggedElement) {
                    draggedElement.classList.remove('dragging');
                    draggedElement = null;
                }
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            
            e.preventDefault(); // Prevent text selection
        });
    });
}

function makeFloatingWindowDraggable(windowElement) {
    const header = windowElement.querySelector('.floating-header');
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = windowElement.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', onDragEnd);
        e.preventDefault();
    });
    
    function onDrag(e) {
        if (!isDragging) return;
        
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        
        windowElement.style.left = Math.max(0, x) + 'px';
        windowElement.style.top = Math.max(0, y) + 'px';
    }
    
    function onDragEnd() {
        isDragging = false;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', onDragEnd);
    }
}

function openSectionInFloatingWindow(sectionId) {
    const section = document.getElementById(sectionId);
    const overlay = document.getElementById('floating-overlay');
    
    if (floatingWindows.has(sectionId)) {
        closeFloatingWindow(sectionId);
        return;
    }
    
    // Hide original section
    section.style.display = 'none';
    
    // Create floating window
    const floatingWindow = document.createElement('div');
    floatingWindow.className = 'floating-window';
    floatingWindow.style.left = '100px';
    floatingWindow.style.top = '100px';
    floatingWindow.style.width = '500px';
    
    // Get the correct section title from the section-title element
    const titleElement = section.querySelector('.section-title');
    const sectionTitle = titleElement ? titleElement.textContent : 'Section';
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
        
        // Update name attributes to match IDs to help with autofill
        if (element.hasAttribute('name')) {
            element.setAttribute('name', `floating-${sectionId}-${element.getAttribute('name')}`);
        }
    });
    
    floatingWindow.innerHTML = `
        <div class="floating-header">
            <h3>${sectionTitle}</h3>
            <div class="floating-controls">
                <button onclick="window.minimizeFloatingWindow('${sectionId}')" title="Minimize">−</button>
                <button onclick="window.closeFloatingWindow('${sectionId}')" class="close-btn" title="Close">×</button>
            </div>
        </div>
        <div class="floating-content"></div>
    `;
    
    floatingWindow.querySelector('.floating-content').appendChild(content);
    overlay.appendChild(floatingWindow);
    
    // Make floating window draggable
    makeFloatingWindowDraggable(floatingWindow);
    
    // Store reference
    floatingWindows.set(sectionId, floatingWindow);
    
    // Update pop-out button
    const popBtn = section.querySelector('.popup-btn');
    if (popBtn) {
        popBtn.textContent = '⧈';
        popBtn.title = 'Dock';
    }
}

function openSectionInBrowserPopup(sectionId) {
    const section = document.getElementById(sectionId);
    
    if (floatingWindows.has(sectionId)) {
        // Close existing popup
        const existingWindow = floatingWindows.get(sectionId);
        if (existingWindow && !existingWindow.closed) {
            existingWindow.close();
        }
        floatingWindows.delete(sectionId);
        section.style.display = '';
        
        // Reset pop-out button
        const popBtn = section.querySelector('.popup-btn');
        if (popBtn) {
            popBtn.textContent = '⧉';
            popBtn.title = 'Pop Out';
        }
        return;
    }
    
    // Hide original section
    section.style.display = 'none';
    
    // Get the correct section title from the section-title element
    const titleElement = section.querySelector('.section-title');
    const sectionTitle = titleElement ? titleElement.textContent : 'Section';
    // Modify content before putting it in the popup to make IDs unique
    const sectionContent = section.querySelector('.section-content').innerHTML;
    
    // Replace form IDs with popup-specific ones
    let modifiedContent = sectionContent.replace(/id="([^"]+)"/g, (match, id) => {
        return `id="popup-${sectionId}-${id}"`;
    });
    
    // Fix references to those IDs (like labels)
    modifiedContent = modifiedContent.replace(/for="([^"]+)"/g, (match, id) => {
        return `for="popup-${sectionId}-${id}"`;
    });
    
    // Create popup window HTML
    const popupHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${sectionTitle} - Call Center Helper</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #f7f9fa;
                    margin: 0;
                    padding: 20px;
                    color: #222;
                }
                
                .section-content {
                    background: #fff;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                h1 {
                    color: #1976d2;
                    margin-top: 0;
                    text-align: center;
                    border-bottom: 2px solid #e3f2fd;
                    padding-bottom: 10px;
                }
                
                .button, button {
                    background: linear-gradient(90deg, #3498db 60%, #1976d2 100%);
                    color: #fff;
                    border: none;
                    border-radius: 5px;
                    padding: 9px 20px;
                    font-size: 1em;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.18s;
                }
                
                .button:hover, button:hover {
                    background: linear-gradient(90deg, #1976d2 60%, #3498db 100%);
                }
                
                /* Add styles for form elements */
                input, textarea, select {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin-bottom: 10px;
                    box-sizing: border-box;
                }
                
                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                }
            </style>
        </head>
        <body>
            <h1>${sectionTitle}</h1>
            <div class="section-content">
                ${modifiedContent}
            </div>
            
            <script>
                // Create proxy functions to communicate with parent window
                window.toggleStep = function(index) {
                    window.opener.toggleStep(index);
                };
                
                window.clearCheckmarks = function() {
                    window.opener.clearCheckmarks();
                };
                
                // Add other function proxies as needed
                
                // Fix any event handlers that were broken by ID changes
                document.addEventListener('DOMContentLoaded', function() {
                    // Re-attach event handlers for elements with modified IDs
                    const buttons = document.querySelectorAll('button[id^="popup-"]');
                    buttons.forEach(btn => {
                        if (btn.id.includes('add-note-btn')) {
                            btn.addEventListener('click', function() {
                                const textareaId = btn.id.replace('add-note-btn', 'notes-input');
                                const textarea = document.getElementById(textareaId);
                                if (textarea && textarea.value.trim()) {
                                    // Implement functionality directly or call back to parent
                                    window.opener.addNote(textarea.value.trim(), '${sectionId}');
                                    textarea.value = '';
                                }
                            });
                        }
                        
                        // Add more handlers as needed
                    });
                });
            </script>
        </body>
        </html>
    `;
    
    // Open popup window
    const features = [
        'width=600',
        'height=400',
        'scrollbars=yes',
        'resizable=yes',
        'location=no',
        'menubar=no',
        'toolbar=no',
        'status=no'
    ];
    
    const popup = window.open('', `${sectionId}-popup`, features.join(','));
    popup.document.write(popupHTML);
    popup.document.close();
    
    // Store reference
    floatingWindows.set(sectionId, popup);
    
    // Update pop-out button
    const popBtn = section.querySelector('.popup-btn');
    if (popBtn) {
        popBtn.textContent = '⧈';
        popBtn.title = 'Close Popup';
    }
    
    // Listen for popup closing
    const checkClosed = setInterval(() => {
        if (popup.closed) {
            clearInterval(checkClosed);
            floatingWindows.delete(sectionId);
            section.style.display = '';
            
            const popBtn = section.querySelector('.popup-btn');
            if (popBtn) {
                popBtn.textContent = '⧉';
                popBtn.title = 'Pop Out';
            }
        }
    }, 1000);
}

// Export these functions so they can be imported elsewhere
export { openSectionInFloatingWindow, openSectionInBrowserPopup };

// Add these utility functions to set up dragging for dynamic elements

// Set up draggable functionality for a single section
export function setupDraggable(section) {
    if (!section) return;
    
    const handle = section.querySelector('.drag-handle');
    if (!handle) return;
    
    let isDragging = false;
    let initialX, initialY, initialTop, initialLeft;
    
    handle.addEventListener('mousedown', function (e) {
        // Only process if left button is pressed
        if (e.button !== 0) return;
        
        e.preventDefault();
        
        // Start drag
        isDragging = true;
        initialX = e.clientX;
        initialY = e.clientY;
        
        // Get current position
        const rect = section.getBoundingClientRect();
        initialTop = rect.top;
        initialLeft = rect.left;
        
        // Add dragging class
        section.classList.add('dragging');
        
        // Create global event listeners
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
    
    function onMouseMove(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - initialX;
        const deltaY = e.clientY - initialY;
        
        section.style.position = 'absolute';
        section.style.top = `${initialTop + deltaY}px`;
        section.style.left = `${initialLeft + deltaX}px`;
    }
    
    function onMouseUp() {
        isDragging = false;
        section.classList.remove('dragging');
        
        // Remove event listeners
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}

// Set up floating functionality for a single section
export function setupFloating(section) {
    if (!section) return;
    
    const floatBtn = section.querySelector('.float-btn');
    if (!floatBtn) return;
    
    floatBtn.addEventListener('click', function() {
        const sectionId = section.id;
        
        // Check if we're using the browser popup approach
        if (window.config && window.config.useBrowserPopup) {
            window.openSectionInBrowserPopup(sectionId);
        } else {
            window.openSectionInFloatingWindow(sectionId);
        }
    });
}

// Set up section toggle (minimize/maximize)
export function setupSectionToggle(section) {
    if (!section) return;
    
    const minBtn = section.querySelector('.minimize-btn');
    if (!minBtn) return;
    
    minBtn.addEventListener('click', function() {
        const content = section.querySelector('.section-content');
        if (!content) return;
        
        if (content.style.display === 'none') {
            content.style.display = '';
            minBtn.textContent = '−';
            minBtn.title = 'Minimize';
        } else {
            content.style.display = 'none';
            minBtn.textContent = '+';
            minBtn.title = 'Maximize';
        }
    });
}

// Initialize draggable sections
initDragAndDrop();