/**
 * Pure utility function to generate time slots based on business hours and service duration
 * 
 * @param businessOpenTime - Business open time in HH:MM format (e.g. "09:00")
 * @param businessCloseTime - Business close time in HH:MM format (e.g. "18:00")
 * @param serviceDuration - Duration of the service in minutes
 * @param breakDuration - Duration of the break between appointments in minutes (default: 15)
 * @returns Array of time slots in the format { startTime: string, endTime: string }
 */
export function generateSlots(
  businessOpenTime: string,
  businessCloseTime: string,
  serviceDuration: number,
  breakDuration: number = 15
): { startTime: string; endTime: string }[] {
  // Convert business open and close times to minutes since midnight
  const [openHour, openMinute] = businessOpenTime.split(':').map(Number);
  const [closeHour, closeMinute] = businessCloseTime.split(':').map(Number);
  
  const openTimeInMinutes = openHour * 60 + openMinute;
  const closeTimeInMinutes = closeHour * 60 + closeMinute;
  
  // Initialize current time to the open time
  let currentTime = openTimeInMinutes;
  
  // Array to store the generated slots
  const slots: { startTime: string; endTime: string }[] = [];
  
  // Generate slots until the end time exceeds the close time
  while (true) {
    // Calculate the start and end times for the current slot
    const slotStartTime = currentTime;
    const slotEndTime = slotStartTime + serviceDuration;
    
    // Check if the slot end time exceeds the business close time
    if (slotEndTime > closeTimeInMinutes) {
      break;
    }
    
    // Add the slot to the array
    slots.push({
      startTime: formatTime(slotStartTime),
      endTime: formatTime(slotEndTime)
    });
    
    // Move to the next time slot by adding service duration and break duration
    currentTime = slotEndTime + breakDuration;
    
    // Check if the next slot would exceed the close time
    if (currentTime + serviceDuration > closeTimeInMinutes) {
      break;
    }
  }
  
  return slots;
}

/**
 * Helper function to convert minutes since midnight to HH:MM format
 */
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}