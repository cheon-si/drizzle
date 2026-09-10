# F8 사진 업로드 — 구현 플랜 (기록당 1장, 비공개)

PRD v0.2에서 제외했던 F8을 "기록(note)당 사진 1장, 로그인한 사람만 열람" 범위로 넣는다.
`notes.photo_url` 컬럼은 이미 있으므로 DB 마이그레이션은 없다.

## 1. 결정 사항

| 항목 | 결정 | 이유 / 트레이드오프 |
|---|---|---|
| 저장소 | Vercel Blob (Hobby) | 대시보드 원클릭, 무료 5GB, 초과 시 과금 아닌 차단. DB에 바이너리를 넣으면 Neon 0.5GB가 금방 찬다 |
| 접근 | **private 스토어** | 파일 URL을 알아도 토큰 없이는 열 수 없다. 사진은 앱 서버(`/api/photo`)가 로그인 쿠키를 확인한 뒤 스트리밍한다. 대가: CDN 직접 서빙보다 느리고(함수 경유), 조회마다 함수 호출·전송량이 든다. 사용자 2명 규모에서는 무시 가능 |
| 업로드 경로 | **클라이언트 직접 업로드** (`@vercel/blob/client` `upload()`, `access:'private'`) | 서버 경유는 함수 요청 4.5MB 제한에 걸린다. 업로드 전송량도 무료 |
| DB 기록 시점 | 업로드 완료 후 **클라이언트가 서버 액션 호출** | Blob의 `onUploadCompleted` 콜백은 localhost에 닿지 못해 ngrok이 필요하다. 콜백을 안 쓰면 로컬·배포 동작이 같다 |
| 리사이즈 | **브라우저 Canvas**, 긴 변 1600px, WebP q≈0.82 (실패 시 JPEG) | 장당 3~5MB → 수백 KB. 저장 한도와 조회 전송량을 동시에 줄이고, EXIF(GPS·시각)도 제거된다 |
| 사진 수 | 기록당 1장 | 컬럼 구조가 1장. 다중 사진은 `photos` 테이블이 필요하니 실제 요구가 생기면 |
| 카페 대표 사진 | 별도 컬럼 없음 | 목록 카드는 "최신 기록의 사진"을 썸네일로 쓴다 |
| 이미지 표시 | 일반 `<img src="/api/photo?p=…">` | 같은 오리진이라 쿠키가 자동 전송된다. `next/image`는 별도 최적화 한도를 쓰고 private URL을 직접 못 읽으므로 사용하지 않음 |
| 브라우저 캐시 | `Cache-Control: private, no-cache` + ETag → 304 | Vercel 공식 권고. 재방문 시 인증은 매번 타지만 본문은 재전송하지 않는다 |

## 2. 흐름

```
[업로드]  CafeSheet 기록 폼
  1. 사진 선택 (input type=file accept=image/*)
  2. Canvas 리사이즈 → Blob(WebP)  ── 미리보기 표시
  3. "남기기" 탭
  4. upload(filename, blob, { access:'private', handleUploadUrl:'/api/upload' })
       └─ /api/upload (handleUpload)
            onBeforeGenerateToken: 쿠키 == sessionToken() 검사 (실패 시 throw)
            반환: allowedContentTypes [webp,jpeg], maximumSizeInBytes 3MB, addRandomSuffix
  5. addNote(cafeId, body, visitedOn, photoUrl)  ← 서버 액션. URL 호스트가 *.private.blob.vercel-storage.com 인지 검증
  6. 5가 실패하면 removeBlob(photoUrl) 호출로 고아 파일 즉시 제거

[조회]  <img src="/api/photo?p=<pathname>">
  /api/photo (route handler)
    1. 쿠키 == sessionToken() 검사 — proxy.ts와 별개로 핸들러 안에서 다시 검사 (공식 권고: 미들웨어 인증에만 의존하지 말 것)
    2. get(pathname, { access:'private', ifNoneMatch })
    3. 304면 빈 응답 + ETag / 200이면 stream + Content-Type + ETag + Cache-Control: private, no-cache

[삭제]
  deleteNote(id)  : photo_url 조회 → DB 삭제 → del(url)
  deleteCafe(id)  : 해당 카페 notes의 photo_url 전부 조회 → DB 삭제(cascade) → del(urls)
```

DB를 먼저 지우고 Blob을 지운다. Blob 삭제가 실패해도 사용자에겐 삭제된 것으로 보이고, 남은 파일은 정리 스크립트가 잡는다. 반대 순서면 DB에 깨진 URL이 남아 빈 이미지가 뜬다.

`photo_url`에는 Blob이 돌려주는 **전체 private URL**을 저장한다(`del()`이 URL을 받음). 화면용 pathname은 DTO 변환 시 `new URL(url).pathname`으로 뽑는다.

## 3. 변경 파일

