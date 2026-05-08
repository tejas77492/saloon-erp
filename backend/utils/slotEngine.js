/**
 * Slot Calculation Engine
 * Generates available time slots based on working hours,
 * existing bookings, and blocked times.
 */

/**
 * Convert "HH:mm" string to minutes from midnight
 */
const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Convert minutes from midnight to "HH:mm" string
 */
const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

/**
 * Check if two time ranges overlap
 * Range1: [s1, e1)  Range2: [s2, e2)
 */
const hasOverlap = (s1, e1, s2, e2) => s1 < e2 && s2 < e1;

/**
 * Main slot generator
 * @param {Object} workingHours - { openTime: "HH:mm", closeTime: "HH:mm", isClosed: bool }
 * @param {Array}  bookings     - [{ startTime, endTime, status }]
 * @param {Array}  blockedTimes - [{ startTime, endTime, isFullDay }]
 * @param {Number} totalDuration - required service duration in minutes
 * @param {Number} slotInterval  - slot step in minutes (default 15)
 * @returns {Array} slots - [{ time: "HH:mm", status: "available"|"booked"|"blocked"|"closed" }]
 */
const generateSlots = (workingHours, bookings, blockedTimes, totalDuration, slotInterval = 15) => {
  if (!workingHours || workingHours.isClosed) return [];

  const openMin  = timeToMinutes(workingHours.openTime);
  const closeMin = timeToMinutes(workingHours.closeTime);

  // Check if entire day is blocked
  const isFullDayBlocked = blockedTimes.some(b => b.isFullDay);
  if (isFullDayBlocked) return [];

  const slots = [];

  // Generate every slotInterval from open until (close - totalDuration)
  for (let t = openMin; t + totalDuration <= closeMin; t += slotInterval) {
    const slotStart = t;
    const slotEnd   = t + totalDuration;
    const timeStr   = minutesToTime(t);

    let status = 'available';

    // Check against active bookings (not cancelled)
    for (const booking of bookings) {
      if (booking.status === 'cancelled') continue;
      const bStart = timeToMinutes(booking.startTime);
      const bEnd   = timeToMinutes(booking.endTime);
      if (hasOverlap(slotStart, slotEnd, bStart, bEnd)) {
        status = 'booked';
        break;
      }
    }

    // Check against blocked times
    if (status === 'available') {
      for (const block of blockedTimes) {
        if (block.isFullDay) { status = 'blocked'; break; }
        if (block.startTime && block.endTime) {
          const bStart = timeToMinutes(block.startTime);
          const bEnd   = timeToMinutes(block.endTime);
          if (hasOverlap(slotStart, slotEnd, bStart, bEnd)) {
            status = 'blocked';
            break;
          }
        }
      }
    }

    slots.push({ time: timeStr, status });
  }

  return slots;
};

module.exports = { generateSlots, timeToMinutes, minutesToTime };
