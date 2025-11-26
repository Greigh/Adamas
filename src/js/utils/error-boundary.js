// Error Boundary Utility
// Provides error handling and recovery for critical application functions

export class ErrorBoundary {
  constructor(name = 'Component') {
    this.name = name;
    this.errors = [];
  }

  // Wrap a function with error handling
  wrap(fn, fallback = null) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(error, fn.name || 'anonymous function');
        if (fallback) {
          try {
            return await fallback(error, ...args);
          } catch (fallbackError) {
            console.error(`Fallback also failed for ${this.name}:`, fallbackError);
          }
        }
        throw error;
      }
    };
  }

  // Handle errors with logging and user notification
  handleError(error, context = '') {
    const errorInfo = {
      name: this.name,
      context,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    this.errors.push(errorInfo);

    // Log to console with structured format
    console.error(`[${this.name}] Error in ${context}:`, errorInfo);

    // Show user-friendly error message
    if (typeof showToast === 'function') {
      showToast(`An error occurred in ${this.name}. Please try again.`, 'error');
    }

    // Limit stored errors to prevent memory leaks
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-25);
    }
  }

  // Get recent errors for debugging
  getRecentErrors(count = 5) {
    return this.errors.slice(-count);
  }

  // Clear error history
  clearErrors() {
    this.errors = [];
  }
}

// Global error boundary instances
export const crmErrorBoundary = new ErrorBoundary('CRM Integration');
export const uiErrorBoundary = new ErrorBoundary('UI Components');
export const apiErrorBoundary = new ErrorBoundary('API Calls');

// Utility function to create error boundaries for modules
export function createModuleErrorBoundary(moduleName) {
  return new ErrorBoundary(moduleName);
}

// Global error handler for unhandled errors
export function setupGlobalErrorHandling() {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      console.error('Global error caught:', event.error);
      if (typeof showToast === 'function') {
        showToast('An unexpected error occurred. Please refresh the page.', 'error');
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      if (typeof showToast === 'function') {
        showToast('An unexpected error occurred. Please refresh the page.', 'error');
      }
    });
  }
}

// Safe execution wrapper for critical operations
export async function safeExecute(operation, errorBoundary, context = '') {
  return errorBoundary.wrap(operation)(context);
}