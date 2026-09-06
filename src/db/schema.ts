import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  numeric,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const cafes = pgTable(
  "cafes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kakaoPlaceId: text("kakao_place_id").unique().notNull(),
    name: text("name").notNull(),
    roadAddress: text("road_address"),
    address: text("address"),
    phone: text("phone"),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    placeUrl: text("place_url"),
    status: text("status", { enum: ["visited", "wishlist"] })
      .notNull()
      .default("wishlist"),
    rating: numeric("rating", { precision: 2, scale: 1 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("cafes_status_idx").on(t.status)],
);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cafeId: uuid("cafe_id")
      .notNull()
      .references(() => cafes.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    photoUrl: text("photo_url"),
    visitedOn: date("visited_on"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("notes_cafe_idx").on(t.cafeId, t.createdAt)],
);

export const cafesRelations = relations(cafes, ({ many }) => ({
  notes: many(notes),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  cafe: one(cafes, { fields: [notes.cafeId], references: [cafes.id] }),
}));

export type Cafe = typeof cafes.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type CafeWithNotes = Cafe & { notes: Note[] };
