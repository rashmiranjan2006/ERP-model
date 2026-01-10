import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TimetableGrid } from "@/components/timetable/TimetableGrid";
import { Button } from "@/components/ui/button";
import { Download, User, Clock, BookOpen, Coffee, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTimetableEntries,
  useFaculty,
  useTimeSlots,
  transformToGridData,
  getTimeSlotLabels,
} from "@/hooks/useTimetable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function FacultySchedule() {
  const { user, role } = useAuth();
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
  const [currentFacultyId, setCurrentFacultyId] = useState<string | null>(null);

  const { data: faculty, isLoading: facultyLoading } = useFaculty();
  const { data: timeSlots, isLoading: timeSlotsLoading } = useTimeSlots();
  
  // For teachers, get their faculty record
  useEffect(() => {
    async function fetchCurrentFaculty() {
      if (role === 'teacher' && user) {
        const { data } = await supabase
          .from('faculty')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (data) {
          setCurrentFacultyId(data.id);
          setSelectedFacultyId(data.id);
        }
      }
    }
    fetchCurrentFaculty();
  }, [user, role]);

  // For admins, auto-select first faculty
  useEffect(() => {
    if (role === 'admin' && faculty && faculty.length > 0 && !selectedFacultyId) {
      setSelectedFacultyId(faculty[0].id);
    }
  }, [faculty, role, selectedFacultyId]);

  const { 
    data: entries, 
    isLoading: entriesLoading 
  } = useTimetableEntries(undefined, selectedFacultyId || undefined);

  const selectedFaculty = faculty?.find(f => f.id === selectedFacultyId);
  
  // Transform entries to grid format
  const gridData = entries && timeSlots 
    ? transformToGridData(entries, timeSlots)
    : {};
  
  const timeSlotLabels = timeSlots ? getTimeSlotLabels(timeSlots) : [];

  const isLoading = facultyLoading || timeSlotsLoading || entriesLoading;

  // Calculate stats
  const totalSlots = 7 * 5; // 7 slots per day * 5 days
  const theorySlots = entries?.filter(e => e.session_type === "theory").length || 0;
  const labSlots = entries?.filter(e => e.session_type === "lab").length || 0;
  const busySlots = theorySlots + labSlots;
  const freeSlots = totalSlots - busySlots;
  const weeklyHours = theorySlots + (labSlots * 2);

  // Calculate daily breakdown
  const dailyBreakdown = [1, 2, 3, 4, 5].map(day => {
    const dayEntries = entries?.filter(e => e.day_of_week === day) || [];
    return dayEntries.length;
  });

  return (
    <AppLayout
      title="Faculty Schedule"
      subtitle="Personal schedule and availability"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Faculty Profile Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              {role === 'admin' ? (
                <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                  <SelectTrigger className="w-[250px] h-auto text-xl font-semibold border-none p-0 shadow-none">
                    <SelectValue placeholder="Select Faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculty?.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <h2 className="text-xl font-semibold text-foreground">
                  {selectedFaculty?.name || "Loading..."}
                </h2>
              )}
              <p className="text-sm text-muted-foreground">
                {selectedFaculty?.department || "Department"}
              </p>
            </div>
          </div>
          <Button size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export Schedule
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Weekly Hours</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{weeklyHours}</p>
          </div>
          <div className="p-4 bg-slot-theory-bg rounded-xl border border-slot-theory-border">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-slot-theory" />
              <span className="text-sm text-muted-foreground">Theory Classes</span>
            </div>
            <p className="text-2xl font-semibold text-slot-theory">{theorySlots}</p>
          </div>
          <div className="p-4 bg-slot-lab-bg rounded-xl border border-slot-lab-border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slot-lab" />
              <span className="text-sm text-muted-foreground">Lab Sessions</span>
            </div>
            <p className="text-2xl font-semibold text-slot-lab">{labSlots}</p>
          </div>
          <div className="p-4 bg-success/5 rounded-xl border border-success/20">
            <div className="flex items-center gap-2 mb-2">
              <Coffee className="w-4 h-4 text-success" />
              <span className="text-sm text-muted-foreground">Free Slots</span>
            </div>
            <p className="text-2xl font-semibold text-success">{freeSlots}</p>
          </div>
        </div>

        {/* Loading/Empty State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !entries || entries.length === 0 ? (
          <Alert>
            <AlertDescription>
              No schedule found for this faculty. The timetable needs to be generated first.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Timetable */}
            <TimetableGrid 
              data={gridData} 
              timeSlots={timeSlotLabels}
            />

            {/* Daily Breakdown */}
            <div className="p-5 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-4">Daily Breakdown</h3>
              <div className="grid grid-cols-5 gap-4">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, idx) => {
                  const daySlots = dailyBreakdown[idx];
                  return (
                    <div key={day} className="text-center">
                      <p className="text-sm font-medium text-muted-foreground mb-2">{day.slice(0, 3)}</p>
                      <div className="h-24 bg-muted/30 rounded-lg flex items-end justify-center pb-2">
                        <div
                          className="w-8 bg-accent rounded-t transition-all"
                          style={{ height: `${(daySlots / 7) * 100}%`, minHeight: daySlots > 0 ? "8px" : "0" }}
                        />
                      </div>
                      <p className="text-sm font-semibold text-foreground mt-2">{daySlots}h</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sections Taught */}
            <div className="p-5 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-4">Sections & Subjects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from(new Set(entries?.map(e => `${e.section?.id}-${e.subject?.id}`)))
                  .map(key => {
                    const entry = entries?.find(e => `${e.section?.id}-${e.subject?.id}` === key);
                    if (!entry) return null;
                    
                    return (
                      <div key={key} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded">
                            {entry.section?.name}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {entry.session_type}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{entry.subject?.name}</p>
                        <p className="text-xs text-muted-foreground">{entry.room?.name}</p>
                      </div>
                    );
                  }).filter(Boolean)}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
