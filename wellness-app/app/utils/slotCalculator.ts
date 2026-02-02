/**
 * Pure utility function to calculate time slots based on business hours and service duration
 * 
 * @param businessStartTime - Business start time in HH:MM format (e.g. "09:00")
 * @param businessEndTime - Business end time in HH:MM format (e.g. "18:00")
 * @param serviceDuration - Duration of the service in minutes
 * @param breakDuration - Duration of the break between appointments in minutes (default: 15)
 * @returns Array of time slots in the format { startTime: string, endTime: string }
 */
export function calculateTimeSlots(
  businessStartTime: string,
  businessEndTime: string,
  serviceDuration: number,
  breakDuration: number = 15
): { startTime: string; endTime: string }[] {
  // Parse the business start and end times
  const [startHour, startMinute] = businessStartTime.split(':').map(Number);
  const [endHour, endMinute] = businessEndTime.split(':').map(Number);

  // Convert times to minutes since midnight for easier calculation
  let currentSlotStartMinutes = startHour * 60 + startMinute;
  const endOfDayMinutes = endHour * 60 + endMinute;

  // Generate time slots
  const timeSlots: { startTime: string; endTime: string }[] = [];
  
  while (true) {
    // Calculate slot end time
    const slotEndMinutes = currentSlotStartMinutes + serviceDuration;
    
    // Check if the slot extends beyond business hours
    if (slotEndMinutes > endOfDayMinutes) {
      break;
    }
    
    // Format the start and end times
    const startTime = formatTime(currentSlotStartMinutes);
    const endTime = formatTime(slotEndMinutes);
    
    timeSlots.push({
      startTime,
      endTime
    });
    
    // Calculate next slot start time (add service duration + break)
    currentSlotStartMinutes = slotEndMinutes + breakDuration;
    
    // Check if the next slot would extend beyond business hours
    if (currentSlotStartMinutes + serviceDuration > endOfDayMinutes) {
      break;
    }
  }

  return timeSlots;
}

/**
 * Helper function to convert minutes since midnight to HH:MM format
 */
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}