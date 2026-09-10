/**
 * 고아 Blob 정리: Blob 스토어에는 있는데 DB(notes.photo_url)에는 없는 파일을 찾아 지운다.
 *
 * 실행 (기본은 dry-run, 목록만 출력):
 *   npm run blob:gc
 * 실제 삭제:
 *   npm run blob:gc -- --delete
 *
 * 안전장치: 최근 10분 내 업로드는 건너뛴다 (업로드는 끝났지만 addNote가 아직 안 끝난 파일 보호).
 * .env.local의 BLOB_READ_WRITE_TOKEN·DATABASE_URL을 쓰므로 운영 스토어/DB를 그대로 건드린다.
 */
import { del, list, type ListBlobResultBlob } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";

const GRACE_MS = 10 * 60 * 1000;
const shouldDelete = process.argv.includes("--delete");

async function listAllBlobs(): Promise<ListBlobResultBlob[]> {
  const all: ListBlobResultBlob[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: 1000 });
    all.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return all;
}

async function main() {
  if (!process.env.DATABASE_URL || !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("DATABASE_URL, BLOB_READ_WRITE_TOKEN이 필요합니다 (--env-file=.env.local)");
  }

  const sql = neon(process.env.DATABASE_URL);
  const rows = (await sql`select photo_url from notes where photo_url is not null`) as {
    photo_url: string;
  }[];
  const referenced = new Set(rows.map((r) => r.photo_url));

  const blobs = await listAllBlobs();
  const now = Date.now();
  const orphans = blobs.filter(
    (b) => !referenced.has(b.url) && now - new Date(b.uploadedAt).getTime() > GRACE_MS,
  );
  const recent = blobs.filter(
    (b) => !referenced.has(b.url) && now - new Date(b.uploadedAt).getTime() <= GRACE_MS,
  );

  console.log(`Blob ${blobs.length}개 / DB 참조 ${referenced.size}개 / 고아 ${orphans.length}개`);
  if (recent.length) console.log(`(최근 10분 내 업로드 ${recent.length}개는 건너뜀)`);
  for (const b of orphans) {
    console.log(`  ${b.pathname}  ${(b.size / 1024).toFixed(0)}KB  ${b.uploadedAt.toISOString()}`);
  }

  if (orphans.length === 0) return;
  if (!shouldDelete) {
    console.log("\ndry-run입니다. 실제로 지우려면 --delete 를 붙이세요.");
    return;
  }
  await del(orphans.map((b) => b.url));
  console.log(`\n${orphans.length}개 삭제 완료`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
