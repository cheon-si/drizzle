/** 업로드 전 브라우저에서 축소. 긴 변 기준 px */
const MAX_EDGE = 1600;

/**
 * 폰 원본(3~5MB)을 수백 KB로 줄인다.
 * Canvas를 거치면서 EXIF(GPS·촬영시각)도 함께 떨어진다.
 * WebP 인코딩이 안 되는 브라우저(구형 Safari)는 JPEG로 폴백.
 */
export async function resizeImage(file: File): Promise<Blob> {
  // createImageBitmap은 기본으로 EXIF 회전을 반영해 디코딩한다 (HEIC 등 미지원 형식은 여기서 실패)
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("unsupported image");

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  // toBlob은 미지원 타입이면 PNG로 조용히 떨어지므로 결과 type을 확인한다
  let out = await encode("image/webp", 0.82);
  if (!out || out.type !== "image/webp") out = await encode("image/jpeg", 0.85);
  if (!out) throw new Error("encode failed");
  return out;
}
