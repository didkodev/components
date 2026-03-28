function NeonLoopText() {
  const [text, setText] = React.useState('Didko.dev');
  const [fontSize, setFontSize] = React.useState(48);
  const [primaryColor, setPrimaryColor] = React.useState('#00F0FF');
  const [borderColor, setBorderColor] = React.useState('#FF10F0');
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
  const [phase, setPhase] = React.useState('typing');
  const [index, setIndex] = React.useState(0);
  const [cursorVisible, setCursorVisible] = React.useState(true);

  const displayedRef = React.useRef(displayed);
  const phaseRef = React.useRef(phase);
  const indexRef = React.useRef(index);
  const textRef = React.useRef(text);

  React.useEffect(() => { displayedRef.current = displayed; }, [displayed]);
  React.useEffect(() => { phaseRef.current = phase; }, [phase]);
  React.useEffect(() => { indexRef.current = index; }, [index]);
  React.useEffect(() => { textRef.current = text; }, [text]);

  React.useEffect(() => {
    setDisplayed('');
    setPhase('typing');
    setIndex(0);
  }, [text]);

  React.useEffect(() => {
    const baseTypingInterval = 80;
    const baseErasingInterval = 50;
    const basePauseInterval = 700;

    let timeout;

    function tick() {
      const currentPhase = phaseRef.current;
      const currentIndex = indexRef.current;
      const currentText = textRef.current;

      if (currentPhase === 'typing') {
        if (currentIndex < currentText.length) {
          const nextIndex = currentIndex + 1;
          setDisplayed(currentText.slice(0, nextIndex));
          setIndex(nextIndex);
          timeout = setTimeout(tick, baseTypingInterval / speed);
        } else {
          setPhase('pause');
          timeout = setTimeout(tick, basePauseInterval / speed);
        }
      } else if (currentPhase === 'pause') {
        setPhase('erasing');
        timeout = setTimeout(tick, 0);
      } else if (currentPhase === 'erasing') {
        const currentDisplayed = displayedRef.current;
        if (currentDisplayed.length > 0) {
          setDisplayed(currentDisplayed.slice(0, currentDisplayed.length - 1));
          timeout = setTimeout(tick, baseErasingInterval / speed);
        } else {
          setIndex(0);
          setPhase('typing');
          timeout = setTimeout(tick, baseTypingInterval / speed);
        }
      }
    }

    timeout = setTimeout(tick, baseTypingInterval / speed);
    return () => clearTimeout(timeout);
  }, [speed, text]);

  React.useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0,240,255';
    return parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16);
  };

  const primaryRgb = hexToRgb(primaryColor);
  const accentRgb = hexToRgb(borderColor);

  const glowShadow = (
    '0 0 2px rgba(' + primaryRgb + ',1),' +
    '0 0 4px rgba(' + primaryRgb + ',0.95),' +
    '0 0 6px rgba(' + primaryRgb + ',0.85),' +
    '0 0 10px rgba(' + primaryRgb + ',0.6),' +
    '0 0 2px rgba(' + accentRgb + ',0.4)'
  );

  const cursorGlow = (
    '0 0 2px rgba(' + accentRgb + ',1),' +
    '0 0 5px rgba(' + accentRgb + ',0.9),' +
    '0 0 8px rgba(' + accentRgb + ',0.6)'
  );

  const dotGridStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
    backgroundSize: '18px 18px',
    pointerEvents: 'none',
  };

  const containerStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  };

  const textWrapperStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
    padding: '4px 8px',
  };

  const textStyle = {
    fontFamily: '"IBM Plex Mono", "Courier New", monospace',
    fontSize: fontSize + 'px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: primaryColor,
    textShadow: glowShadow,
    margin: 0,
    padding: 0,
    lineHeight: 1.1,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    WebkitFontSmoothing: 'antialiased',
  };

  const cursorStyle = {
    display: 'inline-block',
    width: Math.max(2, fontSize * 0.06) + 'px',
    height: (fontSize * 0.85) + 'px',
    backgroundColor: cursorVisible ? borderColor : 'transparent',
    boxShadow: cursorVisible ? cursorGlow : 'none',
    marginLeft: '3px',
    verticalAlign: 'middle',
    position: 'relative',
    top: '-1px',
    flexShrink: 0,
  };

  const scanlineStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
    pointerEvents: 'none',
    zIndex: 2,
  };

  return (
    <div className="component-root dark-component" style={containerStyle}>
      <div style={dotGridStyle} />
      <div style={scanlineStyle} />
      <div style={textWrapperStyle}>
        <span style={textStyle}>{displayed}</span>
        <span style={cursorStyle} />
      </div>
    </div>
  );
}

export default NeonLoopText;