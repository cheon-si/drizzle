import type { CafeWithNotes } from "@/db/schema";

/** 클라이언트로 넘길 직렬화 형태 (numeric→number, Date→string) */
export type CafeDto = {
  id: string;
  kakaoPlaceId: string;
  name: string;
  roadAddress: string | null;
  address: string | null;
  phone: string | null;
  lat: number;
  lng: number;
  placeUrl: string | null;
  status: "visited" | "wishlist";
  rating: number | null;
  createdAt: string;
  notes: {
    id: string;
    body: string;
    visitedOn: string | null;
    createdAt: string;
    /** <img src>에 바로 넣는 값. private Blob이라 /api/photo를 경유한다 */
    photoSrc: string | null;
  }[];
};

/** Blob 전체 URL → /api/photo?p=<pathname> (앞의 "/" 제거) */
function photoSrcOf(url: string | null): string | null {
  if (!url) return null;
  try {
    const pathname = new URL(url).pathname.slice(1);
    return `/api/photo?p=${encodeURIComponent(pathname)}`;
  } catch {
    return null;
  }
}

export function toDto(c: CafeWithNotes): CafeDto {
  return {
    id: c.id,
    kakaoPlaceId: c.kakaoPlaceId,
    name: c.name,
    roadAddress: c.roadAddress,
    address: c.address,
    phone: c.phone,
    lat: c.lat,
    lng: c.lng,
    placeUrl: c.placeUrl,
    status: c.status,
    rating: c.rating === null ? null : Number(c.rating),
    createdAt: c.createdAt.toISOString(),
    notes: c.notes.map((n) => ({
      id: n.id,
      body: n.body,
      visitedOn: n.visitedOn,
      createdAt: n.createdAt.toISOString(),
      photoSrc: photoSrcOf(n.photoUrl),
    })),
  };
}
