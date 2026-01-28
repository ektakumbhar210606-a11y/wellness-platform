export interface ExpertiseOption {
  id: string;
  label: string;
}

export const EXPERTISE_OPTIONS: ExpertiseOption[] = [
  { id: "swedish_massage", label: "Swedish Massage" },
  { id: "deep_tissue_massage", label: "Deep Tissue Massage" },
  { id: "aromatherapy_massage", label: "Aromatherapy Massage" },
  { id: "hot_stone_massage", label: "Hot Stone Massage" },
  { id: "thai_massage", label: "Thai Massage" },
  { id: "reflexology", label: "Reflexology (Foot Massage)" },
  { id: "head_neck_shoulder_massage", label: "Head, Neck & Shoulder Massage" },
  { id: "facial_treatments_basic", label: "Facial Treatments (Basic)" },
  { id: "facial_treatments_advanced", label: "Facial Treatments (Advanced)" },
  { id: "body_scrub_polishing", label: "Body Scrub & Body Polishing" },
  { id: "body_wrap_therapy", label: "Body Wrap Therapy" },
  { id: "manicure_pedicure", label: "Manicure & Pedicure" },
  { id: "hair_spa_treatment", label: "Hair Spa Treatment" },
  { id: "meditation_mindfulness", label: "Meditation & Mindfulness Programs" },
  { id: "weight_management", label: "Weight Management Programs" },
  { id: "stress_management", label: "Stress Management Therapy" },
  { id: "detox_lifestyle", label: "Detox & Lifestyle Improvement Programs" },
  { id: "mental_wellness_counseling", label: "Mental Wellness Counseling" },
  { id: "sleep_improvement", label: "Sleep Improvement Programs" }
];

// Export an array of valid IDs for validation purposes
export const VALID_EXPERTISE_IDS = EXPERTISE_OPTIONS.map(expertise => expertise.id);

// Export a map for quick lookup by ID
export const EXPERTISE_MAP = EXPERTISE_OPTIONS.reduce((acc, expertise) => {
  acc[expertise.id] = expertise;
  return acc;
}, {} as Record<string, ExpertiseOption>);

// Function to get expertise label by ID
export const getExpertiseLabel = (id: string): string => {
  return EXPERTISE_MAP[id]?.label || id;
};

// Function to validate if an ID is valid
export const isValidExpertiseId = (id: string): boolean => {
  return VALID_EXPERTISE_IDS.includes(id);
};

// Function to validate an array of expertise IDs
export const validateExpertiseIds = (ids: string[]): boolean => {
  return ids.every(isValidExpertiseId);
};