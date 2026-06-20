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

## 외부 문서 (필요할 때 fetch해서 사용)
- apps-in-toss 개발자 문서: https://developers-apps-in-toss.toss.im
- TDS Mobile 컴포넌트: https://developers-apps-in-toss.toss.im/design/components.md
- 내비게이션 바: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/NavigationBar.md
- 비게임 출시 체크리스트: https://developers-apps-in-toss.toss.im/checklist/app-nongame.html
