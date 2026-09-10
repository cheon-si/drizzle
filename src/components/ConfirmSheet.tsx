"use client";

import { createPortal } from "react-dom";

type Props = {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * 브라우저 confirm() 대체. 하단에서 올라오는 작은 확인 시트.
 * 파괴적 동작(삭제) 전용이라 확인 버튼은 코랄, 취소는 중립.
 * 부모(CafeSheet)의 backdrop-blur가 fixed 기준점을 만들어 화면 전체를 못 덮으므로 body로 포털한다.
 */
export default function ConfirmSheet({
  title,
  description,
  confirmLabel = "삭제",
  onConfirm,
  onCancel,
}: Props) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-cocoa/30 backdrop-blur-[2px]"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="sheet mx-2 mb-2 w-full max-w-md rounded-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-semibold">{title}</p>
        {description && <p className="mt-1 text-sm text-mocha">{description}</p>}
        <div className="mt-4 flex gap-2 text-sm font-semibold">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-cream py-3 text-cocoa active:bg-cream-deep"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className="flex-1 rounded-xl bg-coral py-3 text-white active:scale-[0.98]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
