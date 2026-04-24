CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint
CREATE TABLE "entry_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"actor_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gratitude_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"body" text NOT NULL,
	"author_name" text NOT NULL,
	"owner_profile_id" uuid,
	"guest_ownership_id" uuid,
	"visibility" text DEFAULT 'public' NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_ownerships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid,
	"event_type" text NOT NULL,
	"actor_key" text,
	"reason" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gratitude_entries" ADD CONSTRAINT "gratitude_entries_body_length_check" CHECK (char_length("body") between 12 and 1000);--> statement-breakpoint
ALTER TABLE "gratitude_entries" ADD CONSTRAINT "gratitude_entries_author_name_length_check" CHECK (char_length("author_name") between 2 and 40);--> statement-breakpoint
ALTER TABLE "gratitude_entries" ADD CONSTRAINT "gratitude_entries_visibility_check" CHECK ("visibility" in ('public', 'hidden', 'removed'));--> statement-breakpoint
ALTER TABLE "gratitude_entries" ADD CONSTRAINT "gratitude_entries_single_owner_check" CHECK (
  ("owner_profile_id" is not null and "guest_ownership_id" is null)
  or ("owner_profile_id" is null and "guest_ownership_id" is not null)
);--> statement-breakpoint
ALTER TABLE "entry_reactions" ADD CONSTRAINT "entry_reactions_entry_id_gratitude_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."gratitude_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gratitude_entries" ADD CONSTRAINT "gratitude_entries_owner_profile_id_profiles_id_fk" FOREIGN KEY ("owner_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gratitude_entries" ADD CONSTRAINT "gratitude_entries_guest_ownership_id_guest_ownerships_id_fk" FOREIGN KEY ("guest_ownership_id") REFERENCES "public"."guest_ownerships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_events" ADD CONSTRAINT "moderation_events_entry_id_gratitude_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."gratitude_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "entry_reactions_entry_actor_unique" ON "entry_reactions" USING btree ("entry_id","actor_key");--> statement-breakpoint
CREATE INDEX "entry_reactions_entry_idx" ON "entry_reactions" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "gratitude_entries_public_latest_idx" ON "gratitude_entries" USING btree ("created_at") WHERE "gratitude_entries"."visibility" = 'public';--> statement-breakpoint
CREATE INDEX "gratitude_entries_owner_profile_idx" ON "gratitude_entries" USING btree ("owner_profile_id","created_at") WHERE "gratitude_entries"."owner_profile_id" is not null;--> statement-breakpoint
CREATE INDEX "gratitude_entries_guest_owner_idx" ON "gratitude_entries" USING btree ("guest_ownership_id","created_at") WHERE "gratitude_entries"."guest_ownership_id" is not null;--> statement-breakpoint
CREATE INDEX "moderation_events_entry_idx" ON "moderation_events" USING btree ("entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_provider_account_unique" ON "profiles" USING btree ("provider","provider_account_id");
