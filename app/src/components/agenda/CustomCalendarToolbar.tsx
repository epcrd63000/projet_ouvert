import React from "react";
import { ToolbarProps } from "react-big-calendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

export default function CustomCalendarToolbar(props: any) {
  const { date, onNavigate, label, view, onView } = props;

  const navigate = (action: "PREV" | "NEXT" | "TODAY") => {
    onNavigate(action);
  };

  const views = ["month", "week", "day", "agenda"] as const;

  const viewNames: Record<string, string> = {
    month: "Mois",
    week: "Semaine",
    day: "Jour",
    agenda: "Planning",
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate("TODAY")}>
          Aujourd&apos;hui
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate("PREV")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate("NEXT")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="text-lg font-semibold flex items-center gap-2">
        <CalendarIcon className="h-5 w-5 text-muted-foreground" />
        {label}
      </div>

      <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
        {views.map((v) => (
          <Button
            key={v}
            variant={view === v ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onView(v)}
            className="capitalize h-8"
          >
            {viewNames[v]}
          </Button>
        ))}
      </div>
    </div>
  );
}
