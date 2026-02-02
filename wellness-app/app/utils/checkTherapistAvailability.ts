/**
 * Helper function to check if a therapist is available for a specific time slot
 * 
 * @param slotStartTime - The start time of the slot to check in HH:MM format (e.g. "09:00")
 * @param slotEndTime - The end time of the slot to check in HH:MM format (e.g. "10:00")
 * @param therapistWeeklyAvailability - The therapist's weekly availability array
 * @param selectedDate - The selected date to check against
 * @returns boolean - true if available, false if unavailable
 */
export function checkTherapistAvailability(
  slotStartTime: string,
  slotEndTime: string,
  therapistWeeklyAvailability: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }> | undefined,
  selectedDate: Date
): boolean {
  // If therapist has no weekly availability defined, assume they're unavailable
  if (!therapistWeeklyAvailability || therapistWeeklyAvailability.length === 0) {
    return false;
  }

  // Get the day of week from the selected date
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = daysOfWeek[selectedDate.getDay()];

  // Find the availability for the selected day
  const dayAvailability = therapistWeeklyAvailability.find(avail => avail.day === dayOfWeek);
  
  // If no availability is defined for this day, the therapist is unavailable
  if (!dayAvailability) {
    return false;
  }

  // Convert the slot times to minutes since midnight for comparison
  const [slotStartHour, slotStartMinute] = slotStartTime.split(':').map(Number);
  const [slotEndHour, slotEndMinute] = slotEndTime.split(':').map(Number);
  const slotStartMinutes = slotStartHour * 60 + slotStartMinute;
  const slotEndMinutes = slotEndHour * 60 + slotEndMinute;

  // Convert the therapist's availability times to minutes since midnight
  const [availStartHour, availStartMinute] = dayAvailability.startTime.split(':').map(Number);
  const [availEndHour, availEndMinute] = dayAvailability.endTime.split(':').map(Number);
  const availStartMinutes = availStartHour * 60 + availStartMinute;
  const availEndMinutes = availEndHour * 60 + availEndMinute;

  // Check if the slot time falls within the therapist's available time range
  // The slot is available if:
  // 1. The slot starts at or after the therapist's availability starts
  // 2. The slot ends at or before the therapist's availability ends
  // 3. The slot doesn't conflict with the availability window
  return slotStartMinutes >= availStartMinutes && 
         slotEndMinutes <= availEndMinutes &&
         slotStartMinutes < slotEndMinutes; // Ensure valid time range
}