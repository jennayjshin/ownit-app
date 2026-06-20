import { useEffect, useRef, useState } from "react";
import { Button, Top } from "@toss/tds-mobile";
import { getSentencesByCategories, getAllStudiedSentences, updateProgressAfterReview, upsertProgress, toggleFavorite } from "../lib/db";
import type { Category, Sentence } from "../types/database";
import { loadCardOrder, CARD_ORDER_KEY } from "./SettingsPage";
import type { CardOrder } from "./SettingsPage";

interface StudyCardPageProps {
  userId: string;
  dailyGoal: number;
  preferredCategories: Category[];
  reviewMode?: boolean;
  initialOffset?: number;
  onComplete: () => void;
  onBack: () => void;
  onAllComplete?: () => void;
}

function speak(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function highlightKey(text: string, key: string) {
  if (!key) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(key.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <>
      <span>{text.slice(0, idx)}</span>
      <span style={{ color: "#3182f6" }}>{text.slice(idx, idx + key.length)}</span>
      <span>{text.slice(idx + key.length)}</span>
    </>
  );
}

export function StudyCardPage({
  userId,
  dailyGoal,
  preferredCategories,
  reviewMode = false,
  initialOffset = 0,
  onComplete,
  onBack,
  onAllComplete,
}: StudyCardPageProps) {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardOrder, setCardOrder] = useState<CardOrder>(loadCardOrder);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [swipeHint, setSwipeHint] = useState<"easy" | "hard" | null>(null);
  const [easyCount, setEasyCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sentenceOffset, setSentenceOffset] = useState(initialOffset);

  const touchStartX = useRef<number | null>(null);
  const favoriteMap = useRef<Map<number, boolean>>(new Map());
  const ttsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = sentences[currentIndex];
  const progress = sentences.length > 0 ? (currentIndex / sentences.length) * 100 : 0;

  useEffect(() => {
    if (current) {
      setIsFavorite(favoriteMap.current.get(current.id) ?? false);
    }
  }, [current?.id]);

  useEffect(() => {
    setLoading(true);
    const fetcher = reviewMode
      ? getAllStudiedSentences(userId, 50, 0).then((data) => {
          data.forEach((d) => favoriteMap.current.set(d.sentence_id, d.is_favorite));
          return data.map((d) => d.sentences);
        })
      : getSentencesByCategories(preferredCategories, dailyGoal, sentenceOffset);
    fetcher
      .then((data) => {
        setSentences(data);
        if (!reviewMode && data.length === 0 && onAllComplete) {
          onAllComplete();
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sentenceOffset, reviewMode]);


  function handleTap() {
    setIsFlipped((prev) => !prev);
  }

  function handlePrev() {
    if (currentIndex === 0) return;
    setCurrentIndex((i) => i - 1);
    setIsFlipped(false);
    setSwipeHint(null);
  }

  function handleDifficulty(isEasy: boolean) {
    if (isEasy) setEasyCount((c) => c + 1);
    else setHardCount((c) => c + 1);
    const sentenceId = current.id;
    const isFav = favoriteMap.current.get(sentenceId) ?? false;
    goNext();
    upsertProgress({
      user_id: userId,
      sentence_id: sentenceId,
      first_studied_at: new Date().toISOString(),
      interval_days: 1,
      next_review_date: new Date().toISOString().split("T")[0],
      is_favorite: isFav,
    })
      .then(() => updateProgressAfterReview(userId, sentenceId, isEasy, 1))
      .catch(console.error);
  }

  async function handleToggleFavorite() {
    const next = !isFavorite;
    setIsFavorite(next);
    favoriteMap.current.set(current.id, next);
    if (next) {
      // 즐겨찾기 추가 = 어려운 문장으로 기록 (스와이프 안 하고 끄면 hard로 남음)
      await upsertProgress({
        user_id: userId,
        sentence_id: current.id,
        first_studied_at: new Date().toISOString(),
        interval_days: 1,
        next_review_date: new Date().toISOString().split("T")[0],
        is_favorite: true,
      });
      await updateProgressAfterReview(userId, current.id, false, 1);
    }
    await toggleFavorite(userId, current.id, next);
  }

  function goNext() {
    if (currentIndex + 1 >= sentences.length) {
      setIsCompleted(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
      setSwipeHint(null);
    }
  }

  function handleRepeat() {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSwipeHint(null);
    setEasyCount(0);
    setHardCount(0);
    setIsCompleted(false);
  }

  function handleNextSet() {
    setSentenceOffset((prev) => prev + dailyGoal);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFavorite(false);
    setSwipeHint(null);
    setEasyCount(0);
    setHardCount(0);
    setIsCompleted(false);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 60) {
      // 오른쪽 스와이프 → 알았어요(easy), 왼쪽 스와이프 → 어려워요(hard)
      const isEasy = diff > 0;
      setSwipeHint(isEasy ? "easy" : "hard");
      setTimeout(() => handleDifficulty(isEasy), 300);
    }
    touchStartX.current = null;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p style={{ color: "#8b95a1" }}>문장 불러오는 중...</p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px 100px" }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🎉</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#191f28", marginBottom: 8 }}>오늘의 학습 완료!</p>
          <p style={{ fontSize: 15, color: "#8b95a1" }}>
            쉬워요 {easyCount}개 · 어려워요 {hardCount}개
          </p>
        </div>
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 24px", paddingBottom: "calc(16px + env(safe-area-inset-bottom))", background: "#fff", display: "flex", gap: 12 }}>
          <Button size="xlarge" variant="weak" style={{ flex: 1 }} onClick={onComplete}>
            끝내기
          </Button>
          <Button size="xlarge" style={{ flex: 1 }} onClick={handleRepeat}>
            복습하기
          </Button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* 헤더: X(좌) | 1/5(중앙) | EN/KR(우) */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", height: 56, paddingLeft: 8, paddingRight: 8 }}>
        <button
          onClick={onBack}
          style={{ position: "absolute", left: 8, background: "none", border: "none", padding: 8, cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <span style={{ fontSize: 17, color: "#8b95a1", fontWeight: 500 }}>
          {currentIndex + 1} / {sentences.length}
        </span>
        <button
          onClick={() => {
            const next: CardOrder = cardOrder === "korean_first" ? "english_first" : "korean_first";
            setCardOrder(next);
            localStorage.setItem(CARD_ORDER_KEY, next);
            setIsFlipped(false);
          }}
          style={{
            position: "absolute",
            right: 8,
            background: "none",
            border: "none",
            padding: 8,
            cursor: "pointer",
            fontSize: 17,
            fontWeight: 500,
            color: "#8b95a1",
          }}
        >
          {cardOrder === "english_first" ? "EN" : "KR"}
        </button>
      </div>

      {/* 진행 바 + 스와이프 카운터 */}
      <div style={{ padding: "0 24px 12px" }}>
        <div style={{ height: 2, background: "#e5e8eb", borderRadius: 2, marginBottom: 12 }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "#3182f6", borderRadius: 2, transition: "width 0.3s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#ff4d4f", background: "#fff1f0", borderRadius: 20, padding: "4px 14px", border: "1.5px solid #ffccc7" }}>{hardCount}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#3182f6", background: "#e8f3ff", borderRadius: 20, padding: "4px 14px", border: "1.5px solid #91caff" }}>{easyCount}</span>
        </div>
      </div>

      {/* 카드 */}
      <div
        style={{ flex: 1, padding: "0 24px", display: "flex", flexDirection: "column" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          onClick={handleTap}
          style={{
            flex: 1,
            background: swipeHint === "easy" ? "#e8f3ff" : swipeHint === "hard" ? "#fff1f0" : "#ffffff",
            border: "2px solid #e5e8eb",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(25,31,40,0.04)",
            transition: "background 0.2s",
            overflow: "hidden",
          }}
        >
          {/* 문장 영역 */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 32px 16px", textAlign: "center" }}>
            {(() => {
              const showEnglishFront = cardOrder === "english_first";
              const isFrontSide = !isFlipped;
              if (isFrontSide) {
                return showEnglishFront ? (
                  <p style={{ fontSize: 20, fontWeight: 600, color: "#191f28", lineHeight: 1.6 }}>
                    {highlightKey(current.english_expression, current.key_expression)}
                  </p>
                ) : (
                  <p style={{ fontSize: 20, fontWeight: 600, color: "#191f28", lineHeight: 1.6 }}>
                    {current.korean_translation}
                  </p>
                );
              } else {
                return showEnglishFront ? (
                  <p style={{ fontSize: 20, fontWeight: 600, color: "#191f28", lineHeight: 1.6 }}>
                    {current.korean_translation}
                  </p>
                ) : (
                  <p style={{ fontSize: 20, fontWeight: 600, color: "#191f28", lineHeight: 1.6 }}>
                    {highlightKey(current.english_expression, current.key_expression)}
                  </p>
                );
              }
            })()}
          </div>

          {/* 카드 하단 버튼 3개 */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "12px 24px 20px", borderTop: "1px solid #f2f4f6" }}
          >
            {/* 1. 이전 카드 */}
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              style={{ background: "none", border: "none", padding: 12, cursor: currentIndex === 0 ? "default" : "pointer", opacity: currentIndex === 0 ? 0.25 : 1, display: "flex", alignItems: "center" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>

            {/* 2. 소리 듣기 (플레이/일시정지) */}
            <button
              onClick={() => {
                if (isPlaying) {
                  window.speechSynthesis.cancel();
                  setIsPlaying(false);
                } else {
                  setIsPlaying(true);
                  const utterance = new SpeechSynthesisUtterance(current.english_expression);
                  utterance.lang = "en-US";
                  utterance.rate = 0.9;
                  utterance.onend = () => setIsPlaying(false);
                  window.speechSynthesis.cancel();
                  window.speechSynthesis.speak(utterance);
                }
              }}
              style={{ background: "none", border: "none", padding: 12, cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              {isPlaying ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#3182f6" stroke="none">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#3182f6" stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            {/* 3. 즐겨찾기 */}
            <button
              onClick={handleToggleFavorite}
              style={{ background: "none", border: "none", padding: 12, cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              {isFavorite ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 배너 광고 영역 */}
      <div style={{
        margin: "16px 24px 40px",
        height: 64,
        background: "#f2f4f6",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <p style={{ fontSize: 12, color: "#b0b8c1" }}>광고 영역</p>
      </div>
    </div>
  );
}
