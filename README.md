# 슬비의 카페 지도 ☕️

https://drizzle-lake.vercel.app

1인용 카페 아카이브. 카카오맵 위에 다녀온/가고 싶은 카페를 핀으로 모으고 별점과 메모를 남긴다.

- Next.js 16 (App Router) + Tailwind v4
- Drizzle ORM + Neon Postgres (serverless HTTP 드라이버)
- Kakao Maps JS SDK + Kakao Local REST API (서버 프록시)
- 인증: 비밀번호 1개 + httpOnly 쿠키 (`src/proxy.ts`에서 전 경로 보호)

## 1. 카카오 키 발급 (5분)

1. https://developers.kakao.com → 내 애플리케이션 → 앱 만들기
2. **앱 설정 > 앱 키**: `JavaScript 키`, `REST API 키` 복사
3. **앱 설정 > 플랫폼 > Web**: 사이트 도메인 등록
   - `http://localhost:3000`
   - `https://<프로젝트>.vercel.app` (배포 후 추가)
4. **제품 설정 > 카카오맵**: 사용 설정 **ON** (2024-12 이후 신규 앱 필수)

## 2. 로컬 실행

```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run db:push              # 스키마를 Neon에 반영
npm run dev
```

`DATABASE_URL`은 https://neon.tech 에서 무료 프로젝트를 만들어 받거나, 아래 Vercel 연동 후 `vercel env pull .env.local`로 받아온다.

## 3. Vercel 배포

1. GitHub에 push → Vercel에서 Import
2. **Storage 탭 → Create → Neon** (마켓플레이스, 카드 불필요) → `DATABASE_URL` 자동 주입
3. **Settings → Environment Variables**에 나머지 추가
   - `APP_PASSWORD` 슬비가 쓸 비밀번호
   - `AUTH_SECRET` 아무 랜덤 문자열 (`openssl rand -hex 32`)
   - `KAKAO_REST_KEY`
   - `NEXT_PUBLIC_KAKAO_JS_KEY`
4. 로컬에서 `vercel env pull .env.local && npm run db:push` 로 테이블 생성 (1회)
5. Redeploy → 카카오 콘솔에 배포 도메인 등록

비밀번호를 바꾸면 기존 로그인은 전부 무효가 된다 (쿠키 토큰이 비밀번호에서 파생).

## 4. 사진 저장소 (Vercel Blob, private)

기록당 사진 1장. 파일은 Vercel Blob **private** 스토어에, DB(`notes.photo_url`)에는 URL만 저장한다.
로그인한 사람만 `/api/photo?p=<pathname>` 경유로 볼 수 있다.

```bash
vercel blob create-store <이름> --access private --region icn1 -e production -e preview -e development --yes
vercel env pull .env.local --environment=production
```

- 브라우저에서 긴 변 1600px·WebP로 줄인 뒤 Blob에 직접 업로드한다 (서버 4.5MB 제한 회피, EXIF 제거).
- `BLOB_READ_WRITE_TOKEN`은 운영 스토어 읽기·쓰기 권한이다. 로컬에서 기록을 지우면 운영 사진도 지워진다.
- Hobby 한도(5GB)를 넘으면 과금 대신 30일 차단된다. Vercel 사용량 알림 메일을 꺼두지 말 것.
- 설계 메모: `docs/photo-upload-plan.md`

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run db:push` | 스키마 → DB 반영 (마이그레이션 파일 없이) |
| `npm run db:studio` | Drizzle Studio로 데이터 보기 |
| `npm run typecheck` / `lint` / `build` | 검증 |

## 구조

```
src/
  proxy.ts               인증 게이트 (Next 16의 middleware)
  lib/auth.ts            세션 토큰 계산
  db/schema.ts           cafes, notes
  app/page.tsx           로그인
  app/map/page.tsx       지도 (기본 화면)
  app/list/page.tsx      목록 + 정렬/필터
  app/api/search/route.ts  카카오 키워드 검색 프록시 (REST 키 서버 보관)
  app/actions.ts         저장/별점/상태/메모 서버 액션
  components/MapView.tsx    SDK 로드, 마커, 클러스터(30개 이상)
  components/SearchSheet.tsx
  components/CafeSheet.tsx  상세 바텀시트
```
