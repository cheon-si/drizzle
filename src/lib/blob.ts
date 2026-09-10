import { del } from "@vercel/blob";

/** private 스토어 URL 형태: https://<store-id>.private.blob.vercel-storage.com/<pathname> */
const BLOB_HOST_SUFFIX = ".private.blob.vercel-storage.com";

/** 클라이언트가 넘긴 URL이 우리 Blob 스토어 것인지 (임의 URL을 DB에 넣지 못하게) */
export function isBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * Blob 파일 삭제. DB를 먼저 지운 뒤 호출하므로 실패해도 사용자 흐름은 막지 않는다.
 * 남은 파일은 정리 스크립트(2단계)가 잡는다.
 */
export async function deleteBlobs(urls: (string | null | undefined)[]) {
  const targets = urls.filter((u): u is string => !!u);
  if (targets.length === 0) return;
  try {
    await del(targets);
  } catch (e) {
    console.error("[blob] delete failed", targets, e);
  }
}
