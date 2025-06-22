// Number pattern formatter module
import { savePatterns, loadPatterns } from './storage.js';

export let patterns = [
  { id: 1, start: '81', minLength: 10, format: '@XXX-XXX-XXXX' },
  { id: 2, start: '', minLength: 10, format: '@XXX-XXX-XXXX' },
  { id: 3, start: '', minLength: 9, format: '#XXXXXXXXX' },
];

export let nextPatternId = 4;

export function initializePatterns() {
  const savedPatterns = loadPatterns();
  if (savedPatterns.length > 0) {
    patterns = savedPatterns;
    nextPatternId = Math.max(...patterns.map((p) => p.id)) + 1;
  }
  updatePatternTable();
}

export function updatePatternTable() {
  const tbody = document.getElementById('patternList');
  if (!tbody) return;

  tbody.innerHTML = '';
  patterns.forEach((pattern) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${pattern.start || '(none)'}</td>
      <td>${pattern.minLength}</td>
      <td>${pattern.format}</td>
      <td><button class="delete-pattern-btn" data-pattern-id="${
        pattern.id
      }">Delete</button></td>
    `;
    tbody.appendChild(row);
  });

  // Attach event listeners to all delete buttons
  tbody.querySelectorAll('.delete-pattern-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      const id = parseInt(this.getAttribute('data-pattern-id'));
      deletePattern(id);
    });
  });
}

export function addPattern() {
  const start = document.getElementById('startSequence').value.trim();
  const minLength = parseInt(document.getElementById('minLength').value);
  const format = document.getElementById('formatPattern').value.trim();

  if (isNaN(minLength) || minLength < 1) {
    alert('Please enter a valid minimum length.');
    return;
  }

  patterns.push({
    id: nextPatternId++,
    start,
    minLength,
    format,
  });
  savePatterns(patterns);
  updatePatternTable();

  // Clear inputs
  document.getElementById('startSequence').value = '';
  document.getElementById('minLength').value = '';
  document.getElementById('formatPattern').value = '';
}

export function deletePattern(id) {
  patterns = patterns.filter((p) => p.id !== id);
  savePatterns(patterns);
  updatePatternTable();
}

export function formatNumber() {
  const input = document.getElementById('patternNumberInput').value;
  const originalDigits = input.replace(/\D/g, '');
  let result = 'No matching pattern found';
  const copyButton = document.getElementById('copyPatternBtn');
  const resultDiv = document.getElementById('patternResult');

  // Sort patterns by specificity (longest start, then longest format)
  const sortedPatterns = [...patterns].sort((a, b) => {
    const startDiff = (b.start?.length || 0) - (a.start?.length || 0);
    if (startDiff !== 0) return startDiff;
    return b.format.length - a.format.length;
  });

  for (const pattern of sortedPatterns) {
    let digits = originalDigits;
    // Enforce start sequence if defined
    if (pattern.start && pattern.start.length > 0) {
      if (!digits.startsWith(pattern.start)) continue;
      digits = digits.slice(pattern.start.length);
    }
    // Only match if there are exactly minLength digits after the start
    if (digits.length !== pattern.minLength) continue;

    let formatted = '';
    let digitIndex = 0;
    for (let i = 0; i < pattern.format.length; i++) {
      const char = pattern.format[i];
      if ((char === '@' || char === '#') && digitIndex < digits.length) {
        formatted += char + digits[digitIndex++];
        // Skip the next X, since the prefix digit is already used
        if (pattern.format[i + 1] === 'X' || pattern.format[i + 1] === 'x') {
          i++;
        }
      } else if ((char === 'X' || char === 'x') && digitIndex < digits.length) {
        formatted += digits[digitIndex++];
      } else {
        formatted += char;
      }
    }
    result = formatted;
    break;
  }

  resultDiv.textContent = result;
  if (result && result !== 'No matching pattern found') {
    copyButton.style.display = 'inline-block';
    copyButton.disabled = false;
  } else {
    copyButton.style.display = 'none';
    copyButton.disabled = true;
  }
}

export function copyResult() {
  const resultText = document.getElementById('patternResult').textContent;
  if (
    resultText &&
    resultText !== 'No matching pattern found' &&
    resultText !== 'Result will appear here'
  ) {
    navigator.clipboard.writeText(resultText).then(() => {
      // Show a copied message near the copy button
      let copiedMsg = document.getElementById('pattern-copied-msg');
      if (!copiedMsg) {
        copiedMsg = document.createElement('span');
        copiedMsg.id = 'pattern-copied-msg';
        copiedMsg.style.marginLeft = '10px';
        copiedMsg.style.color = '#16a34a';
        copiedMsg.style.fontWeight = 'bold';
        const copyBtn = document.getElementById('copyPatternBtn');
        if (copyBtn && copyBtn.parentNode) {
          copyBtn.parentNode.insertBefore(copiedMsg, copyBtn.nextSibling);
        }
      }
      copiedMsg.textContent = 'Copied!';
      copiedMsg.style.display = 'inline';
      setTimeout(() => {
        copiedMsg.style.display = 'none';
      }, 1500);
    });
  }
}

export function clearPattern() {
  const input = document.getElementById('patternNumberInput');
  const result = document.getElementById('patternResult');
  const copyBtn = document.getElementById('copyPatternBtn');
  if (input) input.value = '';
  if (result) result.textContent = 'Result will appear here';
  if (copyBtn) copyBtn.disabled = true;
}

// Ensure this function is exported for dynamic import
export function setupPatternEventListeners() {
  // Attach listeners to the inner tabs
  document
    .querySelector('[data-pattern-tab="format-tab"]')
    ?.addEventListener('click', (event) => openPatternTab('format-tab', event));
  document
    .querySelector('[data-pattern-tab="patterns-tab"]')
    ?.addEventListener('click', (event) =>
      openPatternTab('patterns-tab', event)
    );

  // Attach listeners to format input and copy button
  const numberInput = document.getElementById('patternNumberInput');
  const copyBtn = document.getElementById('copyPatternBtn');
  if (numberInput) {
    numberInput.addEventListener('input', formatNumber);
  }
  if (copyBtn) {
    copyBtn.addEventListener('click', copyResult);
  }

  // Attach listener to clear button if present
  const clearBtn = document.getElementById('clearPatternBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearPattern);
  }

  // Attach the addPattern event
  const addBtn = document.getElementById('addPatternBtn');
  if (addBtn) {
    addBtn.addEventListener('click', addPattern);
  }

  // Initialize patterns on load
  initializePatterns();
}

function openPatternTab(tabId, event) {
  const patternSection = document.getElementById('pattern-formatter');
  if (!patternSection) return;
  // Only modify tabs within this specific section
  const tabButtons = patternSection.querySelectorAll('.tab-button');
  const tabContents = patternSection.querySelectorAll('.tab-content');
  // Remove active class from all tabs in this section
  tabContents.forEach((tab) => tab.classList.remove('active'));
  tabButtons.forEach((button) => button.classList.remove('active'));
  // Activate the selected tab
  const activeTab = document.getElementById(tabId);
  if (activeTab) activeTab.classList.add('active');
  if (event && event.currentTarget) event.currentTarget.classList.add('active');
}
