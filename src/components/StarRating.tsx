"use client";

import { useState } from "react";

type Props = {
  value: number | null;
  onChange?: (v: number | null) => void;
  size?: "sm" | "lg";
};

/** 0.5 단위 별점. 각 별의 왼쪽 절반을 누르면 .5 */
export default function StarRating({ value, onChange, size = "lg" }: Props) {
  const [popIdx, setPopIdx] = useState<number | null>(null);
  const v = value ?? 0;
  const px = size === "lg" ? "text-4xl" : "text-base";

  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = v >= i ? 1 : v >= i - 0.5 ? 0.5 : 0;
        return (
          <span key={i} className={`relative select-none leading-none ${px}`}>
            <span className="text-cream-deep">★</span>
            <span
              className={`absolute inset-y-0 left-0 overflow-hidden text-coral ${
                popIdx === i ? "pop" : ""
              }`}
              style={{ width: `${fill * 100}%` }}
              onAnimationEnd={() => setPopIdx(null)}
            >
              ★
            </span>
            {onChange && (
              <>
                <button
                  type="button"
                  aria-label={`${i - 0.5}점`}
                  className="absolute inset-y-0 left-0 w-1/2"
                  onClick={() => {
                    const next = i - 0.5;
                    setPopIdx(i);
                    onChange(next === v ? null : next);
                  }}
                />
                <button
                  type="button"
                  aria-label={`${i}점`}
                  className="absolute inset-y-0 right-0 w-1/2"
                  onClick={() => {
                    setPopIdx(i);
                    onChange(i === v ? null : i);
                  }}
                />
              </>
            )}
          </span>
        );
      })}
      {size === "lg" && (
        <span className="ml-2 w-8 text-lg font-semibold text-latte-deep">
          {value ? value.toFixed(1) : "-"}
        </span>
      )}
    </div>
  );
}
