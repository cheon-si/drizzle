import { NextResponse, type NextRequest } from "next/server";

export type SearchResult = {
  kakaoPlaceId: string;
  name: string;
  roadAddress: string;
  address: string;
  phone: string;
  /** 마지막 카테고리 (예: "카페", "와인바") */
  category: string;
  /** 카카오 그룹 코드. CE7=카페, FD6=음식점 … 카페 여부 판단에 쓴다 */
  categoryGroup: string;
  lat: number;
  lng: number;
  placeUrl: string;
};

type KakaoDoc = {
  id: string;
  place_name: string;
  road_address_name: string;
  address_name: string;
  phone: string;
  category_name: string;
  category_group_code: string;
  x: string;
  y: string;
  place_url: string;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", q);
  // 카페(CE7)만 걸던 필터를 제거 — 와인바·베이커리 등도 저장 대상. 대신 결과에서 카페를 먼저 보여준다
  url.searchParams.set("size", "15");
  const x = request.nextUrl.searchParams.get("x");
  const y = request.nextUrl.searchParams.get("y");
  if (x && y) {
    url.searchParams.set("x", x);
    url.searchParams.set("y", y);
  }

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return NextResponse.json({ error: "kakao_error" }, { status: 502 });
  }
  const data = (await res.json()) as { documents: KakaoDoc[] };
  const results: SearchResult[] = data.documents.map((d) => ({
    kakaoPlaceId: d.id,
    name: d.place_name,
    roadAddress: d.road_address_name,
    address: d.address_name,
    phone: d.phone,
    category: d.category_name.split(">").pop()?.trim() ?? "",
    categoryGroup: d.category_group_code,
    lat: Number(d.y),
    lng: Number(d.x),
    placeUrl: d.place_url,
  }));
  // 카카오 관련도 순서는 유지하되 카페를 앞으로 (Array.sort는 stable)
  results.sort((a, b) => Number(b.categoryGroup === "CE7") - Number(a.categoryGroup === "CE7"));
  return NextResponse.json(results);
}
