"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import type { CafeDto } from "@/lib/dto";
import type { SearchResult } from "@/app/api/search/route";
import { markerSvg, MARKER_SIZE } from "@/lib/marker";
import SearchSheet from "./SearchSheet";
import CafeSheet from "./CafeSheet";

const SEOUL = { lat: 37.5665, lng: 126.978 };
const CLUSTER_MIN = 30;

type Props = {
  cafes: CafeDto[];
  initialSelectedId: string | null;
  jsKey: string;
};

function loadSdk(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps?.Map) return resolve();
    const existing = document.getElementById("kakao-sdk");
    if (existing) {
      existing.addEventListener("load", () => window.kakao.maps.load(resolve));
      return;
    }
    const s = document.createElement("script");
    s.id = "kakao-sdk";
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=clusterer`;
    s.async = true;
    s.onload = () => window.kakao.maps.load(resolve);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function MapView({ cafes, initialSelectedId, jsKey }: Props) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clustererRef = useRef<any>(null);
  const candidateRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [candidate, setCandidate] = useState<SearchResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selected = cafes.find((c) => c.id === selectedId) ?? null;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  // SDK 로드 + 지도 생성 (1회)
  useEffect(() => {
    let cancelled = false;
    loadSdk(jsKey)
      .then(() => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        const { kakao } = window;
        const first = cafes.find((c) => c.id === initialSelectedId) ?? cafes[0];
        const center = first ?? SEOUL;
        mapRef.current = new kakao.maps.Map(mapEl.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level: first ? 4 : 7,
        });
        setReady(true);
      })
      .catch(() => showToast("지도를 불러오지 못했어요"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsKey]);

  // 저장된 카페 마커 갱신
  useEffect(() => {
    if (!ready) return;
    const { kakao } = window;
    const map = mapRef.current;

    markersRef.current.forEach((m) => m.setMap(null));
    clustererRef.current?.clear();
    markersRef.current = [];

    const size = new kakao.maps.Size(MARKER_SIZE.w, MARKER_SIZE.h);
    const offset = new kakao.maps.Point(MARKER_SIZE.w / 2, MARKER_SIZE.h);
    const images: Record<string, any> = {};
    const img = (kind: "wishlist" | "visited" | "love") =>
      (images[kind] ??= new kakao.maps.MarkerImage(markerSvg(kind), size, {
        offset,
      }));

    const markers = cafes.map((c) => {
      const kind =
        c.status === "wishlist"
          ? "wishlist"
          : (c.rating ?? 0) >= 4.5
            ? "love"
            : "visited";
      const m = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(c.lat, c.lng),
        image: img(kind),
        title: c.name,
      });
      kakao.maps.event.addListener(m, "click", () => {
        setCandidate(null);
        setSelectedId(c.id);
        map.panTo(new kakao.maps.LatLng(c.lat, c.lng));
      });
      return m;
    });
    markersRef.current = markers;

    if (cafes.length >= CLUSTER_MIN) {
      clustererRef.current ??= new kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: 6,
        styles: [
          {
            width: "40px",
            height: "40px",
            background: "rgba(242,139,130,.9)",
            borderRadius: "20px",
            color: "#fff",
            textAlign: "center",
            lineHeight: "40px",
            fontWeight: "600",
          },
        ],
      });
      clustererRef.current.addMarkers(markers);
    } else {
      markers.forEach((m) => m.setMap(map));
    }
  }, [ready, cafes]);

  // 검색 후보 임시 마커
  useEffect(() => {
    if (!ready) return;
    const { kakao } = window;
    candidateRef.current?.setMap(null);
    candidateRef.current = null;
    if (!candidate) return;
    const pos = new kakao.maps.LatLng(candidate.lat, candidate.lng);
    candidateRef.current = new kakao.maps.Marker({
      position: pos,
      image: new kakao.maps.MarkerImage(
        markerSvg("candidate"),
        new kakao.maps.Size(MARKER_SIZE.w, MARKER_SIZE.h),
        { offset: new kakao.maps.Point(MARKER_SIZE.w / 2, MARKER_SIZE.h) },
      ),
      map: mapRef.current,
      zIndex: 10,
    });
    mapRef.current.setLevel(4);
    mapRef.current.panTo(pos);
  }, [ready, candidate]);

  const locate = () => {
    if (!navigator.geolocation) return showToast("위치를 쓸 수 없어요");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { kakao } = window;
        mapRef.current?.setLevel(5);
        mapRef.current?.panTo(
          new kakao.maps.LatLng(p.coords.latitude, p.coords.longitude),
        );
      },
      () => {
        const { kakao } = window;
        mapRef.current?.panTo(new kakao.maps.LatLng(SEOUL.lat, SEOUL.lng));
        showToast("위치 권한이 없어 서울시청으로 이동했어요");
      },
      { timeout: 5000 },
    );
  };

  const mapCenter = useCallback(() => {
    const c = mapRef.current?.getCenter();
    return c ? { lat: c.getLat(), lng: c.getLng() } : null;
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <div ref={mapEl} className="absolute inset-0" />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-mocha">
          지도를 불러오는 중…
        </div>
      )}

      <button
        onClick={locate}
        aria-label="현재 위치"
        className="absolute right-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-full bg-white shadow-md active:scale-95"
      >
        📍
      </button>

      {selected ? (
        <CafeSheet
          cafe={selected}
          onClose={() => setSelectedId(null)}
          onToast={showToast}
        />
      ) : (
        <SearchSheet
          candidate={candidate}
          savedIds={new Set(cafes.map((c) => c.kakaoPlaceId))}
          onPick={setCandidate}
          onSaved={(id) => {
            setCandidate(null);
            setSelectedId(id);
            showToast("저장했어요 ☕️");
          }}
          getCenter={mapCenter}
        />
      )}

      {toast && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-40 flex justify-center">
          <div className="rounded-full bg-cocoa/90 px-4 py-2 text-sm text-white shadow">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
