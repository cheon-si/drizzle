export const SESSION_COOKIE = "cafe_session";

/** 비밀번호+시크릿의 SHA-256. 쿠키 값과 비교만 하므로 서버/프록시 양쪽에서 계산 가능. */
export async function sessionToken(): Promise<string> {
  const input = `${process.env.APP_PASSWORD}|${process.env.AUTH_SECRET}`;
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 요청 쿠키의 세션 토큰이 유효한지. proxy·업로드·사진 라우트가 같은 검사를 공유한다. */
export async function isAuthed(cookieValue: string | undefined): Promise<boolean> {
  return !!cookieValue && cookieValue === (await sessionToken());
}
