export interface SkillOption {
  id: string;
  label: string;
}

export const SKILLS_OPTIONS: SkillOption[] = [
  { id: "client_assessment_consultation", label: "Client Assessment & Consultation" },
  { id: "anatomy_physiology", label: "Anatomy & Physiology Knowledge" },
  { id: "manual_massage_techniques", label: "Manual Massage Techniques" },
  { id: "mindfulness_coaching", label: "Mindfulness Coaching" },
  { id: "stress_reduction_techniques", label: "Stress Reduction Techniques" },
  { id: "communication_client_care", label: "Communication & Client Care" },
  { id: "hygiene_safety_management", label: "Managing Hygiene & Safety" }
];

// Export an array of valid IDs for validation purposes
export const VALID_SKILL_IDS = SKILLS_OPTIONS.map(skill => skill.id);

// Export a map for quick lookup by ID
export const SKILL_MAP = SKILLS_OPTIONS.reduce((acc, skill) => {
  acc[skill.id] = skill;
  return acc;
}, {} as Record<string, SkillOption>);

// Function to get skill label by ID
export const getSkillLabel = (id: string): string => {
  return SKILL_MAP[id]?.label || id;
};

// Function to validate if an ID is valid
export const isValidSkillId = (id: string): boolean => {
  return VALID_SKILL_IDS.includes(id);
};

// Function to validate an array of skill IDs
export const validateSkillIds = (ids: string[]): boolean => {
  return ids.every(isValidSkillId);
};