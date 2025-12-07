// Script Library Module
export function initializeScripts() {
  const categories = document.querySelectorAll('.script-category');
  const scriptList = document.getElementById('script-list');
  const scriptContent = document.getElementById('script-content');
  const saveScriptBtn = document.getElementById('save-script');
  const cancelScriptBtn = document.getElementById('cancel-script');
  const searchInput = document.getElementById('script-search');
  const editorBtns = document.querySelectorAll('.editor-btn');

  // Check if required elements exist
  if (categories.length === 0 || !scriptList || !scriptContent || !saveScriptBtn ||
      !cancelScriptBtn || !searchInput || editorBtns.length === 0) {
    return;
  }

  let scripts = JSON.parse(localStorage.getItem('scripts')) || getDefaultScripts();
  let currentCategory = 'all';
  let currentScript = null;
  let searchTerm = '';

  function getDefaultScripts() {
    return {
      sales: [
        {
          id: 1,
          title: 'New Customer Greeting',
          content: 'Hello! Thank you for calling [Company]. This is [Your Name] from our sales team. How can I help you find the perfect solution today?',
          category: 'sales',
          favorite: false,
          usage: 0,
          lastUsed: null
        },
        {
          id: 2,
          title: 'Product Recommendation',
          content: 'Based on what you\'ve told me, I recommend our [Product] package. It includes [features] and is priced at [price]. Would you like to proceed with this?',
          category: 'sales',
          favorite: false,
          usage: 0,
          lastUsed: null
        }
      ],
      support: [
        {
          id: 3,
          title: 'Technical Issue Troubleshooting',
          content: 'I understand you\'re experiencing [issue]. Let me guide you through some troubleshooting steps. First, can you tell me what error message you\'re seeing?',
          category: 'support',
          favorite: false,
          usage: 0,
          lastUsed: null
        },
        {
          id: 4,
          title: 'Account Verification',
          content: 'For security purposes, may I have the last four digits of the phone number on file or the account holder\'s name?',
          category: 'support',
          favorite: false,
          usage: 0,
          lastUsed: null
        }
      ],
      complaints: [
        {
          id: 5,
          title: 'Complaint Acknowledgment',
          content: 'I\'m sorry to hear you\'re experiencing this issue. I completely understand your frustration, and I want to make this right. Let me [action] for you.',
          category: 'complaints',
          favorite: false,
          usage: 0,
          lastUsed: null
        }
      ]
    };
  }

  function updateScriptList() {
    scriptList.innerHTML = '';

    let allScripts = [];
    Object.keys(scripts).forEach(category => {
      scripts[category].forEach(script => {
        allScripts.push({ ...script, category });
      });
    });

    // Filter by category
    if (currentCategory !== 'all') {
      allScripts = allScripts.filter(script => script.category === currentCategory);
    }

    // Filter by search term
    if (searchTerm) {
      allScripts = allScripts.filter(script =>
        script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        script.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by favorites first, then by usage
    allScripts.sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return b.usage - a.usage;
    });

    allScripts.forEach(script => {
      const scriptItem = document.createElement('div');
      scriptItem.className = 'script-item';
      scriptItem.innerHTML = `
        <div class="script-title">
          <span class="script-icon">${getCategoryIcon(script.category)}</span>
          ${script.title}
          ${script.favorite ? '⭐' : ''}
        </div>
        <div class="script-preview">${script.content.substring(0, 100)}...</div>
        <div class="script-meta">
          <span class="script-category-tag">${script.category}</span>
          <span class="script-usage">Used ${script.usage} times</span>
        </div>
      `;

      scriptItem.addEventListener('click', () => loadScript(script));
      scriptList.appendChild(scriptItem);
    });

    if (allScripts.length === 0) {
      scriptList.innerHTML = '<div class="no-scripts">No scripts found matching your criteria.</div>';
    }
  }

  function getCategoryIcon(category) {
    const icons = {
      sales: '💼',
      support: '🛠️',
      complaints: '😠',
      all: '📚'
    };
    return icons[category] || '📄';
  }

  function loadScript(script) {
    currentScript = script;
    scriptContent.value = script.content;

    // Update usage
    script.usage++;
    script.lastUsed = new Date();
    localStorage.setItem('scripts', JSON.stringify(scripts));
    updateScriptList();
  }

  function saveScript() {
    if (!currentScript) {
      // Create new script
      const title = prompt('Enter script title:');
      if (!title) return;

      const category = prompt('Enter category (sales/support/complaints):') || 'support';
      const newScript = {
        id: Date.now(),
        title,
        content: scriptContent.value,
        category,
        favorite: false,
        usage: 0,
        lastUsed: null
      };

      if (!scripts[category]) scripts[category] = [];
      scripts[category].push(newScript);
    } else {
      // Update existing script
      currentScript.content = scriptContent.value;
    }

    localStorage.setItem('scripts', JSON.stringify(scripts));
    updateScriptList();
    scriptContent.value = '';
    currentScript = null;
  }

  function cancelEdit() {
    scriptContent.value = '';
    currentScript = null;
  }

  function applyFormatting(action) {
    const textarea = scriptContent;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let replacement = selectedText;

    switch (action) {
      case 'bold':
        replacement = `**${selectedText}**`;
        break;
      case 'italic':
        replacement = `*${selectedText}*`;
        break;
      case 'underline':
        replacement = `<u>${selectedText}</u>`;
        break;
      case 'clear':
        textarea.value = '';
        return;
    }

    textarea.value = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + replacement.length, start + replacement.length);
  }

  // Event listeners
  categories.forEach(category => {
    category.addEventListener('click', () => {
      categories.forEach(c => c.classList.remove('active'));
      category.classList.add('active');
      currentCategory = category.dataset.category;
      updateScriptList();
    });
  });

  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    updateScriptList();
  });

  saveScriptBtn.addEventListener('click', saveScript);
  cancelScriptBtn.addEventListener('click', cancelEdit);

  editorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      applyFormatting(action);
    });
  });

  // Initialize
  updateScriptList();
}

