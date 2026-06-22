interface AlertModalProps {
  message: string;
  onConfirm: () => void;
}

export function AlertModal({ message, onConfirm }: AlertModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--c-overlay)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          background: "var(--c-bg-card)",
          borderRadius: 20,
          padding: "28px 24px 20px",
          width: "calc(100% - 64px)",
          maxWidth: 320,
          boxShadow: "0 8px 32px var(--c-shadow)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <p
          style={{
            fontSize: 15,
            color: "var(--c-text-primary)",
            lineHeight: 1.65,
            textAlign: "center",
            margin: 0,
          }}
        >
          {message}
        </p>
        <button
          onClick={onConfirm}
          style={{
            width: "100%",
            padding: "14px 0",
            background: "var(--c-blue)",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
}
