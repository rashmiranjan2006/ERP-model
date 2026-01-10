import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/timetable/StatusBadge";
import { TimetableGrid } from "@/components/timetable/TimetableGrid";
import { sampleTimetableData } from "@/data/mockTimetable";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Users,
  Building2,
  CheckCircle2,
  Sparkles,
  Clock,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <AppLayout
      title="Dashboard"
      subtitle="AI-Powered Timetable Management System"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent rounded-2xl border border-border">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Welcome back, Administrator
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Your timetables are optimized and ready. All 24 classes, 45 faculty members, and 12 rooms are scheduled without conflicts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status="optimized" />
            <Button className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Timetable
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Classes"
            value={24}
            subtitle="Across 4 departments"
            icon={GraduationCap}
            variant="accent"
          />
          <StatCard
            title="Faculty Members"
            value={45}
            subtitle="Full-time & visiting"
            icon={Users}
            trend={{ value: 5, positive: true }}
          />
          <StatCard
            title="Rooms & Labs"
            value={12}
            subtitle="92% utilization"
            icon={Building2}
          />
          <StatCard
            title="Conflicts Resolved"
            value={0}
            subtitle="AI-optimized schedule"
            icon={CheckCircle2}
            variant="success"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin"
            className="group p-5 bg-card rounded-xl border border-border hover:border-accent/50 hover:shadow-elevated transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Admin Control</p>
                  <p className="text-sm text-muted-foreground">Manage constraints</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/class"
            className="group p-5 bg-card rounded-xl border border-border hover:border-slot-theory/50 hover:shadow-elevated transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slot-theory-bg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-slot-theory" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Class Timetable</p>
                  <p className="text-sm text-muted-foreground">View schedules</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-slot-theory group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link
            to="/rooms"
            className="group p-5 bg-card rounded-xl border border-border hover:border-slot-lab/50 hover:shadow-elevated transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slot-lab-bg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-slot-lab" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Room Occupancy</p>
                  <p className="text-sm text-muted-foreground">Lab & room utilization</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-slot-lab group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>

        {/* Preview Timetable */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">This Week's Schedule</h3>
              <p className="text-sm text-muted-foreground">CSE - Section A (Preview)</p>
            </div>
            <Link to="/class">
              <Button variant="outline" size="sm" className="gap-2">
                View Full Timetable
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <TimetableGrid data={sampleTimetableData} />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 p-4 bg-muted/30 rounded-xl">
          <span className="text-sm font-medium text-muted-foreground">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slot-theory-bg border border-slot-theory-border" />
            <span className="text-sm text-muted-foreground">Theory</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slot-lab-bg border border-slot-lab-border" />
            <span className="text-sm text-muted-foreground">Lab</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slot-free border border-slot-free-border border-dashed" />
            <span className="text-sm text-muted-foreground">Free</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slot-conflict-bg border border-slot-conflict" />
            <span className="text-sm text-muted-foreground">Conflict</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
