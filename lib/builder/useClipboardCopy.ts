/**
 * Clipboard Copy Hook
 * 
 * Reusable hook for copying text to clipboard with "Copied" feedback state.
 * Client-side only (uses useState and navigator.clipboard).
 */

'use client';

import { useState } from 'react';

/**
 * Hook for clipboard copy with feedback state
 * Returns: [copied state, copy function]
 */
export function useClipboardCopy(): [boolean, (text: string) => Promise<boolean>] {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        return true;
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }
        return success;
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  };

  return [copied, copyToClipboard];
}


