"use client";

import { useState, useTransition } from "react";
import { MapPin, Navigation, PenLine, Phone, Trash2, X } from "lucide-react";
import type { CafeDto } from "@/lib/dto";
import { STATUS_LABEL } from "@/lib/labels";
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
  // 기록이 없으면 바로 쓸 수 있게 열어두고, 있으면 기록이 먼저 보이도록 접는다
  const [writing, setWriting] = useState(cafe.notes.length === 0);

  return (
    <div
      className={`sheet absolute inset-x-0 bottom-14 z-20 mx-2 flex flex-col rounded-t-2xl bg-white/95 backdrop-blur transition-[max-height] ${
        expanded ? "max-h-[85dvh]" : "max-h-[60dvh]"
      }`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-cream-deep"
        aria-label="시트 크기 조절"
      />

      {/* 헤더: 이름 · 주소 · 닫기 */}
      <div className="flex items-start justify-between gap-2 px-4 pt-2">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold">{cafe.name}</h2>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-mocha">
            <MapPin size={12} className="shrink-0" />
            {cafe.roadAddress || cafe.address}
          </p>
        </div>
        <button
          onClick={onClose}
          className="-mr-1 rounded-full p-1.5 text-mocha active:bg-cream"
          aria-label="닫기"
        >
          <X size={18} />
        </button>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">
        {/* 별점 + 상태 토글 */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <StarRating
            size="md"
            value={cafe.rating}
            onChange={(v) => start(() => setRating(cafe.id, v))}
          />
          <div className="flex shrink-0 rounded-full bg-cream p-0.5 text-xs">
            {(["wishlist", "visited"] as const).map((s) => (
              <button
                key={s}
                onClick={() => start(() => setStatus(cafe.id, s))}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 transition-colors ${
                  cafe.status === s
                    ? "bg-latte font-semibold text-white"
                    : "text-mocha"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* 외부 링크: 브랜드 컬러 대신 앱 팔레트로 통일 */}
        <div className="mt-3 flex gap-2 text-xs font-medium">
          <a
            href={kakaoMapUrl(cafe.placeUrl, cafe.name)}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-cream py-2.5 text-cocoa ring-1 ring-cream-deep active:bg-cream-deep"
          >
            <Navigation size={14} /> 카카오맵
          </a>
          <a
            href={naverMapUrl(cafe.name, cafe.lat, cafe.lng)}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-cream py-2.5 text-cocoa ring-1 ring-cream-deep active:bg-cream-deep"
          >
            <Navigation size={14} /> 네이버 지도
          </a>
          {cafe.phone && (
            <a
              href={`tel:${cafe.phone}`}
              className="grid w-11 place-items-center rounded-xl bg-cream text-cocoa ring-1 ring-cream-deep active:bg-cream-deep"
              aria-label="전화"
            >
              <Phone size={15} />
            </a>
          )}
        </div>

        {/* 기록(메모) 섹션 */}
        <div className="mt-5 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            기록 <span className="text-latte-deep">{cafe.notes.length}</span>
          </h3>
          {!writing && (
            <button
              onClick={() => setWriting(true)}
              className="flex items-center gap-1 rounded-full bg-coral/15 px-3 py-1 text-xs font-semibold text-coral-deep active:scale-95"
            >
              <PenLine size={12} /> 남기기
            </button>
          )}
        </div>

        {writing && (
          <form
            className="mt-2 rounded-xl bg-cream p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!body.trim()) return;
              start(async () => {
                await addNote(cafe.id, body, visitedOn);
                setBody("");
                setWriting(false);
                onToast("기록을 남겼어요 ✍️");
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
                {cafe.notes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setWriting(false)}
                    className="rounded-full px-3 py-1.5 text-mocha"
                  >
                    취소
                  </button>
                )}
                <button
                  disabled={pending || !body.trim()}
                  className="rounded-full bg-coral px-4 py-1.5 font-semibold text-white active:scale-95 disabled:opacity-50"
                >
                  남기기
                </button>
              </div>
            </div>
          </form>
        )}

        {cafe.notes.length === 0 && !writing && (
          <p className="mt-2 text-xs text-mocha">아직 남긴 기록이 없어요.</p>
        )}

        <ul className="mt-2 space-y-2">
          {cafe.notes.map((n) => (
            <li key={n.id} className="rounded-xl border border-cream-deep p-3">
              <div className="flex items-center justify-between text-xs text-mocha">
                <span>{n.visitedOn ?? n.createdAt.slice(0, 10)}</span>
                <button
                  onClick={() => {
                    if (confirm("이 기록을 지울까요?"))
                      start(() => deleteNote(n.id));
                  }}
                  className="rounded-full p-1 text-mocha/60 active:bg-cream"
                  aria-label="기록 삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
            </li>
          ))}
        </ul>

        <button
          onClick={() => {
            if (confirm(`"${cafe.name}"을(를) 지도에서 지울까요? 기록도 함께 삭제돼요.`))
              start(async () => {
                await deleteCafe(cafe.id);
                onClose();
                onToast("삭제했어요");
              });
          }}
          className="mt-6 w-full py-2 text-center text-xs text-mocha/60"
        >
          이 카페 삭제
        </button>
      </div>
    </div>
  );
}
