import { cn } from "@/lib/utils";
import { Calendar, Users, Building2, GraduationCap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  selectedClass?: string;
  onClassChange?: (value: string) => void;
  selectedFaculty?: string;
  onFacultyChange?: (value: string) => void;
  selectedRoom?: string;
  onRoomChange?: (value: string) => void;
}

const viewFilters = [
  { id: "week", label: "Week View", icon: Calendar },
  { id: "day", label: "Day View", icon: Calendar },
];

const classes = [
  { id: "cse-a", label: "CSE - Section A" },
  { id: "cse-b", label: "CSE - Section B" },
  { id: "ece-a", label: "ECE - Section A" },
  { id: "mech-a", label: "MECH - Section A" },
];

const faculty = [
  { id: "all", label: "All Faculty" },
  { id: "dr-smith", label: "Dr. Smith" },
  { id: "prof-johnson", label: "Prof. Johnson" },
  { id: "dr-williams", label: "Dr. Williams" },
];

const rooms = [
  { id: "all", label: "All Rooms" },
  { id: "room-101", label: "Room 101" },
  { id: "room-102", label: "Room 102" },
  { id: "lab-a", label: "Lab A" },
  { id: "lab-b", label: "Lab B" },
];

export function FilterBar({
  activeFilter,
  onFilterChange,
  selectedClass,
  onClassChange,
  selectedFaculty,
  onFacultyChange,
  selectedRoom,
  onRoomChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-xl border border-border">
      {/* View Toggle */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
        {viewFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              activeFilter === filter.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <filter.icon className="w-4 h-4" />
            {filter.label}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-border hidden sm:block" />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {onClassChange && (
          <Select value={selectedClass} onValueChange={onClassChange}>
            <SelectTrigger className="w-[160px] bg-muted/50 border-transparent">
              <GraduationCap className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {onFacultyChange && (
          <Select value={selectedFaculty} onValueChange={onFacultyChange}>
            <SelectTrigger className="w-[160px] bg-muted/50 border-transparent">
              <Users className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Faculty" />
            </SelectTrigger>
            <SelectContent>
              {faculty.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {onRoomChange && (
          <Select value={selectedRoom} onValueChange={onRoomChange}>
            <SelectTrigger className="w-[140px] bg-muted/50 border-transparent">
              <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Room" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
