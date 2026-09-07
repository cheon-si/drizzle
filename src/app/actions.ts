"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { cafes, notes } from "@/db/schema";
import { SESSION_COOKIE, sessionToken } from "@/lib/auth";
import type { SearchResult } from "./api/search/route";

function revalidate() {
  revalidatePath("/map");
  revalidatePath("/list");
}

export async function login(_: unknown, formData: FormData) {
  const pw = formData.get("password");
  if (pw !== process.env.APP_PASSWORD) {
    return { error: "비밀번호가 틀렸어요" };
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect("/map");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/");
}

export async function saveCafe(r: SearchResult) {
  const [row] = await db
    .insert(cafes)
    .values({
      kakaoPlaceId: r.kakaoPlaceId,
      name: r.name,
      roadAddress: r.roadAddress || null,
      address: r.address || null,
      phone: r.phone || null,
      lat: r.lat,
      lng: r.lng,
      placeUrl: r.placeUrl || null,
    })
    .onConflictDoUpdate({
      target: cafes.kakaoPlaceId,
      set: {
        name: r.name,
        roadAddress: r.roadAddress || null,
        address: r.address || null,
        phone: r.phone || null,
        lat: r.lat,
        lng: r.lng,
        placeUrl: r.placeUrl || null,
        updatedAt: new Date(),
      },
    })
    .returning({ id: cafes.id });
  revalidate();
  return row.id;
}

export async function setRating(id: string, rating: number | null) {
  if (rating !== null && (rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0)) {
    throw new Error("invalid rating");
  }
  await db
    .update(cafes)
    .set({ rating: rating === null ? null : rating.toFixed(1), updatedAt: new Date() })
    .where(eq(cafes.id, id));
  revalidate();
}

export async function setStatus(id: string, status: "visited" | "wishlist") {
  await db
    .update(cafes)
    .set({ status, updatedAt: new Date() })
    .where(eq(cafes.id, id));
  revalidate();
}

export async function deleteCafe(id: string) {
  await db.delete(cafes).where(eq(cafes.id, id));
  revalidate();
}

export async function addNote(cafeId: string, body: string, visitedOn: string | null) {
  const text = body.trim();
  if (!text || text.length > 1000) throw new Error("invalid note");
  await db.insert(notes).values({ cafeId, body: text, visitedOn: visitedOn || null });
  // 기록을 남기면 자연스럽게 '다녀옴'(visited)으로
  await db
    .update(cafes)
    .set({ status: "visited", updatedAt: new Date() })
    .where(eq(cafes.id, cafeId));
  revalidate();
}

export async function deleteNote(id: string) {
  await db.delete(notes).where(eq(notes.id, id));
  revalidate();
}
