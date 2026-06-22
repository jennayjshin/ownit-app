# 온잇(OwnIt) — apps-in-toss 미니앱

## 프로젝트 개요
- **앱 이름**: 온잇(OwnIt) (`appName: "dj-nativefit"`)
- **스택**: Vite + React + TypeScript, WebView 기반 (React Native 아님)
- **UI**: `@toss/tds-mobile` v2.5, `@toss/tds-mobile-ait` v2.5
- **인증**: 토스 로그인 → Supabase Edge Function (`supabase/functions/toss-auth/index.ts`)
- **DB**: Supabase (영어 문장 학습, SRS 복습, 즐겨찾기)

## 주요 파일
- `src/App.tsx` — 라우팅, 인증, 탭바
- `src/pages/StudyCardPage.tsx` — 학습 카드 (TTS, 스와이프)
- `src/pages/HomePage.tsx` — 홈
- `src/pages/ReviewPage.tsx` — 복습
- `src/pages/SettingsPage.tsx` — 설정
- `granite.config.ts` — apps-in-toss 앱 설정

## Supabase Edge Functions
- `toss-auth` — 토스 로그인 콜백 처리, Supabase 세션 발급
- `send-notification` — 루틴 알림 푸시 (JWT 검증 + tossUserKey ownership check 포함, mTLS)
- `toss-unlink` — 토스 계정 연결 해제

## TTS
`SpeechSynthesis` 아님. `HTMLAudioElement` + Supabase Storage MP3 방식.
- MP3 파일: `{SUPABASE_URL}/storage/v1/object/public/tts/{sentence_id}.mp3`
- `audioRef = useRef<HTMLAudioElement | null>(null)` 로 관리
- Android WebView에서 Web Speech API가 동작하지 않아 교체함 (791개 사전 생성, `scripts/generate-tts.mjs`)

## 앱 이름
- `granite.config.ts`의 `brand.displayName`은 앱인토스 콘솔 등록명과 **정확히** 일치해야 함
- 현재: `displayName: "온잇"` — 불일치 시 심사 반려

## 문장 노출
- `get_random_sentences` PostgreSQL RPC 함수로 랜덤 노출 (`ORDER BY RANDOM()`)
- 이미 학습한 문장(`user_progress`) 제외, `src/lib/db.ts`의 `getRandomSentences()` 호출
- 주의: PostgreSQL에서 빈 배열의 `array_length('{}', 1)`은 0이 아니라 NULL 반환 → `IS NULL` 조건으로 처리

## Analytics / 광고
- Analytics: `@apps-in-toss/web-framework`의 `Analytics.screen()` (화면 진입), `Analytics.click()` (버튼 클릭)
- TossAds: `HomePage`에서 `attachBanner("ait.v2.live.5d38d0c155a6400e", ...)` + MutationObserver로 실제 렌더 후 impression 발화
- Toss Pixel: `src/lib/pixel.ts` + `src/types/toss-pixel.d.ts`, `VITE_TOSS_PIXEL_ID` 환경변수 (픽셀 ID 발급 대기 중)

## 보안 주의사항
- `sentences` 테이블 RLS: `anon` 역할에 SELECT 금지 필수. 앱 번들에 anon key가 포함되므로 열려있으면 누구나 전체 문장 조회 가능.

## 외부 문서 (필요할 때 fetch해서 사용)
- apps-in-toss 개발자 문서: https://developers-apps-in-toss.toss.im
- TDS Mobile 컴포넌트: https://developers-apps-in-toss.toss.im/design/components.md
- 내비게이션 바: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/NavigationBar.md
- 비게임 출시 체크리스트: https://developers-apps-in-toss.toss.im/checklist/app-nongame.html
