export function naverMapUrl(name: string, lat: number, lng: number) {
  // 웹 URL: 모바일에서는 네이버가 앱 열기 배너를 띄워줌
  return `https://map.naver.com/p/search/${encodeURIComponent(name)}?c=${lng},${lat},17,0,0,0,dh`;
}

export function kakaoMapUrl(placeUrl: string | null, name: string) {
  return placeUrl ?? `https://map.kakao.com/?q=${encodeURIComponent(name)}`;
}
