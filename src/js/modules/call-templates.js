// Call Templates Module
// Provides pre-filled forms for common call types

export const callTemplates = {
  'customer-support': {
    name: 'Customer Support',
    description: 'General customer support inquiry',
    fields: {
      callType: 'Support',
      priority: 'Medium',
      category: 'General Inquiry',
      initialNotes: 'Customer called regarding: ',
      followUpRequired: false
    }
  },
  'technical-issue': {
    name: 'Technical Issue',
    description: 'Customer reporting a technical problem',
    fields: {
      callType: 'Technical Support',
      priority: 'High',
      category: 'Technical Issue',
      initialNotes: 'Issue description: \n\nSteps to reproduce: \n\nError messages: ',
      followUpRequired: true
    }
  },
  'billing-inquiry': {
    name: 'Billing Inquiry',
    description: 'Questions about billing or charges',
    fields: {
      callType: 'Billing',
      priority: 'Medium',
      category: 'Billing Question',
      initialNotes: 'Billing inquiry regarding: ',
      followUpRequired: false
    }
  },
  'complaint': {
    name: 'Customer Complaint',
    description: 'Customer expressing dissatisfaction',
    fields: {
      callType: 'Complaint',
      priority: 'High',
      category: 'Customer Complaint',
      initialNotes: 'Complaint details: \n\nCustomer expectations: \n\nResolution offered: ',
      followUpRequired: true
    }
  },
  'sales-inquiry': {
    name: 'Sales Inquiry',
    description: 'Potential customer interested in products/services',
    fields: {
      callType: 'Sales',
      priority: 'Medium',
      category: 'Sales Lead',
      initialNotes: 'Products/services of interest: \n\nBudget/timeline: \n\nCurrent provider: ',
      followUpRequired: true
    }
  },
  'account-setup': {
    name: 'Account Setup',
    description: 'New customer account creation/setup',
    fields: {
      callType: 'Account Management',
      priority: 'Medium',
      category: 'New Account',
      initialNotes: 'Account setup for: \n\nRequired information collected: \n\nSetup steps completed: ',
      followUpRequired: true
    }
  }
};

export function initializeCallTemplates() {
  // Create templates section in call logging
  createTemplatesUI();
}

function createTemplatesUI() {
  const callLoggingSection = document.getElementById('call-logging');
  if (!callLoggingSection) return;

  // Add templates selector to the call logging section
  const existingForm = callLoggingSection.querySelector('.call-log-form');
  if (!existingForm) return;

  const templatesContainer = document.createElement('div');
  templatesContainer.className = 'call-templates-container';
  templatesContainer.innerHTML = `
    <div class="templates-header">
      <label for="call-template-select">Call Template:</label>
      <select id="call-template-select" class="template-select">
        <option value="">Select a template...</option>
        ${Object.entries(callTemplates).map(([key, template]) =>
          `<option value="${key}">${template.name}</option>`
        ).join('')}
      </select>
      <button id="apply-template-btn" class="btn btn-secondary apply-template-btn" disabled>Apply Template</button>
    </div>
    <div id="template-preview" class="template-preview" style="display: none;">
      <h4>Template Preview</h4>
      <div id="template-description"></div>
    </div>
  `;

  // Insert before the form
  existingForm.parentNode.insertBefore(templatesContainer, existingForm);

  // Set up event listeners
  setupTemplateListeners();
}

function setupTemplateListeners() {
  const templateSelect = document.getElementById('call-template-select');
  const applyBtn = document.getElementById('apply-template-btn');
  const preview = document.getElementById('template-preview');
  const description = document.getElementById('template-description');

  if (templateSelect) {
    templateSelect.addEventListener('change', (e) => {
      const selectedTemplate = e.target.value;
      if (selectedTemplate && callTemplates[selectedTemplate]) {
        const template = callTemplates[selectedTemplate];
        applyBtn.disabled = false;

        // Show preview
        if (preview && description) {
          description.textContent = template.description;
          preview.style.display = 'block';
        }
      } else {
        applyBtn.disabled = true;
        if (preview) preview.style.display = 'none';
      }
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const selectedTemplate = templateSelect.value;
      if (selectedTemplate && callTemplates[selectedTemplate]) {
        applyCallTemplate(callTemplates[selectedTemplate]);
        showToast(`Applied "${callTemplates[selectedTemplate].name}" template`, 'success');
      }
    });
  }
}

function applyCallTemplate(template) {
  // Apply template fields to the call logging form
  const form = document.querySelector('.call-log-form');
  if (!form) return;

  // Map template fields to form inputs
  const fieldMappings = {
    callType: '#call-type, [name="call-type"]',
    priority: '#call-priority, [name="priority"]',
    category: '#call-category, [name="category"]',
    initialNotes: '#call-notes, #initial-notes, textarea[name="notes"]',
    followUpRequired: '#follow-up-required, [name="follow-up"]'
  };

  Object.entries(template.fields).forEach(([fieldName, value]) => {
    const selectors = fieldMappings[fieldName];
    if (selectors) {
      const element = form.querySelector(selectors);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = value;
        } else {
          element.value = value;
        }
        // Trigger change event for any listeners
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });

  // Focus on the notes field for immediate editing
  const notesField = form.querySelector('#call-notes, #initial-notes, textarea[name="notes"]');
  if (notesField) {
    setTimeout(() => {
      notesField.focus();
      // Position cursor at the end
      notesField.setSelectionRange(notesField.value.length, notesField.value.length);
    }, 100);
  }
}

// Function to get available templates
export function getCallTemplates() {
  return callTemplates;
}

// Function to add custom template (for future expansion)
export function addCustomTemplate(key, template) {
  callTemplates[key] = template;
  // Re-render templates UI if it exists
  const templateSelect = document.getElementById('call-template-select');
  if (templateSelect) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = template.name;
    templateSelect.appendChild(option);
  }
}

// Import showToast for notifications
import { showToast } from '../utils/toast.js';