// Training & Practice Mode
export const trainingState = {
  currentScript: null,
  practiceMode: false,
  feedback: [],
  certifications: JSON.parse(localStorage.getItem('certifications') || '[]')
};

export function startPracticeMode(scriptId) {
  const script = findScriptById(scriptId);
  if (!script) return;

  trainingState.currentScript = script;
  trainingState.practiceMode = true;
  renderPracticeUI(script);
}

function findScriptById(id) {
  const scripts = JSON.parse(localStorage.getItem('scripts')) || getDefaultScripts();
  for (const category in scripts) {
    const found = scripts[category].find(s => s.id == id);
    if (found) return found;
  }
  return null;
}

function renderPracticeUI(script) {
  // Render practice interface with script text, input for user response, feedback
}

export function submitPracticeResponse(response) {
  // Analyze response, provide feedback
  const feedback = analyzeResponse(response, trainingState.currentScript);
  trainingState.feedback.push(feedback);
  displayFeedback(feedback);
}

function analyzeResponse(response, script) {
  // Simple analysis: check if key phrases are included
  const keyPhrases = extractKeyPhrases(script.content);
  const score = keyPhrases.filter(phrase => response.includes(phrase)).length / keyPhrases.length;
  return { score, suggestions: [] };
}

function extractKeyPhrases(content) {
  // Simple extraction
  return content.split('.').filter(s => s.trim());
}

function displayFeedback(feedback) {
  // Show feedback to user
}

export function completeCertification(scriptId) {
  const cert = { scriptId, date: new Date(), score: trainingState.feedback.slice(-1)[0]?.score || 0 };
  trainingState.certifications.push(cert);
  localStorage.setItem('certifications', JSON.stringify(trainingState.certifications));
}

export function getCertifications() {
  return trainingState.certifications;
}