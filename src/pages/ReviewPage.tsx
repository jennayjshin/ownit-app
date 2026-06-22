import { useEffect, useRef, useState } from "react";
import { Button, Top } from "@toss/tds-mobile";
import { Analytics } from "@apps-in-toss/web-framework";
import { getAllStudiedSentences, toggleFavorite } from "../lib/db";
import type { UserProgressWithSentence } from "../types/database";

function Sk({ w, h, r = 8, mb = 0, style }: { w?: string | number; h: number; r?: number; mb?: number; style?: React.CSSProperties }) {
  return (
    <div
      className="skeleton-box"
      style={{ width: w, height: h, borderRadius: r, marginBottom: mb || undefined, flexShrink: 0, ...style }}
    />
  );
}

function ReviewPageSkeleton() {
  return (
    <div style={{ height: "calc(100vh - 84px - env(safe-area-inset-bottom))", display: "flex", flexDirection: "column" }}>
      <div style={{ paddingTop: 16 }} />
      {/* 헤더 */}
      <div style={{ padding: "24px 24px 20px" }}>
        <Sk w={200} h={22} r={6} mb={10} />
        <Sk w={160} h={15} r={5} />
      </div>
      {/* 리스트 */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} style={{ padding: "16px 24px", borderBottom: "1px solid var(--c-divider)", display: "flex", alignItems: "center", gap: 12 }}>
            <Sk w={18} h={13} r={4} />
            <div style={{ flex: 1 }}>
              <Sk w="78%" h={15} r={5} mb={7} />
              <Sk w="52%" h={13} r={4} />
            </div>
            <Sk w={20} h={20} r={10} />
          </div>
        ))}
      </div>
      {/* 버튼 */}
      <div style={{ padding: "16px 24px 16px" }}>
        <Sk h={52} r={12} />
      </div>
    </div>
  );
}

const PAGE_SIZE = 30;

function highlight(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <>
      <span>{text.slice(0, idx)}</span>
      <span style={{ color: "var(--c-blue)", fontWeight: 600 }}>{text.slice(idx, idx + query.length)}</span>
      <span>{text.slice(idx + query.length)}</span>
    </>
  );
}

interface ReviewPageProps {
  userId: string;
  onStartReview: () => void;
}

export function ReviewPage({ userId, onStartReview }: ReviewPageProps) {
  const [list, setList] = useState<UserProgressWithSentence[]>([]);
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const filteredList = searchQuery.trim()
    ? list.filter((item) => {
        const q = searchQuery.toLowerCase();
        return (
          item.sentences.english_expression.toLowerCase().includes(q) ||
          item.sentences.korean_translation.toLowerCase().includes(q)
        );
      })
    : list;

  // 첫 로드
  useEffect(() => {
    getAllStudiedSentences(userId, PAGE_SIZE, 0)
      .then((data) => {
        setList(data);
        setHasMore(data.length === PAGE_SIZE);
        const favMap: Record<number, boolean> = {};
        data.forEach((d) => { favMap[d.sentence_id] = d.is_favorite; });
        setFavorites(favMap);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  // 추가 로드
  function loadMore() {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    getAllStudiedSentences(userId, PAGE_SIZE, list.length)
      .then((data) => {
        setList((prev) => [...prev, ...data]);
        setHasMore(data.length === PAGE_SIZE);
        setFavorites((prev) => {
          const next = { ...prev };
          data.forEach((d) => { next[d.sentence_id] = d.is_favorite; });
          return next;
        });
      })
      .catch(console.error)
      .finally(() => setLoadingMore(false));
  }

  // Intersection Observer — 초기 로드 끝난 후에만 감지
  useEffect(() => {
    if (loading || !bottomRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [loading, list.length, hasMore, loadingMore]);

  if (loading) return <ReviewPageSkeleton />;

  return (
    <div style={{ height: "calc(100vh - 84px - env(safe-area-inset-bottom))", display: "flex", flexDirection: "column" }}>
      <div style={{ paddingTop: 16 }} />
      <Top
        title={<Top.TitleParagraph size={22}>📚 What I've learned</Top.TitleParagraph>}
        subtitleBottom={
          list.length > 0 ? (
            <Top.SubtitleParagraph size={15}>
              총 {list.length}{hasMore ? "+" : ""}개 문장을 학습했어요
            </Top.SubtitleParagraph>
          ) : undefined
        }
      />

      {/* 검색창 */}
      <div style={{ padding: "0 24px 12px" }}>
        <div style={{ position: "relative" }}>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--c-text-hint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="영어 또는 한국어로 검색"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 36px 10px 38px",
              fontSize: 15, color: "var(--c-text-primary)",
              background: "var(--c-bg-input)", border: "none", borderRadius: 10,
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: 4, cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-text-hint)" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {list.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--c-text-secondary)", fontSize: 15 }}>
            복습할 문장이 없어요
          </div>
        )}

        {filteredList.length === 0 && list.length > 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--c-text-secondary)", fontSize: 15 }}>
            검색 결과가 없어요
          </div>
        )}

        {filteredList.map((item, index) => (
          <div
            key={item.sentence_id}
            style={{ padding: "16px 24px", borderBottom: "1px solid var(--c-divider)", display: "flex", alignItems: "center", gap: 12 }}
          >
            <span style={{ fontSize: 13, color: "var(--c-text-hint)", minWidth: 20, textAlign: "center" }}>
              {index + 1}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: "var(--c-text-primary)", marginBottom: 2 }}>
                {highlight(item.sentences.english_expression, searchQuery)}
              </p>
              <p style={{ fontSize: 13, color: "var(--c-text-secondary)" }}>{highlight(item.sentences.korean_translation, searchQuery)}</p>
            </div>
            <button
              onClick={() => {
                const next = !favorites[item.sentence_id];
                setFavorites((prev) => ({ ...prev, [item.sentence_id]: next }));
                toggleFavorite(userId, item.sentence_id, next).catch(console.error);
              }}
              style={{ background: "none", border: "none", padding: 4, cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              {favorites[item.sentence_id] ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--c-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              )}
            </button>
          </div>
        ))}

        {/* 바닥 감지 트리거 */}
        <div ref={bottomRef} style={{ height: 1 }} />

        {loadingMore && (
          <div style={{ padding: "16px", textAlign: "center", color: "var(--c-text-secondary)", fontSize: 13 }}>
            불러오는 중...
          </div>
        )}
      </div>

      <div style={{ padding: "16px 24px 16px" }}>
        <Button
          size="xlarge"
          style={{ width: "100%" }}
          onClick={() => {
            Analytics.click({ button_name: "review_start", total_count: list.length });
            onStartReview();
          }}
          disabled={list.length === 0}
        >
          복습하기
        </Button>
      </div>
    </div>
  );
}
