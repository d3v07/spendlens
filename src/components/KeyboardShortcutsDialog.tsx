import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
}

interface KeyboardShortcutsDialogProps {
  shortcuts: Shortcut[];
}

function getShortcutKeys(shortcut: Shortcut): string[] {
  const keys: string[] = [];
  if (shortcut.ctrl) keys.push('⌘/Ctrl');
  if (shortcut.shift) keys.push('⇧');
  if (shortcut.alt) keys.push('Alt');
  keys.push(shortcut.key.toUpperCase());
  return keys;
}

export function KeyboardShortcutsDialog({ shortcuts }: KeyboardShortcutsDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleShowShortcuts = () => setOpen(true);
    window.addEventListener('show-keyboard-shortcuts', handleShowShortcuts);
    return () => window.removeEventListener('show-keyboard-shortcuts', handleShowShortcuts);
  }, []);

  const navigationShortcuts = shortcuts.filter(s => 
    s.description.toLowerCase().includes('go to')
  );
  
  const actionShortcuts = shortcuts.filter(s => 
    !s.description.toLowerCase().includes('go to')
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Navigation */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Navigation</h3>
            <div className="space-y-2">
              {navigationShortcuts.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {getShortcutKeys(shortcut).map((key, j) => (
                      <Badge key={j} variant="secondary" className="font-mono text-xs px-1.5">
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Actions</h3>
            <div className="space-y-2">
              {actionShortcuts.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {getShortcutKeys(shortcut).map((key, j) => (
                      <Badge key={j} variant="secondary" className="font-mono text-xs px-1.5">
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2 border-t">
            Press <Badge variant="secondary" className="font-mono text-xs px-1">⌘/Ctrl</Badge> + <Badge variant="secondary" className="font-mono text-xs px-1">/</Badge> anytime to show this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
