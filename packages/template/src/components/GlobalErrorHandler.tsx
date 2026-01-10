'use client';
import { useEffect } from 'react';

/**
 * Global error handler component that catches unhandled errors and promise rejections
 * This prevents white screen crashes in Capacitor apps
 */
export default function GlobalErrorHandler() {
  useEffect(() => {
    // Create toast container if it doesn't exist
    if (!document.getElementById('error-toast-container')) {
      const container = document.createElement('div');
      container.id = 'error-toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    // Handle uncaught JavaScript errors
    const handleError = (event: ErrorEvent) => {
      console.error('Uncaught error:', event.error);

      // Prevent default browser error handling (which can cause white screen)
      event.preventDefault();

      // Show user-friendly toast
      showErrorToast('An unexpected error occurred. Please try again.');

      // You can log to error reporting service here
      // Example: Sentry.captureException(event.error);

      return true;
    };

    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);

      // Prevent default browser error handling
      event.preventDefault();

      // Show user-friendly toast
      showErrorToast('An unexpected error occurred. Please try again.');

      // You can log to error reporting service here
      // Example: Sentry.captureException(event.reason);
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null; // This component doesn't render anything
}

/**
 * Show a user-friendly error toast on screen
 */
function showErrorToast(message: string) {
  console.warn('Error Toast:', message);

  // Ensure container exists (in case it was removed or never created)
  let container = document.getElementById('error-toast-container');
  if (!container) {
    console.log('Creating toast container...');
    container = document.createElement('div');
    container.id = 'error-toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  // Create toast element with native iOS styling
  const toast = document.createElement('div');
  const toastId = `toast-${Date.now()}`;
  toast.id = toastId;

  // iOS-native style: subtle, blurred, system-like
  toast.style.cssText = `
    background: rgba(255, 255, 255, 0.95);
    color: #1c1c1e;
    padding: 12px 16px;
    border-radius: 14px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 340px;
    min-width: 280px;
    font-size: 15px;
    font-weight: 400;
    line-height: 1.4;
    pointer-events: auto;
    animation: slideIn 0.4s cubic-bezier(0.36, 0.66, 0.04, 1);
    transition: opacity 0.3s ease-out;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 0.5px solid rgba(0, 0, 0, 0.04);
  `;

  // Check if dark mode
  const isDarkMode =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (isDarkMode) {
    toast.style.background = 'rgba(44, 44, 46, 0.95)';
    toast.style.color = '#ffffff';
    toast.style.borderColor = 'rgba(255, 255, 255, 0.1)';
  }

  // Content container
  const content = document.createElement('div');
  content.style.cssText =
    'flex: 1; display: flex; align-items: center; gap: 10px;';

  // iOS system icon - using SVG for crisp rendering
  const iconContainer = document.createElement('div');
  iconContainer.style.cssText = `
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  iconContainer.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#FF9500" opacity="0.2"/>
      <path d="M12 7v6M12 16v.5" stroke="#FF9500" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `;
  content.appendChild(iconContainer);

  // Add message with iOS typography
  const messageEl = document.createElement('span');
  messageEl.textContent = message;
  messageEl.style.cssText = `
    flex: 1;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
    font-size: 15px;
    font-weight: 400;
    letter-spacing: -0.24px;
  `;
  content.appendChild(messageEl);

  toast.appendChild(content);

  // iOS-style dismiss button (subtle)
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `;
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: ${isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)'};
    cursor: pointer;
    padding: 4px;
    margin: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s ease;
    flex-shrink: 0;
  `;
  closeBtn.onmouseover = () => {
    closeBtn.style.background = isDarkMode
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.05)';
    closeBtn.style.color = isDarkMode
      ? 'rgba(255, 255, 255, 0.8)'
      : 'rgba(0, 0, 0, 0.6)';
  };
  closeBtn.onmouseout = () => {
    closeBtn.style.background = 'none';
    closeBtn.style.color = isDarkMode
      ? 'rgba(255, 255, 255, 0.5)'
      : 'rgba(0, 0, 0, 0.3)';
  };
  closeBtn.onclick = () => removeToast(toastId);
  toast.appendChild(closeBtn);

  // Add animation styles if not already added
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px) scale(0.9);
          opacity: 0;
        }
        to {
          transform: translateX(0) scale(1);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0) scale(1);
          opacity: 1;
        }
        to {
          transform: translateX(400px) scale(0.9);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Add to container (should always exist at this point)
  console.log('Adding toast to container...');
  container.appendChild(toast);
  console.log('Toast added successfully');

  // Auto-remove after 4 seconds (iOS typical timing)
  setTimeout(() => removeToast(toastId), 4000);
}

/**
 * Remove toast with animation
 */
function removeToast(toastId: string) {
  const toast = document.getElementById(toastId);
  if (toast) {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }
}
