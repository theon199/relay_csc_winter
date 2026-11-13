export interface SeedUser {
  id: string;
  displayName: string;
  role: "organizer" | "volunteer" | "admin";
  avatarSeed: string;
  email: string;
  safeNeighborhood: string;
  skills: string[];
}

export interface SeedHub {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: "pantry" | "library" | "school" | "park" | "community_center";
  isApproved: boolean;
}

export interface SeedShift {
  id: string;
  orgId: string;
  hubId: string | null;
  title: string;
  description: string;
  locationType: "in_person" | "remote";
  startAt: string;
  endAt: string;
  durationMins: number;
  capacity: number;
  status: "draft" | "published" | "full" | "completed" | "cancelled";
  requiredSkills: string[];
}

export const SEED_USERS: SeedUser[] = [
  {
    id: "usr_elena",
    displayName: "Elena Rostova",
    role: "organizer",
    avatarSeed: "elena",
    email: "elena@stjudepantry.org",
    safeNeighborhood: "Eastside Community",
    skills: ["Food Pantry Operations", "Volunteer Coordination"],
  },
  {
    id: "usr_marcus",
    displayName: "Marcus Vance",
    role: "volunteer",
    avatarSeed: "marcus",
    email: "marcus.v@student.edu",
    safeNeighborhood: "University District",
    skills: ["Organization", "Spanish", "Outdoors"],
  },
  {
    id: "usr_priya",
    displayName: "Priya Patel",
    role: "volunteer",
    avatarSeed: "priya",
    email: "priya.p@student.edu",
    safeNeighborhood: "University District",
    skills: ["Graphic Design", "Children", "Translation"],
  },
  {
    id: "usr_admin",
    displayName: "Community Trust Admin",
    role: "admin",
    avatarSeed: "admin",
    email: "admin@relaycommunity.org",
    safeNeighborhood: "Civic Center",
    skills: ["Moderation", "Safety Review"],
  },
];

export const SEED_ORGANIZATIONS = [
  {
    id: "org_st_jude",
    ownerUserId: "usr_elena",
    name: "St. Jude Community Pantry",
    description: "Grassroots neighborhood food bank providing fresh nutrition and pantry boxes.",
    isApproved: true,
  },
  {
    id: "org_library_friends",
    ownerUserId: "usr_elena",
    name: "Friends of the Public Library",
    description: "Civic alliance promoting community literacy, book archives, and student reading clubs.",
    isApproved: true,
  },
  {
    id: "org_metro_parks",
    ownerUserId: "usr_elena",
    name: "Metro Urban Gardens Guild",
    description: "Volunteer-powered sustainable agriculture, seasonal harvest mulching, and public parks.",
    isApproved: true,
  },
];

export const SEED_HUBS: SeedHub[] = [
  {
    id: "hub_pantry",
    name: "St. Jude Community Pantry",
    address: "1420 E Pine St, Seattle, WA",
    latitude: 47.6152,
    longitude: -122.3135,
    category: "pantry",
    isApproved: true,
  },
  {
    id: "hub_library",
    name: "Central Public Library",
    address: "1000 4th Ave, Seattle, WA",
    latitude: 47.6062,
    longitude: -122.3321,
    category: "library",
    isApproved: true,
  },
  {
    id: "hub_park",
    name: "Oak Park Community Garden",
    address: "800 23rd Ave, Seattle, WA",
    latitude: 47.6085,
    longitude: -122.3025,
    category: "park",
    isApproved: true,
  },
  {
    id: "hub_school",
    name: "Lincoln High School Civic Center",
    address: "4400 Interlake Ave N, Seattle, WA",
    latitude: 47.6605,
    longitude: -122.3425,
    category: "school",
    isApproved: true,
  },
];

