// Accessible modal utilities (confirmation dialog)
export function showConfirmModal({ title = 'Confirm', message = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    const titleId = `modal-title-${Date.now()}`;
    const descId = `modal-desc-${Date.now()}`;
    modal.innerHTML = `
      <h2 id="${titleId}" class="modal-title">${title}</h2>
      <p id="${descId}" class="modal-message">${message}</p>
      <div class="modal-actions">
        <button class="modal-cancel">${cancelLabel}</button>
        <button class="modal-confirm ${danger ? 'danger' : ''}">${confirmLabel}</button>
      </div>
    `;
    modal.setAttribute('aria-labelledby', titleId);
    modal.setAttribute('aria-describedby', descId);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Trigger animation after DOM insertion
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });

    const confirmBtn = modal.querySelector('.modal-confirm');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const previousActive = document.activeElement;

    // Focus trap setup - collect all focusable elements
    const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    function cleanup(animated = true) {
      if (animated) {
        overlay.classList.add('closing');
        overlay.classList.remove('active');
        // Wait for animation to complete
        setTimeout(() => {
          try { overlay.remove(); } catch (e) {}
        }, 200); // Match CSS transition duration
      } else {
        try { overlay.remove(); } catch (e) {}
      }
      document.removeEventListener('keydown', onKeyDown);
      // Restore focus to the previously active element
      if (previousActive && typeof previousActive.focus === 'function') {
        setTimeout(() => previousActive.focus(), animated ? 200 : 0);
      }
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup();
        resolve(false);
      } else if (e.key === 'Tab') {
        // Improved focus trapping
        if (e.shiftKey) {
          // Shift+Tab: move to previous focusable element
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          // Tab: move to next focusable element
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    }

    confirmBtn?.addEventListener('click', () => {
      cleanup();
      resolve(true);
    });
    cancelBtn?.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });
    
    // Focus the first focusable element (usually confirm button for dangerous actions)
    setTimeout(() => {
      try { 
        if (firstFocusable) {
          firstFocusable.focus();
        } else if (confirmBtn) {
          confirmBtn.focus();
        }
      } catch (e) {}
    }, 0);
    
    document.addEventListener('keydown', onKeyDown);
  });
}

export function closeModals() {
  document.querySelectorAll('.confirm-modal-overlay').forEach((overlay) => {
    overlay.classList.add('closing');
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 200);
  });
}
