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
        // Focus trap between cancel and confirm buttons
        const focusable = modal.querySelectorAll('button');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
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
    
    // Focus confirm button (or cancel if not dangerous)
    setTimeout(() => {
      try { 
        confirmBtn.focus();
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