export const SEED_SHIFTS: SeedShift[] = [
  {
    id: "shift_pantry_sorting",
    orgId: "org_st_jude",
    hubId: "hub_pantry",
    title: "Pantry Box Sorting & Packing",
    description: "Help organize incoming weekly fresh produce crates and pack essential dry pantry boxes for senior neighbors.",
    locationType: "in_person",
    startAt: "Saturday, 9:00 AM",
    endAt: "Saturday, 10:30 AM",
    durationMins: 90,
    capacity: 2,
    status: "published",
    requiredSkills: ["Organization", "Physical Help"],
  },
  {
    id: "shift_reading_corner",
    orgId: "org_library_friends",
    hubId: "hub_library",
    title: "Youth Reading Corner Setup",
    description: "Arrange comfortable reading mats, catalog weekend storybooks, and prepare craft stations for family morning.",
    locationType: "in_person",
    startAt: "Saturday, 11:00 AM",
    endAt: "Saturday, 12:00 PM",
    durationMins: 60,
    capacity: 2,
    status: "published",
    requiredSkills: ["Children", "Books", "Setup"],
  },
  {
    id: "shift_garden_mulching",
    orgId: "org_metro_parks",
    hubId: "hub_park",
    title: "Community Garden Spring Mulching",
    description: "Spreading cedar mulch along public vegetable garden beds and winter compost turning with our park stewards.",
    locationType: "in_person",
    startAt: "Sunday, 1:00 PM",
    endAt: "Sunday, 3:00 PM",
    durationMins: 120,
    capacity: 4,
    status: "published",
    requiredSkills: ["Gardening", "Outdoors"],
  },
  {
    id: "shift_backpack_meals",
    orgId: "org_st_jude",
    hubId: "hub_school",
    title: "Weekend Backpack Meal Packing",
    description: "Assemble weekend snack packs and healthy lunch bags for local student distribution.",
    locationType: "in_person",
    startAt: "Friday, 3:30 PM",
    endAt: "Friday, 4:15 PM",
    durationMins: 45,
    capacity: 3,
    status: "published",
    requiredSkills: ["Food Security", "Packing"],
  },
  {
    id: "shift_spanish_flyer",
    orgId: "org_st_jude",
    hubId: null,
    title: "Spanish Nutrition Flyer Translation",
    description: "Translate a one-page neighborhood healthy eating and pantry schedule flyer from English into conversational Spanish.",
    locationType: "remote",
    startAt: "Due by Sunday Evening",
    endAt: "Flexible (1 hr estimated)",
    durationMins: 60,
    capacity: 1,
    status: "published",
    requiredSkills: ["Spanish", "Translation"],
  },
  {
    id: "shift_winter_poster",
    orgId: "org_library_friends",
    hubId: null,
    title: "Winter Reading Gala Poster Design",
    description: "Create an inviting, accessible digital flyer in Canva or Figma for our annual youth reading kickoff.",
    locationType: "remote",
    startAt: "Due in 3 days",
    endAt: "Flexible (90 mins)",
    durationMins: 90,
    capacity: 1,
    status: "published",
    requiredSkills: ["Graphic Design", "Canva/Figma"],
  },
  {
    id: "shift_senior_tech_deck",
    orgId: "org_library_friends",
    hubId: null,
    title: "Senior Tech Workshop Slide Deck",
    description: "Draft 8 clear, high-contrast slides introducing how seniors can safely make video calls to family members.",
    locationType: "remote",
    startAt: "Due in 4 days",
    endAt: "Flexible (1 hr estimated)",
    durationMins: 60,
    capacity: 1,
    status: "published",
    requiredSkills: ["Presentation", "Teaching"],
  },
  {
    id: "shift_hours_audit",
    orgId: "org_metro_parks",
    hubId: null,
    title: "Volunteer Hours Spreadsheet Audit",
    description: "Check volunteer hour log entries against monthly sign-in sheets in Google Sheets to ensure everyone gets service credit.",
    locationType: "remote",
    startAt: "Due in 2 days",
    endAt: "Flexible (45 mins)",
    durationMins: 45,
    capacity: 1,
    status: "published",
    requiredSkills: ["Google Sheets", "Data Entry"],
  },
];
