import { Bell, Search, User, Download, Share2, LogOut, Shield, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const roleIcons = {
    admin: <Shield className="w-3 h-3" />,
    teacher: <Users className="w-3 h-3" />,
    student: <GraduationCap className="w-3 h-3" />
  };

  const roleColors = {
    admin: 'bg-destructive/10 text-destructive border-destructive/20',
    teacher: 'bg-primary/10 text-primary border-primary/20',
    student: 'bg-success/10 text-success border-success/20'
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card/50 backdrop-blur-sm">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search classes, faculty..."
            className="w-64 pl-9 bg-muted/50 border-transparent focus:border-border focus:bg-card"
          />
        </div>

        {/* Actions */}
        <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
        <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
          <Download className="w-4 h-4" />
          Export PDF
        </Button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        </button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{user?.email}</p>
                {role && (
                  <Badge variant="outline" className={`w-fit text-xs ${roleColors[role]}`}>
                    {roleIcons[role]}
                    <span className="ml-1 capitalize">{role}</span>
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
