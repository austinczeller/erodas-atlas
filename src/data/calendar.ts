// The Erodian Standard Calendar, taken from the vault's Calendarium settings.
// Update `today` as the campaign moves forward.

export const fantasyCalendarUrl =
  "https://app.fantasy-calendar.com/calendars/1ace9b1ba0c9b96a062d6ffdca5910f4";

// The in-world date at the table. Month 1 is Nhaale.
export const today = { year: 12004, month: 1, day: 59 };

export const DAYS_IN_MONTH = 80;
export const DAYS_IN_WEEK = 10;
export const DAYS_IN_YEAR = 320;

export const months = [
  { name: "Nhaale", meaning: "Inhale", season: "Spring", text: "The first month of the year, representing spring in Northern Erodas." },
  { name: "Htaale", meaning: "Heat", season: "Summer", text: "The second month of the year. It represents the Elvish heat, and is the summer month in Northern Erodas." },
  { name: "Xhaale", meaning: "Exhale", season: "Autumn", text: "The third month of the year. It represents the Elvish expiration and decay of life. In Northern Erodas it is the month of fall." },
  { name: "Salaale", meaning: "Quiet", season: "Winter", text: "The fourth and final month of the year. It represents the Elvish quiet and the season of winter in Northern Erodas." },
];

export const weekdays = [
  { name: "Vitael", meaning: "Spirit" },
  { name: "Luxael", meaning: "Light" },
  { name: "Umrael", meaning: "Shadow" },
  { name: "Terrael", meaning: "Land" },
  { name: "Aelwyn", meaning: "Air" },
  { name: "Aquael", meaning: "Water" },
  { name: "Pyrael", meaning: "Fire" },
  { name: "Temprael", meaning: "Storm" },
  { name: "Veloriael", meaning: "Noise" },
  { name: "Vaelchron", meaning: "Time" },
];

// Days of the year that aren't holidays but are still marked on the calendar.
export const seasonalDays = [
  { title: "Summer Solstice", month: 2, day: 40 },
  { title: "Winter Solstice", month: 4, day: 40 },
];

export const moons = [
  { id: "tethra", name: "Têthra", cycle: 64, offset: 20, face: "#f4f2e8" },
  { id: "pepra", name: "Pêpra", cycle: 200, offset: 0, face: "#d9c46a" },
];

export const PHASES = [
  "New",
  "Waxing crescent",
  "First quarter",
  "Waxing gibbous",
  "Full",
  "Waning gibbous",
  "Last quarter",
  "Waning crescent",
] as const;

// Days since the start of the calendar, counting from 1st Nhaale of year 1.
export function dayNumber(year: number, month: number, day: number) {
  return (year - 1) * DAYS_IN_YEAR + (month - 1) * DAYS_IN_MONTH + (day - 1);
}

// Where a moon is in its cycle on a given day, from 0 (new) up to 1.
export function moonPosition(moon: (typeof moons)[number], n: number) {
  const d = (((n - moon.offset) % moon.cycle) + moon.cycle) % moon.cycle;
  return d / moon.cycle;
}

export function phaseName(position: number) {
  return PHASES[Math.round(position * 8) % 8];
}

// True on the single day a moon reaches new, first quarter, full or last quarter.
export function principalPhase(moon: (typeof moons)[number], n: number): string | null {
  const d = (((n - moon.offset) % moon.cycle) + moon.cycle) % moon.cycle;
  for (const [k, label] of [
    [0, "New"],
    [1, "First quarter"],
    [2, "Full"],
    [3, "Last quarter"],
  ] as const) {
    if (d === Math.round((k * moon.cycle) / 4)) return label;
  }
  return null;
}

export function weekdayOf(day: number) {
  return weekdays[(day - 1) % DAYS_IN_WEEK];
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
