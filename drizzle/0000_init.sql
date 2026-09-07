CREATE TABLE "cafes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kakao_place_id" text NOT NULL,
	"name" text NOT NULL,
	"road_address" text,
	"address" text,
	"phone" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"place_url" text,
	"status" text DEFAULT 'wishlist' NOT NULL,
	"rating" numeric(2, 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cafes_kakao_place_id_unique" UNIQUE("kakao_place_id")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cafe_id" uuid NOT NULL,
	"body" text NOT NULL,
	"photo_url" text,
	"visited_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cafes_status_idx" ON "cafes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notes_cafe_idx" ON "notes" USING btree ("cafe_id","created_at");