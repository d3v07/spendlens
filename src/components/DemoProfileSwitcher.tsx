import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Beaker, ChevronDown, RotateCcw, Rocket, ShoppingCart, Cpu } from 'lucide-react';
import { DemoProfile } from '@/lib/demo-data';
import { cn } from '@/lib/utils';

interface DemoProfileSwitcherProps {
  currentProfile: DemoProfile;
  profiles: DemoProfile[];
  onProfileChange: (profileId: string) => void;
  onReset: () => void;
}

const profileIcons: Record<DemoProfile['type'], typeof Rocket> = {
  'startup-saas': Rocket,
  'ecommerce': ShoppingCart,
  'ml-heavy': Cpu,
};

const profileColors: Record<DemoProfile['type'], string> = {
  'startup-saas': 'text-primary bg-primary/10',
  'ecommerce': 'text-success bg-success/10',
  'ml-heavy': 'text-warning bg-warning/10',
};

export function DemoProfileSwitcher({ 
  currentProfile, 
  profiles, 
  onProfileChange, 
  onReset 
}: DemoProfileSwitcherProps) {
  const CurrentIcon = profileIcons[currentProfile.type];

  return (
    <Card className="border-dashed border-muted-foreground/30 bg-muted/30">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
              <Beaker className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Demo Mode:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2">
                    <div className={cn(
                      "h-5 w-5 rounded flex items-center justify-center",
                      profileColors[currentProfile.type]
                    )}>
                      <CurrentIcon className="h-3 w-3" />
                    </div>
                    <span>{currentProfile.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 bg-popover z-50">
                  {profiles.map((profile) => {
                    const Icon = profileIcons[profile.type];
                    const isActive = profile.id === currentProfile.id;
                    return (
                      <DropdownMenuItem
                        key={profile.id}
                        onClick={() => onProfileChange(profile.id)}
                        className={cn(
                          "flex items-start gap-3 p-3 cursor-pointer",
                          isActive && "bg-accent"
                        )}
                      >
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          profileColors[profile.type]
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{profile.name}</span>
                            {isActive && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1">
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {profile.description}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
