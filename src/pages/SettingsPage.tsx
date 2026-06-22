import React, { useRef, useState } from "react";
import { requestNotificationAgreement, Analytics } from "@apps-in-toss/web-framework";
import { closeView } from "@apps-in-toss/web-framework";
import { updateUser } from "../lib/db";
import { supabase } from "../lib/supabase";
import type { Category, Difficulty } from "../types/database";
import { AlertModal } from "../components/AlertModal";
import { TermsPage } from "./TermsPage";

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
const DAYS_KR = ["월", "화", "수", "목", "금", "토", "일"];

interface NotificationSettings {
  enabled: boolean;
  days: number[];
  hour: string;
  minute: "00" | "30";
}

export type CardOrder = "korean_first" | "english_first";
export const CARD_ORDER_KEY = "ownit_card_order";
export function loadCardOrder(): CardOrder {
  return (localStorage.getItem(CARD_ORDER_KEY) as CardOrder) ?? "korean_first";
}

function loadNotification(): NotificationSettings {
  try {
    const stored = localStorage.getItem("ownit_notification");
    if (stored) {
      const parsed = JSON.parse(stored);
      // migrate old "time" string format → hour/minute
      if (parsed.time && !parsed.hour) {
        const [h, m] = parsed.time.split(":");
        parsed.hour = h ?? "09";
        parsed.minute = m === "30" ? "30" : "00";
        delete parsed.time;
      }
      return parsed;
    }
  } catch {
    // fall through to default
  }
  return { enabled: false, days: [0, 1, 2, 3, 4], hour: "09", minute: "00" };
}

export interface SettingsUpdate {
  study_reason?: string;
  daily_goal?: number;
  preferred_categories?: Category[];
  preferred_difficulties?: Difficulty[];
  email?: string;
}

interface SettingsPageProps {
  userId: string | null;
  tossUserKey: string | null;
  studyReason: string;
  dailyGoal: number;
  preferredCategories: Category[];
  preferredDifficulties: Difficulty[];
  onUpdate: (updates: SettingsUpdate) => void;
  onWithdraw: () => void;
}

