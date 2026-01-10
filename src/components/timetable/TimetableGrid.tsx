import { SlotCard, SlotData } from "./SlotCard";
import { cn } from "@/lib/utils";

interface TimetableGridProps {
  data: Record<string, Record<string, SlotData>>;
  days?: string[];
  timeSlots?: string[];
  onSlotClick?: (day: string, time: string, slot: SlotData) => void;
  className?: string;
}

const defaultDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const defaultTimeSlots = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];

export function TimetableGrid({
  data,
  days = defaultDays,
  timeSlots = defaultTimeSlots,
  onSlotClick,
  className,
}: TimetableGridProps) {
  return (
    <div className={cn("timetable-grid overflow-x-auto", className)}>
      <table className="w-full border-collapse min-w-[800px]">
        <thead>
          <tr>
            <th className="timetable-header-cell sticky left-0 z-10 bg-muted/80 backdrop-blur-sm">
              Time
            </th>
            {days.map((day) => (
              <th key={day} className="timetable-header-cell">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((time) => (
            <tr key={time}>
              <td className="timetable-time-cell sticky left-0 z-10 bg-muted/50 backdrop-blur-sm">
                {time}
              </td>
              {days.map((day) => {
                const slot = data[day]?.[time] || {
                  id: `${day}-${time}`,
                  type: "free" as const,
                };
                return (
                  <td key={`${day}-${time}`} className="timetable-cell">
                    <SlotCard
                      slot={slot}
                      onClick={() => onSlotClick?.(day, time, slot)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
