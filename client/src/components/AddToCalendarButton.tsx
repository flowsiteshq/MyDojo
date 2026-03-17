import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addToCalendar, CalendarEvent, downloadICalFile, getGoogleCalendarUrl } from "@/lib/calendar";
import { Calendar } from "lucide-react";

interface AddToCalendarButtonProps {
  event: CalendarEvent;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function AddToCalendarButton({ 
  event, 
  variant = "outline", 
  size = "default",
  className 
}: AddToCalendarButtonProps) {
  const handleGoogleCalendar = () => {
    const url = getGoogleCalendarUrl(event);
    window.open(url, '_blank');
  };

  const handleAppleCalendar = () => {
    downloadICalFile(event, `${event.title.replace(/\s+/g, '-')}.ics`);
  };

  const handleOutlook = () => {
    downloadICalFile(event, `${event.title.replace(/\s+/g, '-')}.ics`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Calendar className="mr-2 h-4 w-4" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleGoogleCalendar}>
          <span className="font-medium">Google Calendar</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAppleCalendar}>
          <span className="font-medium">Apple Calendar</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlook}>
          <span className="font-medium">Outlook</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
