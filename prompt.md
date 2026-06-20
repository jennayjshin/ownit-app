# Role: Senior Full-stack Developer
# Task: Build 'OwnIt(온잇)', an English Learning App for 'App-in-Toss' environment.

## 1. Project Context
- App Name: OwnIt (온잇)
- Platform: App-in-Toss (Toss-in-app environment)
- Tech Stack: Vite + React (TypeScript), @toss/tds-mobile (TDS 컴포넌트), @toss/tds-colors, Supabase (DB), Toss SDK (Auth & Push)
- Goal: Create an 'Oral Translation(입영작)' English learning app based on 850 pre-defined sentences.

## 2. Core Functional Specs
- Home: Study reason display, [Start Study] CTA, Review list (top 3).
- Study Card: Front(Korean situation), Back(English expression). Touch to flip. Swipe Right(Hard) / Left(Easy).
- Learning Logic: 'Oral Translation' mode. Show Korean, user thinks/speaks, show English card, 난이도 평가(Easy/Hard) by swipe.
- Review Logic: Spaced Repetition System (SRS).
    - If Hard: interval = 1, next_review = today + 1.
    - If Easy: interval = floor(interval * 2.5), next_review = today + interval.
    - Sorting: favorite > interval ASC > next_review ASC.
- Settings: Learning quantity (2,5,10,20), Category selection (7 types), Notifications (via Toss SDK).

## 3. Database Schema (Supabase)
- users: id, toss_user_id, study_reason, daily_goal, preferred_categories, created_at
- sentences: id, english_expression, key_expression, korean_translation, category, source
- user_progress: id, user_id, sentence_id, first_studied_at, interval_days, next_review_date, is_favorite, updated_at

## 4. Development Guidelines
- Design: TDS(Toss Design System) 기반. @toss/tds-mobile 컴포넌트 우선 사용, 색상은 @toss/tds-colors 사용.
- Constraint: No admin page (use direct DB manipulation), No external heavy media files (use Web Speech API for TTS).
- Priority: Initialize the project, setup Tailwind with the theme, define the database types, and build the 'Card Flip' component as the first task.

Please start by initializing the Next.js project and setting up the folder structure suitable for an App-in-Toss application.
