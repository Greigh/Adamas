// Script Library Module
export function initializeScripts() {
  const categories = document.querySelectorAll('.script-category');
  const scriptList = document.getElementById('script-list');
  const scriptContent = document.getElementById('script-content');
  const saveScriptBtn = document.getElementById('save-script');

  let scripts = JSON.parse(localStorage.getItem('scripts')) || getDefaultScripts();
  let currentCategory = 'all';

  function getDefaultScripts() {
    return {
      sales: [
        {
          id: 1,
          title: 'New Customer Greeting',
          content: 'Hello! Thank you for calling [Company]. This is [Your Name] from our sales team. How can I help you find the perfect solution today?'
        },
        {
          id: 2,
          title: 'Product Recommendation',
          content: 'Based on what you\'ve told me, I recommend our [Product] package. It includes [features] and is priced at [price]. Would you like to proceed with this?'
        }
      ],
      support: [
        {
          id: 3,
          title: 'Technical Issue Troubleshooting',
          content: 'I understand you\'re experiencing [issue]. Let me guide you through some troubleshooting steps. First, can you tell me what error message you\'re seeing?'
        },
        {
          id: 4,
          title: 'Account Verification',
          content: 'For security purposes, may I have the last four digits of the phone number on file or the account holder\'s name?'
        }
      ],
      complaints: [
        {
          id: 5,
          title: 'Complaint Acknowledgment',
          content: 'I\'m sorry to hear you\'re experiencing this issue. I completely understand your frustration, and I want to make this right. Let me [action] for you.'
        }
      ]
    };
  }

  function updateScriptList() {
    scriptList.innerHTML = '';

    const scriptsToShow = currentCategory === 'all' ?
      Object.values(scripts).flat() :
      scripts[currentCategory] || [];

    scriptsToShow.forEach(script => {
      const scriptItem = document.createElement('div');
      scriptItem.className = 'script-item';
      scriptItem.innerHTML = `
        <h4>${script.title}</h4>
        <p>${script.content.substring(0, 100)}...</p>
        <button class="button" onclick="loadScript(${script.id})">Load</button>
        <button class="button btn-secondary" onclick="editScript(${script.id})">Edit</button>
      `;
      scriptList.appendChild(scriptItem);
    });
  }

  function loadScript(scriptId) {
    const allScripts = Object.values(scripts).flat();
    const script = allScripts.find(s => s.id === scriptId);
    if (script) {
      scriptContent.value = script.content;
    }
  }

  function editScript(scriptId) {
    loadScript(scriptId);
    // Could add edit mode here
  }

  function saveScript() {
    const content = scriptContent.value.trim();
    if (!content) return;

    const title = prompt('Enter script title:');
    if (!title) return;

    const category = prompt('Enter category (sales/support/complaints):') || 'support';

    if (!scripts[category]) scripts[category] = [];

    const newScript = {
      id: Date.now(),
      title,
      content
    };

    scripts[category].push(newScript);
    localStorage.setItem('scripts', JSON.stringify(scripts));
    updateScriptList();
    alert('Script saved!');
  }

  categories.forEach(category => {
    category.addEventListener('click', () => {
      categories.forEach(c => c.classList.remove('active'));
      category.classList.add('active');
      currentCategory = category.dataset.category;
      updateScriptList();
    });
  });

  saveScriptBtn.addEventListener('click', saveScript);

  // Expose functions globally for inline handlers
  window.loadScript = loadScript;
  window.editScript = editScript;

  updateScriptList();
}