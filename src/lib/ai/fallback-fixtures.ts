export interface DecomposedTask {
  title: string;
  description: string;
  locationType: "in_person" | "remote";
  locationText: string | null;
  suggestedDurationMins: number;
  spotsNeeded: number;
  suggestedSchedule: string | null;
  skills: string[];
  missingFields: string[];
}

export const CANONICAL_FIXTURES: Record<string, DecomposedTask[]> = {
  pantry: [
    {
      title: "Sort pantry boxes",
      description: "Organize and pack weekly grocery staples and produce for local food pantry distribution.",
      locationType: "in_person",
      locationText: "Community center / St. Jude Food Pantry",
      suggestedDurationMins: 120,
      spotsNeeded: 2,
      suggestedSchedule: "Saturday 9:00 AM – 11:00 AM",
      skills: ["Organization", "Physical Help"],
      missingFields: ["verified_hub"],
    },
    {
      title: "Spanish Event Flyer Translation",
      description: "Translate a one-page neighborhood event flyer and nutritional pantry schedule into Spanish.",
      locationType: "remote",
      locationText: null,
      suggestedDurationMins: 60,
      spotsNeeded: 1,
      suggestedSchedule: null,
      skills: ["Spanish", "Translation"],
      missingFields: ["deadline_or_schedule"],
    },
  ],
  park: [
    {
      title: "Oak Park Cedar Mulching",
      description: "Spread cedar mulch across communal garden beds and help turn seasonal compost.",
      locationType: "in_person",
      locationText: "Oak Park Community Garden",
      suggestedDurationMins: 120,
      spotsNeeded: 4,
      suggestedSchedule: "Sunday 1:00 PM – 3:00 PM",
      skills: ["Gardening", "Outdoors"],
      missingFields: ["verified_hub"],
    },
    {
      title: "Student Snack Bag Assembly",
      description: "Assemble weekend snack packs and healthy lunch bags for local students.",
      locationType: "in_person",
      locationText: "Lincoln High School",
      suggestedDurationMins: 45,
      spotsNeeded: 2,
      suggestedSchedule: "Friday afternoon",
      skills: ["Food Security", "Packing"],
      missingFields: ["exact_start_time"],
    },
  ],
  library: [
    {
      title: "Youth Reading Corner Arrangement",
      description: "Setup storybook floor mats, arrange children's books, and organize weekend craft bins.",
      locationType: "in_person",
      locationText: "Central Library",
      suggestedDurationMins: 60,
      spotsNeeded: 2,
      suggestedSchedule: "Saturday 11:00 AM",
      skills: ["Children", "Books", "Setup"],
      missingFields: ["verified_hub"],
    },
    {
      title: "Winter Reading Gala Poster Design",
      description: "Design an accessible, cheerful event poster for the annual winter reading kickoff.",
      locationType: "remote",
      locationText: null,
      suggestedDurationMins: 90,
      spotsNeeded: 1,
      suggestedSchedule: "Due in 3 days",
      skills: ["Graphic Design", "Canva/Figma"],
      missingFields: ["submission_format"],
    },
  ],
};

export function getFallbackDecomposition(prompt: string): DecomposedTask[] {
  const lower = prompt.toLowerCase();
  if (lower.includes("pantry") || lower.includes("spanish")) {
    return CANONICAL_FIXTURES.pantry;
  }
  if (lower.includes("park") || lower.includes("mulch") || lower.includes("snack")) {
    return CANONICAL_FIXTURES.park;
  }
  if (lower.includes("library") || lower.includes("gala") || lower.includes("poster")) {
    return CANONICAL_FIXTURES.library;
  }

  // Generic fallback split if free-text query is entered
  return [
    {
      title: "Community Volunteer Assistance",
      description: prompt.slice(0, 160),
      locationType: "in_person",
      locationText: "Neighborhood Public Hub",
      suggestedDurationMins: 60,
      spotsNeeded: 2,
      suggestedSchedule: "This Weekend",
      skills: ["General Help"],
      missingFields: ["verified_hub", "exact_time"],
    },
  ];
}
