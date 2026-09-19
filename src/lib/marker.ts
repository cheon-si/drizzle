/** 마커 색을 정하는 재료. 카페가 아니면(와인바·베이커리 등) 상태와 무관하게 와인색 */
export type MarkerKind = {
  status: "wishlist" | "visited" | "candidate";
  isCafe: boolean;
  /** 별점 4.5 이상이면 하트 배지 */
  love?: boolean;
};

const COLOR = {
  candidate: "#7a6a5f", // mocha
  wishlist: "#c9a57f", // latte
  visited: "#f28b82", // coral
  other: "#9a5b6b", // wine — 카페 외 장소
} as const;

/** 상태/별점/업종에 따른 커스텀 SVG 마커 (data URI) */
export function markerSvg({ status, isCafe, love }: MarkerKind) {
  const fill =
    status === "candidate" ? COLOR.candidate : isCafe ? COLOR[status] : COLOR.other;
  const badge = love
    ? `<circle cx="30" cy="8" r="7" fill="#fff"/><text x="30" y="11.5" font-size="10" text-anchor="middle">❤️</text>`
    : "";
  // 카페는 커피컵, 그 외는 와인잔 픽토그램
  const icon = isCafe
    ? `<path d="M12 12h13v8a6.5 6.5 0 0 1-6.5 6.5A6.5 6.5 0 0 1 12 20z" fill="#fff"/>
  <path d="M25 14h2.5a3 3 0 0 1 0 6H25" fill="none" stroke="#fff" stroke-width="2"/>`
    : `<path d="M14 10h12l-1 7a5 5 0 0 1-10 0z" fill="#fff"/>
  <path d="M20 22v5M16 27h8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
  <path d="M20 46 C8 30 4 24 4 17 A16 16 0 0 1 36 17 C36 24 32 30 20 46Z" fill="${fill}" stroke="#fff" stroke-width="2"/>
  ${icon}
  ${badge}
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** 이미지 캐시 키. 같은 조합은 MarkerImage를 재사용한다 */
export function markerKey(k: MarkerKind) {
  return `${k.status}|${k.isCafe ? "cafe" : "other"}|${k.love ? "love" : ""}`;
}

export const MARKER_SIZE = { w: 40, h: 48 };
