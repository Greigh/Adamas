// Notes management module
import { saveNotes, loadNotes } from './storage.js';
import { appSettings } from './settings.js'; // Add this import

export function renderNotes() {
  const notesFeed = document.getElementById('notes-feed');
  if (!notesFeed) return;

  const notes = loadNotes();
  notesFeed.innerHTML = '';

  if (notes.length === 0) {
    notesFeed.innerHTML =
      '<li style="color: #888; font-style: italic;">No notes yet. Add your first note above!</li>';
    return;
  }

  notes.forEach((note, idx) => {
    const li = document.createElement('li');
    const contentDiv = document.createElement('div');
    contentDiv.className = 'note-content';

    if (note.editing) {
      const textarea = document.createElement('textarea');
      textarea.className = 'edit-note-input';
      textarea.value = note.text;
      contentDiv.appendChild(textarea);

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      saveBtn.className = 'save-note-btn';
      saveBtn.onclick = () => {
        notes[idx].text = textarea.value.trim();
        notes[idx].editing = false;
        notes[idx].updatedAt = new Date().toISOString();
        saveNotes(notes);
        renderNotes();
      };

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.className = 'cancel-edit-btn';
      cancelBtn.onclick = () => {
        notes[idx].editing = false;
        saveNotes(notes);
        renderNotes();
      };
      contentDiv.appendChild(saveBtn);
      contentDiv.appendChild(cancelBtn);
    } else {
      contentDiv.innerHTML = note.text
        .split('\n')
        .map((line) => `<div>${line}</div>`)
        .join('');
    }

    // Timestamp
    const time = document.createElement('span');
    time.className = 'note-timestamp';
    time.textContent = 'Created: ' + new Date(note.timestamp).toLocaleString();
    contentDiv.appendChild(time);

    // Show updated at if different from created
    if (note.updatedAt && note.updatedAt !== note.timestamp) {
      const updated = document.createElement('span');
      updated.className = 'note-updated';
      updated.textContent =
        'Updated: ' + new Date(note.updatedAt).toLocaleString();
      contentDiv.appendChild(updated);
    }

    li.appendChild(contentDiv);

    // Actions
    if (!note.editing) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'note-actions';

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.className = 'edit-note-btn';
      editBtn.onclick = () => {
        notes[idx].editing = true;
        saveNotes(notes);
        renderNotes();
      };
      actionsDiv.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.className = 'delete-note-btn';
      delBtn.onclick = () => {
        notes.splice(idx, 1);
        saveNotes(notes);
        renderNotes();
      };
      actionsDiv.appendChild(delBtn);

      const copyBtn = document.createElement('button');
      copyBtn.textContent = 'Copy';
      copyBtn.className = 'copy-note-btn';
      copyBtn.onclick = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(note.text)
            .then(() => {
              copyBtn.textContent = 'Copied!';
              setTimeout(() => (copyBtn.textContent = 'Copy'), 1000);
            })
            .catch(() => {
              alert('Copy failed. Please copy manually.');
            });
        } else {
          // Fallback for older browsers
          const textarea = document.createElement('textarea');
          textarea.value = note.text;
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
            copyBtn.textContent = 'Copied!';
            setTimeout(() => (copyBtn.textContent = 'Copy'), 1000);
          } catch (err) {
            alert('Copy failed. Please copy manually.');
          }
          document.body.removeChild(textarea);
        }
      };
      actionsDiv.appendChild(copyBtn);

      li.appendChild(actionsDiv);
    }

    notesFeed.appendChild(li);
  });
}

export function setupNotesEventListeners() {
  const addNoteBtn = document.getElementById('add-note-btn');
  const notesInput = document.getElementById('notes-input');

  if (addNoteBtn && notesInput) {
    addNoteBtn.addEventListener('click', () => {
      const noteText = notesInput.value.trim();
      if (noteText) {
        const notes = loadNotes();
        notes.unshift({
          text: noteText,
          timestamp: new Date().toISOString(),
          editing: false,
        });
        saveNotes(notes);
        renderNotes();
        notesInput.value = '';
      }
    });

    notesInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        addNoteBtn.click();
      }
    });
  }

  const clearNotesBtn = document.getElementById('clear-notes-btn');
  if (clearNotesBtn) {
    clearNotesBtn.addEventListener('click', () => {
      if (confirm('Clear all notes? This cannot be undone.')) {
        saveNotes([]);
        renderNotes();
      }
    });
  }
}

