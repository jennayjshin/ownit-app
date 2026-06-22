import { useEffect, useRef, useState } from "react";
import "./App.css";
import { appLogin, Analytics } from "@apps-in-toss/web-framework";
import { AlertModal } from "./components/AlertModal";
import { HomePage } from "./pages/HomePage";
import { StudyCardPage } from "./pages/StudyCardPage";
import { ReviewPage } from "./pages/ReviewPage";
import { SettingsPage, AllCompletePage } from "./pages/SettingsPage";
import type { SettingsUpdate } from "./pages/SettingsPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import type { OnboardingResult } from "./pages/OnboardingPage";
import { supabase } from "./lib/supabase";
import { upsertUser, updateUser } from "./lib/db";
import type { Category, Difficulty } from "./types/database";
import type { Session } from "@supabase/supabase-js";

type Tab = "home" | "review" | "settings";
type Page = "tabs" | "study" | "review-study" | "all-complete";

const DEFAULT_PROFILE = {
  studyReason: "원어민과 자유롭게 수다 떠는 그날까지",
  dailyGoal: 5,
  preferredCategories: [] as Category[],
  preferredDifficulties: [] as Difficulty[],
};

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--c-blue)" : "var(--c-text-secondary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ReviewIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--c-blue)" : "var(--c-text-secondary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--c-blue)" : "var(--c-text-secondary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const TAB_LABELS: Record<Tab, string> = {
  home: "홈",
  review: "복습",
  settings: "설정",
};

function BottomTabBar({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (tab: Tab) => void }) {
  return (
    <div style={{
      position: "fixed",
      bottom: "calc(env(safe-area-inset-bottom) + 12px)",
      left: 16,
      right: 16,
      height: 60,
      background: "var(--c-bg-card)",
      borderRadius: 20,
      boxShadow: "0 4px 20px var(--c-shadow)",
      display: "flex",
      alignItems: "center",
    }}>
      {(["home", "review", "settings"] as Tab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px 0",
          }}
        >
          {tab === "home" && <HomeIcon active={activeTab === tab} />}
          {tab === "review" && <ReviewIcon active={activeTab === tab} />}
          {tab === "settings" && <SettingsIcon active={activeTab === tab} />}
          <span style={{ fontSize: 11, color: activeTab === tab ? "var(--c-blue)" : "var(--c-text-secondary)", fontWeight: activeTab === tab ? 600 : 400 }}>
            {TAB_LABELS[tab]}
          </span>
        </button>
      ))}
    </div>
  );
}

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tossUserKey, setTossUserKey] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem("ownit_onboarding_done")
  );
  const [page, setPage] = useState<Page>("tabs");
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const [studyReason, setStudyReason] = useState(DEFAULT_PROFILE.studyReason);
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_PROFILE.dailyGoal);
  const [preferredCategories, setPreferredCategories] = useState<Category[]>(DEFAULT_PROFILE.preferredCategories);
  const [preferredDifficulties, setPreferredDifficulties] = useState<Difficulty[]>(DEFAULT_PROFILE.preferredDifficulties);
  const [userEmail, setUserEmail] = useState<string>("");

  const isLoggingInRef = useRef(false);
  const pendingOnboardingRef = useRef<OnboardingResult | null>(null);

  const setupUser = async (session: Session) => {
    const uid = session.user.id;
    const key = session.user.user_metadata?.toss_user_key;

    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (!existingUser) {
      // 신규 유저: users 행 생성 (실패 시 로그인 자체를 중단)
      const tossKey = session.user.user_metadata?.toss_user_key;
      try {
        await upsertUser({
          id: uid,
          toss_user_id: tossKey ? String(tossKey) : uid,
          study_reason: DEFAULT_PROFILE.studyReason,
          daily_goal: DEFAULT_PROFILE.dailyGoal,
          preferred_categories: DEFAULT_PROFILE.preferredCategories,
          preferred_difficulties: DEFAULT_PROFILE.preferredDifficulties,
        });
      } catch (e: unknown) {
        const code = (e as { code?: string })?.code;
        if (code === "23505") {
          await supabase.auth.signOut();
          return; // userId 미설정 상태로 종료
        }
        throw e;
      }
    }

    // users 행 존재 확정 이후 userId 설정
    setUserId(uid);
    if (key) setTossUserKey(String(key));

    // 온보딩 pending 설정 적용 (fire-and-forget — 실패해도 로그인 차단하지 않음)
    const pending = pendingOnboardingRef.current;
    if (pending) {
      pendingOnboardingRef.current = null;
      setStudyReason(pending.studyReason);
      setDailyGoal(pending.dailyGoal);
      setPreferredCategories(pending.preferredCategories);
      setPreferredDifficulties(pending.preferredDifficulties);
      updateUser(uid, {
        study_reason: pending.studyReason,
        daily_goal: pending.dailyGoal,
        preferred_categories: pending.preferredCategories,
        preferred_difficulties: pending.preferredDifficulties,
      }).catch((e) => console.error("[setupUser] pending save failed:", e));
    } else if (existingUser) {
      setStudyReason(existingUser.study_reason ?? DEFAULT_PROFILE.studyReason);
      setDailyGoal(existingUser.daily_goal ?? DEFAULT_PROFILE.dailyGoal);
      setPreferredCategories(existingUser.preferred_categories ?? DEFAULT_PROFILE.preferredCategories);
      setPreferredDifficulties(existingUser.preferred_difficulties ?? DEFAULT_PROFILE.preferredDifficulties);
      setUserEmail(existingUser.email ?? "");
    }

    if (existingUser || pending) {
      setShowOnboarding(false);
    }
  };

  // 앱 시작 시: 기존 세션만 확인, appLogin() 호출하지 않음
  useEffect(() => {
    async function checkSession() {
      const devUserId = import.meta.env.VITE_DEV_USER_ID as string | undefined;
      if (devUserId) {
        setUserId(devUserId);
        setIsAuthReady(true);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await setupUser(session);
        }
      } catch (e) {
        console.error("Session check failed:", e);
      } finally {
        setIsAuthReady(true);
      }
    }
    checkSession();
  }, []);

  // 액션 시점에 호출: 로그인 필요할 때만 appLogin() 실행
  const doLogin = async (): Promise<boolean> => {
    if (userId) return true;
    if (isLoggingInRef.current) return false;
    isLoggingInRef.current = true;
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const { authorizationCode, referrer } = await appLogin();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/toss-auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ authorizationCode, referrer }),
        }
      );
      const payload = await res.json();
      if (payload.error) throw new Error(payload.error);

      const { data: otpData, error: otpErr } = await supabase.auth.verifyOtp({
        token_hash: payload.token_hash,
        type: "email",
      });
      if (otpErr) throw otpErr;
      if (!otpData.session?.user) throw new Error("세션 생성 실패");

      await setupUser(otpData.session);
      return true;
    } catch (e: unknown) {
      console.error("[doLogin]", e);
      setAuthError("로그인에 실패했어요. 잠시 후 다시 시도해주세요.");
      return false;
    } finally {
      isLoggingInRef.current = false;
      setIsLoggingIn(false);
    }
  };

  const devLogin = async (): Promise<boolean> => {
    setIsLoggingIn(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dev-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: JSON.stringify({ secret: "ownit-dev-bypass-2026" }),
        }
      );
      const payload = await res.json();
      if (payload.error) throw new Error(payload.error);
      const { data: otpData, error: otpErr } = await supabase.auth.verifyOtp({ token_hash: payload.token_hash, type: "email" });
      if (otpErr) throw otpErr;
      if (!otpData.session?.user) throw new Error("세션 생성 실패");
      await setupUser(otpData.session);
      return true;
    } catch (e) {
      console.error("[devLogin]", e);
      setAuthError("테스트 로그인 실패");
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem("ownit_onboarding_done", "1");
    setShowOnboarding(false);
  };

  const applyAndFinishOnboarding = async (result: OnboardingResult, uid: string) => {
    setStudyReason(result.studyReason);
    setDailyGoal(result.dailyGoal);
    setPreferredCategories(result.preferredCategories);
    setPreferredDifficulties(result.preferredDifficulties);
    updateUser(uid, {
      study_reason: result.studyReason,
      daily_goal: result.dailyGoal,
      preferred_categories: result.preferredCategories,
      preferred_difficulties: result.preferredDifficulties,
    }).catch((e) => console.error("[onboarding] save failed:", e));
    finishOnboarding();
  };

  const handleOnboardingComplete = async (result: OnboardingResult) => {
    setStudyReason(result.studyReason);
    setDailyGoal(result.dailyGoal);
    setPreferredCategories(result.preferredCategories);
    setPreferredDifficulties(result.preferredDifficulties);

    if (userId) {
      // checkSession으로 이미 인증된 상태 — 직접 설정만 저장
      await applyAndFinishOnboarding(result, userId);
      return;
    }
    pendingOnboardingRef.current = result;
    const ok = await doLogin();
    if (ok) finishOnboarding();
  };

  const handleDevLoginFromOnboarding = async (result: OnboardingResult) => {
    setStudyReason(result.studyReason);
    setDailyGoal(result.dailyGoal);
    setPreferredCategories(result.preferredCategories);
    setPreferredDifficulties(result.preferredDifficulties);

    if (userId) {
      await applyAndFinishOnboarding(result, userId);
      return;
    }
    pendingOnboardingRef.current = result;
    const ok = await devLogin();
    if (ok) finishOnboarding();
  };

  const handleSettingsUpdate = (updates: SettingsUpdate) => {
    if (updates.study_reason !== undefined) setStudyReason(updates.study_reason);
    if (updates.daily_goal !== undefined) setDailyGoal(updates.daily_goal);
    if (updates.preferred_categories !== undefined) setPreferredCategories(updates.preferred_categories);
    if (updates.preferred_difficulties !== undefined) setPreferredDifficulties(updates.preferred_difficulties);
    if (updates.email !== undefined) setUserEmail(updates.email);
  };

  // dev-only: ?onboarding URL 파라미터로 온보딩 미리보기
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("onboarding") !== null) {
    return (
      <OnboardingPage
        defaultStudyReason={DEFAULT_PROFILE.studyReason}
        defaultDailyGoal={DEFAULT_PROFILE.dailyGoal}
        isLoggingIn={false}
        onComplete={() => { window.location.href = "/"; }}
        onDevLogin={() => { window.location.href = "/"; }}
      />
    );
  }

  // 온보딩은 auth와 무관하게 먼저 표시 (로그인은 온보딩 마지막에 트리거)
  if (showOnboarding) {
    return (
      <OnboardingPage
        defaultStudyReason={DEFAULT_PROFILE.studyReason}
        defaultDailyGoal={DEFAULT_PROFILE.dailyGoal}
        isLoggingIn={isLoggingIn}
        onComplete={handleOnboardingComplete}
        onDevLogin={handleDevLoginFromOnboarding}
      />
    );
  }

  if (!isAuthReady) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", padding: "0 24px" }}>
        <p style={{ color: "var(--c-text-secondary)" }}>불러오는 중...</p>
      </div>
    );
  }

  if (page === "all-complete") {
    return <AllCompletePage onBack={() => setPage("tabs")} />;
  }

  if (page === "study" && userId) {
    return (
      <StudyCardPage
        userId={userId}
        dailyGoal={dailyGoal}
        preferredCategories={preferredCategories}
        preferredDifficulties={preferredDifficulties}
        onComplete={() => setPage("tabs")}
        onBack={() => setPage("tabs")}
        onAllComplete={() => setPage("all-complete")}
      />
    );
  }

  if (page === "review-study" && userId) {
    return (
      <StudyCardPage
        userId={userId}
        dailyGoal={dailyGoal}
        preferredCategories={preferredCategories}
        preferredDifficulties={preferredDifficulties}
        reviewMode
        onComplete={() => { setPage("tabs"); setActiveTab("review"); }}
        onBack={() => { setPage("tabs"); setActiveTab("review"); }}
      />
    );
  }

  return (
    <div style={{ paddingBottom: "calc(84px + env(safe-area-inset-bottom))" }}>
      {authError && (
        <AlertModal
          message={authError}
          onConfirm={() => setAuthError(null)}
        />
      )}
      <div style={{ display: activeTab === "home" ? "block" : "none" }}>
        <HomePage
          userId={userId}
          studyReason={studyReason}
          dailyGoal={dailyGoal}
          onStartStudy={async () => {
            const ok = await doLogin();
            if (!ok) return;
            setPage("study");
            Analytics.screen({ log_name: "study_card_screen", mode: "study" });
          }}
          onStartReview={() => setActiveTab("review")}
        />
      </div>
      {userId && (
        <>
          <div style={{ display: activeTab === "review" ? "block" : "none" }}>
            <ReviewPage
              userId={userId}
              onStartReview={() => {
                setPage("review-study");
                Analytics.screen({ log_name: "study_card_screen", mode: "review" });
              }}
            />
          </div>
          <div style={{ display: activeTab === "settings" ? "block" : "none" }}>
            <SettingsPage
              userId={userId}
              tossUserKey={tossUserKey}
              studyReason={studyReason}
              dailyGoal={dailyGoal}
              preferredCategories={preferredCategories}
              preferredDifficulties={preferredDifficulties}
              onUpdate={handleSettingsUpdate}
              onWithdraw={() => {
                setUserId(null);
                setTossUserKey(null);
                setPage("tabs");
                setActiveTab("home");
                setStudyReason(DEFAULT_PROFILE.studyReason);
                setDailyGoal(DEFAULT_PROFILE.dailyGoal);
                setPreferredCategories(DEFAULT_PROFILE.preferredCategories);
                setPreferredDifficulties(DEFAULT_PROFILE.preferredDifficulties);
                setUserEmail("");
                localStorage.removeItem("ownit_onboarding_done");
                setShowOnboarding(true);
              }}
            />
          </div>
        </>
      )}

      <BottomTabBar
        activeTab={activeTab}
        onTabChange={async (tab) => {
          if (!userId && tab !== "home") {
            const ok = await doLogin();
            if (!ok) return;
          }
          setActiveTab(tab);
          Analytics.screen({ log_name: `tab_${tab}` });
        }}
      />
    </div>
  );
}

export default App;
