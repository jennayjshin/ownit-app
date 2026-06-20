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
        background: "rgba(25, 31, 40, 0.5)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: "28px 24px 20px",
          width: "calc(100% - 64px)",
          maxWidth: 320,
          boxShadow: "0 8px 32px rgba(25, 31, 40, 0.16)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <p
          style={{
            fontSize: 15,
            color: "#191f28",
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
            background: "#3182f6",
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