export function SettingsPage({
  userId,
  tossUserKey,
  studyReason,
  dailyGoal,
  preferredCategories,
  preferredDifficulties,
  onUpdate,
  onWithdraw,
}: SettingsPageProps) {
  const [editingReason, setEditingReason] = useState(false);
  const [reasonDraft, setReasonDraft] = useState(studyReason);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationSettings>(loadNotification);
  const [isRequestingNotif, setIsRequestingNotif] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const notifTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showFinalComplete, setShowFinalComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [cardOrder, setCardOrderState] = useState<CardOrder>(loadCardOrder);

  const handleCardOrderChange = (order: CardOrder) => {
    setCardOrderState(order);
    localStorage.setItem(CARD_ORDER_KEY, order);
  };

  if (showFeedback) {
    return <FeedbackPage onBack={() => setShowFeedback(false)} />;
  }

  if (showTerms) {
    return <TermsPage onBack={() => setShowTerms(false)} />;
  }

  if (showFinalComplete) {
    return <AllCompletePage onBack={() => setShowFinalComplete(false)} />;
  }

  const save = async (updates: SettingsUpdate, key: string) => {
    setSavingKey(key);
    try {
      const supabaseUpdates: Record<string, unknown> = {};
      if (updates.study_reason !== undefined) supabaseUpdates.study_reason = updates.study_reason;
      if (updates.daily_goal !== undefined) supabaseUpdates.daily_goal = updates.daily_goal;
      if (updates.preferred_categories !== undefined) supabaseUpdates.preferred_categories = updates.preferred_categories;
      if (updates.preferred_difficulties !== undefined) supabaseUpdates.preferred_difficulties = updates.preferred_difficulties;
      await updateUser(userId, supabaseUpdates as Parameters<typeof updateUser>[1]);
      onUpdate(updates);
    } catch (e) {
      console.error("Settings save failed:", e);
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveReason = async () => {
    const trimmed = reasonDraft.trim();
    if (!trimmed) return;
    await save({ study_reason: trimmed }, "reason");
    setEditingReason(false);
  };

  const handleCancelReason = () => {
    setReasonDraft(studyReason);
    setEditingReason(false);
  };

  const handleGoalChange = (goal: number) => {
    if (goal === dailyGoal) return;
    save({ daily_goal: goal }, "goal");
  };

  const handleCategoryToggle = (cat: Category) => {
    const next = preferredCategories.includes(cat)
      ? preferredCategories.filter((c) => c !== cat)
      : [...preferredCategories, cat];
    save({ preferred_categories: next }, "category");
  };

  const handleDifficultyToggle = (diff: Difficulty) => {
    const next = preferredDifficulties.includes(diff)
      ? preferredDifficulties.filter((d) => d !== diff)
      : [...preferredDifficulties, diff];
    save({ preferred_difficulties: next }, "difficulty");
  };

  const saveNotification = (updates: Partial<NotificationSettings>) => {
    const next = { ...notification, ...updates };
    setNotification(next);
    localStorage.setItem("ownit_notification", JSON.stringify(next));
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("세션 없음");

      const { error } = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;

      await supabase.auth.signOut();
      onWithdraw();
      await closeView();
    } catch (e) {
      console.error("[withdraw]", e);
      setAlertMessage("탈퇴 처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsWithdrawing(false);
      setShowWithdrawConfirm(false);
    }
  };

  const sendRoutineNotification = async (key: string, hour: string, minute: string) => {
    await supabase.functions.invoke("send-notification", {
      body: { tossUserKey: key, context: { time: `${hour}:${minute}` } },
    });
  };

  const handleNotificationToggle = (enable: boolean) => {
    if (!enable) {
      Analytics.click({ button_name: "notification_disable" });
      saveNotification({ enabled: false });
      return;
    }
    if (isRequestingNotif) return;
    setIsRequestingNotif(true);

    let cleanupFn: (() => void) | undefined;
    let aborted = false;

    const abort = (showAlert = false) => {
      if (aborted) return;
      aborted = true;
      if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
      try { cleanupFn?.(); } catch {}
      setIsRequestingNotif(false);
      if (showAlert) setAlertMessage("잠시 뒤에 다시 시도해주세요.");
    };

    // Set timeout before calling requestNotificationAgreement so it always fires
    // even if the API throws synchronously (e.g. no Toss bridge in local dev)
    notifTimeoutRef.current = setTimeout(() => abort(true), 5000);

    try {
      cleanupFn = requestNotificationAgreement({
        options: { templateCode: "dj-nativefit-routine" },
        onEvent: ({ type }) => {
          if (aborted) return;
          abort();
          if (type === "newAgreement" || type === "alreadyAgreed") {
            Analytics.click({ button_name: "notification_enable" });
            saveNotification({ enabled: true });
            if (tossUserKey) {
              sendRoutineNotification(tossUserKey, notification.hour, notification.minute)
                .catch(console.error);
            }
          }
        },
        onError: (error) => {
          abort();
          console.error("[notification agreement]", error);
        },
      });
    } catch {
      abort(true);
    }
  };

  const toggleNotifDay = (i: number) => {
    const days = notification.days.includes(i)
      ? notification.days.filter((d) => d !== i)
      : [...notification.days, i];
    saveNotification({ days });
  };

  const isSavingReason = savingKey === "reason";
  const canSaveReason = !!reasonDraft.trim() && !isSavingReason;

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh", paddingBottom: 100 }}>
      {alertMessage && (
        <AlertModal message={alertMessage} onConfirm={() => setAlertMessage(null)} />
      )}
      {/* Header */}
      <div style={{ background: "#ffffff", padding: "20px 24px 16px", borderBottom: "1px solid #e5e8eb" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#191f28", margin: 0 }}>설정</h1>
      </div>

      {/* 내가 영어를 공부하는 이유 */}
      <SettingsSection title="내가 영어를 공부하는 이유">
        {editingReason ? (
          <>
            <textarea
              value={reasonDraft}
              onChange={(e) => setReasonDraft(e.target.value)}
              placeholder="영어를 공부하는 이유를 한 줄로 입력해주세요"
              maxLength={100}
              rows={2}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: 15,
                color: "#191f28",
                background: "#f2f4f6",
                border: "none",
                borderRadius: 12,
                resize: "none",
                outline: "none",
                lineHeight: 1.6,
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
            <div style={{ fontSize: 12, color: "#8b95a1", textAlign: "right", marginTop: 4, marginBottom: 12 }}>
              {reasonDraft.length}/100
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleCancelReason}
                style={{ ...subBtn, flex: 1 }}
              >
                취소
              </button>
              <button
                onClick={handleSaveReason}
                disabled={!canSaveReason}
                style={{ ...primaryBtn, flex: 1, opacity: canSaveReason ? 1 : 0.5 }}
              >
                {isSavingReason ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </>
        ) : (
          <div
            onClick={() => { setReasonDraft(studyReason); setEditingReason(true); }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              background: "#f2f4f6",
              borderRadius: 12,
              cursor: "pointer",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 15, color: "#191f28", lineHeight: 1.5, flex: 1 }}>
              {studyReason}
            </span>
            <span style={{ fontSize: 13, color: "#3182f6", flexShrink: 0, fontWeight: 500 }}>수정</span>
          </div>
        )}
      </SettingsSection>

      {/* 학습량 */}
      <SettingsSection title="하루 학습량">
        <p style={{ fontSize: 13, color: "#8b95a1", marginBottom: 12 }}>
          매일 학습할 문장 수를 설정해요
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          {DAILY_GOAL_OPTIONS.map((goal) => {
            const active = goal === dailyGoal;
            return (
              <button
                key={goal}
                onClick={() => handleGoalChange(goal)}
                disabled={savingKey === "goal"}
                style={{
                  flex: 1,
                  padding: "13px 0",
                  fontSize: 15,
                  fontWeight: active ? 700 : 400,
                  color: active ? "#ffffff" : "#333d4b",
                  background: active ? "#3182f6" : "#f2f4f6",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "background 120ms ease, color 120ms ease",
                }}
              >
                {goal}개
              </button>
            );
          })}
        </div>
      </SettingsSection>

      {/* 카드 표시 순서 */}
      <SettingsSection title="카드 표시 순서">
        <p style={{ fontSize: 13, color: "#8b95a1", marginBottom: 12 }}>
          학습 카드의 앞면에 표시할 언어를 선택해요
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          {([
            { value: "korean_first" as CardOrder, label: "한국어 먼저" },
            { value: "english_first" as CardOrder, label: "영어 먼저" },
          ]).map(({ value, label }) => {
            const active = cardOrder === value;
            return (
              <button
                key={value}
                onClick={() => handleCardOrderChange(value)}
                style={{
                  flex: 1,
                  padding: "13px 0",
                  fontSize: 15,
                  fontWeight: active ? 700 : 400,
                  color: active ? "#ffffff" : "#333d4b",
                  background: active ? "#3182f6" : "#f2f4f6",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "background 120ms ease, color 120ms ease",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </SettingsSection>

      {/* 난이도 */}
      <SettingsSection title="난이도">
        <p style={{ fontSize: 13, color: "#8b95a1", marginBottom: 12 }}>
          {preferredDifficulties.length === 0
            ? "미선택 시 모든 난이도를 랜덤으로 학습해요"
            : `${preferredDifficulties.length}개 선택됨`}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => {
            const selected = preferredDifficulties.includes(diff);
            const labelMap: Record<Difficulty, string> = { easy: "쉬움", medium: "보통", hard: "어려움" };
            return (
              <button
                key={diff}
                onClick={() => handleDifficultyToggle(diff)}
                disabled={savingKey === "difficulty"}
                style={{
                  flex: 1,
                  padding: "13px 0",
                  fontSize: 14,
                  fontWeight: selected ? 700 : 400,
                  color: selected ? "#3182f6" : "#6b7684",
                  background: selected ? "#e8f3ff" : "#f2f4f6",
                  border: `1.5px solid ${selected ? "#3182f6" : "transparent"}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "all 120ms ease",
                }}
              >
                {labelMap[diff]}
              </button>
            );
          })}
        </div>
      </SettingsSection>

      {/* 카테고리 */}
      <SettingsSection title="학습 카테고리">
        <p style={{ fontSize: 13, color: "#8b95a1", marginBottom: 12 }}>
          {preferredCategories.length === 0
            ? "미선택 시 전체 카테고리를 랜덤으로 학습해요"
            : `${preferredCategories.length}개 선택됨`}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CATEGORIES.map((cat) => {
            const selected = preferredCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => handleCategoryToggle(cat)}
                disabled={savingKey === "category"}
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: selected ? 600 : 400,
                  color: selected ? "#3182f6" : "#6b7684",
                  background: selected ? "#e8f3ff" : "#f2f4f6",
                  border: `1.5px solid ${selected ? "#3182f6" : "transparent"}`,
                  borderRadius: 20,
                  cursor: "pointer",
                  transition: "all 120ms ease",
                }}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>
      </SettingsSection>

      {/* 루틴 알림 */}
      <SettingsSection title="루틴 알림">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 15, color: "#333d4b" }}>
            알림 받기
            {isRequestingNotif && (
              <span style={{ fontSize: 12, color: "#8b95a1", marginLeft: 8 }}>동의 요청 중...</span>
            )}
          </span>
          <ToggleSwitch
            enabled={notification.enabled || isRequestingNotif}
            onChange={handleNotificationToggle}
          />
        </div>

        {notification.enabled && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 13, color: "#8b95a1", marginBottom: 8 }}>알림 요일</p>
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {DAYS_KR.map((day, i) => {
                const active = notification.days.includes(i);
                return (
                  <button
                    key={day}
                    onClick={() => toggleNotifDay(i)}
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      color: active ? "#3182f6" : "#8b95a1",
                      background: active ? "#e8f3ff" : "#f2f4f6",
                      border: `1.5px solid ${active ? "#3182f6" : "transparent"}`,
                      borderRadius: 8,
                      cursor: "pointer",
                      transition: "all 120ms ease",
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <p style={{ fontSize: 13, color: "#8b95a1", marginBottom: 8 }}>알림 시간</p>
            <div style={{ display: "flex", gap: 8 }}>
              {/* Hour select */}
              <div style={{ flex: 1, position: "relative" }}>
                <select
                  value={notification.hour}
                  onChange={(e) => saveNotification({ hour: e.target.value })}
                  style={timeSelectStyle}
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const h = String(i).padStart(2, "0");
                    return (
                      <option key={h} value={h}>{h}시</option>
                    );
                  })}
                </select>
                <SelectArrow />
              </div>
              {/* Minute select — 00 / 30 only */}
              <div style={{ flex: 1, position: "relative" }}>
                <select
                  value={notification.minute}
                  onChange={(e) => saveNotification({ minute: e.target.value as "00" | "30" })}
                  style={timeSelectStyle}
                >
                  <option value="00">00분</option>
                  <option value="30">30분</option>
                </select>
                <SelectArrow />
              </div>
            </div>
          </div>
        )}
      </SettingsSection>

      {/* 더보기 */}
      <SettingsSection title="더보기">
        <ListRow label="약관 및 개인정보 처리방침" onClick={() => setShowTerms(true)} />
        <ListRow label="의견 보내기" onClick={() => setShowFeedback(true)} />
      </SettingsSection>

      {/* 탈퇴하기 */}
      <div style={{ padding: "8px 24px 40px", textAlign: "center" }}>
        <button
          onClick={() => setShowWithdrawConfirm(true)}
          style={{ background: "none", border: "none", fontSize: 13, color: "#b0b8c1", cursor: "pointer", textDecoration: "underline" }}
        >
          탈퇴하기
        </button>
      </div>

      <div style={{ textAlign: "center", padding: "0 0 8px", color: "#8b95a1", fontSize: 12 }}>
        온잇(OwnIt) v0.1.0
      </div>

      {/* 탈퇴 확인 모달 */}
      {showWithdrawConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(25,31,40,0.5)" }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px 20px", width: "calc(100% - 64px)", maxWidth: 320 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#191f28", textAlign: "center", marginBottom: 12 }}>정말 탈퇴하시겠어요?</p>
            <p style={{ fontSize: 14, color: "#6b7684", lineHeight: 1.65, textAlign: "center", marginBottom: 24 }}>
              지금까지의 학습 기록이 모두 삭제되며{"\n"}복구할 수 없어요.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowWithdrawConfirm(false)}
                disabled={isWithdrawing}
                style={{ flex: 1, padding: "14px 0", background: "#f2f4f6", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, color: "#333d4b", cursor: "pointer" }}
              >
                취소
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                style={{ flex: 1, padding: "14px 0", background: "#ff4d4f", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, color: "#fff", cursor: "pointer", opacity: isWithdrawing ? 0.6 : 1 }}
              >
                {isWithdrawing ? "처리 중..." : "탈퇴"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#ffffff", marginTop: 8, padding: "20px 24px" }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, color: "#8b95a1", marginBottom: 16, letterSpacing: "0.04em" }}>
        {title.toUpperCase()}
      </h2>
      {children}
    </div>
  );
}

function ListRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "15px 0",
        background: "none",
        border: "none",
        borderBottom: "1px solid #f2f4f6",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: 15, color: "#333d4b" }}>{label}</span>
      <span style={{ color: "#d1d6db", fontSize: 20, lineHeight: 1 }}>›</span>
    </button>
  );
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      style={{
        width: 50,
        height: 28,
        borderRadius: 14,
        background: enabled ? "#3182f6" : "#d1d6db",
        position: "relative",
        cursor: "pointer",
        transition: "background 200ms ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: enabled ? 24 : 2,
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(25,31,40,0.15)",
          transition: "left 200ms ease",
        }}
      />
    </div>
  );
}

function SelectArrow() {
  return (
    <div style={{
      position: "absolute",
      right: 14,
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
      color: "#8b95a1",
      fontSize: 12,
    }}>
      ▾
    </div>
  );
}

const timeSelectStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 36px 13px 16px",
  fontSize: 15,
  color: "#191f28",
  background: "#f2f4f6",
  border: "none",
  borderRadius: 12,
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

function FeedbackPage({ onBack }: { onBack: () => void }) {
  const [text, setText] = useState("");

  function handleSend() {
    if (!text.trim()) return;
    const subject = encodeURIComponent("온잇(OwnIt) 의견");
    const body = encodeURIComponent(text.trim());
    const a = document.createElement("a");
    a.href = `mailto:dearjelly.official@gmail.com?subject=${subject}&body=${body}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", background: "#ffffff", zIndex: 100 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", height: 56, padding: "0 8px", borderBottom: "1px solid #f2f4f6" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", padding: 8, cursor: "pointer", display: "flex", alignItems: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <span style={{ fontSize: 17, fontWeight: 600, color: "#191f28", marginLeft: 4 }}>의견 보내기</span>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, padding: "24px 24px 0", display: "flex", flexDirection: "column" }}>
        <p style={{ fontSize: 14, color: "#8b95a1", marginBottom: 12 }}>
          불편한 점이나 원하는 표현·기능을 자유롭게 적어주세요
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="의견을 입력해주세요"
          maxLength={1000}
          style={{
            flex: 1,
            padding: "16px",
            fontSize: 15,
            color: "#191f28",
            background: "#f2f4f6",
            border: "none",
            borderRadius: 12,
            resize: "none",
            outline: "none",
            lineHeight: 1.7,
            fontFamily: "inherit",
          }}
        />
        <p style={{ fontSize: 12, color: "#b0b8c1", textAlign: "right", marginTop: 6 }}>
          {text.length}/1000
        </p>
      </div>

      {/* 하단 버튼 */}
      <div style={{ padding: "12px 24px", paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}>
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          style={{
            width: "100%",
            padding: "16px 0",
            borderRadius: 14,
            border: "none",
            background: text.trim() ? "#3182f6" : "#e5e8eb",
            fontSize: 17,
            fontWeight: 600,
            color: text.trim() ? "#ffffff" : "#8b95a1",
            cursor: text.trim() ? "pointer" : "default",
            transition: "background 0.2s",
          }}
        >
          보내기
        </button>
      </div>
    </div>
  );
}

export function AllCompletePage({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", background: "#ffffff", zIndex: 100 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", height: 56, padding: "0 8px", borderBottom: "1px solid #f2f4f6" }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", padding: 8, cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* 본문 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", textAlign: "center" }}>
        <p style={{ fontSize: 64, marginBottom: 24 }}>🎓</p>
        <p style={{ fontSize: 24, fontWeight: 700, color: "#191f28", marginBottom: 12, lineHeight: 1.4 }}>
          모든 문장을 학습했어요!
        </p>
        <p style={{ fontSize: 16, color: "#8b95a1", lineHeight: 1.7, marginBottom: 8 }}>
          791개의 모든 표현을 완주했어요.
        </p>
        <p style={{ fontSize: 16, color: "#8b95a1", lineHeight: 1.7 }}>
          정말 대단해요. 이제 진짜 <span style={{ color: "#3182f6", fontWeight: 600 }}>온잇(OwnIt)</span>이에요!
        </p>
      </div>

      {/* 하단 고정 버튼 */}
      <div style={{ padding: "0 24px", paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}>
        <p style={{ fontSize: 13, color: "#b0b8c1", textAlign: "center", marginBottom: 12 }}>
          원하는 표현이나 문장을 제안해 주세요
        </p>
        <button
          onClick={() => {
            window.location.href =
              "mailto:dearjelly.official@gmail.com?subject=%EC%98%A8%EC%9E%87%20%EC%95%B1%20%EC%9D%98%EA%B2%AC&body=%EB%AA%A8%EB%93%A0%20%EB%AC%B8%EC%9E%A5%EC%9D%84%20%ED%95%99%EC%8A%B5%ED%96%88%EC%96%B4%EC%9A%94!%20%EB%8B%A4%EC%9D%8C%EC%97%90%20%EC%B6%94%EA%B0%80%ED%95%B4%EC%A3%BC%EC%84%B8%EC%9A%94%3A%20";
          }}
          style={{
            width: "100%",
            padding: "16px 0",
            borderRadius: 14,
            border: "none",
            background: "#3182f6",
            fontSize: 17,
            fontWeight: 600,
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          의견 보내기
        </button>
      </div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: "13px 20px",
  fontSize: 15,
  fontWeight: 600,
  color: "#ffffff",
  background: "#3182f6",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
};

// TDS secondary button: tinted blue fill + deep blue text
const subBtn: React.CSSProperties = {
  padding: "13px 20px",
  fontSize: 15,
  fontWeight: 500,
  color: "#1b64da",
  background: "#e8f3ff",
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
};
