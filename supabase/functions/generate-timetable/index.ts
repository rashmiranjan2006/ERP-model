import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Types for internal use
interface Section {
  id: string;
  name: string;
  department: string;
  classroom: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  type: "theory" | "lab";
  lab_room: string | null;
  credits: number;
}

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  slot_order: number;
}

interface Room {
  id: string;
  name: string;
  type: "classroom" | "lab";
  capacity: number;
}

interface Faculty {
  id: string;
  name: string;
  department: string;
}

interface FacultySubject {
  id: string;
  faculty_id: string;
  subject_id: string;
  section_id: string;
}

interface TimetableEntry {
  id?: string;
  section_id: string;
  subject_id: string;
  faculty_id: string;
  room_id: string;
  time_slot_id: string;
  day_of_week: number; // 1-5 (Mon-Fri)
  session_type: "theory" | "lab";
  is_locked: boolean;
}

interface SchedulableEntity {
  section_id: string;
  subject_id: string;
  faculty_id: string;
  room_id: string;
  session_type: "theory" | "lab";
  slots_required: number; // Labs need 2 continuous slots
  subject_code: string;
  subject_name: string;
  faculty_name: string;
}

interface Assignment {
  entity: SchedulableEntity;
  day_of_week: number;
  time_slot_id: string;
  slot_order: number;
}

// Conflict tracking
interface ConflictState {
  facultySchedule: Map<string, Set<string>>; // faculty_id -> Set<day-slotOrder>
  sectionSchedule: Map<string, Set<string>>; // section_id -> Set<day-slotOrder>
  roomSchedule: Map<string, Set<string>>; // room_id -> Set<day-slotOrder>
}

// Initialize conflict tracking
function initConflictState(): ConflictState {
  return {
    facultySchedule: new Map(),
    sectionSchedule: new Map(),
    roomSchedule: new Map(),
  };
}

// Check if slot is available
function isSlotAvailable(
  state: ConflictState,
  facultyId: string,
  sectionId: string,
  roomId: string,
  day: number,
  slotOrders: number[]
): boolean {
  for (const slotOrder of slotOrders) {
    const key = `${day}-${slotOrder}`;
    
    // Check faculty conflict
    if (state.facultySchedule.get(facultyId)?.has(key)) return false;
    
    // Check section conflict
    if (state.sectionSchedule.get(sectionId)?.has(key)) return false;
    
    // Check room conflict
    if (state.roomSchedule.get(roomId)?.has(key)) return false;
  }
  return true;
}

// Mark slot as occupied
function occupySlot(
  state: ConflictState,
  facultyId: string,
  sectionId: string,
  roomId: string,
  day: number,
  slotOrders: number[]
): void {
  for (const slotOrder of slotOrders) {
    const key = `${day}-${slotOrder}`;
    
    if (!state.facultySchedule.has(facultyId)) {
      state.facultySchedule.set(facultyId, new Set());
    }
    state.facultySchedule.get(facultyId)!.add(key);
    
    if (!state.sectionSchedule.has(sectionId)) {
      state.sectionSchedule.set(sectionId, new Set());
    }
    state.sectionSchedule.get(sectionId)!.add(key);
    
    if (!state.roomSchedule.has(roomId)) {
      state.roomSchedule.set(roomId, new Set());
    }
    state.roomSchedule.get(roomId)!.add(key);
  }
}

// Calculate soft constraint score (lower is better)
function calculateScore(
  assignments: Assignment[],
  timeSlots: TimeSlot[]
): number {
  let score = 0;
  
  // Group by section and day
  const sectionDayAssignments = new Map<string, Assignment[]>();
  
  for (const a of assignments) {
    const key = `${a.entity.section_id}-${a.day_of_week}`;
    if (!sectionDayAssignments.has(key)) {
      sectionDayAssignments.set(key, []);
    }
    sectionDayAssignments.get(key)!.push(a);
  }
  
  // Soft constraint 1: Penalize extreme early/late slots
  for (const a of assignments) {
    if (a.slot_order === 1) score += 2; // 7:30 AM penalty
    if (a.slot_order === 7) score += 1; // 2-3 PM slight penalty
  }
  
  // Soft constraint 2: Penalize overloading sections
  for (const [, dayAssignments] of sectionDayAssignments) {
    if (dayAssignments.length > 5) {
      score += (dayAssignments.length - 5) * 3;
    }
  }
  
  // Soft constraint 3: Faculty idle gaps
  const facultyDaySlots = new Map<string, number[]>();
  for (const a of assignments) {
    const key = `${a.entity.faculty_id}-${a.day_of_week}`;
    if (!facultyDaySlots.has(key)) {
      facultyDaySlots.set(key, []);
    }
    facultyDaySlots.get(key)!.push(a.slot_order);
  }
  
  for (const [, slots] of facultyDaySlots) {
    if (slots.length > 1) {
      const sorted = slots.sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i] - sorted[i - 1] - 1;
        if (gap > 0) score += gap * 2;
      }
    }
  }
  
  return score;
}