export class NotesInstance {
  constructor(id) {
    this.id = id;
    this.notes = [];
  }
}

export const notesInstances = new Map();

// Modify the createNotes function to prevent duplicates
let isCreatingNotes = false;

export function createNotes() {
  // Prevent duplicate creation
  if (isCreatingNotes) return null;

  if (notesInstances.size >= appSettings.maxNotes) {
    alert(`Maximum number of notes sections (${appSettings.maxNotes}) reached`);
    return null;
  }

  // Set flag to prevent duplicates
  isCreatingNotes = true;

  // Generate a unique ID for this notes instance
  const id = `notes-${Date.now()}`;

  // Create new notes with animated entry
  setTimeout(() => {
    const notes = new NotesInstance(id);
    notesInstances.set(id, notes);

    createNotesUI(id);

    // Reset the flag after notes are created
    isCreatingNotes = false;
  }, 300);

  return id;
}

function createNotesUI(notesId) {
  const container = document.querySelector('.sortable-container');
  if (!container) return;

  const notesHtml = `
        <section id="${notesId}" class="card notes-card toggleable-section draggable-section" data-section="notes">
            <div class="section-header">
                <div class="drag-handle">⋮⋮</div>
                <div class="title-container">
                    <h2 class="section-title" data-original="Notes">Notes</h2>
                    <button class="edit-title-btn" onclick="editSectionTitle('${notesId}')" title="Edit Title">✎</button>
                </div>
                <div class="section-controls">
                    <button class="minimize-btn" title="Minimize">−</button>
                    <button class="float-btn" title="Float">⧉</button>
                </div>
            </div>
            <div class="section-content">
                <div class="notes-input-area">
                    <textarea id="notes-input-${notesId}" name="notes-input-${notesId}" placeholder="Type a note and press Add..."></textarea>
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        <button id="add-note-btn-${notesId}" class="button">Add Note</button>
                        <button id="clear-notes-btn-${notesId}" class="button btn-danger">Clear All Notes</button>
                    </div>
                </div>
                <ul id="notes-feed-${notesId}" class="notes-feed"></ul>
            </div>
        </section>
    `;

  container.insertAdjacentHTML('beforeend', notesHtml);

  // Set up event listeners for this specific notes instance
  setupNotesInstanceListeners(notesId);

  // Get the newly created section and set up dragging and floating
  const noteSection = document.getElementById(notesId);
  if (noteSection) {
    // Setup draggable functionality
    setupDraggable(noteSection);

    // Setup floating functionality
    setupFloating(noteSection);

    // Setup section minimize/maximize
    setupSectionToggle(noteSection);
  }

  return notesId;
}

// Add a new function to set up listeners for dynamic notes instances
function setupNotesInstanceListeners(notesId) {
  const addNoteBtn = document.getElementById(`add-note-btn-${notesId}`);
  const notesInput = document.getElementById(`notes-input-${notesId}`);
  const notesFeed = document.getElementById(`notes-feed-${notesId}`);

  if (addNoteBtn && notesInput) {
    addNoteBtn.addEventListener('click', () => {
      const noteText = notesInput.value.trim();
      if (noteText) {
        const notes = notesInstances.get(notesId);
        if (notes) {
          notes.notes.unshift({
            text: noteText,
            timestamp: new Date().toISOString(),
            editing: false,
          });
          renderNotesInstance(notesId);
          notesInput.value = '';
        }
      }
    });

    notesInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        addNoteBtn.click();
      }
    });
  }

  const clearNotesBtn = document.getElementById(`clear-notes-btn-${notesId}`);
  if (clearNotesBtn) {
    clearNotesBtn.addEventListener('click', () => {
      if (confirm('Clear all notes? This cannot be undone.')) {
        const notes = notesInstances.get(notesId);
        if (notes) {
          notes.notes = [];
          renderNotesInstance(notesId);
        }
      }
    });
  }
}

