import type { CafeDto } from "./dto";

/** 카페 상태 표시 라벨. 문구를 바꾸고 싶으면 여기 한 곳만 수정 */
export const STATUS_LABEL: Record<CafeDto["status"], string> = {
  wishlist: "saved",
  visited: "visited",
};