// Main scheduling algorithm
function generateSchedule(
  entities: SchedulableEntity[],
  timeSlots: TimeSlot[],
  rooms: Room[],
  lockedEntries: TimetableEntry[]
): { assignments: Assignment[]; success: boolean; message: string } {
  const state = initConflictState();
  const assignments: Assignment[] = [];
  const days = [1, 2, 3, 4, 5]; // Monday to Friday
  
  // Sort time slots by order
  const sortedSlots = [...timeSlots].sort((a, b) => a.slot_order - b.slot_order);
  
  // Room lookup by name
  const roomByName = new Map<string, Room>();
  for (const room of rooms) {
    roomByName.set(room.name, room);
  }
  
  // Pre-occupy locked entries
  for (const entry of lockedEntries) {
    const slot = sortedSlots.find(s => s.id === entry.time_slot_id);
    if (slot) {
      const slotsNeeded = entry.session_type === "lab" ? [slot.slot_order, slot.slot_order + 1] : [slot.slot_order];
      occupySlot(state, entry.faculty_id, entry.section_id, entry.room_id, entry.day_of_week, slotsNeeded);
    }
  }
  
  // Separate labs and theory - schedule labs first (harder constraint)
  const labEntities = entities.filter(e => e.session_type === "lab");
  const theoryEntities = entities.filter(e => e.session_type === "theory");
  
  // Shuffle for variety
  const shuffleArray = <T>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  
  const shuffledLabs = shuffleArray(labEntities);
  const shuffledTheory = shuffleArray(theoryEntities);
  
  // Schedule labs (need continuous slots)
  for (const entity of shuffledLabs) {
    let scheduled = false;
    
    // Prefer mid-day slots for labs (after lunch is good)
    const preferredStartOrders = [4, 3, 5, 2, 6]; // Starting positions for 2-slot labs
    
    for (const day of shuffleArray([...days])) {
      for (const startOrder of preferredStartOrders) {
        if (startOrder + 1 > sortedSlots.length) continue;
        
        const startSlot = sortedSlots.find(s => s.slot_order === startOrder);
        if (!startSlot) continue;
        
        const slotsNeeded = [startOrder, startOrder + 1];
        
        if (isSlotAvailable(state, entity.faculty_id, entity.section_id, entity.room_id, day, slotsNeeded)) {
          occupySlot(state, entity.faculty_id, entity.section_id, entity.room_id, day, slotsNeeded);
          
          assignments.push({
            entity,
            day_of_week: day,
            time_slot_id: startSlot.id,
            slot_order: startOrder,
          });
          
          scheduled = true;
          break;
        }
      }
      if (scheduled) break;
    }
    
    if (!scheduled) {
      console.log(`Failed to schedule lab: ${entity.subject_name} for section ${entity.section_id}`);
    }
  }
  
  // Schedule theory classes
  for (const entity of shuffledTheory) {
    // Each theory subject needs multiple sessions per week based on credits
    const sessionsNeeded = entity.slots_required;
    let sessionsScheduled = 0;
    
    for (const day of shuffleArray([...days])) {
      if (sessionsScheduled >= sessionsNeeded) break;
      
      // Prefer mid-morning slots for theory
      const preferredOrders = [3, 2, 4, 5, 1, 6, 7];
      
      for (const slotOrder of preferredOrders) {
        const slot = sortedSlots.find(s => s.slot_order === slotOrder);
        if (!slot) continue;
        
        if (isSlotAvailable(state, entity.faculty_id, entity.section_id, entity.room_id, day, [slotOrder])) {
          occupySlot(state, entity.faculty_id, entity.section_id, entity.room_id, day, [slotOrder]);
          
          assignments.push({
            entity,
            day_of_week: day,
            time_slot_id: slot.id,
            slot_order: slotOrder,
          });
          
          sessionsScheduled++;
          break;
        }
      }
    }
  }
  
  const score = calculateScore(assignments, sortedSlots);
  console.log(`Generated schedule with ${assignments.length} entries, score: ${score}`);
  
  return {
    assignments,
    success: true,
    message: `Generated ${assignments.length} timetable entries with optimization score ${score}`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { action, sectionId } = await req.json();
    
    console.log(`Timetable generation request: action=${action}, sectionId=${sectionId}`);
    
    // Fetch all required data
    const [sectionsRes, subjectsRes, timeSlotsRes, roomsRes, facultyRes, facultySubjectsRes, lockedEntriesRes] = await Promise.all([
      supabase.from("sections").select("*"),
      supabase.from("subjects").select("*"),
      supabase.from("time_slots").select("*").order("slot_order"),
      supabase.from("rooms").select("*"),
      supabase.from("faculty").select("*"),
      supabase.from("faculty_subjects").select("*, faculty:faculty_id(name), subject:subject_id(name, code, type, lab_room, credits), section:section_id(name, classroom)"),
      supabase.from("timetable_entries").select("*").eq("is_locked", true),
    ]);
    
    if (sectionsRes.error) throw sectionsRes.error;
    if (subjectsRes.error) throw subjectsRes.error;
    if (timeSlotsRes.error) throw timeSlotsRes.error;
    if (roomsRes.error) throw roomsRes.error;
    if (facultyRes.error) throw facultyRes.error;
    if (facultySubjectsRes.error) throw facultySubjectsRes.error;
    if (lockedEntriesRes.error) throw lockedEntriesRes.error;
    
    const sections = sectionsRes.data as Section[];
    const subjects = subjectsRes.data as Subject[];
    const timeSlots = timeSlotsRes.data as TimeSlot[];
    const rooms = roomsRes.data as Room[];
    const faculty = facultyRes.data as Faculty[];
    const facultySubjects = facultySubjectsRes.data;
    const lockedEntries = lockedEntriesRes.data as TimetableEntry[];
    
    console.log(`Data loaded: ${sections.length} sections, ${subjects.length} subjects, ${timeSlots.length} time slots, ${rooms.length} rooms, ${faculty.length} faculty, ${facultySubjects.length} faculty-subject mappings`);
    
    // Check if we have faculty-subject mappings
    if (facultySubjects.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No faculty-subject mappings found. Please add faculty and assign them to subjects first.",
          entries: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Build room lookup
    const roomByName = new Map<string, Room>();
    for (const room of rooms) {
      roomByName.set(room.name, room);
    }
    
    // Build section classroom lookup
    const sectionClassroom = new Map<string, string>();
    for (const section of sections) {
      sectionClassroom.set(section.id, section.classroom);
    }
    
    // Create schedulable entities from faculty_subjects
    const entities: SchedulableEntity[] = [];
    
    for (const fs of facultySubjects) {
      const subject = fs.subject as any;
      const facultyMember = fs.faculty as any;
      const section = fs.section as any;
      
      if (!subject || !facultyMember || !section) continue;
      
      // Determine room
      let roomId: string;
      if (subject.type === "lab" && subject.lab_room) {
        const labRoom = roomByName.get(subject.lab_room);
        if (labRoom) {
          roomId = labRoom.id;
        } else {
          // Use section classroom for Python lab
          const classroom = sectionClassroom.get(fs.section_id);
          const classroomRoom = rooms.find(r => r.name === classroom);
          roomId = classroomRoom?.id || rooms[0].id;
        }
      } else {
        // Theory - use section's assigned classroom
        const classroom = sectionClassroom.get(fs.section_id);
        const classroomRoom = rooms.find(r => r.name === classroom);
        roomId = classroomRoom?.id || rooms[0].id;
      }
      
      entities.push({
        section_id: fs.section_id,
        subject_id: fs.subject_id,
        faculty_id: fs.faculty_id,
        room_id: roomId,
        session_type: subject.type as "theory" | "lab",
        slots_required: subject.type === "lab" ? 1 : Math.ceil(subject.credits / 1.5), // Theory needs ~2-3 sessions/week
        subject_code: subject.code,
        subject_name: subject.name,
        faculty_name: facultyMember.name,
      });
    }
    
    console.log(`Created ${entities.length} schedulable entities`);
    
    // Generate schedule
    const result = generateSchedule(entities, timeSlots, rooms, lockedEntries);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: result.message,
          entries: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Convert assignments to timetable entries
    const newEntries: Omit<TimetableEntry, "id">[] = result.assignments.map(a => ({
      section_id: a.entity.section_id,
      subject_id: a.entity.subject_id,
      faculty_id: a.entity.faculty_id,
      room_id: a.entity.room_id,
      time_slot_id: a.time_slot_id,
      day_of_week: a.day_of_week,
      session_type: a.entity.session_type,
      is_locked: false,
    }));
    
    // Clear existing non-locked entries if regenerating
    if (action === "regenerate") {
      const { error: deleteError } = await supabase
        .from("timetable_entries")
        .delete()
        .eq("is_locked", false);
      
      if (deleteError) {
        console.error("Error deleting old entries:", deleteError);
      }
    }
    
    // Insert new entries
    if (newEntries.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from("timetable_entries")
        .insert(newEntries)
        .select();
      
      if (insertError) {
        console.error("Error inserting entries:", insertError);
        throw insertError;
      }
      
      console.log(`Inserted ${insertedData?.length || 0} timetable entries`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        entriesCount: newEntries.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error: unknown) {
    console.error("Error in generate-timetable:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
        entries: [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
