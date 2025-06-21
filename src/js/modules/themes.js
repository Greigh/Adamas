// Theme management functions
import { saveTheme, loadTheme } from './storage.js';

export function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Set initial toggle state
    const themeToggle = document.getElementById('dark-mode-toggle');
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'dark';
    }
    
    // Update theme indicator
    const themeIndicator = document.getElementById('current-theme');
    if (themeIndicator) {
        themeIndicator.textContent = savedTheme.charAt(0).toUpperCase() + savedTheme.slice(1);
    }
}

export function updateThemeIndicator(theme) {
    const indicator = document.getElementById('current-theme');
    if (indicator) {
        indicator.textContent = theme === 'dark' ? 'Dark' : 'Light';
    }
}

export function switchToLight() {
    document.documentElement.removeAttribute('data-theme');
    saveTheme('light');
    updateThemeIndicator('light');
    
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) toggle.checked = false;
}

export function switchToDark() {
    document.documentElement.setAttribute('data-theme', 'dark');
    saveTheme('dark');
    updateThemeIndicator('dark');
    
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) toggle.checked = true;
}

export function setupThemeToggle() {
    const themeToggle = document.getElementById('dark-mode-toggle');
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    // Set initial state
    if (themeToggle) {
        themeToggle.checked = currentTheme === 'dark';
        
        themeToggle.addEventListener('change', function() {
            const newTheme = this.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update theme indicator if it exists
            const themeIndicator = document.getElementById('current-theme');
            if (themeIndicator) {
                themeIndicator.textContent = newTheme.charAt(0).toUpperCase() + newTheme.slice(1);
            }
        });
    }
}