import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    displayName: text("display_name").notNull(),
    displayNameChangedAt: timestamp("display_name_changed_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("profiles_provider_account_unique").on(
      table.provider,
      table.providerAccountId,
    ),
  ],
);

export const guestOwnerships = pgTable("guest_ownerships", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorName: text("author_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const gratitudeEntries = pgTable(
  "gratitude_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    body: text("body").notNull(),
    authorName: text("author_name").notNull(),
    ownerProfileId: uuid("owner_profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    guestOwnershipId: uuid("guest_ownership_id").references(
      () => guestOwnerships.id,
      {
        onDelete: "set null",
      },
    ),
    visibility: text("visibility").notNull().default("public"),
    locale: text("locale").notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("gratitude_entries_public_latest_idx")
      .on(table.createdAt)
      .where(sql`${table.visibility} = 'public'`),
    index("gratitude_entries_owner_profile_idx")
      .on(table.ownerProfileId, table.createdAt)
      .where(sql`${table.ownerProfileId} is not null`),
    index("gratitude_entries_guest_owner_idx")
      .on(table.guestOwnershipId, table.createdAt)
      .where(sql`${table.guestOwnershipId} is not null`),
  ],
);

export const entryReactions = pgTable(
  "entry_reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => gratitudeEntries.id, { onDelete: "cascade" }),
    actorKey: text("actor_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("entry_reactions_entry_actor_unique").on(
      table.entryId,
      table.actorKey,
    ),
    index("entry_reactions_entry_idx").on(table.entryId),
  ],
);

export const moderationEvents = pgTable(
  "moderation_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entryId: uuid("entry_id").references(() => gratitudeEntries.id, {
      onDelete: "cascade",
    }),
    eventType: text("event_type").notNull(),
    actorKey: text("actor_key"),
    reason: text("reason"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("moderation_events_entry_idx").on(table.entryId)],
);
