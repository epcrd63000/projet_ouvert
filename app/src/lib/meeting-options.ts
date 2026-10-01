export interface ScheduledMeeting {
  id: string;
  title: string;
  scheduledAt: string;
  status: string;
}

export function getUpcomingMeetings<T extends ScheduledMeeting>(
  meetings: T[],
  now = Date.now()
): T[] {
  return meetings
    .filter(
      (meeting) =>
        meeting.status !== "DONE" && new Date(meeting.scheduledAt).getTime() > now
    )
    .sort(
      (first, second) =>
        new Date(first.scheduledAt).getTime() - new Date(second.scheduledAt).getTime()
    )
    .slice(0, 2);
}
