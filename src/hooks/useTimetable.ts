import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      let query = supabase
        .from("timetable_entries")
        .select(`
          id,
          day_of_week,
          session_type,
          is_locked,
          time_slot:time_slot_id(id, start_time, end_time, slot_order),
          section:section_id(id, name, classroom),
          subject:subject_id(id, name, code, type),
          faculty:faculty_id(id, name),
          room:room_id(id, name, type)
        `);

      if (sectionId) {
        query = query.eq("section_id", sectionId);
      }
      if (facultyId) {
        query = query.eq("faculty_id", facultyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as TimetableEntryWithDetails[];
    },
  });
}

// Fetch sections
export function useSections() {
  return useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sections")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

// Fetch faculty
export function useFaculty() {
  return useQuery({
    queryKey: ["faculty"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculty")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

// Fetch time slots
export function useTimeSlots() {
  return useQuery({
    queryKey: ["time-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_slots")
        .select("*")
        .order("slot_order");
      if (error) throw error;
      return data;
    },
  });
}

// Fetch rooms
export function useRooms() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

// Generate timetable
export function useGenerateTimetable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: "generate" | "regenerate") => {
      const { data, error } = await supabase.functions.invoke("generate-timetable", {
        body: { action },
      });

      if (error) throw error;
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
      const { data, error } = await supabase
        .from("timetable_entries")
        .update({ is_locked: !isLocked })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
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
