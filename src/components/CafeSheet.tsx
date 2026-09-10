"use client";

import { useRef, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import {
  ImagePlus,
  MapPin,
  Navigation,
  PenLine,
  Phone,
  Trash2,
  X,
} from "lucide-react";
import type { CafeDto } from "@/lib/dto";
import { STATUS_LABEL } from "@/lib/labels";
import { resizeImage } from "@/lib/image";
import {
  addNote,
  deleteCafe,
  deleteNote,
  removeBlob,
  setRating,
  setStatus,
} from "@/app/actions";
import { kakaoMapUrl, naverMapUrl } from "@/lib/links";
import StarRating from "./StarRating";
import ConfirmSheet from "./ConfirmSheet";

type Props = {
  cafe: CafeDto;
  onClose: () => void;
  onToast: (msg: string) => void;
};

/** 리사이즈까지 끝난 첨부 사진. previewUrl은 object URL이라 쓰고 나면 revoke */
type Photo = { blob: Blob; previewUrl: string };

export default function CafeSheet({ cafe, onClose, onToast }: Props) {
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");
  const [visitedOn, setVisitedOn] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [expanded, setExpanded] = useState(false);
  // 기록이 없으면 바로 쓸 수 있게 열어두고, 있으면 기록이 먼저 보이도록 접는다
  const [writing, setWriting] = useState(cafe.notes.length === 0);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // 브라우저 confirm() 대신 쓰는 확인 시트. null이면 닫힘
  const [confirmSheet, setConfirmSheet] = useState<{
    title: string;
    description?: string;
    onConfirm: () => void;
  } | null>(null);

  const clearPhoto = () => {
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    setPhoto(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const blob = await resizeImage(file);
      clearPhoto();
      setPhoto({ blob, previewUrl: URL.createObjectURL(blob) });
    } catch {
      onToast("지원하지 않는 사진 형식이에요");
    }
  };

  const submitNote = () =>
    start(async () => {
      let photoUrl: string | null = null;
      try {
        if (photo) {
          // 브라우저 → Blob 직접 업로드. 서버(/api/upload)는 토큰만 발급한다
          setUploading(true);
          const ext = photo.blob.type === "image/jpeg" ? "jpg" : "webp";
          const res = await upload(`notes/${Date.now()}.${ext}`, photo.blob, {
            access: "private",
            handleUploadUrl: "/api/upload",
            contentType: photo.blob.type,
          });
          photoUrl = res.url;
        }
        await addNote(cafe.id, body, visitedOn, photoUrl);
        setBody("");
        clearPhoto();
        setWriting(false);
        onToast("기록을 남겼어요 ✍️");
      } catch {
        // 업로드는 됐는데 DB 저장이 실패한 경우 고아 파일을 바로 치운다
        if (photoUrl) await removeBlob(photoUrl).catch(() => {});
        onToast("저장에 실패했어요. 다시 시도해 주세요");
      } finally {
        setUploading(false);
      }
    });

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
              submitNote();
            }}
          >
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 1000))}
              placeholder="오늘은 어땠어요?"
              rows={2}
              className="w-full resize-none bg-transparent outline-none"
            />

            {/* 사진 1장: 선택 즉시 리사이즈해서 미리보기 */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
            {photo ? (
              <div className="relative mt-2 w-fit">
                {/* object URL 미리보기 — next/image 대상이 아님 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt="첨부 사진 미리보기"
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-cocoa text-white"
                  aria-label="사진 제거"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-2 flex items-center gap-1 text-xs text-mocha active:text-cocoa"
              >
                <ImagePlus size={14} /> 사진 추가
              </button>
            )}

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
                    onClick={() => {
                      clearPhoto();
                      setWriting(false);
                    }}
                    className="rounded-full px-3 py-1.5 text-mocha"
                  >
                    취소
                  </button>
                )}
                <button
                  disabled={pending || !body.trim()}
                  className="rounded-full bg-coral px-4 py-1.5 font-semibold text-white active:scale-95 disabled:opacity-50"
                >
                  {uploading ? "올리는 중…" : "남기기"}
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
                  onClick={() =>
                    setConfirmSheet({
                      title: "이 기록을 지울까요?",
                      description: n.photoSrc ? "사진도 함께 삭제돼요." : undefined,
                      onConfirm: () => start(() => deleteNote(n.id)),
                    })
                  }
                  className="rounded-full p-1 text-mocha/60 active:bg-cream"
                  aria-label="기록 삭제"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {n.photoSrc && (
                <a href={n.photoSrc} target="_blank" rel="noreferrer">
                  {/* private Blob은 /api/photo 경유라 next/image를 쓸 수 없다 */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={n.photoSrc}
                    alt=""
                    loading="lazy"
                    className="mt-2 aspect-[4/3] w-full rounded-lg bg-cream object-cover"
                  />
                </a>
              )}
              <p className="mt-2 whitespace-pre-wrap text-sm">{n.body}</p>
            </li>
          ))}
        </ul>

        <button
          onClick={() =>
            setConfirmSheet({
              title: `${cafe.name}을(를) 지도에서 지울까요?`,
              description: "기록과 사진도 함께 삭제돼요.",
              onConfirm: () =>
                start(async () => {
                  await deleteCafe(cafe.id);
                  onClose();
                  onToast("삭제했어요");
                }),
            })
          }
          className="mt-6 w-full py-2 text-center text-xs text-mocha/60"
        >
          이 카페 삭제
        </button>
      </div>

      {confirmSheet && (
        <ConfirmSheet
          title={confirmSheet.title}
          description={confirmSheet.description}
          onCancel={() => setConfirmSheet(null)}
          onConfirm={() => {
            confirmSheet.onConfirm();
            setConfirmSheet(null);
          }}
        />
      )}
    </div>
  );
}