| 파일 | 변경 |
|---|---|
| `package.json` | `@vercel/blob` 추가 (private 지원은 SDK ≥ 2.3) |
| `src/lib/auth.ts` | `isAuthed(cookieValue)` 헬퍼 추가 — proxy·업로드·조회 라우트가 같은 검사를 공유 |
| `src/app/api/upload/route.ts` | 신규. `handleUpload` + `onBeforeGenerateToken`에서 인증 |
| `src/app/api/photo/route.ts` | 신규. 인증 → `get()` → 스트리밍, ETag/304 처리 |
| `src/lib/image.ts` | 신규. `resizeImage(file): Promise<Blob>` — Canvas 리사이즈, WebP 미지원이면 JPEG 폴백 |
| `src/lib/blob.ts` | 신규. `deleteBlobs(urls)` — `del()` 래퍼, 빈 배열·실패 무시(로그만) |
| `src/app/actions.ts` | `addNote`에 `photoUrl` 인자·호스트 검증. `deleteNote`·`deleteCafe`에 Blob 삭제 연동. `removeBlob(url)` 신규 |
| `src/lib/dto.ts` | `notes[].photoPath` 추가 (`/api/photo?p=` 에 넣을 pathname) |
| `src/components/CafeSheet.tsx` | 폼에 사진 버튼(`ImagePlus`)·미리보기·제거. 기록 목록에 사진 표시(탭 시 원본 새 탭) |
| `src/app/list/page.tsx` | 카드 우측에 최신 기록 사진 썸네일 |
| `README.md` | Blob 스토어(private) 생성·환경변수 절 추가 |
| `scripts/blob-gc.ts` (2단계) | `list()`로 Blob 전체 → DB `photo_url`과 대조 → 없는 것 `del()`. `--dry-run` 기본 |

## 4. 환경변수 · 사전 작업 (사용자가 대시보드에서)

1. Vercel 프로젝트 → **Storage → Create → Blob**, access **Private**
2. 연결 환경에 **Production, Preview, Development 모두** 체크 (Development가 빠지면 `vercel env pull`로 안 내려옴)
3. 로컬에서 `vercel.cmd env pull .env.local --environment=production` 재실행

추가되는 변수: `BLOB_READ_WRITE_TOKEN` (클라이언트 토큰 발급·`del()`·로컬 `get()`에 필요), `BLOB_STORE_ID`. 배포 환경의 `get()`은 OIDC 토큰을 자동 사용한다.

## 5. 검증

- [ ] 로컬: 사진 있는 기록 저장 → Neon `notes.photo_url`에 private URL, Vercel Blob 브라우저에서 파일 확인
- [ ] 로컬: 사진 없는 기록 저장이 기존과 동일하게 동작
- [ ] 리사이즈: 4MB 원본 → 업로드 파일이 1MB 미만 (개발자도구 Network)
- [ ] **비공개 확인**: Blob URL을 새 시크릿 창에 직접 붙이면 열리지 않음 / 로그아웃 상태에서 `/api/photo?p=…` → 401 / `POST /api/upload` → 401
- [ ] 같은 사진 두 번째 로드가 304로 떨어짐
- [ ] `addNote` 강제 실패 시 Blob에 고아 파일이 남지 않음
- [ ] 기록 삭제 → Blob 파일도 삭제 / 카페 삭제 → 기록 사진 전부 삭제
- [ ] 배포 후 iPhone Safari: 사진 선택(HEIC) → 정상 업로드·표시
- [ ] `npm run typecheck && npm run lint && npm run build` 통과

## 6. 알려진 리스크

- **조회 비용 구조가 바뀜**: public이면 CDN이 직접 서빙하지만, private은 사진 1장 볼 때마다 함수 1회 + 전송량이 든다. 사용자 2명·리사이즈 수백 KB 기준으로 Hobby 한도(전송 100GB/월)에 닿을 일은 없다. 목록 카드 썸네일이 카페 수만큼 요청을 만들지만 304 캐시로 재방문 부담은 작다.
- **로컬 `get()` 인증**: 로컬은 OIDC가 없어 `BLOB_READ_WRITE_TOKEN`으로 동작한다. `env pull` 후 이 변수가 없으면 사진이 전부 404로 보인다.
- **iOS Safari WebP 인코딩**: `canvas.toBlob('image/webp')` 미지원이면 PNG로 떨어져 용량이 커진다. 결과 `blob.type`을 확인해 JPEG로 재인코딩한다.
- **HEIC**: iOS는 `accept="image/*"` 선택 시 JPEG로 변환해 넘긴다. 데스크톱에서 HEIC 파일을 직접 고르면 Canvas가 디코딩 못 함 → "지원하지 않는 형식" 토스트.
- **Blob 한도 초과 시 30일 차단**: Vercel 사용량 알림 이메일을 끄지 않는다.
- **고아 파일**: 즉시 제거 + 정리 스크립트로 이중 방어. 정리 스크립트는 2단계.
- **`.env.local`의 `BLOB_READ_WRITE_TOKEN`은 운영 스토어 읽기·쓰기 권한**. 로컬에서 지우면 운영 사진이 지워진다.
- **"관리자 + 사용자 1명"은 지금 구조상 같은 비밀번호를 공유**한다. 사진 접근도 "로그인 여부"로만 통제된다. 두 사람을 구분하거나 한쪽만 삭제 권한을 갖게 하려면 인증 구조 변경이 필요하며 이 플랜의 범위 밖이다.

## 7. 범위 밖

다중 사진, 이미지 편집·필터, 사진만 모아보는 갤러리 뷰, 기존 기록에 사진 추가/교체(첫 버전은 기록 생성 시에만 첨부), 관리자/사용자 계정 분리.
