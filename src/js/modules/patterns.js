// Number pattern formatter module
import { savePatterns, loadPatterns, loadData } from './storage.js';

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

export function formatNumber(root = document) {
  const getElement = (r, id) => {
    if (!r) return null;
    if (typeof r.getElementById === 'function') {
      return r.getElementById(id) || r.querySelector(`#${id}`) || r.querySelector(`[id$="${id}"]`);
    }
    return r.querySelector(`#${id}`) || r.querySelector(`[id$="${id}"]`);
  };

  const inputEl = getElement(root, 'patternNumberInput');
  const copyButton = getElement(root, 'copyPatternBtn');
  const resultDiv = getElement(root, 'patternResult');
  if (!inputEl || !resultDiv) return;
  try { console.log('PATTERNS: formatNumber invoked for root', root && (root.id || root.tagName)); } catch (e) {}
  const originalDigits = (inputEl.value || '').replace(/\D/g, '');
  const result = formatDigits(originalDigits);

  resultDiv.textContent = result;
  const autoCopy = loadData('autoCopyPattern', true);
  if (result && result !== 'No matching pattern found') {
    if (copyButton) {
      copyButton.style.display = 'inline-block';
      copyButton.disabled = false;
    }
    if (autoCopy) {
      copyResult(root); // <-- Only auto-copy if enabled
    }
  } else if (copyButton) {
    copyButton.style.display = 'none';
    copyButton.disabled = true;
  }
}

// Pure function: format a digits-only string using the configured patterns
export function formatDigits(originalDigits) {
  let result = 'No matching pattern found';
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

  return result;
}

