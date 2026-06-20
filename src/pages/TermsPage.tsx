import { useState } from "react";

type TermsTab = "terms" | "privacy";

interface TermsPageProps {
  onBack: () => void;
}

export function TermsPage({ onBack }: TermsPageProps) {
  const [activeTab, setActiveTab] = useState<TermsTab>("terms");

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#ffffff", overflowY: "auto", zIndex: 100 }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        padding: "16px 24px",
        borderBottom: "1px solid #e5e8eb",
        position: "sticky",
        top: 0,
        background: "#ffffff",
        zIndex: 10,
      }}>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px 4px 0", marginRight: 8 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#191f28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#191f28", margin: 0 }}>
          약관 및 개인정보 처리방침
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e8eb", background: "#ffffff" }}>
        {(["terms", "privacy"] as TermsTab[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "14px 0",
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? "#3182f6" : "#8b95a1",
                background: "none",
                border: "none",
                borderBottom: active ? "2px solid #3182f6" : "2px solid transparent",
                cursor: "pointer",
                marginBottom: -1,
              }}
            >
              {tab === "terms" ? "이용약관" : "개인정보 처리방침"}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: "28px 24px 80px", color: "#333d4b", lineHeight: 1.75 }}>
        {activeTab === "terms" ? <TermsContent /> : <PrivacyContent />}
      </div>
    </div>
  );
}

function ArticleTitle({ num, title }: { num: number; title: string }) {
  return (
    <h2 style={{ fontSize: 15, fontWeight: 700, color: "#191f28", marginTop: 32, marginBottom: 10 }}>
      제{num}조 ({title})
    </h2>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, color: "#333d4b", marginBottom: 8 }}>{children}</p>;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6b7684", margin: "20px 0 8px", letterSpacing: "0.02em" }}>
      {children}
    </h3>
  );
}

function Ol({ items }: { items: React.ReactNode[] }) {
  return (
    <ol style={{ margin: "0 0 8px", paddingLeft: 20 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 14, color: "#333d4b", marginBottom: 6 }}>{item}</li>
      ))}
    </ol>
  );
}

function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 14, color: "#333d4b", marginBottom: 4 }}>{item}</li>
      ))}
    </ul>
  );
}

