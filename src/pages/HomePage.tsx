import { useEffect, useState } from "react";
import { Button, Top } from "@toss/tds-mobile";
import { getTodayStudiedCount, getAllStudiedSentences } from "../lib/db";
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
    <div style={{ paddingBottom: 40 }}>
      <div style={{ paddingTop: 16 }} />
      {/* My Goal */}
      <div style={{ padding: "24px 24px 20px" }}>
        <Sk w={90} h={22} r={6} mb={10} />
        <Sk w="78%" h={16} r={5} />
      </div>
      {/* Today's expressions */}
      <div style={{ padding: "0 24px 32px" }}>
        <Sk w={130} h={13} r={4} mb={14} />
        <Sk w="65%" h={17} r={6} mb={20} />
        <Sk h={52} r={12} />
      </div>
      {/* What I've learned */}
      <div style={{ paddingTop: 8 }}>
        <Sk w={110} h={13} r={4} style={{ margin: "0 24px 14px" }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ padding: "14px 24px", borderBottom: "1px solid #f2f4f6" }}>
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
  onStartStudy: (offset: number) => void;
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

  const isStudyComplete = studiedCount >= dailyGoal;

  useEffect(() => {
    Promise.all([
      getAllStudiedSentences(userId, 5, 0).then(setRecentList),
      getTodayStudiedCount(userId).then(setStudiedCount),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <HomePageSkeleton />;

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ paddingTop: 16 }} />
      <Top
        title={<Top.TitleParagraph size={22}>🎯 My Goal</Top.TitleParagraph>}
        subtitleBottom={<Top.SubtitleParagraph size={15}>{studyReason}</Top.SubtitleParagraph>}

      />

      {/* Today's expressions */}
      <div style={{ padding: "0 24px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <p style={{ fontSize: 13, color: "#8b95a1" }}>Today's expressions</p>
        </div>

        {isStudyComplete ? (
          <>
            <p style={{ fontSize: 17, fontWeight: 600, color: "#191f28", marginBottom: 20 }}>
              오늘의 학습을 완료했어요
            </p>
            <Button size="xlarge" style={{ width: "100%" }} onClick={() => onStartStudy(studiedCount)}>
              다음 학습 시작하기
            </Button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 17, fontWeight: 600, color: "#191f28", marginBottom: 20 }}>
              오늘 <span style={{ color: "#3182f6" }}>{dailyGoal}문장</span>을 학습해 보세요
            </p>
            <Button size="xlarge" style={{ width: "100%" }} onClick={() => onStartStudy(0)}>
              시작하기
            </Button>
          </>
        )}
      </div>

      {/* What I've learned */}
      <div style={{ paddingTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 24px 12px" }}>
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
                style={{ padding: "14px 24px", borderBottom: "1px solid #f2f4f6" }}
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
