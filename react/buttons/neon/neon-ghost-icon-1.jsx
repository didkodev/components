const NeonGhostLoadingButton = () => {
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, 16);
    return () => clearInterval(interval);
  }, []);

  const rotation = (tick * 4) % 360;

  return (
    <div className="component-root dark-component flex items-center justify-center min-h-screen">
      <button
        disabled
        style={{
          border: "1px solid #00D9FF",
          boxShadow: "0 0 6px 1px rgba(0,217,255,0.55), 0 0 14px 2px rgba(0,217,255,0.25), inset 0 0 8px 0px rgba(0,217,255,0.07)",
          background: "rgba(0,217,255,0.04)",
          color: "#00D9FF",
          outline: "none",
          cursor: "not-allowed",
          position: "relative",
          overflow: "hidden",
        }}
        className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded text-xs font-medium tracking-widest uppercase select-none transition-all duration-300"
      >
        <span
          style={{
            display: "inline-block",
            transform: "rotate(" + rotation + "deg)",
            width: "14px",
            height: "14px",
            flexShrink: 0,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: "drop-shadow(0 0 3px rgba(0,217,255,0.9)) drop-shadow(0 0 6px rgba(0,217,255,0.5))",
            }}
          >
            <circle
              cx="7"
              cy="7"
              r="5.5"
              stroke="#00D9FF"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeDasharray="8 26"
              fill="none"
              opacity="1"
            />
            <circle
              cx="7"
              cy="7"
              r="5.5"
              stroke="#00D9FF"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeDasharray="3 31"
              strokeDashoffset="15"
              fill="none"
              opacity="0.4"
            />
          </svg>
        </span>
        <span
          style={{
            color: "#00D9FF",
            textShadow: "0 0 6px rgba(0,217,255,0.9), 0 0 12px rgba(0,217,255,0.4)",
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            letterSpacing: "0.12em",
            fontSize: "10px",
          }}
        >
          Loading
        </span>
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(0,217,255,0.04) 50%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
      </button>
    </div>
  );
};

export default NeonGhostLoadingButton;