export function copyResult(root = document) {
  const getElement = (r, id) => {
    if (!r) return null;
    if (typeof r.getElementById === 'function') {
      return r.getElementById(id) || r.querySelector(`#${id}`) || r.querySelector(`[id$="${id}"]`);
    }
    return r.querySelector(`#${id}`) || r.querySelector(`[id$="${id}"]`);
  };
  const resultEl = getElement(root, 'patternResult');
  const resultText = resultEl ? resultEl.textContent : '';
  if (
    resultText &&
    resultText !== 'No matching pattern found' &&
    resultText !== 'Result will appear here'
  ) {
    // Try Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(resultText)
        .then(showCopiedMsg, fallbackCopy);
    } else {
      fallbackCopy();
    }
  }

  function fallbackCopy() {
    // Fallback: create a temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = resultText;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showCopiedMsg();
    } catch (err) {
      alert('Copy failed. Please copy manually.');
    }
    document.body.removeChild(textarea);
  }

  function showCopiedMsg() {
    let copiedMsg = document.getElementById('pattern-copied-msg');
    if (!copiedMsg) {
      copiedMsg = document.createElement('span');
      copiedMsg.id = 'pattern-copied-msg';
      copiedMsg.style.marginLeft = '10px';
      copiedMsg.style.color = '#16a34a';
      copiedMsg.style.fontWeight = 'bold';
      const copyBtn = getElement(root, 'copyPatternBtn') || document.getElementById('copyPatternBtn');
      if (copyBtn && copyBtn.parentNode) {
        copyBtn.parentNode.insertBefore(copiedMsg, copyBtn.nextSibling);
      }
    }
    copiedMsg.textContent = 'Copied!';
    copiedMsg.style.display = 'inline';
    setTimeout(() => {
      copiedMsg.style.display = 'none';
    }, 1500);
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

// Exported helper for pasting so tests or other code can call directly
export async function pasteFromClipboard(providedText, root = document) {
  const getElement = (r, id) => {
    if (!r) return null;
    if (typeof r.getElementById === 'function') {
      return r.getElementById(id) || r.querySelector(`#${id}`) || r.querySelector(`[id$="${id}"]`);
    }
    return r.querySelector(`#${id}`) || r.querySelector(`[id$="${id}"]`);
  };
  const numberInputLocal = getElement(root, 'patternNumberInput');
  let text = providedText || '';
  // Try Clipboard API first
  if (!text && navigator.clipboard && navigator.clipboard.readText) {
    try {
      text = await navigator.clipboard.readText();
    } catch (err) {
      text = '';
    }
  }
  if (!text) {
    try {
      if (typeof window.prompt === 'function') {
        text = window.prompt('Paste number here:') || '';
      }
    } catch (err) {
      text = '';
    }
  }
  if (text && numberInputLocal) {
    const normalized = normalizeNumber(text);
    numberInputLocal.value = normalized || text;
    try { console.log('[patterns] pasteFromClipboard calling formatNumber', { rootId: root && root.id, value: numberInputLocal.value }); } catch (e) {}
    formatNumber(root);
    return normalized || text;
  }
  return '';
}

// Small utility to normalize arbitrary pasted input to digits-only
export function normalizeNumber(text) {
  if (!text) return '';
  return text.replace(/[\s()\-+\.]/g, '').replace(/[^0-9]/g, '');
}

// Ensure this function is exported for dynamic import
// Attach listeners scoped to a root element (defaults to document)
export function attachPatternEventListeners(root = document) {
  // Tabs within the root
  const getElement = (r, id) => {
    if (!r) return null;
    if (typeof r.getElementById === 'function') {
      return r.getElementById(id) || r.querySelector(`#${id}`) || r.querySelector(`[id$="${id}"]`);
    }
    return r.querySelector(`#${id}`) || r.querySelector(`[id$="${id}"]`);
  };

  const formatTabBtn = root.querySelector('[data-pattern-tab="format-tab"]');
  const patternsTabBtn = root.querySelector('[data-pattern-tab="patterns-tab"]');
  try { if (formatTabBtn) formatTabBtn.addEventListener('click', (event) => openPatternTab('format-tab', event, root)); } catch (e) { console.log('[patterns] failed to attach formatTabBtn listener', e && (e.message || e)); }
  try { if (patternsTabBtn) patternsTabBtn.addEventListener('click', (event) => openPatternTab('patterns-tab', event, root)); } catch (e) { console.log('[patterns] failed to attach patternsTabBtn listener', e && (e.message || e)); }

  // Inputs and buttons scoped to the root
  const numberInput = getElement(root, 'patternNumberInput');
  const copyBtn = getElement(root, 'copyPatternBtn');

  if (numberInput) {
    try { numberInput.addEventListener('input', () => formatNumber(root)); } catch (e) { console.log('[patterns] failed to attach numberInput listener', e && (e.message || e)); }
  }
  if (copyBtn) {
    try { copyBtn.addEventListener('click', () => copyResult(root)); } catch (e) { console.log('[patterns] failed to attach copyBtn listener', e && (e.message || e)); }
  }

  const pasteBtn = getElement(root, 'pastePatternBtn');
  if (pasteBtn) {
    try { pasteBtn.addEventListener('click', () => { pasteFromClipboard(undefined, root); }); } catch (e) { console.log('[patterns] failed to attach pasteBtn listener', e && (e.message || e)); }
    // Tooltip show/hide for accessibility
    const tooltip = pasteBtn.closest('.tooltip-wrapper')?.querySelector('.tooltip-text');
    if (tooltip) {
      pasteBtn.addEventListener('mouseenter', () => {
        tooltip.style.visibility = 'visible';
        tooltip.setAttribute('aria-hidden', 'false');
      });
      pasteBtn.addEventListener('mouseleave', () => {
        tooltip.style.visibility = 'hidden';
        tooltip.setAttribute('aria-hidden', 'true');
      });
      pasteBtn.addEventListener('focus', () => {
        tooltip.style.visibility = 'visible';
        tooltip.setAttribute('aria-hidden', 'false');
      });
      pasteBtn.addEventListener('blur', () => {
        tooltip.style.visibility = 'hidden';
        tooltip.setAttribute('aria-hidden', 'true');
      });
    }
  }

  const formatBtn = getElement(root, 'formatPatternBtn');
  if (formatBtn) {
    try { formatBtn.addEventListener('click', () => formatNumber(root)); } catch (e) { console.log('[patterns] failed to attach formatBtn listener', e && (e.message || e)); }
  }

  const clearBtn = getElement(root, 'clearPatternBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => clearPattern(root));
  }

  const addBtn = getElement(root, 'addPatternBtn');
  if (addBtn) {
    try { addBtn.addEventListener('click', addPattern); } catch (e) { console.log('[patterns] failed to attach addBtn listener', e && (e.message || e)); }
  }
  try {
    if (root && root.setAttribute) {
      root.setAttribute('data-patterns-attached', 'true');
      try { console.log('PATTERNS: attachPatternEventListeners completed', root && (root.id || root.tagName)); } catch (e) {}
    }
  } catch (e) {}
}

// Backwards-compatible default that wires the document root
export function setupPatternEventListeners() {
  attachPatternEventListeners(document);
  // Initialize patterns on load
  initializePatterns();
}

function openPatternTab(tabId, event, root = document) {
  // Operate within the provided root so cloned sections behave correctly
  const base = root || document;
  const tabButtons = base.querySelectorAll('.tab-button');
  const tabContents = base.querySelectorAll('.tab-content');
  // Remove active class from all tabs in this root
  tabContents.forEach((tab) => tab.classList.remove('active'));
  tabButtons.forEach((button) => button.classList.remove('active'));

  // Try to find the tab content by exact id, id-suffix, or data attribute
  let activeTab = base.querySelector(`#${tabId}`) || base.querySelector(`[id$="${tabId}"]`) || base.querySelector(`[data-pattern-tab="${tabId}"]`);
  if (activeTab) activeTab.classList.add('active');
  if (event && event.currentTarget) event.currentTarget.classList.add('active');
}
