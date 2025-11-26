# Quick Reference: Using the Modal System

## Basic Usage

### Import and Use
```javascript
// Dynamic import (recommended - reduces bundle size)
async function handleDelete() {
  const { showConfirmModal } = await import('../utils/modal.js');
  const confirmed = await showConfirmModal({
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    danger: true
  });
  
  if (confirmed) {
    // Perform deletion
    console.log('User confirmed deletion');
  } else {
    console.log('User cancelled');
  }
}
```

### Static Import (for frequently used modals)
```javascript
import { showConfirmModal } from '../utils/modal.js';

// Use directly without await import
async function handleAction() {
  const confirmed = await showConfirmModal({ ... });
}
```

## API Reference

### showConfirmModal(options)

**Parameters:**
- `title` (string, default: 'Confirm') - Modal heading
- `message` (string, default: '') - Modal body text
- `confirmLabel` (string, default: 'Confirm') - Text for confirm button
- `cancelLabel` (string, default: 'Cancel') - Text for cancel button
- `danger` (boolean, default: false) - Style confirm button as dangerous (red)

**Returns:** `Promise<boolean>`
- `true` if user clicked Confirm
- `false` if user clicked Cancel or pressed Escape

## Common Patterns

### Dangerous Action (Delete)
```javascript
const confirmed = await showConfirmModal({
  title: 'Delete Pattern',
  message: 'This action cannot be undone. Are you sure?',
  confirmLabel: 'Delete',
  cancelLabel: 'Cancel',
  danger: true // Red confirm button
});
```

### Safe Action (Reset)
```javascript
const confirmed = await showConfirmModal({
  title: 'Reset Settings',
  message: 'Reset all settings to defaults?',
  confirmLabel: 'Reset',
  cancelLabel: 'Cancel',
  danger: false // Normal blue button
});
```

### Quick Confirmation
```javascript
const confirmed = await showConfirmModal({
  title: 'Continue?',
  message: 'This will overwrite existing data.',
});
// Uses default labels: 'Confirm' and 'Cancel'
```

## Keyboard Support

Users can interact with modals using keyboard:
- `Tab` - Navigate between Cancel and Confirm buttons
- `Shift+Tab` - Navigate backwards
- `Enter` - Activate focused button
- `Escape` - Close modal (same as Cancel)

## Accessibility

The modal system automatically:
- Sets proper ARIA attributes
- Manages focus (focuses Confirm by default)
- Traps focus within modal
- Returns focus to previous element on close
- Works with screen readers

## CSS Classes

Apply custom styling if needed:
- `.confirm-modal-overlay` - Background overlay
- `.confirm-modal` - Modal container
- `.modal-title` - Heading
- `.modal-message` - Body text
- `.modal-actions` - Button container
- `.modal-cancel` - Cancel button
- `.modal-confirm` - Confirm button
- `.modal-confirm.danger` - Dangerous action styling

## Converting from window.confirm()

**Before:**
```javascript
function deleteItem() {
  if (confirm('Delete this item?')) {
    // Delete logic
  }
}
```

**After:**
```javascript
async function deleteItem() {
  const { showConfirmModal } = await import('../utils/modal.js');
  const confirmed = await showConfirmModal({
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    danger: true
  });
  
  if (confirmed) {
    // Delete logic
  }
}
```

**Important:** Don't forget to make the function `async`!

## Error Handling

```javascript
async function safeDelete() {
  try {
    const { showConfirmModal } = await import('../utils/modal.js');
    const confirmed = await showConfirmModal({ ... });
    
    if (confirmed) {
      // Perform action
    }
  } catch (error) {
    console.error('Modal error:', error);
    // Fallback to window.confirm if needed
    if (confirm('Fallback: Delete item?')) {
      // Perform action
    }
  }
}
```

## Examples from Codebase

### Pattern Deletion (patterns.js)
```javascript
const confirmed = await showConfirmModal({
  title: 'Delete Pattern',
  message: 'Are you sure you want to delete this pattern?',
  confirmLabel: 'Delete',
  cancelLabel: 'Cancel',
  danger: true
});
```

### Reset Layout (settings.js)
```javascript
const confirmed = await showConfirmModal({
  title: 'Reset Layout',
  message: 'Reset layout to default? This will restore the original section order and grid settings.',
  confirmLabel: 'Reset',
  cancelLabel: 'Cancel',
  danger: false
});
```

### Clear All (notes.js)
```javascript
const confirmed = await showConfirmModal({
  title: 'Clear All Notes',
  message: 'This will permanently delete all notes. Continue?',
  confirmLabel: 'Clear All',
  cancelLabel: 'Cancel',
  danger: true
});
```

## Testing

### Unit Test
```javascript
import { showConfirmModal } from '../utils/modal.js';

test('modal resolves to true on confirm', async () => {
  const modalPromise = showConfirmModal({ title: 'Test' });
  
  // Simulate user clicking confirm
  setTimeout(() => {
    document.querySelector('.modal-confirm').click();
  }, 100);
  
  const result = await modalPromise;
  expect(result).toBe(true);
});
```

### E2E Test (Playwright)
```javascript
test('should show modal and confirm action', async ({ page }) => {
  await page.click('button:has-text("Delete")');
  
  // Modal appears
  await expect(page.locator('.confirm-modal')).toBeVisible();
  
  // Click confirm
  await page.click('.modal-confirm');
  
  // Modal disappears
  await expect(page.locator('.confirm-modal')).not.toBeVisible();
});
```

## Tips and Best Practices

1. **Use dynamic import for code splitting:**
   ```javascript
   const { showConfirmModal } = await import('../utils/modal.js');
   ```

2. **Always await the result:**
   ```javascript
   const confirmed = await showConfirmModal({ ... });
   ```

3. **Make containing function async:**
   ```javascript
   async function handleClick() { ... }
   ```

4. **Use danger flag for destructive actions:**
   ```javascript
   danger: true // For delete, clear, reset all
   danger: false // For save, export, copy
   ```

5. **Provide clear, action-oriented labels:**
   ```javascript
   confirmLabel: 'Delete Pattern' // Not "Yes" or "OK"
   cancelLabel: 'Keep Pattern' // Not "No" or "Cancel"
   ```

6. **Keep messages concise:**
   ```javascript
   message: 'This action cannot be undone.' // Clear and brief
   ```

## Troubleshooting

### Modal doesn't appear
- Check that function is `async`
- Verify import path is correct
- Check browser console for errors

### Focus issues
- Modal automatically manages focus
- If issues persist, check for conflicting focus management

### Styling problems
- Ensure SCSS files are compiled
- Check for CSS conflicts
- Verify dark mode theme variables

### Animation glitches
- Clear browser cache
- Check for conflicting transitions
- Verify CSS class names match

## Support
For questions or issues, refer to:
- Full documentation: `MODAL_UNDO_IMPLEMENTATION.md`
- Source code: `src/js/utils/modal.js`
- Tests: `test/e2e/modal-undo.spec.js`
- Styles: `src/styles/components/_modals.scss`
