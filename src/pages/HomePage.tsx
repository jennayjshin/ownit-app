import { useEffect, useRef, useState } from "react";
import { Button, Top } from "@toss/tds-mobile";
import { TossAds, Analytics } from "@apps-in-toss/web-framework";
import { getTodayStudiedCount, getAllStudiedSentences } from "../lib/db";
import { trackAdImpression } from "../lib/pixel";
import type { UserProgressWithSentence } from "../types/database";

function Sk({ w, h, r = 8, mb = 0, style }: { w?: string | number; h: number; r?: number; mb?: number; style?: React.CSSProperties }) {
  return (
    <div
      className="skeleton-box"
      style={{ width: w, height: h, borderRadius: r, marginBottom: mb || undefined, flexShrink: 0, ...style }}
    />
  );
}

function HomePageSkeleton() {
  return (
    <div style={{ background: "#f2f4f6", minHeight: "100vh", paddingBottom: 40 }}>
      <div style={{ paddingTop: 16 }} />
      {/* My Goal */}
      <div style={{ margin: "0 16px 12px", background: "#fff", borderRadius: 16, padding: "24px 20px 20px" }}>
        <Sk w={90} h={22} r={6} mb={10} />
        <Sk w="78%" h={16} r={5} />
      </div>
      {/* Today's expressions */}
      <div style={{ margin: "0 16px 12px", background: "#fff", borderRadius: 16, padding: "20px 20px 24px" }}>
        <Sk w={130} h={13} r={4} mb={14} />
        <Sk w="65%" h={17} r={6} mb={20} />
        <Sk h={52} r={12} />
      </div>
      {/* Ad */}
      <div style={{ margin: "0 16px 12px", background: "#fff", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <Sk w={48} h={48} r={12} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <Sk w="60%" h={15} r={5} mb={7} />
          <Sk w="40%" h={13} r={4} />
        </div>
      </div>
      {/* What I've learned */}
      <div style={{ margin: "0 16px 40px", background: "#fff", borderRadius: 16, overflow: "hidden" }}>
        <Sk w={110} h={13} r={4} style={{ margin: "16px 20px 12px" }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ padding: "14px 20px", borderBottom: "1px solid #f2f4f6" }}>
            <Sk w="82%" h={15} r={5} mb={7} />
            <Sk w="55%" h={13} r={4} />
          </div>
        ))}
      </div>
    </div>
  );
}

interface HomePageProps {
  userId: string;
  studyReason: string;
  dailyGoal: number;
  onStartStudy: () => void;
  onStartReview: () => void;
}


export function HomePage({
  userId,
  studyReason,
  dailyGoal,
  onStartStudy,
  onStartReview,
}: HomePageProps) {
  const [recentList, setRecentList] = useState<UserProgressWithSentence[]>([]);
  const [studiedCount, setStudiedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(true);
  const bannerRef = useRef<HTMLDivElement>(null);

  const isStudyComplete = studiedCount >= dailyGoal;

  useEffect(() => {
    Promise.all([
      getAllStudiedSentences(userId, 5, 0).then(setRecentList),
      getTodayStudiedCount(userId).then(setStudiedCount),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!bannerRef.current) return;
    const result = TossAds.attachBanner(
      "ait.v2.live.5d38d0c155a6400e",
      bannerRef.current,
      {
        theme: "auto",
        variant: "expanded",
        callbacks: {
          onNoFill: () => setShowBanner(false),
          onAdFailedToRender: () => setShowBanner(false),
        },
      }
    );

    // 광고가 실제로 DOM에 그려졌을 때 impression 이벤트 발화
    const observer = new MutationObserver(() => {
      if (bannerRef.current?.childElementCount) {
        trackAdImpression();
        observer.disconnect();
      }
    });
    observer.observe(bannerRef.current, { childList: true });

    // attachBanner may inject children synchronously before observe() is registered
    if (bannerRef.current.childElementCount) {
      trackAdImpression();
      observer.disconnect();
    }

    return () => {
      result.destroy();
      observer.disconnect();
    };
  }, []);

  if (loading) return <HomePageSkeleton />;

  return (
    <div style={{ background: "#f2f4f6", minHeight: "100vh", paddingBottom: 40 }}>
      <div style={{ paddingTop: 16 }} />

      {/* My Goal */}
      <div style={{ margin: "0 16px 12px", background: "#fff", borderRadius: 16, overflow: "hidden" }}>
        <Top
          title={<Top.TitleParagraph size={22}>🎯 My Goal</Top.TitleParagraph>}
          subtitleBottom={<Top.SubtitleParagraph size={15}>{studyReason}</Top.SubtitleParagraph>}
        />
      </div>

      {/* Today's expressions */}
      <div style={{ margin: "0 16px 12px", background: "#fff", borderRadius: 16, padding: "20px 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <p style={{ fontSize: 13, color: "#8b95a1" }}>Today's expressions</p>
        </div>

        {isStudyComplete ? (
          <>
            <p style={{ fontSize: 17, fontWeight: 600, color: "#191f28", marginBottom: 20 }}>
              오늘의 학습을 완료했어요
            </p>
            <Button size="xlarge" style={{ width: "100%" }} onClick={() => {
              Analytics.click({ button_name: "study_next_set", studied_count: studiedCount, daily_goal: dailyGoal });
              onStartStudy();
            }}>
              다음 학습 시작하기
            </Button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 17, fontWeight: 600, color: "#191f28", marginBottom: 20 }}>
              오늘 <span style={{ color: "#3182f6" }}>{dailyGoal}문장</span>을 학습해 보세요
            </p>
            <Button size="xlarge" style={{ width: "100%" }} onClick={() => {
              Analytics.click({ button_name: "study_start", daily_goal: dailyGoal });
              onStartStudy();
            }}>
              시작하기
            </Button>
          </>
        )}
      </div>

      {/* 배너 광고 영역 */}
      <div style={{
        margin: showBanner ? "0 16px 12px" : 0,
        background: "#fff",
        borderRadius: showBanner ? 16 : 0,
        overflow: "hidden",
        height: showBanner ? "auto" : 0,
      }}>
        <div ref={bannerRef} style={{ width: "100%" }} />
      </div>

      {/* What I've learned */}
      <div style={{ margin: "0 16px 40px", background: "#fff", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "16px 20px 12px" }}>
          <span style={{ fontSize: 14 }}>📚</span>
          <p style={{ fontSize: 13, color: "#8b95a1" }}>What I've learned</p>
        </div>
        {recentList.length === 0 ? (
          <div style={{ padding: "20px 24px", textAlign: "center", color: "#8b95a1", fontSize: 14 }}>
            아직 학습한 문장이 없어요
          </div>
        ) : (
          recentList.map((item) => (
            <div
              key={item.sentence_id}
              style={{ padding: "14px 20px", borderBottom: "1px solid #f2f4f6" }}
            >
              <p style={{ fontSize: 15, fontWeight: 500, color: "#191f28", marginBottom: 2 }}>{item.sentences.english_expression}</p>
              <p style={{ fontSize: 13, color: "#8b95a1" }}>{item.sentences.korean_translation}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
