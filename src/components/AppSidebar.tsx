import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, 
  SidebarMenuButton, SidebarFooter 
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { TrendingDown, LayoutDashboard, Lightbulb, Calculator, Bell, Settings, LogOut, Cpu, Users } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Recommendations', url: '/recommendations', icon: Lightbulb },
  { title: 'Rightsizing', url: '/rightsizing', icon: Cpu },
  { title: 'Team Allocation', url: '/team-allocation', icon: Users },
  { title: 'Budget Alerts', url: '/budget-alerts', icon: Bell },
  { title: 'Simulator', url: '/simulator', icon: Calculator },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <TrendingDown className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">SpendLens</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2">
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border space-y-2">
        <ThemeToggle />
        <Separator className="bg-sidebar-border" />
        <div className="text-sm text-sidebar-foreground/70 truncate">{user?.email}</div>
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
