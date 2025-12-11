
import { showToast } from '../utils/toast.js';
import { showCallLoggingSettings } from './call-templates.js';

export function initializeSectionSettings() {
    document.addEventListener('click', (e) => {
        if (e.target.matches('.section-settings-btn') || e.target.closest('.section-settings-btn')) {
            const btn = e.target.closest('.section-settings-btn');
            const section = btn.closest('section');
            if (section) {
                const sectionId = section.id;
                openSectionSettings(sectionId);
            }
        }
    });
}

function openSectionSettings(sectionId) {
    if (sectionId === 'call-logging') {
        // For now, Call Logging settings = Template Manager
        // In the future, this could be a menu with "Manage Templates", "Customize Fields", etc.
        showCallLoggingSettings();
    } else {
        showToast(`Settings for ${sectionId} coming soon!`, 'info');
    }
}
