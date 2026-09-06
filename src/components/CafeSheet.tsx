"use client";

import { useState, useTransition } from "react";
import type { CafeDto } from "@/lib/dto";
import {
  addNote,
  deleteCafe,
  deleteNote,
  setRating,
  setStatus,
} from "@/app/actions";
import { kakaoMapUrl, naverMapUrl } from "@/lib/links";
import StarRating from "./StarRating";

type Props = {
  cafe: CafeDto;
  onClose: () => void;
  onToast: (msg: string) => void;
};

export default function CafeSheet({ cafe, onClose, onToast }: Props) {
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");
  const [visitedOn, setVisitedOn] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`sheet absolute inset-x-0 bottom-14 z-20 mx-2 flex flex-col rounded-t-2xl bg-white/95 backdrop-blur transition-[max-height] ${
        expanded ? "max-h-[85dvh]" : "max-h-[55dvh]"
      }`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-cream-deep"
        aria-label="시트 크기 조절"
      />
      <div className="flex items-start justify-between gap-2 px-4 pt-2">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold">{cafe.name}</h2>
          <p className="truncate text-xs text-mocha">
            {cafe.roadAddress || cafe.address}
          </p>
        </div>
        <button onClick={onClose} className="p-1 text-mocha" aria-label="닫기">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mt-3 flex items-center justify-between">
          <StarRating
            value={cafe.rating}
            onChange={(v) => start(() => setRating(cafe.id, v))}
          />
          <div className="flex rounded-full bg-cream p-0.5 text-xs">
            {(["wishlist", "visited"] as const).map((s) => (
              <button
                key={s}
                onClick={() => start(() => setStatus(cafe.id, s))}
                className={`rounded-full px-3 py-1.5 ${
                  cafe.status === s
                    ? "bg-latte font-semibold text-white"
                    : "text-mocha"
                }`}
              >
                {s === "visited" ? "가봄" : "가고싶음"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex gap-2 text-sm">
          <a
            href={kakaoMapUrl(cafe.placeUrl, cafe.name)}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-xl bg-[#fee500] py-2 text-center font-semibold text-[#3c1e1e]"
          >
            카카오맵
          </a>
          <a
            href={naverMapUrl(cafe.name, cafe.lat, cafe.lng)}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-xl bg-[#03c75a] py-2 text-center font-semibold text-white"
          >
            네이버 지도
          </a>
          {cafe.phone && (
            <a
              href={`tel:${cafe.phone}`}
              className="rounded-xl bg-cream px-3 py-2"
              aria-label="전화"
            >
              📞
            </a>
          )}
        </div>

        <form
          className="mt-4 rounded-xl bg-cream p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!body.trim()) return;
            start(async () => {
              await addNote(cafe.id, body, visitedOn);
              setBody("");
              onToast("메모를 남겼어요 ✍️");
            });
          }}
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 1000))}
            placeholder="오늘은 어땠어요?"
            rows={2}
            className="w-full resize-none bg-transparent outline-none"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-mocha">
            <input
              type="date"
              value={visitedOn}
              onChange={(e) => setVisitedOn(e.target.value)}
              className="bg-transparent"
            />
            <div className="flex items-center gap-2">
              <span>{body.length}/1000</span>
              <button
                disabled={pending || !body.trim()}
                className="rounded-full bg-coral px-4 py-1.5 font-semibold text-white active:scale-95 disabled:opacity-50"
              >
                남기기
              </button>
            </div>
          </div>
        </form>

        <ul className="mt-3 space-y-2">
          {cafe.notes.map((n) => (
            <li key={n.id} className="rounded-xl border border-cream-deep p-3">
              <div className="flex items-center justify-between text-xs text-mocha">
                <span>{n.visitedOn ?? n.createdAt.slice(0, 10)}</span>
                <button
                  onClick={() => {
                    if (confirm("이 메모를 지울까요?"))
                      start(() => deleteNote(n.id));
                  }}
                  className="text-mocha/70"
                >
                  삭제
                </button>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
            </li>
          ))}
        </ul>

        <button
          onClick={() => {
            if (confirm(`"${cafe.name}"을(를) 지도에서 지울까요? 메모도 함께 삭제돼요.`))
              start(async () => {
                await deleteCafe(cafe.id);
                onClose();
                onToast("삭제했어요");
              });
          }}
          className="mt-6 w-full py-2 text-center text-xs text-mocha/70"
        >
          이 카페 삭제
        </button>
      </div>
    </div>
  );
}
