"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import type { SearchResult } from "@/app/api/search/route";
import { saveCafe } from "@/app/actions";

type Props = {
  candidate: SearchResult | null;
  savedIds: Set<string>;
  onPick: (r: SearchResult | null) => void;
  onSaved: (id: string) => void;
  getCenter: () => { lat: number; lng: number } | null;
};

export default function SearchSheet({
  candidate,
  savedIds,
  onPick,
  onSaved,
  getCenter,
}: Props) {
  const [q, setQ] = useState("");
  const [rawResults, setResults] = useState<SearchResult[]>([]);
  const results = q.trim() ? rawResults : [];
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  // 300ms 디바운스 검색
  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const c = getCenter();
        const params = new URLSearchParams({ q: term });
        if (c) {
          params.set("x", String(c.lng));
          params.set("y", String(c.lat));
        }
        const res = await fetch(`/api/search?${params}`, { signal: ctrl.signal });
        if (res.ok) setResults(await res.json());
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, getCenter]);

  const save = (r: SearchResult) =>
    start(async () => {
      const id = await saveCafe(r);
      setQ("");
      setOpen(false);
      onSaved(id);
    });

  return (
    <div className="sheet absolute inset-x-0 bottom-14 z-20 mx-2 rounded-t-2xl bg-white/95 pb-2 backdrop-blur">
      <div className="flex items-center gap-2 p-3">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="카페 이름이나 동네를 검색해요"
          className="flex-1 rounded-xl bg-cream px-4 py-3 outline-none ring-1 ring-cream-deep focus:ring-latte"
        />
        {q && (
          <button
            onClick={() => {
              setQ("");
              onPick(null);
            }}
            className="rounded-full p-1.5 text-mocha active:bg-cream"
            aria-label="지우기"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {candidate && (
        <div className="mx-3 mb-2 flex items-center justify-between rounded-xl bg-cream-deep/60 px-3 py-2">
          <div className="min-w-0">
            <div className="truncate font-semibold">{candidate.name}</div>
            <div className="truncate text-xs text-mocha">
              {candidate.roadAddress || candidate.address}
            </div>
          </div>
          {savedIds.has(candidate.kakaoPlaceId) ? (
            <span className="ml-2 shrink-0 text-xs text-mocha">이미 저장됨</span>
          ) : (
            <button
              disabled={pending}
              onClick={() => save(candidate)}
              className="ml-2 shrink-0 rounded-full bg-coral px-4 py-1.5 text-sm font-semibold text-white active:scale-95 disabled:opacity-60"
            >
              저장
            </button>
          )}
        </div>
      )}

      {open && q && (
        <ul className="max-h-[45dvh] overflow-y-auto px-2">
          {loading && results.length === 0 && (
            <li className="p-3 text-sm text-mocha">검색 중…</li>
          )}
          {!loading && results.length === 0 && (
            <li className="p-3 text-sm text-mocha">결과가 없어요</li>
          )}
          {results.map((r) => (
            <li key={r.kakaoPlaceId}>
              <button
                onClick={() => {
                  onPick(r);
                  setOpen(false);
                }}
                className="flex w-full items-start justify-between gap-2 rounded-xl px-3 py-2.5 text-left active:bg-cream"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.name}</div>
                  <div className="truncate text-xs text-mocha">
                    {r.roadAddress || r.address}
                  </div>
                </div>
                {savedIds.has(r.kakaoPlaceId) && (
                  <span className="shrink-0 text-xs text-coral-deep">저장됨</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
