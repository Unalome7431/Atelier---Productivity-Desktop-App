/**
 * Platform & OS helper utilities for Atelier
 * Detects client operating system to dynamically format shortcuts (e.g. CMD vs Ctrl).
 */

export function isMacOS(): boolean {
  if (typeof window === 'undefined') return false;
  // Modern navigator.userAgentData API
  const nav = window.navigator as any;
  if (nav?.userAgentData?.platform) {
    return nav.userAgentData.platform.toLowerCase().includes('mac');
  }
  // Standard fallback
  const platform = nav?.platform || nav?.userAgent || '';
  return /Mac|iPhone|iPod|iPad/i.test(platform);
}

export function getModKeyLabel(): 'CMD' | 'Ctrl' {
  return isMacOS() ? 'CMD' : 'Ctrl';
}

/**
 * Automatically replace ⌘, CMD, or Cmd with the user OS modifier key ('CMD' or 'Ctrl').
 * Example:
 *   formatShortcut('⌘K') => 'Ctrl K' (on Windows/Linux) or 'CMD K' (on macOS)
 *   formatShortcut('⌘1') => 'Ctrl 1' (on Windows/Linux) or 'CMD 1' (on macOS)
 *   formatShortcut('Bold (⌘B)') => 'Bold (Ctrl B)' (on Windows/Linux)
 */
export function formatShortcut(shortcut: string): string {
  if (!shortcut) return '';
  const mod = getModKeyLabel();
  return shortcut
    .replace(/⌘\+?(\w+)/g, `${mod} $1`)
    .replace(/⌘/g, mod)
    .replace(/\b(CMD|Cmd)\+?(\w+)/g, `${mod} $2`)
    .replace(/\b(CMD|Cmd)\b/g, mod);
}
