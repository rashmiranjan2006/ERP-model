import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export interface TimetableEntryWithDetails {
  id: string;
  day_of_week: number;
  session_type: string;
  is_locked: boolean;
  time_slot: {
    id: string;
    start_time: string;
    end_time: string;
    slot_order: number;
  };
  section: {
    id: string;
    name: string;
    classroom: string;
  };
  subject: {
    id: string;
    name: string;
    code: string;
    type: string;
  };
  faculty: {
    id: string;
    name: string;
  };
  room: {
    id: string;
    name: string;
    type: string;
  };
}

// Fetch all timetable entries with related data
export function useTimetableEntries(sectionId?: string, facultyId?: string) {
  return useQuery({
    queryKey: ["timetable-entries", sectionId, facultyId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sectionId) params.append("section_id", sectionId);
      if (facultyId) params.append("faculty_id", facultyId);
      const data = await apiFetch(`/api/timetable?${params.toString()}`);
      return data.entries as TimetableEntryWithDetails[];
    },
  });
}

// Fetch sections
export function useSections() {
  return useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const data = await apiFetch("/api/sections");
      return data.sections;
    },
  });
}

// Fetch faculty
export function useFaculty() {
  return useQuery({
    queryKey: ["faculty"],
    queryFn: async () => {
      const data = await apiFetch("/api/faculty");
      return data.faculty;
    },
  });
}

// Fetch time slots
export function useTimeSlots() {
  return useQuery({
    queryKey: ["time-slots"],
    queryFn: async () => {
      const data = await apiFetch("/api/time-slots");
      return data.time_slots;
    },
  });
}

// Fetch rooms
export function useRooms() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const data = await apiFetch("/api/rooms");
      return data.rooms;
    },
  });
}

// Generate timetable
export function useGenerateTimetable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: "generate" | "regenerate") => {
      const data = await apiFetch("/api/generate-timetable", {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["timetable-entries"] });
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate timetable: ${error.message}`);
    },
  });
}

// Toggle lock on timetable entry
export function useToggleLock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isLocked }: { id: string; isLocked: boolean }) => {
      const data = await apiFetch(`/api/timetable/${id}/toggle-lock`, {
        method: "POST",
        body: JSON.stringify({ is_locked: !isLocked }),
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["timetable-entries"] });
      toast.success(`Slot ${data.is_locked ? "locked" : "unlocked"}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

// Transform timetable entries to grid format
export function transformToGridData(
  entries: TimetableEntryWithDetails[],
  timeSlots: { id: string; start_time: string; end_time: string; slot_order: number }[]
): Record<string, Record<string, any>> {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const grid: Record<string, Record<string, any>> = {};

  // Initialize grid with free slots
  for (const day of days) {
    grid[day] = {};
    for (const slot of timeSlots) {
      const timeLabel = formatTimeSlot(slot.start_time, slot.end_time);
      grid[day][timeLabel] = {
        id: `${day}-${timeLabel}`,
        type: "free" as const,
      };
    }
  }

  // Fill in entries
  for (const entry of entries) {
    const dayName = days[entry.day_of_week - 1];
    if (!dayName || !entry.time_slot) continue;

    const timeLabel = formatTimeSlot(entry.time_slot.start_time, entry.time_slot.end_time);

    grid[dayName][timeLabel] = {
      id: entry.id,
      type: entry.session_type as "theory" | "lab",
      subject: entry.subject?.name,
      subjectCode: entry.subject?.code,
      faculty: entry.faculty?.name,
      room: entry.room?.name,
      isLocked: entry.is_locked,
      section: entry.section?.name,
      aiReason: entry.session_type === "lab" 
        ? "Lab scheduled in designated lab room" 
        : "Optimal slot based on constraint optimization",
    };
  }

  return grid;
}

// Format time slot for display
export function formatTimeSlot(startTime: string, endTime: string): string {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  return `${formatTime(startTime)}`;
}

// Get time slot labels for grid
export function getTimeSlotLabels(
  timeSlots: { start_time: string; end_time: string; slot_order: number }[]
): string[] {
  return timeSlots
    .sort((a, b) => a.slot_order - b.slot_order)
    .map((slot) => formatTimeSlot(slot.start_time, slot.end_time));
}
