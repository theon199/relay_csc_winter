import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["organizer", "volunteer", "admin"] }).notNull(),
  avatarSeed: text("avatar_seed").notNull(),
  email: text("email").notNull(),
  safeNeighborhood: text("safe_neighborhood"),
  skills: text("skills"), // JSON string array: e.g. '["Spanish", "Organization"]'
  createdAt: text("created_at").notNull(),
});

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  isApproved: integer("is_approved", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const hubs = sqliteTable("hubs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  category: text("category", {
    enum: ["pantry", "library", "school", "park", "community_center"],
  }).notNull(),
  isApproved: integer("is_approved", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const shifts = sqliteTable("shifts", {
  id: text("id").primaryKey(),
  orgId: text("org_id")
    .notNull()
    .references(() => organizations.id),
  hubId: text("hub_id").references(() => hubs.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  locationType: text("location_type", { enum: ["in_person", "remote"] }).notNull(),
  startAt: text("start_at"),
  endAt: text("end_at"),
  durationMins: integer("duration_mins").notNull().default(60),
  capacity: integer("capacity").notNull().default(2),
  status: text("status", {
    enum: ["draft", "published", "full", "completed", "cancelled"],
  })
    .notNull()
    .default("published"),
  requiredSkills: text("required_skills"), // JSON string array
  intakeRequestId: text("intake_request_id"),
  createdAt: text("created_at").notNull(),
});

export const shiftClaims = sqliteTable("shift_claims", {
  id: text("id").primaryKey(),
  shiftId: text("shift_id")
    .notNull()
    .references(() => shifts.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  status: text("status", { enum: ["confirmed", "cancelled", "completed"] })
    .notNull()
    .default("confirmed"),
  invitationId: text("invitation_id"),
  createdAt: text("created_at").notNull(),
});

export const invitations = sqliteTable("invitations", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  shiftId: text("shift_id")
    .notNull()
    .references(() => shifts.id),
  inviterUserId: text("inviter_user_id")
    .notNull()
    .references(() => users.id),
  claimedByUserId: text("claimed_by_user_id").references(() => users.id),
  status: text("status", { enum: ["active", "claimed", "expired", "revoked"] })
    .notNull()
    .default("active"),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const intakeRequests = sqliteTable("intake_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  rawText: text("raw_text").notNull(),
  parsedJson: text("parsed_json"),
  status: text("status", { enum: ["draft", "reviewed", "published"] })
    .notNull()
    .default("reviewed"),
  createdAt: text("created_at").notNull(),
});
