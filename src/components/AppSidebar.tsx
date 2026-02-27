import { Link, useLocation } from 'react-router-dom';
import { BarChart3, ChevronLeft, ChevronRight, ClipboardList, ImageIcon, LayoutDashboard, Settings, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUploadUrl } from '@/lib/api';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
    description: 'QA Overview Dashboard',
  },
  {
    title: 'API Performance',
    url: '/performance',
    icon: BarChart3,
    description: 'k6 API Performance Dashboard',
  },
  {
    title: 'AI Test Case Builder',
    url: '/ai-testcase',
    icon: Sparkles,
    description: 'AI Test Case Generator',
  },
  {
    title: 'Test Cases Management',
    url: '/test-cases',
    icon: ClipboardList,
    description: 'Manage test suites & cases',
  },
  {
    title: 'Gallery',
    url: '/screenshots',
    icon: ImageIcon,
    description: 'Upload & manage screenshots',
  },
];

const settingsItems = [
  {
    title: 'Profile',
    url: '/profile',
    icon: User,
    description: 'User profile',
  },
  {
    title: 'Settings',
    url: '#',
    icon: Settings,
    description: 'Application settings',
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { open, toggleSidebar } = useSidebar();
  const { organizations } = useAuth();

  // Use the first organization's logo if available
  const firstOrg = organizations?.[0];
  const orgLogoSrc = getUploadUrl(firstOrg?.logo_url);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-2 py-3">
          <div className="flex items-center gap-3 min-w-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg overflow-hidden shadow-md">
              <img 
                src={orgLogoSrc || `${import.meta.env.BASE_URL}logo.svg`} 
                alt={firstOrg?.name || 'Logo'} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              {firstOrg && (
                <span className="text-sm font-semibold truncate">{firstOrg.name}</span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 group-data-[collapsible=icon]:hidden"
            onClick={toggleSidebar}
          >
            {open ? (
              <ChevronLeft className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            <span className="sr-only">Toggle Sidebar</span> 
          </Button>
        </div>
      </SidebarHeader>
      
      <SidebarSeparator />
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.description}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.description}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
