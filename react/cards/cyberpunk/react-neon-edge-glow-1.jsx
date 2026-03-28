function GlowBorderCard() {
  const [hovered, setHovered] = React.useState(false);
  const [primaryColor, setPrimaryColor] = React.useState('#00ffff');
  const [accentColor, setAccentColor] = React.useState('#ff00ff');
  const [cardBg, setCardBg] = React.useState('#1a1a1a');
  const [glowIntensity, setGlowIntensity] = React.useState(18);

  React.useEffect(() => {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['primaryColor'] = setPrimaryColor;
    window.__paramSetters['accentColor'] = setAccentColor;
    window.__paramSetters['cardBg'] = setCardBg;
    window.__paramSetters['glowIntensity'] = setGlowIntensity;
  }, []);

  React.useEffect(() => {
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--accent', accentColor);
  }, [primaryColor, accentColor]);

  const specs = [
    { label: 'PROCESSOR', value: 'IL-X9 Neural Core' },
    { label: 'MEMORY', value: '64 TB Quantum RAM' },
    { label: 'BANDWIDTH', value: '400 Gbps Uplink' },
    { label: 'LATENCY', value: '0.4ms Edge Response' },
  ];

  const glowHover = glowIntensity * 2;

  return (
    <div
      className="component-root dark-component"
      style={{
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        minHeight: '520px',
        fontFamily: "'Courier New', Courier, monospace",
      }}
    >
      <style>{
        '@keyframes pulseCyan { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }' +
        '@keyframes pulseMagenta { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }' +
        '@keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(400%); } }' +
        '@keyframes borderCycle { 0% { border-color: #00ffff; box-shadow: 0 0 8px #00ffff, 0 0 16px #00ffff44; } 50% { border-color: #ff00ff; box-shadow: 0 0 8px #ff00ff, 0 0 16px #ff00ff44; } 100% { border-color: #00ffff; box-shadow: 0 0 8px #00ffff, 0 0 16px #00ffff44; } }' +
        '@keyframes borderCycleHover { 0% { border-color: #00ffff; box-shadow: 0 0 16px #00ffff, 0 0 36px #00ffff66, 0 0 60px #00ffff22; } 50% { border-color: #ff00ff; box-shadow: 0 0 16px #ff00ff, 0 0 36px #ff00ff66, 0 0 60px #ff00ff22; } 100% { border-color: #00ffff; box-shadow: 0 0 16px #00ffff, 0 0 36px #00ffff66, 0 0 60px #00ffff22; } }' +
        '@keyframes glowPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }' +
        '@keyframes tagBlink { 0%, 90%, 100% { opacity: 1; } 95% { opacity: 0; } }' +
        '.card-glow { animation: borderCycle 3s ease-in-out infinite; }' +
        '.card-glow-hover { animation: borderCycleHover 2s ease-in-out infinite; }' +
        '.corner-tl { animation: pulseCyan 2s ease-in-out infinite; }' +
        '.corner-br { animation: pulseMagenta 2s ease-in-out infinite 0.5s; }' +
        '.corner-tr { animation: pulseMagenta 2s ease-in-out infinite 1s; }' +
        '.corner-bl { animation: pulseCyan 2s ease-in-out infinite 1.5s; }' +
        '.tag-blink { animation: tagBlink 4s ease-in-out infinite; }' +
        '.btn-cta:hover { background: #00ffff !important; color: #000 !important; box-shadow: 0 0 18px #00ffff, 0 0 36px #00ffff66 !important; }' +
        '.spec-row:hover .spec-val { color: #ff00ff !important; text-shadow: 0 0 8px #ff00ff88; }'
      }</style>

      <div
        className={hovered ? 'card-glow-hover' : 'card-glow'}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: cardBg,
          border: '2px solid #00ffff',
          borderRadius: '0px',
          width: '480px',
          maxWidth: '95vw',
          padding: '0',
          position: 'relative',
          transform: hovered ? 'scale(1.02)' : 'scale(1)',
          transition: 'transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1)',
          cursor: 'default',
          overflow: 'hidden',
        }}
      >
        {/* Scanline overlay */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          pointerEvents: 'none',
          zIndex: 10,
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            left: 0, right: 0,
            height: '60px',
            background: hovered
              ? 'linear-gradient(transparent, rgba(0,255,255,0.04), transparent)'
              : 'transparent',
            animation: hovered ? 'scanline 2.4s linear infinite' : 'none',
            top: '0',
          }} />
        </div>

        {/* Corner decorations TL */}
        <div className="corner-tl" style={{
          position: 'absolute', top: '-2px', left: '-2px',
          width: '20px', height: '20px',
          borderTop: '3px solid #00ffff',
          borderLeft: '3px solid #00ffff',
          zIndex: 5,
        }} />
        {/* Corner TR */}
        <div className="corner-tr" style={{
          position: 'absolute', top: '-2px', right: '-2px',
          width: '20px', height: '20px',
          borderTop: '3px solid #ff00ff',
          borderRight: '3px solid #ff00ff',
          zIndex: 5,
        }} />
        {/* Corner BL */}
        <div className="corner-bl" style={{
          position: 'absolute', bottom: '-2px', left: '-2px',
          width: '20px', height: '20px',
          borderBottom: '3px solid #ff00ff',
          borderLeft: '3px solid #ff00ff',
          zIndex: 5,
        }} />
        {/* Corner BR */}
        <div className="corner-br" style={{
          position: 'absolute', bottom: '-2px', right: '-2px',
          width: '20px', height: '20px',
          borderBottom: '3px solid #00ffff',
          borderRight: '3px solid #00ffff',
          zIndex: 5,
        }} />

        {/* Header stripe */}
        <div style={{
          background: 'linear-gradient(90deg, rgba(0,255,255,0.12) 0%, rgba(255,0,255,0.08) 100%)',
          borderBottom: '1px solid rgba(0,255,255,0.3)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            color: '#00ffff',
            fontSize: '10px',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            opacity: 0.8,
          }}>IMPERIAL LABS</span>
          <span className="tag-blink" style={{
            color: '#ff00ff',
            fontSize: '10px',
            letterSpacing: '2px',
          }}>● ACTIVE</span>
        </div>

        {/* Main content */}
        <div style={{ padding: '32px 28px 28px 28px' }}>

          {/* Product tag */}
          <div style={{
            display: 'inline-block',
            border: '1px solid rgba(255,0,255,0.5)',
            color: '#ff00ff',
            fontSize: '9px',
            letterSpacing: '3px',
            padding: '3px 10px',
            marginBottom: '14px',
            textTransform: 'uppercase',
          }}>SERIES X — ENTERPRISE</div>

          {/* Title */}
          <h2 style={{
            color: '#ffffff',
            fontSize: '28px',
            fontWeight: '700',
            letterSpacing: '1px',
            margin: '0 0 6px 0',
            lineHeight: '1.1',
            textShadow: hovered ? '0 0 20px rgba(0,255,255,0.4)' : 'none',
            transition: 'text-shadow 0.3s ease',
          }}>IL NEXUS PRO</h2>

          {/* Subtitle */}
          <p style={{
            color: 'rgba(0,255,255,0.7)',
            fontSize: '12px',
            letterSpacing: '2px',
            margin: '0 0 24px 0',
            textTransform: 'uppercase',
          }}>Quantum Edge Infrastructure Node</p>

          {/* Divider */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, #00ffff44, #ff00ff44, transparent)',
            marginBottom: '22px',
          }} />

          {/* Description */}
          <p style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: '13px',
            lineHeight: '1.7',
            margin: '0 0 24px 0',
          }}>
            Next-generation distributed compute node engineered for zero-latency
            neural inference at the network edge. Designed for mission-critical
            deployments in hostile environments.
          </p>

          {/* Specs */}
          <div style={{ marginBottom: '28px' }}>
            {specs.map(function(spec, i) {
              return (
                <div
                  key={i}
                  className="spec-row"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'default',
                  }}
                >
                  <span style={{
                    color: 'rgba(0,255,255,0.5)',
                    fontSize: '10px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                  }}>{spec.label}</span>
                  <span
                    className="spec-val"
                    style={{
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: '12px',
                      letterSpacing: '0.5px',
                      transition: 'color 0.2s, text-shadow 0.2s',
                    }}
                  >{spec.value}</span>
                </div>
              );
            })}
          </div>

          {/* CTA row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              className="btn-cta"
              style={{
                background: 'transparent',
                border: '2px solid #00ffff',
                color: '#00ffff',
                fontSize: '11px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                padding: '11px 28px',
                borderRadius: '0px',
                cursor: 'pointer',
                fontFamily: "'Courier New', Courier, monospace",
                transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                boxShadow: '0 0 8px rgba(0,255,255,0.3)',
              }}
            >VIEW DETAILS</button>
            <span style={{
              color: 'rgba(255,255,255,0.25)',
              fontSize: '11px',
              letterSpacing: '2px',
            }}>// IL-2024-X9</span>
          </div>

        </div>

        {/* Bottom edge accent line */}
        <div style={{
          height: '2px',
          background: hovered
            ? 'linear-gradient(90deg, #00ffff, #ff00ff, #00ffff)'
            : 'linear-gradient(90deg, rgba(0,255,255,0.4), rgba(255,0,255,0.2), transparent)',
          transition: 'background 0.4s ease',
        }} />
      </div>
    </div>
  );
}

export default GlowBorderCard;