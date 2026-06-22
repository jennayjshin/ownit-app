import { useRef, useState } from "react";
import type { Category, Difficulty } from "../types/database";

const CATEGORIES: Category[] = [
  "Work & Office",
  "Daily Life",
  "Idioms & Patterns",
  "Social",
  "Meetings",
  "Emotions & Opinions",
  "Email & Phone",
];

const CATEGORY_LABELS: Record<Category, string> = {
  "Work & Office": "업무 · 직장",
  "Daily Life": "일상",
  "Idioms & Patterns": "관용구 · 패턴",
  "Social": "소셜",
  "Meetings": "미팅",
  "Emotions & Opinions": "감정 · 의견",
  "Email & Phone": "이메일 · 전화",
};

const DAILY_GOAL_OPTIONS = [2, 5, 10, 20];

const DIFFICULTY_OPTIONS: {
  value: Difficulty;
  label: string;
  sub: string;
  korean: string;
  english: string;
  highlight: string;
}[] = [
  {
    value: "easy",
    label: "초급",
    sub: "기초 영어 표현",
    korean: "나 진짜 배고파!",
    english: "I'm starving!",
    highlight: "starving",
  },
  {
    value: "medium",
    label: "중급",
    sub: "일상 대화 표현",
    korean: "오늘 좀 힘들었어.",
    english: "I've had a rough day.",
    highlight: "rough day",
  },
  {
    value: "hard",
    label: "고급",
    sub: "관용구 · 고급 표현",
    korean: "기분 망치고 싶지는 않은데...",
    english: "I don't want to rain on your parade, but...",
    highlight: "rain on your parade",
  },
];

export interface OnboardingResult {
  studyReason: string;
  dailyGoal: number;
  preferredCategories: Category[];
  preferredDifficulties: Difficulty[];
}

interface OnboardingPageProps {
  defaultStudyReason: string;
  defaultDailyGoal: number;
  isLoggingIn?: boolean;
  onComplete: (result: OnboardingResult) => void;
  onDevLogin: (result: OnboardingResult) => void;
}

function TutorialCard() {
  const [flipped, setFlipped] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
        <div className="arrow-left" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 20 }}>←</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#ff6b6b", margin: 0 }}>어려워요</p>
            <p style={{ fontSize: 11, color: "var(--c-text-hint)", margin: 0 }}>왼쪽으로 스와이프</p>
          </div>
        </div>
        <div className="arrow-right" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--c-blue)", margin: 0 }}>쉬워요</p>
            <p style={{ fontSize: 11, color: "var(--c-text-hint)", margin: 0 }}>오른쪽으로 스와이프</p>
          </div>
          <span style={{ fontSize: 20 }}>→</span>
        </div>
      </div>
      <div
        className={flipped ? "swipe-hint-right" : "swipe-hint-left"}
        onClick={() => setFlipped((v) => !v)}
        style={{
          width: "100%",
          minHeight: 160,
          background: "var(--c-bg-card)",
          borderRadius: 20,
          boxShadow: "0 4px 24px var(--c-shadow)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "28px 24px",
          cursor: "pointer",
          userSelect: "none",
          border: "1.5px solid var(--c-border)",
          gap: 8,
        }}
      >
        {flipped ? (
          <>
            <p style={{ fontSize: 13, color: "var(--c-text-secondary)", marginBottom: 4 }}>영어</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "var(--c-text-primary)", textAlign: "center", lineHeight: 1.4 }}>
              Oh, that's <span style={{ color: "var(--c-blue)" }}>hilarious</span>!
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "var(--c-text-secondary)", marginBottom: 4 }}>한국어</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: "var(--c-text-primary)", textAlign: "center", lineHeight: 1.4 }}>
              아, 그거 정말 웃기다!
            </p>
          </>
        )}
        <p style={{ fontSize: 12, color: "var(--c-text-hint)", marginTop: 8 }}>
          {flipped ? "다시 탭하면 한국어로" : "탭하면 영어로 확인 →"}
        </p>
      </div>
    </div>
  );
}

