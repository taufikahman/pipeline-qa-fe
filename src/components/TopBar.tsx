import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, Moon, Sun, Monitor, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { getUploadUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TopBar() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="size-4" />;
      case 'dark':
        return <Moon className="size-4" />;
      default:
        return <Monitor className="size-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'System';
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 gap-4">
      {/* Left: Sidebar trigger */}
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Profile Avatar Dropdown */}
      {user && (() => {
        const avatarSrc = getUploadUrl(user.avatar_url);
        const initial = (user.full_name || user.email).charAt(0).toUpperCase();

        return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-7 w-7 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-ring">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="size-7 rounded-full object-cover ring-2 ring-background" />
              ) : (
                <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold ring-2 ring-background">
                  {initial}
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
            {/* User Header */}
            <div className="flex items-center gap-3 px-3 py-3">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Avatar" className="size-10 shrink-0 rounded-full object-cover" />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-base font-bold">
                  {initial}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate">
                  {user.full_name || 'User'}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user.email}
                </span>
              </div>
            </div>

            <DropdownMenuSeparator />

            {/* Profile */}
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/profile" className="flex items-center gap-2">
                <User className="size-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>

            {/* Account settings */}
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/profile" className="flex items-center gap-2">
                <Settings className="size-4" />
                <span>Account settings</span>
              </Link>
            </DropdownMenuItem>

            {/* Theme Submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer">
                {getThemeIcon()}
                <span>Theme</span>
                <span className="ml-auto text-xs text-muted-foreground">{getThemeLabel()}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                  <Sun className="mr-2 size-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                  <Moon className="mr-2 size-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                  <Monitor className="mr-2 size-4" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            {/* Log out */}
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut className="mr-2 size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        );
      })()}
    </header>
  );
}
