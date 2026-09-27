/**
 * Utilities for Kanban Due Date & Time references.
 * Formats ISO timestamps (e.g. YYYY-MM-DDTHH:mm:ss) so the Cloudflare Worker / Telegram Bot
 * can query, schedule, and dispatch exact reminders (e.g. /agenda, cron triggers).
 */

export interface DueDateStatus {
  formatted: string;
  dayDate: string;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  hasTime: boolean;
}

/**
 * Returns formatted display text and status for an ISO datetime string.
 * Gracefully falls back to raw string for legacy text.
 */
export function formatDueDateTime(dueStr?: string | null): DueDateStatus {
  if (!dueStr || !dueStr.trim()) {
    return {
      formatted: '',
      dayDate: '',
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
      hasTime: false,
    };
  }

  const raw = dueStr.trim();
  const dateObj = new Date(raw);

  // If invalid date (e.g. legacy plain text "Fri"), return as is
  if (isNaN(dateObj.getTime())) {
    const lower = raw.toLowerCase();
    return {
      formatted: raw,
      dayDate: raw,
      isOverdue: false,
      isToday: lower.includes('today'),
      isTomorrow: lower.includes('tomorrow'),
      hasTime: false,
    };
  }

  const now = new Date();
  const isOverdue = dateObj.getTime() < now.getTime();

  const isToday =
    dateObj.getFullYear() === now.getFullYear() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getDate() === now.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    dateObj.getFullYear() === tomorrow.getFullYear() &&
    dateObj.getMonth() === tomorrow.getMonth() &&
    dateObj.getDate() === tomorrow.getDate();

  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const hasTime = raw.includes('T') || raw.includes(':');
  const timeStr = `${hours}:${minutes}`;

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const dayName = dayNames[dateObj.getDay()];
  const monthName = monthNames[dateObj.getMonth()];
  const dayNum = dateObj.getDate();

  const dayDate = isToday
    ? `Today, ${monthName} ${dayNum}`
    : isTomorrow
      ? `Tomorrow, ${monthName} ${dayNum}`
      : `${dayName}, ${monthName} ${dayNum}`;

  if (isToday) {
    return {
      formatted: hasTime ? `Today ${timeStr}` : 'Today',
      dayDate,
      isOverdue: false,
      isToday: true,
      isTomorrow: false,
      hasTime,
    };
  }

  if (isTomorrow) {
    return {
      formatted: hasTime ? `Tomorrow ${timeStr}` : 'Tomorrow',
      dayDate,
      isOverdue: false,
      isToday: false,
      isTomorrow: true,
      hasTime,
    };
  }

  const formatted = hasTime
    ? `${dayName}, ${monthName} ${dayNum} · ${timeStr}`
    : `${dayName}, ${monthName} ${dayNum}`;

  return {
    formatted,
    dayDate,
    isOverdue,
    isToday: false,
    isTomorrow: false,
    hasTime,
  };
}

/**
 * Generates ISO string (YYYY-MM-DDTHH:mm) for standard quick presets.
 */
export function getDuePresetIso(
  preset: 'today_eod' | 'tomorrow_morning' | 'this_friday' | 'next_monday'
): string {
  const now = new Date();
  switch (preset) {
    case 'today_eod': {
      const d = new Date(now);
      d.setHours(17, 0, 0, 0);
      return toLocalIsoString(d);
    }
    case 'tomorrow_morning': {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return toLocalIsoString(d);
    }
    case 'this_friday': {
      const d = new Date(now);
      const day = d.getDay();
      const diff = (5 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      d.setHours(17, 0, 0, 0);
      return toLocalIsoString(d);
    }
    case 'next_monday': {
      const d = new Date(now);
      const day = d.getDay();
      const diff = (8 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      d.setHours(9, 0, 0, 0);
      return toLocalIsoString(d);
    }
    default:
      return toLocalIsoString(now);
  }
}

/**
 * Converts a Date object to YYYY-MM-DDTHH:mm string for <input type="datetime-local">
 */
export function toLocalIsoString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
