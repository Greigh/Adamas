/**
 * E2E tests for modal confirmation dialogs and undo functionality
 * Tests the accessible modal system and pattern deletion undo flows
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

const DIST_PATH = path.join(__dirname, '../../dist');
const BASE_URL = `file://${DIST_PATH}/index.html`;

test.describe('Modal Confirmation System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should show accessible modal when deleting a pattern', async ({ page }) => {
    // Navigate to Pattern Formatter section
    await page.click('text=Pattern Formatter');
    
    // Add a test pattern first
    const patternInput = await page.locator('#pattern-input');
    await patternInput.fill('test-pattern-123');
    await page.click('text=Format Pattern');
    
    // Click the delete button for the pattern
    const deleteBtn = await page.locator('.pattern-item .delete-btn').first();
    await deleteBtn.click();
    
    // Modal should appear
    const modal = await page.locator('.confirm-modal');
    await expect(modal).toBeVisible();
    
    // Check modal content
    await expect(modal.locator('.modal-title')).toContainText('Delete Pattern');
    await expect(modal.locator('.modal-message')).toContainText('delete this pattern');
    
    // Check ARIA attributes
    const modalRole = await modal.getAttribute('role');
    expect(modalRole).toBe('dialog');
    
    const ariaModal = await modal.getAttribute('aria-modal');
    expect(ariaModal).toBe('true');
    
    const ariaLabelledBy = await modal.getAttribute('aria-labelledby');
    expect(ariaLabelledBy).toBeTruthy();
  });

  test('should close modal on Cancel button click', async ({ page }) => {
    await page.click('text=Pattern Formatter');
    
    // Add pattern
    await page.fill('#pattern-input', 'test-cancel-pattern');
    await page.click('text=Format Pattern');
    
    // Click delete
    await page.click('.pattern-item .delete-btn');
    
    // Modal appears
    await expect(page.locator('.confirm-modal')).toBeVisible();
    
    // Click Cancel
    await page.click('.confirm-modal .modal-cancel');
    
    // Modal should disappear
    await expect(page.locator('.confirm-modal')).not.toBeVisible();
    
    // Pattern should still exist
    await expect(page.locator('.pattern-item')).toHaveCount(1);
  });

  test('should close modal on Escape key press', async ({ page }) => {
    await page.click('text=Pattern Formatter');
    
    // Add pattern
    await page.fill('#pattern-input', 'test-escape-pattern');
    await page.click('text=Format Pattern');
    
    // Click delete
    await page.click('.pattern-item .delete-btn');
    
    // Modal appears
    await expect(page.locator('.confirm-modal')).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Modal should disappear
    await expect(page.locator('.confirm-modal')).not.toBeVisible();
    
    // Pattern should still exist
    await expect(page.locator('.pattern-item')).toHaveCount(1);
  });

  test('should delete pattern when Confirm button clicked', async ({ page }) => {
    await page.click('text=Pattern Formatter');
    
    // Add pattern
    await page.fill('#pattern-input', 'test-confirm-delete');
    await page.click('text=Format Pattern');
    
    // Verify pattern exists
    await expect(page.locator('.pattern-item')).toHaveCount(1);
    
    // Click delete
    await page.click('.pattern-item .delete-btn');
    
    // Click Confirm in modal
    await page.click('.confirm-modal .modal-confirm');
    
    // Modal should disappear
    await expect(page.locator('.confirm-modal')).not.toBeVisible();
    
    // Toast notification should appear
    await expect(page.locator('.toast-container .toast')).toBeVisible();
    await expect(page.locator('.toast')).toContainText('Pattern deleted');
  });

  test('should trap focus within modal', async ({ page }) => {
    await page.click('text=Pattern Formatter');
    
    // Add pattern
    await page.fill('#pattern-input', 'test-focus-trap');
    await page.click('text=Format Pattern');
    
    // Click delete
    await page.click('.pattern-item .delete-btn');
    
    // Modal appears
    await expect(page.locator('.confirm-modal')).toBeVisible();
    
    // Focus should be on confirm button (dangerous action)
    const confirmBtn = page.locator('.confirm-modal .modal-confirm');
    await expect(confirmBtn).toBeFocused();
    
    // Tab should cycle between cancel and confirm
    await page.keyboard.press('Tab');
    const cancelBtn = page.locator('.confirm-modal .modal-cancel');
    await expect(cancelBtn).toBeFocused();
    
    // Tab again should return to confirm
    await page.keyboard.press('Tab');
    await expect(confirmBtn).toBeFocused();
  });
});

test.describe('Pattern Deletion Undo System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.click('text=Pattern Formatter');
  });

  test('should show undo action in toast after deletion', async ({ page }) => {
    // Add pattern
    await page.fill('#pattern-input', 'test-undo-pattern');
    await page.click('text=Format Pattern');
    
    // Delete pattern
    await page.click('.pattern-item .delete-btn');
    await page.click('.confirm-modal .modal-confirm');
    
    // Toast with undo action should appear
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Pattern deleted');
    
    // Undo button should be present
    const undoBtn = toast.locator('.toast-action');
    await expect(undoBtn).toBeVisible();
    await expect(undoBtn).toContainText('Undo');
  });

  test('should restore pattern when undo is clicked', async ({ page }) => {
    const testPattern = 'test-restore-pattern-xyz';
    
    // Add pattern
    await page.fill('#pattern-input', testPattern);
    await page.click('text=Format Pattern');
    
    // Verify pattern exists with formatted value
    const patternItem = page.locator('.pattern-item').first();
    await expect(patternItem).toBeVisible();
    const formattedValue = await patternItem.locator('.pattern-value').textContent();
    
    // Delete pattern
    await page.click('.pattern-item .delete-btn');
    await page.click('.confirm-modal .modal-confirm');
    
    // Pattern should be gone
    await expect(page.locator('.pattern-item')).toHaveCount(0);
    
    // Click undo
    await page.click('.toast .toast-action');
    
    // Pattern should be restored
    await expect(page.locator('.pattern-item')).toHaveCount(1);
    
    // Verify it has the same formatted value
    const restoredValue = await page.locator('.pattern-value').textContent();
    expect(restoredValue).toBe(formattedValue);
    
    // Toast should show undo confirmation
    await expect(page.locator('.toast')).toContainText('Pattern restored');
  });

  test('should finalize deletion after undo window expires', async ({ page }) => {
    // Add pattern
    await page.fill('#pattern-input', 'test-expire-undo');
    await page.click('text=Format Pattern');
    
    // Delete pattern
    await page.click('.pattern-item .delete-btn');
    await page.click('.confirm-modal .modal-confirm');
    
    // Wait for undo window to expire (5 seconds + buffer)
    await page.waitForTimeout(5500);
    
    // Toast should disappear
    await expect(page.locator('.toast')).not.toBeVisible();
    
    // Pattern should remain deleted (cannot be recovered)
    await expect(page.locator('.pattern-item')).toHaveCount(0);
  });

  test('should preserve pattern order when undoing', async ({ page }) => {
    // Add multiple patterns
    const patterns = ['pattern-A', 'pattern-B', 'pattern-C'];
    for (const pattern of patterns) {
      await page.fill('#pattern-input', pattern);
      await page.click('text=Format Pattern');
    }
    
    // Delete middle pattern (B)
    const patternItems = page.locator('.pattern-item');
    await expect(patternItems).toHaveCount(3);
    await patternItems.nth(1).locator('.delete-btn').click();
    await page.click('.confirm-modal .modal-confirm');
    
    // Only A and C remain
    await expect(patternItems).toHaveCount(2);
    
    // Undo deletion
    await page.click('.toast .toast-action');
    
    // All three should be back
    await expect(patternItems).toHaveCount(3);
    
    // Verify order is preserved (A, B, C)
    const values = await patternItems.locator('.pattern-value').allTextContents();
    expect(values[0]).toContain('pattern-A');
    expect(values[1]).toContain('pattern-B');
    expect(values[2]).toContain('pattern-C');
  });
});

test.describe('Modal Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should have proper keyboard navigation in Settings reset', async ({ page }) => {
    await page.click('text=Settings');
    
    // Scroll to reset button
    await page.evaluate(() => {
      document.querySelector('#reset-all-data')?.scrollIntoView();
    });
    
    // Click reset
    await page.click('#reset-all-data');
    
    // Modal should appear with focus on dangerous action
    const modal = page.locator('.confirm-modal');
    await expect(modal).toBeVisible();
    
    // Confirm button should have focus (dangerous action)
    await expect(modal.locator('.modal-confirm')).toBeFocused();
    
    // Can navigate with keyboard
    await page.keyboard.press('Tab');
    await expect(modal.locator('.modal-cancel')).toBeFocused();
    
    // Enter key on cancel should close modal
    await page.keyboard.press('Enter');
    await expect(modal).not.toBeVisible();
  });

  test('should announce modal to screen readers', async ({ page }) => {
    await page.click('text=Pattern Formatter');
    
    // Add and delete pattern
    await page.fill('#pattern-input', 'test-sr-announce');
    await page.click('text=Format Pattern');
    await page.click('.pattern-item .delete-btn');
    
    const modal = page.locator('.confirm-modal');
    
    // Check live region for announcements
    const liveRegion = modal.locator('[aria-live]');
    if (await liveRegion.count() > 0) {
      const ariaLive = await liveRegion.first().getAttribute('aria-live');
      expect(['polite', 'assertive']).toContain(ariaLive);
    }
    
    // Modal should have aria-labelledby and aria-describedby
    const labelledBy = await modal.getAttribute('aria-labelledby');
    const describedBy = await modal.getAttribute('aria-describedby');
    
    expect(labelledBy).toBeTruthy();
    expect(describedBy).toBeTruthy();
  });
});

test.describe('Cross-Module Confirmation Modals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should show modal for clearing all notes', async ({ page }) => {
    await page.click('text=Notes');
    
    // Add a note
    await page.fill('#notes-input', 'Test note to clear');
    
    // Click clear all (if button exists)
    const clearBtn = page.locator('button:has-text("Clear All")');
    if (await clearBtn.count() > 0) {
      await clearBtn.click();
      
      // Modal should appear
      await expect(page.locator('.confirm-modal')).toBeVisible();
      await expect(page.locator('.modal-title')).toContainText('Clear');
    }
  });

  test('should show modal for resetting layout in Settings', async ({ page }) => {
    await page.click('text=Settings');
    
    // Scroll to reset layout button
    await page.evaluate(() => {
      document.querySelector('button:has-text("Reset Layout")')?.scrollIntoView();
    });
    
    const resetLayoutBtn = page.locator('button:has-text("Reset Layout")');
    if (await resetLayoutBtn.count() > 0) {
      await resetLayoutBtn.click();
      
      // Modal should appear
      await expect(page.locator('.confirm-modal')).toBeVisible();
      await expect(page.locator('.modal-title')).toContainText('Reset Layout');
      
      // Should not be marked as dangerous (danger: false)
      const confirmBtn = page.locator('.confirm-modal .modal-confirm');
      const isDanger = await confirmBtn.evaluate(el => 
        el.classList.contains('danger') || el.classList.contains('modal-confirm-danger')
      );
      expect(isDanger).toBe(false);
    }
  });
});
