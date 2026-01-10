import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { FileText, Download, Share2, Calendar, Users, Building2, Printer } from "lucide-react";

const reportTypes = [
  {
    title: "Master Timetable",
    description: "Complete timetable for all classes and sections",
    icon: Calendar,
    format: "PDF / Excel",
  },
  {
    title: "Faculty Schedule Report",
    description: "Individual faculty schedules with workload analysis",
    icon: Users,
    format: "PDF",
  },
  {
    title: "Room Utilization Report",
    description: "Room and lab utilization metrics with recommendations",
    icon: Building2,
    format: "PDF / CSV",
  },
  {
    title: "Conflict Analysis",
    description: "Historical conflict data and resolution patterns",
    icon: FileText,
    format: "PDF",
  },
];

export default function Reports() {
  return (
    <AppLayout
      title="Reports & Export"
      subtitle="Generate and download timetable reports"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Export All as PDF
          </Button>
          <Button variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            Print Preview
          </Button>
          <Button variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            Generate Share Link
          </Button>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTypes.map((report) => (
            <div
              key={report.title}
              className="p-6 bg-card rounded-xl border border-border hover:border-accent/50 hover:shadow-elevated transition-all duration-200 group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                  <report.icon className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {report.format}
                    </span>
                    <Button variant="ghost" size="sm" className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Public Share Settings */}
        <div className="p-6 bg-card rounded-xl border border-border">
          <h3 className="font-semibold text-foreground mb-4">Public Read-Only Links</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generate shareable links for students and parents to view timetables without login.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">CSE Section A - Semester 4</p>
                <p className="text-xs text-muted-foreground">https://timetable.edu/share/cse-a-s4</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Copy</Button>
                <Button variant="ghost" size="sm" className="text-destructive">Revoke</Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">ECE Section A - Semester 4</p>
                <p className="text-xs text-muted-foreground">https://timetable.edu/share/ece-a-s4</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Copy</Button>
                <Button variant="ghost" size="sm" className="text-destructive">Revoke</Button>
              </div>
            </div>
          </div>
          <Button variant="outline" className="mt-4 gap-2">
            <Share2 className="w-4 h-4" />
            Generate New Link
          </Button>
        </div>

        {/* Print-Ready Preview */}
        <div className="p-6 bg-muted/30 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Print-Ready Preview</h3>
            <Button variant="outline" size="sm" className="gap-2">
              <Printer className="w-4 h-4" />
              Open Print View
            </Button>
          </div>
          <div className="aspect-[16/10] bg-card rounded-lg border border-border flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Preview will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
