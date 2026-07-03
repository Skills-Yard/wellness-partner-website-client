export const DEFAULT_CITY = "Delhi NCR";
export const DEFAULT_PROFESSION = "Male Massage";

export const HIRING_MATRIX: Record<string, string[]> = {
  Mumbai: ["Massage Therapist", "Female Massage", "Corporate Professional"],
  Bangalore: ["Massage Therapist", "Corporate Professional"],
  Pune: ["Female Massage"],
  Hyderabad: ["Massage Therapist"],
  Chennai: ["Massage Therapist", "Female Massage"],
};

export function isServiceAvailable(city: string, profession: string): boolean {
  if (!city || !profession) return false;
  const availableProfessions = HIRING_MATRIX[city] || [];
  return availableProfessions.includes(profession);
}
