/**
 * Calendar integration utilities
 * Generates links to add events to Google Calendar, Apple Calendar, and Outlook
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Format date for calendar URLs (YYYYMMDDTHHmmssZ)
 */
function formatDateForCalendar(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generate Google Calendar link
 */
export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDateForCalendar(event.startTime)}/${formatDateForCalendar(event.endTime)}`,
    details: event.description || '',
    location: event.location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate iCal file content for Apple Calendar and Outlook
 */
export function generateICalFile(event: CalendarEvent): string {
  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${formatDateForCalendar(event.startTime)}`,
    `DTEND:${formatDateForCalendar(event.endTime)}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description}` : '',
    event.location ? `LOCATION:${event.location}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  return ical;
}

/**
 * Download iCal file for Apple Calendar or Outlook
 */
export function downloadICalFile(event: CalendarEvent, filename = 'event.ics'): void {
  const icalContent = generateICalFile(event);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open calendar selection dialog
 */
export function addToCalendar(event: CalendarEvent): void {
  // For now, we'll default to Google Calendar
  // In a future enhancement, we can show a dialog to let users choose
  const googleUrl = getGoogleCalendarUrl(event);
  window.open(googleUrl, '_blank');
}