function TermsContent() {
  return (
    <>
      <p style={{ fontSize: 13, color: "#8b95a1", marginBottom: 4 }}>시행일: 2025년 6월 20일</p>
      <p style={{ fontSize: 13, color: "#8b95a1", marginBottom: 24 }}>제공: 디어젤리 (dearjelly.official@gmail.com)</p>

      <ArticleTitle num={1} title="목적" />
      <Body>
        이 약관은 디어젤리(이하 "회사")가 운영하는 온잇(OwnIt) 서비스(이하 "서비스")의 이용에 관한 회사와 이용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
      </Body>

      <ArticleTitle num={2} title="정의" />
      <Body>이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</Body>
      <Ol items={[
        <>서비스: 회사가 제공하는 영어 표현 학습 및 복습 기능 일체를 말합니다.</>,
        <>이용자: 이 약관에 동의하고 서비스를 이용하는 자를 말합니다.</>,
        <>콘텐츠: 서비스 내에서 제공되는 영어 표현, 한글 설명, 예문 등 일체의 학습 자료를 말합니다.</>,
        <>학습 데이터: 이용자의 학습 진도, 복습 일정, 즐겨찾기 등 서비스 이용 중 생성되는 데이터를 말합니다.</>,
      ]} />

      <ArticleTitle num={3} title="약관의 효력 및 변경" />
      <Ol items={[
        <>이 약관은 서비스 화면에 게시하거나 이용자에게 공지함으로써 효력이 발생합니다.</>,
        <>회사는 관련 법령을 위반하지 않는 범위 내에서 이 약관을 개정할 수 있습니다.</>,
        <>약관이 변경될 경우 시행일 7일 전에 공지합니다. 변경된 약관의 시행일 이후에도 서비스를 계속 이용하면 변경된 약관에 동의한 것으로 간주합니다.</>,
      ]} />

      <ArticleTitle num={4} title="서비스 내용" />
      <Body>회사는 다음과 같은 서비스를 제공합니다.</Body>
      <Ul items={[
        <>영어 표현 카드 학습 (한글 상황 설명 → 영어 표현 확인)</>,
        <>SRS(간격 반복 시스템) 기반 복습 스케줄링</>,
        <>TTS(문자-음성 변환)를 활용한 원어민 발음 청취</>,
        <>즐겨찾기 및 카테고리별 학습 설정</>,
        <>학습 진도 및 통계 제공</>,
        <>학습 카드 화면 내 배너 광고 노출 (토스 광고 네트워크 활용)</>,
      ]} />

      <ArticleTitle num={5} title="이용자 의무" />
      <Body>이용자는 다음 행위를 하여서는 안 됩니다.</Body>
      <Ul items={[
        <>서비스 내 콘텐츠를 무단으로 복제, 배포, 판매하는 행위</>,
        <>자동화 도구를 이용해 서비스를 비정상적으로 이용하는 행위</>,
        <>회사의 서비스 운영을 방해하는 행위</>,
        <>타인의 계정을 무단으로 이용하는 행위</>,
        <>기타 관련 법령을 위반하는 행위</>,
      ]} />

      <ArticleTitle num={6} title="서비스 변경 및 중단" />
      <Ol items={[
        <>회사는 서비스의 내용을 변경하거나 중단할 수 있으며, 이 경우 가능한 한 사전에 이용자에게 공지합니다.</>,
        <>무료 서비스의 일부 또는 전부가 정책 변경이나 서버 사정에 따라 종료될 수 있습니다.</>,
        <>회사는 서비스 변경·중단으로 인한 손해에 대해 별도의 보상을 하지 않습니다.</>,
      ]} />

      <ArticleTitle num={7} title="광고" />
      <Ol items={[
        <>회사는 무료 서비스 운영을 위해 서비스 내(학습 카드 화면 하단 등)에 광고를 게재할 수 있습니다.</>,
        <>서비스 내 광고는 토스 광고 네트워크(Toss Ads)를 통해 제공될 수 있으며, 광고의 내용·형태·노출 위치는 사전 통보 없이 변경될 수 있습니다.</>,
        <>이용자는 서비스 이용 시 광고가 표시될 수 있음에 동의합니다.</>,
        <>광고 내용의 정확성, 신뢰성 또는 적법성에 대해 회사는 책임을 지지 않습니다.</>,
        <>이용자와 광고주 간에 발생한 거래, 계약 또는 분쟁에 대해 회사는 어떠한 책임도 지지 않습니다.</>,
      ]} />

      <ArticleTitle num={8} title="지적재산권" />
      <Ol items={[
        <>서비스 내 콘텐츠(영어 표현, 설명, 디자인, 로고 등)에 대한 지적재산권은 회사에 귀속됩니다.</>,
        <>이용자는 회사의 사전 서면 동의 없이 콘텐츠를 상업적으로 이용할 수 없습니다.</>,
      ]} />

      <ArticleTitle num={9} title="개인정보 보호" />
      <Body>
        회사는 이용자의 개인정보를 안전하게 보호하기 위해 최선을 다합니다. 개인정보 수집 및 이용에 관한 상세한 내용은 "개인정보 처리방침"을 참조하세요.
      </Body>

      <ArticleTitle num={10} title="면책조항" />
      <Ol items={[
        <>회사는 천재지변, 전쟁, 통신 장애 등 불가항력으로 인한 서비스 제공 중단에 대해 책임을 지지 않습니다.</>,
        <>회사는 이용자의 귀책 사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</>,
        <>TTS 음성은 브라우저 내장 기능을 사용하며, 발음의 정확성을 보증하지 않습니다.</>,
        <>서비스 내 노출되는 광고 콘텐츠 및 광고주와의 거래에서 발생하는 손해에 대해 회사는 책임을 지지 않습니다.</>,
      ]} />

      <ArticleTitle num={11} title="분쟁해결" />
      <Ol items={[
        <>이 약관은 대한민국 법률에 따라 해석됩니다.</>,
        <>서비스 이용 관련 분쟁은 당사자 간 협의를 우선으로 하되, 협의가 이루어지지 않을 경우 관할 법원에 소송을 제기할 수 있습니다.</>,
      ]} />

      <ArticleTitle num={12} title="문의" />
      <Body>서비스 이용 관련 문의는 아래 이메일로 연락해 주세요.</Body>
      <Body>📧 dearjelly.official@gmail.com</Body>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <p style={{ fontSize: 13, color: "#8b95a1", marginBottom: 4 }}>시행일: 2025년 6월 20일</p>
      <p style={{ fontSize: 13, color: "#8b95a1", marginBottom: 24 }}>제공: 디어젤리 (dearjelly.official@gmail.com)</p>

      <Body>
        디어젤리(이하 "회사")는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 이 방침은 서비스 이용 과정에서 수집하는 개인정보의 항목, 수집 목적, 보유 기간 등을 안내합니다.
      </Body>

      <SectionHeader>1. 수집하는 개인정보 항목</SectionHeader>
      <Ul items={[
        <><strong>토스 로그인 이용 시:</strong> 토스 제공 식별키 (실명·전화번호 등은 수집하지 않음)</>,
        <><strong>이메일 주소 (선택):</strong> 토스 계정에서 자동으로 제공되거나 이용자가 직접 입력·수정할 수 있어요. 미입력 시 수집하지 않아요.</>,
        <><strong>서비스 이용 중 자동 생성:</strong> 학습 진도, 복습 일정, 즐겨찾기, 설정값(학습량·카테고리·학습 이유)</>,
        <><strong>기기 정보:</strong> 브라우저 종류, 알림 설정(로컬 저장)</>,
        <><strong>광고 관련 (Toss Ads SDK):</strong> 광고 노출·클릭 로그, 광고 식별자(GAID/IDFA). 광고 데이터는 토스(비바리퍼블리카)의 광고 정책에 따라 처리됩니다.</>,
      ]} />

      <SectionHeader>2. 개인정보 수집 및 이용 목적</SectionHeader>
      <Ul items={[
        <>서비스 제공 및 회원 식별</>,
        <>학습 진도 저장 및 SRS 복습 스케줄 관리</>,
        <>서비스 중대사항 변경 시 이용자 공지</>,
        <>서비스 개선을 위한 익명 통계 분석</>,
        <>관심 기반 광고 제공 및 광고 효과 측정 (Toss Ads)</>,
      ]} />

      <SectionHeader>3. 개인정보 보유 및 이용 기간</SectionHeader>
      <Body>
        수집한 개인정보는 회원 탈퇴 시 즉시 삭제합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
      </Body>

      <SectionHeader>4. 개인정보 제3자 제공</SectionHeader>
      <Body>
        회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 의거한 경우에는 예외로 합니다.
      </Body>
      <Body>
        토스 로그인을 사용하는 경우 토스(비바리퍼블리카)의 개인정보처리방침이 함께 적용될 수 있습니다.
      </Body>

      <SectionHeader>5. 개인정보 처리 위탁</SectionHeader>
      <Ul items={[
        <><strong>Supabase, Inc.</strong> — 데이터베이스 저장 및 인증 서비스 제공</>,
        <><strong>비바리퍼블리카 (토스)</strong> — 인앱 광고 네트워크 운영 (Toss Ads SDK). 광고 데이터 처리는 토스의 개인정보처리방침을 따릅니다.</>,
      ]} />

      <SectionHeader>6. 이용자의 권리</SectionHeader>
      <Body>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</Body>
      <Ul items={[
        <>개인정보 열람 요청</>,
        <>오류 정정 요청</>,
        <>삭제 요청 (회원 탈퇴 포함)</>,
        <>처리 정지 요청</>,
      ]} />
      <Body>권리 행사는 dearjelly.official@gmail.com으로 이메일을 보내주시면 됩니다.</Body>

      <SectionHeader>7. 개인정보 보호책임자</SectionHeader>
      <Body>이름: 디어젤리 운영팀</Body>
      <Body>이메일: dearjelly.official@gmail.com</Body>

      <SectionHeader>8. 개인정보 처리방침 변경</SectionHeader>
      <Body>
        이 방침은 법령 또는 서비스 정책 변경에 따라 수정될 수 있으며, 변경 시 서비스 내 공지를 통해 안내합니다.
      </Body>
    </>
  );
}