export function OnboardingPage({
  defaultStudyReason,
  defaultDailyGoal,
  isLoggingIn = false,
  onComplete,
  onDevLogin,
}: OnboardingPageProps) {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [studyReason, setStudyReason] = useState(defaultStudyReason);
  const [dailyGoal, setDailyGoal] = useState(defaultDailyGoal);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const devTapCount = useRef(0);
  const devTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDevTap = () => {
    devTapCount.current += 1;
    if (devTapTimer.current) clearTimeout(devTapTimer.current);
    if (devTapCount.current >= 5) {
      devTapCount.current = 0;
      onDevLogin({
        studyReason: studyReason.trim() || defaultStudyReason,
        dailyGoal,
        preferredCategories: categories,
        preferredDifficulties: difficulties,
      });
    } else {
      devTapTimer.current = setTimeout(() => { devTapCount.current = 0; }, 1500);
    }
  };

  const toggleDifficulty = (d: Difficulty) => {
    setDifficulties((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const toggleCategory = (cat: Category) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleNext = () => {
    if (step < 5) {
      setStep((s) => (s + 1) as typeof step);
    } else {
      onComplete({
        studyReason: studyReason.trim() || defaultStudyReason,
        dailyGoal,
        preferredCategories: categories,
        preferredDifficulties: difficulties,
      });
    }
  };

  const TOTAL_STEPS = 6;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "var(--c-bg-card)",
      display: "flex", flexDirection: "column", zIndex: 500,
    }}>
      {/* Progress bar */}
      <div style={{ padding: "16px 24px 0" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1, height: 4, borderRadius: 2,
                background: i <= step ? "var(--c-blue)" : "var(--c-border)",
                transition: "background 300ms ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "32px 24px 0", overflowY: "auto" }}>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <>
            <p style={{ fontSize: 36, marginBottom: 16 }}>👋</p>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--c-text-primary)", marginBottom: 12, lineHeight: 1.35 }}>
              온잇에 오신 걸<br />환영해요!
            </h2>
            <p style={{ fontSize: 15, color: "var(--c-text-caption)", lineHeight: 1.75, marginBottom: 0 }}>
              토스에서 영어 문장을 매일 학습하고<br />
              500개 이상의 표현을 내 것으로 만들어요.<br />
              <br />
              시작 전에 몇 가지만 확인할게요.
            </p>
          </>
        )}

        {/* Step 1 — Study reason */}
        {step === 1 && (
          <>
            <p style={{ fontSize: 26, marginBottom: 12 }}>📖</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--c-text-primary)", marginBottom: 8, lineHeight: 1.4 }}>
              왜 영어를 공부하시나요?
            </h2>
            <p style={{ fontSize: 14, color: "var(--c-text-secondary)", marginBottom: 28, lineHeight: 1.6 }}>
              목표를 적어두면 꾸준한 학습에 도움이 돼요
            </p>
            <textarea
              value={studyReason}
              onChange={(e) => setStudyReason(e.target.value)}
              placeholder="영어를 공부하는 이유를 한 줄로 입력해주세요"
              maxLength={100}
              rows={3}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: 15,
                color: "var(--c-text-primary)",
                background: "var(--c-bg-input)",
                border: "none",
                borderRadius: 14,
                resize: "none",
                outline: "none",
                lineHeight: 1.6,
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
            <div style={{ fontSize: 12, color: "var(--c-text-hint)", textAlign: "right", marginTop: 6 }}>
              {studyReason.length}/100
            </div>
          </>
        )}

        {/* Step 2 — Daily goal */}
        {step === 2 && (
          <>
            <p style={{ fontSize: 26, marginBottom: 12 }}>⚡</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--c-text-primary)", marginBottom: 8, lineHeight: 1.4 }}>
              하루에 몇 문장씩 학습할까요?
            </h2>
            <p style={{ fontSize: 14, color: "var(--c-text-secondary)", marginBottom: 28, lineHeight: 1.6 }}>
              처음엔 5개부터 시작하는 걸 추천해요
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {DAILY_GOAL_OPTIONS.map((goal) => {
                const active = goal === dailyGoal;
                return (
                  <button
                    key={goal}
                    onClick={() => setDailyGoal(goal)}
                    style={{
                      flex: 1,
                      padding: "18px 0",
                      fontSize: 18,
                      fontWeight: active ? 700 : 500,
                      color: active ? "#ffffff" : "var(--c-text-body)",
                      background: active ? "var(--c-blue)" : "var(--c-bg-input)",
                      border: "none",
                      borderRadius: 14,
                      cursor: "pointer",
                      transition: "background 120ms ease, color 120ms ease",
                    }}
                  >
                    {goal}개
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Step 3 — Difficulty */}
        {step === 3 && (
          <>
            <p style={{ fontSize: 26, marginBottom: 12 }}>🎯</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--c-text-primary)", marginBottom: 8, lineHeight: 1.4 }}>
              어떤 난이도로 시작할까요?
            </h2>
            <p style={{ fontSize: 14, color: "var(--c-text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
              선택 안 해도 돼요 — 전체 난이도를 골고루 학습해요
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {DIFFICULTY_OPTIONS.map(({ value, label, sub, korean, english, highlight }) => {
                const selected = difficulties.includes(value);
                const englishParts = english.split(highlight);
                return (
                  <button
                    key={value}
                    onClick={() => toggleDifficulty(value)}
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      background: selected ? "var(--c-blue-tint)" : "var(--c-bg-input)",
                      border: `1.5px solid ${selected ? "#3182f6" : "transparent"}`,
                      borderRadius: 16,
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 120ms ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: selected ? "var(--c-blue)" : "var(--c-text-caption)",
                        background: selected ? "var(--c-blue-tint)" : "var(--c-border)",
                        borderRadius: 6, padding: "2px 8px",
                      }}>
                        {label}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--c-text-secondary)" }}>{sub}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--c-text-secondary)", marginBottom: 4 }}>{korean}</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "var(--c-text-primary)" }}>
                      {englishParts[0]}
                      <span style={{ color: "var(--c-blue)" }}>{highlight}</span>
                      {englishParts[1]}
                    </p>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Step 4 — Category */}
        {step === 4 && (
          <>
            <p style={{ fontSize: 26, marginBottom: 12 }}>📂</p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--c-text-primary)", marginBottom: 8, lineHeight: 1.4 }}>
              관심 카테고리가 있나요?
            </h2>
            <p style={{ fontSize: 14, color: "var(--c-text-secondary)", marginBottom: 28, lineHeight: 1.6 }}>
              선택 안 해도 돼요 — 전체 카테고리를 골고루 학습해요
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {CATEGORIES.map((cat) => {
                const selected = categories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    style={{
                      padding: "10px 18px",
                      fontSize: 14,
                      fontWeight: selected ? 600 : 400,
                      color: selected ? "var(--c-blue)" : "var(--c-text-caption)",
                      background: selected ? "var(--c-blue-tint)" : "var(--c-bg-input)",
                      border: `1.5px solid ${selected ? "#3182f6" : "transparent"}`,
                      borderRadius: 24,
                      cursor: "pointer",
                      transition: "all 120ms ease",
                    }}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Step 5 — Tutorial */}
        {step === 5 && (
          <>
            <p
              style={{ fontSize: 26, marginBottom: 12, display: "inline-block", cursor: "default" }}
              onClick={handleDevTap}
            >
              👆
            </p>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--c-text-primary)", marginBottom: 8, lineHeight: 1.4 }}>
              이렇게 사용해요
            </h2>
            <p style={{ fontSize: 14, color: "var(--c-text-secondary)", marginBottom: 28, lineHeight: 1.6 }}>
              카드를 탭해서 뒤집고, 좌우로 스와이프해서 넘겨요
            </p>
            <TutorialCard />
          </>
        )}
      </div>

      {/* CTA */}
      <div style={{
        padding: "16px 24px",
        paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
      }}>
        {step === 5 && (
          <p style={{ fontSize: 13, color: "var(--c-text-hint)", textAlign: "center", marginBottom: 10 }}>
            토스 로그인 후 시작돼요
          </p>
        )}
        <button
          onClick={handleNext}
          disabled={isLoggingIn}
          style={{
            width: "100%",
            padding: "18px 0",
            borderRadius: 16,
            border: "none",
            background: isLoggingIn ? "#b0c8f0" : "#3182f6",
            fontSize: 17,
            fontWeight: 700,
            color: "#ffffff",
            cursor: isLoggingIn ? "default" : "pointer",
            transition: "background 200ms ease",
          }}
        >
          {isLoggingIn ? "로그인 중..." : step === 5 ? "시작하기" : "다음"}
        </button>
      </div>
    </div>
  );
}
