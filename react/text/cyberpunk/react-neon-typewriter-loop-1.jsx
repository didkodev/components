function CyberpunkTypewriter() {
  const [text, setText] = React.useState('Didko.dev');
  const [fontSize, setFontSize] = React.useState(48);
  const [primaryColor, setPrimaryColor] = React.useState('#00FF41');
  const [borderColor, setBorderColor] = React.useState('#00FF41');
  const [speed, setSpeed] = React.useState(1);

  React.useEffect(() => {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['text'] = setText;
    window.__paramSetters['fontSize'] = (v) => setFontSize(Number(v));
    window.__paramSetters['primaryColor'] = setPrimaryColor;
    window.__paramSetters['borderColor'] = setBorderColor;
    window.__paramSetters['speed'] = (v) => setSpeed(Number(v));
  }, []);

  const [displayed, setDisplayed] = React.useState('');
  const [charIndex, setCharIndex] = React.useState(0);
  const [phase, setPhase] = React.useState('typing');
  const [cursorVisible, setCursorVisible] = React.useState(true);
  const [scanOffset, setScanOffset] = React.useState(0);

  React.useEffect(() => {
    const blinkInterval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(blinkInterval);
  }, []);

  React.useEffect(() => {
    setScanOffset(0);
    const scanInterval = setInterval(() => {
      setScanOffset((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(scanInterval);
  }, []);

  React.useEffect(() => {
    setDisplayed('');
    setCharIndex(0);
    setPhase('typing');
  }, [text]);

  React.useEffect(() => {
    if (phase === 'typing') {
      if (charIndex < text.length) {
        const baseDelay = 80;
        const delay = Math.max(20, baseDelay / speed);
        const timeout = setTimeout(() => {
          setDisplayed(text.slice(0, charIndex + 1));
          setCharIndex((i) => i + 1);
        }, delay);
        return () => clearTimeout(timeout);
      } else {
        const pauseDelay = Math.max(400, 1800 / speed);
        const timeout = setTimeout(() => {
          setPhase('deleting');
        }, pauseDelay);
        return () => clearTimeout(timeout);
      }
    } else if (phase === 'deleting') {
      if (charIndex > 0) {
        const baseDelay = 40;
        const delay = Math.max(10, baseDelay / speed);
        const timeout = setTimeout(() => {
          setCharIndex((i) => i - 1);
          setDisplayed(text.slice(0, charIndex - 1));
        }, delay);
        return () => clearTimeout(timeout);
      } else {
        const pauseDelay = Math.max(200, 600 / speed);
        const timeout = setTimeout(() => {
          setPhase('typing');
          setCharIndex(0);
          setDisplayed('');
        }, pauseDelay);
        return () => clearTimeout(timeout);
      }
    }
  }, [phase, charIndex, text, speed]);

  const glowColor = primaryColor;

  const scanLineStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage:
      'repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)',
    pointerEvents: 'none',
    zIndex: 2,
  };

  const scannerLineStyle = {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: '2px',
    top: scanOffset + '%',
    background:
      'linear-gradient(to bottom, transparent, ' + primaryColor + '18, transparent)',
    opacity: 0.35,
    pointerEvents: 'none',
    zIndex: 3,
    transition: 'top 0.05s linear',
  };

  const dotGridStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage:
      'radial-gradient(circle, ' + primaryColor + '08 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    pointerEvents: 'none',
    zIndex: 1,
  };

  const textStyle = {
    fontFamily: "'IBM Plex Mono', 'Courier Prime', 'Courier New', monospace",
    fontSize: fontSize + 'px',
    color: primaryColor,
    textShadow:
      '0 0 6px ' + glowColor + ', 0 0 14px ' + glowColor + '88, 0 0 28px ' + glowColor + '44',
    letterSpacing: '0.08em',
    fontWeight: 400,
    lineHeight: 1.2,
    whiteSpace: 'pre',
    position: 'relative',
    zIndex: 4,
    userSelect: 'none',
  };

  const cursorStyle = {
    display: 'inline-block',
    width: Math.max(2, fontSize * 0.07) + 'px',
    height: fontSize * 0.85 + 'px',
    background: cursorVisible ? primaryColor : 'transparent',
    boxShadow: cursorVisible
      ? '0 0 6px ' + glowColor + ', 0 0 12px ' + glowColor + '88'
      : 'none',
    marginLeft: '3px',
    verticalAlign: 'middle',
    position: 'relative',
    top: '-0.05em',
    transition: 'background 0.05s',
  };

  const prefixStyle = {
    fontFamily: "'IBM Plex Mono', 'Courier Prime', 'Courier New', monospace",
    fontSize: (fontSize * 0.55) + 'px',
    color: primaryColor + 'aa',
    textShadow: '0 0 8px ' + glowColor + '66',
    letterSpacing: '0.12em',
    fontWeight: 400,
    position: 'relative',
    zIndex: 4,
    marginBottom: '6px',
    userSelect: 'none',
  };

  return (
    <div
      className="component-root dark-component"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div style={dotGridStyle} />
      <div style={scanLineStyle} />
      <div style={scannerLineStyle} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          position: 'relative',
          zIndex: 4,
        }}
      >
        <div style={prefixStyle}>{'> system.out ~'}</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={textStyle}>{displayed}</span>
          <span style={cursorStyle} />
        </div>
      </div>
    </div>
  );
}

export default CyberpunkTypewriter;