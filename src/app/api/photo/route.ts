import { get } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isAuthed } from "@/lib/auth";

/**
 * private Blob 사진을 로그인한 사람에게만 스트리밍한다.
 * <img src="/api/photo?p=<pathname>"> 형태로 쓰며, 같은 오리진이라 쿠키가 자동으로 붙는다.
 */
export async function GET(request: NextRequest) {
  // 미들웨어(proxy.ts)에만 의존하지 말고 핸들러 안에서 다시 검사 (Vercel 공식 권고)
  if (!(await isAuthed(request.cookies.get(SESSION_COOKIE)?.value))) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const pathname = request.nextUrl.searchParams.get("p");
  if (!pathname) return new NextResponse("missing p", { status: 400 });

  // 브라우저가 보낸 ETag를 그대로 전달 → 변경 없으면 304로 본문 재전송을 피한다
  const result = await get(pathname, {
    access: "private",
    ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
  });
  if (!result) return new NextResponse("not found", { status: 404 });

  const headers: Record<string, string> = {
    ETag: result.blob.etag,
    "Cache-Control": "private, no-cache",
  };
  if (result.statusCode === 304) {
    return new NextResponse(null, { status: 304, headers });
  }
  return new NextResponse(result.stream, {
    headers: {
      ...headers,
      "Content-Type": result.blob.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
