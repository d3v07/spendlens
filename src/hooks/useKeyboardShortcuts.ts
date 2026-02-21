import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(customHandlers: ShortcutHandler[] = []) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    toast.success(`Switched to ${newTheme} mode`, { duration: 1500 });
  }, [theme, setTheme]);

  const defaultShortcuts: ShortcutHandler[] = [
    // Navigation
    { key: 'g', ctrl: true, description: 'Go to Dashboard', action: () => navigate('/dashboard') },
    { key: 'r', ctrl: true, shift: true, description: 'Go to Recommendations', action: () => navigate('/recommendations') },
    { key: 'b', ctrl: true, shift: true, description: 'Go to Budget Alerts', action: () => navigate('/budget-alerts') },
    { key: 's', ctrl: true, shift: true, description: 'Go to Simulator', action: () => navigate('/simulator') },
    { key: ',', ctrl: true, description: 'Go to Settings', action: () => navigate('/settings') },
    
    // Theme toggle
    { key: 'd', ctrl: true, shift: true, description: 'Toggle dark mode', action: toggleTheme },
    
    // Help
    { key: '/', ctrl: true, description: 'Show keyboard shortcuts', action: () => {
      const event = new CustomEvent('show-keyboard-shortcuts');
      window.dispatchEvent(event);
    }},
  ];

  const allShortcuts = [...defaultShortcuts, ...customHandlers];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      for (const shortcut of allShortcuts) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allShortcuts, location.pathname]);

  return { shortcuts: allShortcuts };
}

export function getShortcutDisplay(shortcut: ShortcutHandler): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('⌘/Ctrl');
  if (shortcut.shift) parts.push('⇧');
  if (shortcut.alt) parts.push('Alt');
  parts.push(shortcut.key.toUpperCase());
  return parts.join(' + ');
}
