Product Requirements Document: 온잇(OwnIt)

1. 개요 (Mission & Problem)
목적: 원어민이 실생활에서 사용하는 영어 표현을 암기하고, '입영작(Oral Translation)' 방식으로 체화하여 스피킹 실력을 높이는 웹 앱.

문제 정의:

읽기/듣기는 가능하나 말하기/쓰기가 약한 한국식 영어 학습의 한계.

양질의 Input 없이 Output 위주의 연습만으로는 스피킹 실력 향상이 더딤.

목표: 매일 루틴을 통해 원어민 뉘앙스를 내 표현으로 응용하고 체화하기.

2. 타겟 사용자 (Who)

해외 취업/이주를 앞두고 원어민의 뉘앙스를 완벽히 체화하려는 사람.

3. 핵심 기능 및 구성 (Features)

앱 이름: 온잇(OwnIt)

1) 홈:

유저가 작성한 '영어를 공부하는 이유' 상단 표시.

[오늘의 학습 시작하기] CTA.

복습 대기 문장 상위 3개 표시 & [복습하기] CTA.

2) 문장 카드 (입영작 모드):

앞면: 한글 상황 설명 (직역 지양).

뒷면: 영어 표현 (터치 시 Flip).

기능: 원어민 발음 듣기(TTS), 10번 소리 내어 읽기 가이드, 즐겨찾기 등록.

난이도: 왼쪽 스와이프(쉬움), 오른쪽 스와이프(어려움).

3) 오늘의 학습:

설정한 개수만큼 롤링. 그날의 학습 복습 또는 다음날 설정 개수만큼 추가 학습 가능.

4) 복습하기 (SRS 알고리즘):

조건: next_review_date가 오늘 이하인 문장만 표시.

정렬: 즐겨찾기 > interval_days 짧은 순 > next_review_date 오래된 순.

평가 로직:

'어렵다': interval_days = 1, next_review = 오늘 + 1일.

'쉽다': interval_days = 기존 * 2.5(버림), next_review = 오늘 + 계산된 날짜.

5) 설정:

내가 영어를 공부하는 이유: 확인 및 수정 가능

학습량 설정(2~20개): 2, 5, 10, 20개 (디폴트 5개) 중 설정 가능

카테고리 설정(7종): Work & Office, Daily Life, Idioms & Patterns, Social, Meetings, Emotions & Opinions, Email & Phone 총 7개 카테고리 중에 복수 선택 가능 (아무 것도 설정하지 않으면 전체 선택, 랜덤하게 카드 롤링)

루틴 알림: 원하는 요일과 시간 설정해서 알림 받기

약관/개인정보

의견 보내기: dearjelly.official@gmail.com으로 이메일 전송 가능 

4. 유저 시나리오 (How)

온보딩: 가입(앱인토스 로그인 모듈 활용) -> 학습량 및 카테고리 설정 -> 영어를 공부하는 이유 한 줄로 입력 -> 홈.

루틴: 홈 -> [오늘의 학습] -> 한글 보기/입영작 -> 카드 뒤집기/확인 -> 난이도 평가 -> 완료.

복습: 홈 -> [복습하기] -> 리스트 확인 -> 복습 시작 -> 평가 반복 -> 완료.

5. 기술 스택 및 구현 환경 (Tech Stack)

환경: App-in-Toss (토스 앱 내 서비스)

Frontend: Vite + React (TypeScript), @toss/tds-mobile (TDS 컴포넌트), @toss/tds-colors

Backend/DB: Supabase

인증/알림: Toss SDK (App-in-Toss)

6. 제약사항 (Constraints)

Zero-cost 인프라: 브라우저 내장 TTS 사용, DB 텍스트 위주 구성(무료 티어 500MB 준수).

초보자 친화: 어드민 페이지 제외(DB 직접 제어), 자체 로그인 제외(토스 인증 활용).

7. 피드백 루프

이메일 피드백을 기반으로 한 지속적인 서비스 고도화(Iteration).