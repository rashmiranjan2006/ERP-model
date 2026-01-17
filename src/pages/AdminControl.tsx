import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TimetableGrid } from "@/components/timetable/TimetableGrid";
import { FilterBar } from "@/components/timetable/FilterBar";
import { StatusBadge } from "@/components/timetable/StatusBadge";
import { SlotData } from "@/components/timetable/SlotCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Lock,
  Unlock,
  RefreshCw,
  Save,
  History,
  Settings2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  useTimetableEntries,
  useSections,
  useTimeSlots,
  useGenerateTimetable,
  useToggleLock,
  transformToGridData,
  getTimeSlotLabels,
} from "@/hooks/useTimetable";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminControl() {
  const [viewFilter, setViewFilter] = useState("week");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<{
    day: string;
    time: string;
    slot: SlotData;
    entryId?: string;
  } | null>(null);

  const { data: sections, isLoading: sectionsLoading } = useSections();
  const { data: timeSlots, isLoading: timeSlotsLoading } = useTimeSlots();
  const { 
    data: entries, 
    isLoading: entriesLoading,
    refetch: refetchEntries 
  } = useTimetableEntries(selectedSection || undefined);
  
  const generateMutation = useGenerateTimetable();
  const toggleLockMutation = useToggleLock();

  // Transform entries to grid format
  const gridData = entries && timeSlots 
    ? transformToGridData(entries, timeSlots)
    : {};
  
  const timeSlotLabels = timeSlots ? getTimeSlotLabels(timeSlots) : [];

  const handleSlotClick = (day: string, time: string, slot: SlotData) => {
    if (slot.type !== "free") {
      setSelectedSlot({ day, time, slot, entryId: slot.id });
    }
  };

  const handleGenerate = () => {
    generateMutation.mutate("generate");
  };

  const handleRegenerate = () => {
    generateMutation.mutate("regenerate");
  };

  const handleToggleLock = () => {
    if (selectedSlot?.entryId) {
      toggleLockMutation.mutate({
        id: selectedSlot.entryId,
        isLocked: selectedSlot.slot.isLocked || false,
      });
      setSelectedSlot(null);
    }
  };

  // Get locked entries for display
  const lockedEntries = entries?.filter(e => e.is_locked) || [];
  
  const isLoading = sectionsLoading || timeSlotsLoading || entriesLoading;
  const hasNoEntries = !entriesLoading && (!entries || entries.length === 0);

  return (
    <AppLayout
      title="Admin Control Panel"
      subtitle="Manage timetable constraints and generation"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-4">
            <StatusBadge status={hasNoEntries ? "pending" : "optimized"} />
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="text-sm">
              <span className="text-muted-foreground">Total entries:</span>{" "}
              <span className="font-medium text-foreground">{entries?.length || 0}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <History className="w-4 h-4" />
              History
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Constraints
            </Button>
            {hasNoEntries ? (
              <Button 
                size="sm" 
                className="gap-2"
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate Timetable
              </Button>
            ) : (
              <Button 
                size="sm" 
                className="gap-2"
                onClick={handleRegenerate}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Regenerate
              </Button>
            )}
          </div>
        </div>

        {/* Section Filter */}
        <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Section:</span>
            <Select 
              value={selectedSection || "all"} 
              onValueChange={(val) => setSelectedSection(val === "all" ? "" : val)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections
                  ?.filter((section) => Boolean(section?.id))
                  .map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <FilterBar
            activeFilter={viewFilter}
            onFilterChange={setViewFilter}
            selectedClass={selectedSection}
            onClassChange={setSelectedSection}
          />
        </div>

        {/* Loading/Empty State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : hasNoEntries ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No timetable entries found. Click "Generate Timetable" to create a new schedule.
              Make sure you have added faculty and assigned them to subjects first.
            </AlertDescription>
          </Alert>
        ) : (
          <TimetableGrid
            data={gridData}
            timeSlots={timeSlotLabels}
            onSlotClick={handleSlotClick}
          />
        )}

        {/* Constraints Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-5 bg-card rounded-xl border border-border">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              Locked Slots ({lockedEntries.length})
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {lockedEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No locked slots</p>
              ) : (
                lockedEntries.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {entry.subject?.code} - {entry.subject?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {["Mon", "Tue", "Wed", "Thu", "Fri"][entry.day_of_week - 1]}, {entry.room?.name}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleLockMutation.mutate({ id: entry.id, isLocked: true })}
                    >
                      <Unlock className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-5 bg-card rounded-xl border border-border">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              Active Constraints
            </h3>
            <div className="space-y-2 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">No faculty overlap</p>
                <p className="text-xs text-muted-foreground">Faculty can't be in two places</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">Continuous lab sessions</p>
                <p className="text-xs text-muted-foreground">Labs span 2 consecutive slots</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">Fixed classrooms</p>
                <p className="text-xs text-muted-foreground">Theory in assigned rooms only</p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-card rounded-xl border border-border">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              Generation Stats
            </h3>
            <div className="space-y-2 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">Sections covered</p>
                <p className="text-xs text-muted-foreground">
                  {new Set(entries?.map(e => e.section?.id)).size} / {sections?.length || 0}
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">Lab sessions</p>
                <p className="text-xs text-muted-foreground">
                  {entries?.filter(e => e.session_type === "lab").length || 0} scheduled
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">Theory sessions</p>
                <p className="text-xs text-muted-foreground">
                  {entries?.filter(e => e.session_type === "theory").length || 0} scheduled
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Slot Detail Modal */}
        <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedSlot?.slot.subject}</DialogTitle>
              <DialogDescription>
                {selectedSlot?.day}, {selectedSlot?.time}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Subject Code</p>
                  <p className="font-medium">{selectedSlot?.slot.subjectCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedSlot?.slot.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Faculty</p>
                  <p className="font-medium">{selectedSlot?.slot.faculty}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Room</p>
                  <p className="font-medium">{selectedSlot?.slot.room}</p>
                </div>
              </div>
              {selectedSlot?.slot.aiReason && (
                <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg">
                  <p className="text-xs font-medium text-accent mb-1">AI Decision</p>
                  <p className="text-sm text-muted-foreground">{selectedSlot.slot.aiReason}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={handleToggleLock}
                  disabled={toggleLockMutation.isPending}
                >
                  {selectedSlot?.slot.isLocked ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      Unlock Slot
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Lock Slot
                    </>
                  )}
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Reschedule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
