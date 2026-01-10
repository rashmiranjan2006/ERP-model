import { AppLayout } from "@/components/layout/AppLayout";
import { roomOccupancy } from "@/data/mockTimetable";
import { Building2, Beaker, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RoomOccupancy() {
  const classrooms = roomOccupancy.filter((r) => r.type === "classroom");
  const labs = roomOccupancy.filter((r) => r.type === "lab");

  const avgUtilization = Math.round(
    roomOccupancy.reduce((acc, r) => acc + r.utilization, 0) / roomOccupancy.length
  );

  const getUtilizationColor = (util: number) => {
    if (util >= 80) return "bg-success text-success";
    if (util >= 50) return "bg-warning text-warning";
    return "bg-destructive text-destructive";
  };

  const getBarColor = (util: number) => {
    if (util >= 80) return "bg-success";
    if (util >= 50) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <AppLayout
      title="Room & Lab Occupancy"
      subtitle="Utilization heatmap and analytics"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Utilization</p>
                <p className="text-2xl font-semibold text-foreground">{avgUtilization}%</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-slot-theory-bg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-slot-theory" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Classrooms</p>
                <p className="text-2xl font-semibold text-foreground">{classrooms.length}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-slot-lab-bg flex items-center justify-center">
                <Beaker className="w-5 h-5 text-slot-lab" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Labs</p>
                <p className="text-2xl font-semibold text-foreground">{labs.length}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Idle Hours</p>
                <p className="text-2xl font-semibold text-foreground">28</p>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="p-6 bg-card rounded-xl border border-border">
          <h3 className="font-semibold text-foreground mb-6">Weekly Heatmap View</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-muted-foreground pb-4">Room</th>
                  {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                    <th key={day} className="text-center text-sm font-medium text-muted-foreground pb-4 w-24">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roomOccupancy.map((room) => (
                  <tr key={room.room}>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        {room.type === "lab" ? (
                          <Beaker className="w-4 h-4 text-slot-lab" />
                        ) : (
                          <Building2 className="w-4 h-4 text-slot-theory" />
                        )}
                        <span className="text-sm font-medium">{room.room}</span>
                      </div>
                    </td>
                    {[0, 1, 2, 3, 4].map((dayIndex) => {
                      // Simulate daily variation
                      const dailyUtil = Math.min(
                        100,
                        Math.max(0, room.utilization + (Math.random() * 30 - 15))
                      );
                      const opacity = dailyUtil / 100;
                      return (
                        <td key={dayIndex} className="p-1">
                          <div
                            className={cn(
                              "h-10 rounded-md transition-all cursor-pointer hover:scale-105",
                              room.type === "lab" ? "bg-slot-lab" : "bg-slot-theory"
                            )}
                            style={{ opacity: 0.2 + opacity * 0.8 }}
                            title={`${Math.round(dailyUtil)}% utilized`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">Low</span>
            <div className="flex gap-1">
              {[20, 40, 60, 80, 100].map((level) => (
                <div
                  key={level}
                  className="w-6 h-4 rounded bg-accent"
                  style={{ opacity: level / 100 }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">High</span>
          </div>
        </div>

        {/* Room Utilization Bars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Classrooms */}
          <div className="p-5 bg-card rounded-xl border border-border">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slot-theory" />
              Classroom Utilization
            </h3>
            <div className="space-y-4">
              {classrooms.map((room) => (
                <div key={room.room}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{room.room}</span>
                    <span className={cn("text-sm font-semibold", getUtilizationColor(room.utilization).split(" ")[1])}>
                      {room.utilization}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", getBarColor(room.utilization))}
                      style={{ width: `${room.utilization}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Labs */}
          <div className="p-5 bg-card rounded-xl border border-border">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Beaker className="w-4 h-4 text-slot-lab" />
              Lab Utilization
            </h3>
            <div className="space-y-4">
              {labs.map((room) => (
                <div key={room.room}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{room.room}</span>
                    <span className={cn("text-sm font-semibold", getUtilizationColor(room.utilization).split(" ")[1])}>
                      {room.utilization}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", getBarColor(room.utilization))}
                      style={{ width: `${room.utilization}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-5 bg-accent/5 rounded-xl border border-accent/20">
          <h3 className="font-semibold text-foreground mb-3">AI Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-card rounded-lg border border-border">
              <p className="text-sm font-medium text-foreground mb-1">Room 105 Underutilized</p>
              <p className="text-xs text-muted-foreground">
                Consider merging CSE-B Wednesday classes here to improve Lab A availability.
              </p>
            </div>
            <div className="p-3 bg-card rounded-lg border border-border">
              <p className="text-sm font-medium text-foreground mb-1">Lab C Optimization</p>
              <p className="text-xs text-muted-foreground">
                ECE labs could be scheduled in Lab C during off-peak hours (2-4 PM).
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
