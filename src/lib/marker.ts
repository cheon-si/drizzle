/** 상태/별점에 따른 커스텀 SVG 마커 (data URI) */
export function markerSvg(kind: "wishlist" | "visited" | "love" | "candidate") {
  const fill =
    kind === "wishlist"
      ? "#c9a57f"
      : kind === "candidate"
        ? "#7a6a5f"
        : "#f28b82";
  const badge =
    kind === "love"
      ? `<circle cx="30" cy="8" r="7" fill="#fff"/><text x="30" y="11.5" font-size="10" text-anchor="middle">❤️</text>`
      : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
  <path d="M20 46 C8 30 4 24 4 17 A16 16 0 0 1 36 17 C36 24 32 30 20 46Z" fill="${fill}" stroke="#fff" stroke-width="2"/>
  <path d="M12 12h13v8a6.5 6.5 0 0 1-6.5 6.5A6.5 6.5 0 0 1 12 20z" fill="#fff"/>
  <path d="M25 14h2.5a3 3 0 0 1 0 6H25" fill="none" stroke="#fff" stroke-width="2"/>
  ${badge}
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const MARKER_SIZE = { w: 40, h: 48 };
