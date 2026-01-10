import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  GraduationCap,
  Building2,
  Settings,
  FileText,
  ChevronLeft,
  Sparkles,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: ('admin' | 'teacher' | 'student')[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ['admin'] },
  { name: "Admin Control", href: "/admin", icon: Settings, roles: ['admin'] },
  { name: "Class Timetable", href: "/class", icon: Calendar, roles: ['admin', 'student'] },
  { name: "Faculty Schedule", href: "/faculty", icon: Users, roles: ['admin', 'teacher'] },
  { name: "Room Occupancy", href: "/rooms", icon: Building2, roles: ['admin'] },
];

const secondaryNav: NavItem[] = [
  { name: "Reports", href: "/reports", icon: FileText, roles: ['admin'] },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { role } = useAuth();

  const filteredNavigation = navigation.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );

  const filteredSecondaryNav = secondaryNav.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">TimetableAI</span>
            <span className="text-xs text-muted-foreground">Smart Scheduling</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="mb-2 px-3">
          {!collapsed && (
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Main
            </span>
          )}
        </div>
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "nav-item",
                isActive && "active"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-accent" : "")} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}

        {filteredSecondaryNav.length > 0 && (
          <>
            <div className="mt-6 mb-2 px-3">
              {!collapsed && (
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Export
                </span>
              )}
            </div>
            {filteredSecondaryNav.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "nav-item",
                    isActive && "active"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-accent" : "")} />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* Status Card */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-4 rounded-xl bg-success/5 border border-success/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            <span className="text-xs font-medium text-success">System Optimized</span>
          </div>
          <p className="text-xs text-muted-foreground">
            All schedules are conflict-free and optimized.
          </p>
        </div>
      )}

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <ChevronLeft
          className={cn(
            "w-5 h-5 transition-transform duration-300",
            collapsed && "rotate-180"
          )}
        />
      </button>
    </aside>
  );
}
