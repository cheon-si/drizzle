import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isAuthed } from "@/lib/auth";

/**
 * 클라이언트 직접 업로드용 토큰 발급.
 * 파일 자체는 브라우저 → Blob으로 바로 가고, 이 라우트는 "올려도 되는지"만 판단한다.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // proxy.ts가 /api/*를 막지만, 공식 권고대로 토큰 발급 직전에 한 번 더 검사
        const authed = await isAuthed(request.cookies.get(SESSION_COOKIE)?.value);
        if (!authed) throw new Error("unauthorized");
        return {
          allowedContentTypes: ["image/webp", "image/jpeg"],
          maximumSizeInBytes: 3 * 1024 * 1024, // 브라우저 리사이즈 후 수백 KB가 정상. 3MB는 안전장치
          addRandomSuffix: true,
        };
      },
      // DB 기록은 업로드가 끝난 뒤 클라이언트가 addNote로 처리한다.
      // (이 콜백은 Vercel이 서버로 호출하는 웹훅이라 localhost에서는 오지 않음)
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
