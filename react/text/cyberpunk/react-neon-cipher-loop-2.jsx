function CyberpunkLoopText() {
  const [text, setText] = React.useState('Didko.dev');
  const [fontSize, setFontSize] = React.useState(72);
  const [primaryColor, setPrimaryColor] = React.useState('#00ffff');
  const [borderColor, setBorderColor] = React.useState('#ff00ff');
  const [speed, setSpeed] = React.useState(1);

  React.useEffect(() => {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['text'] = setText;
    window.__paramSetters['fontSize'] = (v) => setFontSize(Number(v));
    window.__paramSetters['primaryColor'] = setPrimaryColor;
    window.__paramSetters['borderColor'] = setBorderColor;
    window.__paramSetters['speed'] = (v) => setSpeed(Number(v));
  }, []);

  const phrases = React.useMemo(() => {
    const base = text || 'Didko.dev';
    return [
      base.toUpperCase(),
      'SYSTEM.ONLINE',
      'GRID.ACTIVE',
      'NEURAL.LINK',
      base.toUpperCase(),
      'EXECUTE.NOW',
      'DATA.STREAM',
      'CYBER.CORE',
    ];
  }, [text]);

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [displayChars, setDisplayChars] = React.useState([]);
  const [phase, setPhase] = React.useState('reveal');
  const [tick, setTick] = React.useState(0);
  const [cursorVisible, setCursorVisible] = React.useState(true);
  const [flickerStates, setFlickerStates] = React.useState({});

  const glitchChars = '!@#$%^&*<>[]{}|\\/?~ABCDEFabcdef0123456789';

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 500 / speed);
    return () => clearInterval(interval);
  }, [speed]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setFlickerStates((prev) => {
        const next = { ...prev };
        const phrase = phrases[currentIndex];
        for (let i = 0; i < phrase.length; i++) {
          next[i] = Math.random() < 0.08;
        }
        return next;
      });
    }, 80 / speed);
    return () => clearInterval(interval);
  }, [speed, currentIndex, phrases]);

  React.useEffect(() => {
    const phrase = phrases[currentIndex];
    let charIndex = 0;
    let holdTimer = null;
    let eraseTimer = null;
    let eraseIndex = phrase.length;

    if (phase === 'reveal') {
      setDisplayChars([]);
      const revealTimer = setInterval(() => {
        charIndex++;
        setDisplayChars(phrase.slice(0, charIndex).split(''));
        setTick((t) => t + 1);
        if (charIndex >= phrase.length) {
          clearInterval(revealTimer);
          holdTimer = setTimeout(() => {
            setPhase('erase');
          }, 1800 / speed);
        }
      }, 60 / speed);
      return () => {
        clearInterval(revealTimer);
        clearTimeout(holdTimer);
      };
    }

    if (phase === 'erase') {
      eraseIndex = phrase.length;
      eraseTimer = setInterval(() => {
        eraseIndex--;
        setDisplayChars(phrase.slice(0, eraseIndex).split(''));
        setTick((t) => t + 1);
        if (eraseIndex <= 0) {
          clearInterval(eraseTimer);
          setCurrentIndex((i) => (i + 1) % phrases.length);
          setPhase('reveal');
        }
      }, 40 / speed);
      return () => clearInterval(eraseTimer);
    }
  }, [phase, currentIndex, phrases, speed]);

  const getCharColor = (index, total) => {
    const ratio = total <= 1 ? 0 : index / (total - 1);
    if (ratio < 0.5) {
      const t = ratio * 2;
      const r1 = parseInt(primaryColor.slice(1, 3), 16);
      const g1 = parseInt(primaryColor.slice(3, 5), 16);
      const b1 = parseInt(primaryColor.slice(5, 7), 16);
      const r2 = parseInt(borderColor.slice(1, 3), 16);
      const g2 = parseInt(borderColor.slice(3, 5), 16);
      const b2 = parseInt(borderColor.slice(5, 7), 16);
      const r = Math.round(r1 + (r2 - r1) * t);
      const g = Math.round(g1 + (g2 - g1) * t);
      const b = Math.round(b1 + (b2 - b1) * t);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    } else {
      const t = (ratio - 0.5) * 2;
      const r1 = parseInt(borderColor.slice(1, 3), 16);
      const g1 = parseInt(borderColor.slice(3, 5), 16);
      const b1 = parseInt(borderColor.slice(5, 7), 16);
      const r2 = 0xcc;
      const g2 = 0xff;
      const b2 = 0x00;
      const r = Math.round(r1 + (r2 - r1) * t);
      const g = Math.round(g1 + (g2 - g1) * t);
      const b = Math.round(b1 + (b2 - b1) * t);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    }
  };

  const scanlineStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    backgroundImage:
      'repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 3px)',
    zIndex: 2,
  };

  const cornerSize = Math.round(fontSize * 0.4);

  const cornerBase = {
    position: 'absolute',
    width: cornerSize + 'px',
    height: cornerSize + 'px',
    pointerEvents: 'none',
  };

  const cornerBorderStyle = '1.5px solid ' + primaryColor;

  const dotGridStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage:
      'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    pointerEvents: 'none',
    zIndex: 0,
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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={dotGridStyle} />
      <div style={scanlineStyle} />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: Math.round(fontSize * 0.5) + 'px ' + Math.round(fontSize * 0.9) + 'px',
          zIndex: 3,
        }}
      >
        <div
          style={{
            ...cornerBase,
            top: 0,
            left: 0,
            borderTop: cornerBorderStyle,
            borderLeft: cornerBorderStyle,
          }}
        />
        <div
          style={{
            ...cornerBase,
            top: 0,
            right: 0,
            borderTop: cornerBorderStyle,
            borderRight: cornerBorderStyle,
          }}
        />
        <div
          style={{
            ...cornerBase,
            bottom: 0,
            left: 0,
            borderBottom: cornerBorderStyle,
            borderLeft: cornerBorderStyle,
          }}
        />
        <div
          style={{
            ...cornerBase,
            bottom: 0,
            right: 0,
            borderBottom: cornerBorderStyle,
            borderRight: cornerBorderStyle,
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            minHeight: Math.round(fontSize * 1.3) + 'px',
            minWidth: '200px',
            justifyContent: 'center',
          }}
        >
          {displayChars.map((char, i) => {
            const isFlickering = flickerStates[i];
            const displayChar = isFlickering
              ? glitchChars[Math.floor(Math.random() * glitchChars.length)]
              : char;
            const color = getCharColor(i, displayChars.length);
            return (
              <span
                key={i + '-' + tick}
                style={{
                  display: 'inline-block',
                  fontFamily: '"Share Tech Mono", "Courier New", monospace',
                  fontSize: fontSize + 'px',
                  fontWeight: 900,
                  letterSpacing: Math.round(fontSize * 0.08) + 'px',
                  color: isFlickering ? borderColor : color,
                  textShadow: isFlickering
                    ? '0 0 8px ' + borderColor + ', 0 0 2px #fff'
                    : '0 0 6px ' + color + ', 0 0 1px #fff',
                  opacity: isFlickering ? 0.5 + Math.random() * 0.5 : 1,
                  lineHeight: 1.1,
                  whiteSpace: 'pre',
                  transition: 'none',
                  userSelect: 'none',
                }}
              >
                {displayChar === ' ' ? '\u00A0' : displayChar}
              </span>
            );
          })}
          <span
            style={{
              display: 'inline-block',
              width: Math.round(fontSize * 0.55) + 'px',
              height: Math.round(fontSize * 0.85) + 'px',
              background: cursorVisible ? primaryColor : 'transparent',
              marginLeft: '4px',
              verticalAlign: 'middle',
              boxShadow: cursorVisible ? '0 0 8px ' + primaryColor : 'none',
              transition: 'none',
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '18px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '6px',
          zIndex: 3,
        }}
      >
        {phrases.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === currentIndex ? '18px' : '6px',
              height: '3px',
              background: i === currentIndex ? primaryColor : 'rgba(255,255,255,0.15)',
              boxShadow: i === currentIndex ? '0 0 6px ' + primaryColor : 'none',
              transition: 'width 0.2s, background 0.2s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default CyberpunkLoopText;