import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TimetableGrid } from "@/components/timetable/TimetableGrid";
import { Button } from "@/components/ui/button";
import { Download, Share2, Printer, CalendarDays, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useTimetableEntries,
  useSections,
  useTimeSlots,
  transformToGridData,
  getTimeSlotLabels,
} from "@/hooks/useTimetable";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ClassTimetable() {
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  const { data: sections, isLoading: sectionsLoading } = useSections();
  const { data: timeSlots, isLoading: timeSlotsLoading } = useTimeSlots();
  const { 
    data: entries, 
    isLoading: entriesLoading 
  } = useTimetableEntries(selectedSectionId || undefined);

  // Auto-select first section
  if (sections && sections.length > 0 && !selectedSectionId) {
    setSelectedSectionId(sections[0].id);
  }

  const selectedSection = sections?.find(s => s.id === selectedSectionId);
  
  // Transform entries to grid format
  const gridData = entries && timeSlots 
    ? transformToGridData(entries, timeSlots)
    : {};
  
  const timeSlotLabels = timeSlots ? getTimeSlotLabels(timeSlots) : [];

  const isLoading = sectionsLoading || timeSlotsLoading || entriesLoading;

  // Calculate stats
  const theoryHours = entries?.filter(e => e.session_type === "theory").length || 0;
  const labHours = (entries?.filter(e => e.session_type === "lab").length || 0) * 2;
  const uniqueSubjects = new Set(entries?.map(e => e.subject?.id)).size;
  const uniqueFaculty = new Set(entries?.map(e => e.faculty?.id)).size;

  return (
    <AppLayout
      title="Class Timetable"
      subtitle="View and export class schedules"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slot-theory-bg flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-slot-theory" />
            </div>
            <div>
              <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
                <SelectTrigger className="w-[200px] h-auto text-xl font-semibold border-none p-0 shadow-none">
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  {sections?.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {selectedSection?.department} • {selectedSection?.classroom}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share Link
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
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
              No timetable entries found for this section. An admin needs to generate the timetable first.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Timetable */}
            <TimetableGrid 
              data={gridData} 
              timeSlots={timeSlotLabels}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slot-theory-bg rounded-xl border border-slot-theory-border">
                <p className="text-sm text-muted-foreground mb-1">Theory Hours</p>
                <p className="text-2xl font-semibold text-slot-theory">{theoryHours}</p>
                <p className="text-xs text-muted-foreground mt-1">per week</p>
              </div>
              <div className="p-4 bg-slot-lab-bg rounded-xl border border-slot-lab-border">
                <p className="text-sm text-muted-foreground mb-1">Lab Hours</p>
                <p className="text-2xl font-semibold text-slot-lab">{labHours}</p>
                <p className="text-xs text-muted-foreground mt-1">per week</p>
              </div>
              <div className="p-4 bg-card rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Subjects</p>
                <p className="text-2xl font-semibold text-foreground">{uniqueSubjects}</p>
                <p className="text-xs text-muted-foreground mt-1">this semester</p>
              </div>
              <div className="p-4 bg-card rounded-xl border border-border">
                <p className="text-sm text-muted-foreground mb-1">Faculty</p>
                <p className="text-2xl font-semibold text-foreground">{uniqueFaculty}</p>
                <p className="text-xs text-muted-foreground mt-1">assigned</p>
              </div>
            </div>

            {/* Subject List */}
            <div className="p-5 bg-card rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-4">Subject Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from(new Set(entries?.map(e => e.subject?.id)))
                  .map(subjectId => {
                    const entry = entries?.find(e => e.subject?.id === subjectId);
                    if (!entry) return null;
                    const subjectEntries = entries?.filter(e => e.subject?.id === subjectId);
                    const theoryCount = subjectEntries?.filter(e => e.session_type === "theory").length || 0;
                    const labCount = subjectEntries?.filter(e => e.session_type === "lab").length || 0;
                    
                    return (
                      <div key={subjectId} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded">
                            {entry.subject?.code}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {theoryCount}T{labCount > 0 ? ` + ${labCount * 2}L` : ''}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{entry.subject?.name}</p>
                        <p className="text-xs text-muted-foreground">{entry.faculty?.name}</p>
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