// Add a function to render a specific notes instance
function renderNotesInstance(notesId) {
  const notesFeed = document.getElementById(`notes-feed-${notesId}`);
  const notesInstance = notesInstances.get(notesId);

  if (!notesFeed || !notesInstance) return;

  const notes = notesInstance.notes;
  notesFeed.innerHTML = '';

  if (notes.length === 0) {
    notesFeed.innerHTML =
      '<li style="color: #888; font-style: italic;">No notes yet. Add your first note above!</li>';
    return;
  }

  notes.forEach((note, idx) => {
    const li = document.createElement('li');
    const contentDiv = document.createElement('div');
    contentDiv.className = 'note-content';

    if (note.editing) {
      const textarea = document.createElement('textarea');
      textarea.className = 'edit-note-input';
      textarea.value = note.text;
      contentDiv.appendChild(textarea);

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      saveBtn.className = 'save-note-btn';
      saveBtn.onclick = () => {
        notes[idx].text = textarea.value.trim();
        notes[idx].editing = false;
        notes[idx].updatedAt = new Date().toISOString();
        renderNotesInstance(notesId);
      };

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.className = 'cancel-edit-btn';
      cancelBtn.onclick = () => {
        notes[idx].editing = false;
        renderNotesInstance(notesId);
      };
      contentDiv.appendChild(saveBtn);
      contentDiv.appendChild(cancelBtn);
    } else {
      contentDiv.innerHTML = note.text
        .split('\n')
        .map((line) => `<div>${line}</div>`)
        .join('');
    }

    // Timestamp
    const time = document.createElement('span');
    time.className = 'note-timestamp';
    time.textContent = 'Created: ' + new Date(note.timestamp).toLocaleString();
    contentDiv.appendChild(time);

    // Show updated at if different from created
    if (note.updatedAt && note.updatedAt !== note.timestamp) {
      const updated = document.createElement('span');
      updated.className = 'note-updated';
      updated.textContent =
        'Updated: ' + new Date(note.updatedAt).toLocaleString();
      contentDiv.appendChild(updated);
    }

    li.appendChild(contentDiv);

    // Actions
    if (!note.editing) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'note-actions';

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.className = 'edit-note-btn';
      editBtn.onclick = () => {
        notes[idx].editing = true;
        renderNotesInstance(notesId);
      };
      actionsDiv.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.className = 'delete-note-btn';
      delBtn.onclick = () => {
        notes.splice(idx, 1);
        renderNotesInstance(notesId);
      };
      actionsDiv.appendChild(delBtn);

      const copyBtn = document.createElement('button');
      copyBtn.textContent = 'Copy';
      copyBtn.className = 'copy-note-btn';
      copyBtn.onclick = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(note.text)
            .then(() => {
              copyBtn.textContent = 'Copied!';
              setTimeout(() => (copyBtn.textContent = 'Copy'), 1000);
            })
            .catch(() => {
              alert('Copy failed. Please copy manually.');
            });
        } else {
          // Fallback for older browsers
          const textarea = document.createElement('textarea');
          textarea.value = note.text;
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
            copyBtn.textContent = 'Copied!';
            setTimeout(() => (copyBtn.textContent = 'Copy'), 1000);
          } catch (err) {
            alert('Copy failed. Please copy manually.');
          }
          document.body.removeChild(textarea);
        }
      };
      actionsDiv.appendChild(copyBtn);

      li.appendChild(actionsDiv);
    }

    notesFeed.appendChild(li);
  });
}

// Add this function at the top level of your module
export function initializeNotes() {
  // Load any existing notes
  renderNotes();

  // Set up event listeners
  setupNotesEventListeners();

  // Initialize any other notes-related functionality
  const notesContainer = document.getElementById('notes');
  if (notesContainer) {
    // Set up draggable functionality
    if (typeof setupDraggable === 'function') {
      setupDraggable(notesContainer);
    }

    // Set up floating functionality
    if (typeof setupFloating === 'function') {
      setupFloating(notesContainer);
    }

    // Set up section toggle
    if (typeof setupSectionToggle === 'function') {
      setupSectionToggle(notesContainer);
    }
  }

  // Expose window functions for note operations if needed
  window.addNote = (text, sectionId) => {
    if (!text.trim()) return;

    // If sectionId is provided, add to specific notes instance
    if (sectionId && notesInstances.has(sectionId)) {
      const notes = notesInstances.get(sectionId);
      notes.notes.unshift({
        text: text,
        timestamp: new Date().toISOString(),
        editing: false,
      });
      renderNotesInstance(sectionId);
      return;
    }

    // Otherwise add to main notes
    const notes = loadNotes();
    notes.unshift({
      text: text,
      timestamp: new Date().toISOString(),
      editing: false,
    });
    saveNotes(notes);
    renderNotes();
  };
}
