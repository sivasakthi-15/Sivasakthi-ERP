/**
 * Safe local storage wrapper.
 * Prevents QuotaExceededError and other storage-related exceptions from crashing the application.
 */

export const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`[Storage Warning] Failed to save '${key}' to localStorage.`, error);
    // Return false to indicate failure without throwing an exception
    return false;
  }
};

export const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`[Storage Warning] Failed to read '${key}' from localStorage.`, error);
    return null;
  }
};

export const safeRemoveItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`[Storage Warning] Failed to remove '${key}' from localStorage.`, error);
    return false;
  }
};
