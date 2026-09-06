import { NextResponse, type NextRequest } from "next/server";

export type SearchResult = {
  kakaoPlaceId: string;
  name: string;
  roadAddress: string;
  address: string;
  phone: string;
  category: string;
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
  x: string;
  y: string;
  place_url: string;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", q);
  url.searchParams.set("category_group_code", "CE7");
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
    lat: Number(d.y),
    lng: Number(d.x),
    placeUrl: d.place_url,
  }));
  return NextResponse.json(results);
}
