/**
 * Business Hours Calculation Utility
 *
 * Calculates time differences considering only business hours:
 * - Monday to Friday
 * - 9:00 AM to 6:00 PM (9 hours per day)
 * - Excludes weekends
 */

const BUSINESS_HOURS_START = 9; // 9 AM
const BUSINESS_HOURS_END = 18;  // 6 PM
const BUSINESS_HOURS_PER_DAY = BUSINESS_HOURS_END - BUSINESS_HOURS_START; // 9 hours

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Check if a date is within business hours
 */
function isBusinessHours(date: Date): boolean {
  const hour = date.getHours();
  return hour >= BUSINESS_HOURS_START && hour < BUSINESS_HOURS_END;
}

/**
 * Get the next business day start time
 */
function getNextBusinessDayStart(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(BUSINESS_HOURS_START, 0, 0, 0);

  // Skip weekends
  while (isWeekend(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
}

/**
 * Get business day end time for a given date
 */
function getBusinessDayEnd(date: Date): Date {
  const endTime = new Date(date);
  endTime.setHours(BUSINESS_HOURS_END, 0, 0, 0);
  return endTime;
}

/**
 * Get business day start time for a given date
 */
function getBusinessDayStart(date: Date): Date {
  const startTime = new Date(date);
  startTime.setHours(BUSINESS_HOURS_START, 0, 0, 0);
  return startTime;
}

/**
 * Calculate business hours (in minutes) between two dates
 *
 * Rules:
 * - Only counts Monday-Friday
 * - Only counts 9 AM - 6 PM
 * - Excludes weekends completely
 *
 * @param startDate - Start date/time
 * @param endDate - End date/time
 * @returns Number of business minutes between the dates
 */
export function calculateBusinessHours(startDate: Date, endDate: Date): number {
  if (startDate >= endDate) {
    return 0;
  }

  let totalMinutes = 0;
  let currentDate = new Date(startDate);

  while (currentDate < endDate) {
    // Skip weekends
    if (isWeekend(currentDate)) {
      currentDate = getNextBusinessDayStart(currentDate);
      continue;
    }

    const dayStart = getBusinessDayStart(currentDate);
    const dayEnd = getBusinessDayEnd(currentDate);

    // Determine the effective start time for this day
    let effectiveStart: Date;
    if (currentDate < dayStart) {
      effectiveStart = dayStart;
    } else if (currentDate >= dayEnd) {
      // After business hours, move to next business day
      currentDate = getNextBusinessDayStart(currentDate);
      continue;
    } else {
      effectiveStart = currentDate;
    }

    // Determine the effective end time for this day
    let effectiveEnd: Date;
    if (endDate < dayStart) {
      // End is before this day starts, we're done
      break;
    } else if (endDate <= dayEnd) {
      effectiveEnd = endDate;
    } else {
      effectiveEnd = dayEnd;
    }

    // Calculate minutes for this business day segment
    const segmentMinutes = Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / 1000 / 60);
    if (segmentMinutes > 0) {
      totalMinutes += segmentMinutes;
    }

    // Move to next day
    if (effectiveEnd < endDate) {
      currentDate = getNextBusinessDayStart(effectiveEnd);
    } else {
      break;
    }
  }

  return totalMinutes;
}

/**
 * Calculate business hours and return formatted string
 *
 * @param startDate - Start date/time
 * @param endDate - End date/time
 * @returns Formatted string like "2h 30m" or "1d 3h"
 */
export function formatBusinessHours(startDate: Date, endDate: Date): string {
  const minutes = calculateBusinessHours(startDate, endDate);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / BUSINESS_HOURS_PER_DAY);
  const remainingHours = hours % BUSINESS_HOURS_PER_DAY;

  if (remainingHours === 0) {
    return `${days}d`;
  }

  return `${days}d ${remainingHours}h`;
}

/**
 * Check if an issue is within SLA based on business hours
 *
 * @param startDate - When the issue was created/reported
 * @param slaHours - SLA time in hours
 * @param currentDate - Current date (defaults to now)
 * @returns Object with status and remaining time
 */
export function checkSLAStatus(
  startDate: Date,
  slaHours: number,
  currentDate: Date = new Date()
): {
  status: 'on-time' | 'at-risk' | 'overdue';
  elapsedMinutes: number;
  remainingMinutes: number;
  percentageUsed: number;
} {
  const elapsedMinutes = calculateBusinessHours(startDate, currentDate);
  const slaMinutes = slaHours * 60;
  const remainingMinutes = slaMinutes - elapsedMinutes;
  const percentageUsed = (elapsedMinutes / slaMinutes) * 100;

  let status: 'on-time' | 'at-risk' | 'overdue';
  if (percentageUsed >= 100) {
    status = 'overdue';
  } else if (percentageUsed >= 80) {
    status = 'at-risk';
  } else {
    status = 'on-time';
  }

  return {
    status,
    elapsedMinutes,
    remainingMinutes,
    percentageUsed: Math.min(100, Math.round(percentageUsed)),
  };
}

/**
 * Add business hours to a date
 *
 * @param startDate - Start date
 * @param hours - Number of business hours to add
 * @returns New date with business hours added
 */
export function addBusinessHours(startDate: Date, hours: number): Date {
  let remainingMinutes = hours * 60;
  let currentDate = new Date(startDate);

  while (remainingMinutes > 0) {
    // Skip weekends
    if (isWeekend(currentDate)) {
      currentDate = getNextBusinessDayStart(currentDate);
      continue;
    }

    const dayStart = getBusinessDayStart(currentDate);
    const dayEnd = getBusinessDayEnd(currentDate);

    // If before business hours, move to start
    if (currentDate < dayStart) {
      currentDate = dayStart;
    }

    // If after business hours, move to next day
    if (currentDate >= dayEnd) {
      currentDate = getNextBusinessDayStart(currentDate);
      continue;
    }

    // Calculate available minutes in this day
    const availableMinutes = Math.floor((dayEnd.getTime() - currentDate.getTime()) / 1000 / 60);

    if (remainingMinutes <= availableMinutes) {
      // Can fit in this day
      currentDate = new Date(currentDate.getTime() + remainingMinutes * 60 * 1000);
      remainingMinutes = 0;
    } else {
      // Use up this day and continue
      remainingMinutes -= availableMinutes;
      currentDate = getNextBusinessDayStart(dayEnd);
    }
  }

  return currentDate;
}
