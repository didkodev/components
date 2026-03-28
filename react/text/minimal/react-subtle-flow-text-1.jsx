function TextEntrance() {
  const [text, setText] = React.useState('Didko.dev');
  const [fontSize, setFontSize] = React.useState(48);
  const [primaryColor, setPrimaryColor] = React.useState('#f0f0f0');
  const [borderColor, setBorderColor] = React.useState('#444444');
  const [speed, setSpeed] = React.useState(1);

  React.useEffect(() => {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['text'] = setText;
    window.__paramSetters['fontSize'] = (v) => setFontSize(Number(v));
    window.__paramSetters['primaryColor'] = setPrimaryColor;
    window.__paramSetters['borderColor'] = setBorderColor;
    window.__paramSetters['speed'] = (v) => setSpeed(Number(v));
  }, []);

  const [chars, setChars] = React.useState([]);
  const [isHovered, setIsHovered] = React.useState(false);
  const [cycleKey, setCycleKey] = React.useState(0);
  const animRef = React.useRef(null);
  const cycleRef = React.useRef(null);

  const charDelay = React.useMemo(() => {
    return Math.max(0.05, 0.12 / speed);
  }, [speed]);

  const fadeDuration = React.useMemo(() => {
    return Math.max(0.3, 0.7 / speed);
  }, [speed]);

  const holdDuration = React.useMemo(() => {
    return Math.max(800, 2200 / speed);
  }, [speed]);

  const exitDuration = React.useMemo(() => {
    return Math.max(0.3, 0.6 / speed);
  }, [speed]);

  React.useEffect(() => {
    const letters = text.split('');
    setChars(letters.map((char, i) => ({ char, index: i, visible: false })));
  }, [text, cycleKey]);

  React.useEffect(() => {
    if (chars.length === 0) return;

    const timers = [];

    chars.forEach((_, i) => {
      const t = setTimeout(() => {
        setChars(prev => prev.map((c, ci) => ci === i ? { ...c, visible: true } : c));
      }, i * charDelay * 1000);
      timers.push(t);
    });

    const totalIn = chars.length * charDelay * 1000 + fadeDuration * 1000;

    cycleRef.current = setTimeout(() => {
      setCycleKey(k => k + 1);
    }, totalIn + holdDuration + exitDuration * 1000);

    return () => {
      timers.forEach(t => clearTimeout(t));
      if (cycleRef.current) clearTimeout(cycleRef.current);
    };
  }, [chars.length > 0 ? cycleKey : null, charDelay, fadeDuration, holdDuration, exitDuration]);

  const letterSpacing = React.useMemo(() => {
    const base = fontSize * 0.08;
    return base + 'px';
  }, [fontSize]);

  const containerStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    position: 'relative',
    cursor: 'default',
  };

  const textWrapStyle = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0px',
    padding: '0',
    userSelect: 'none',
  };

  return (
    <div className="component-root dark-component" style={containerStyle}>
      <style>{'\
        @import url(\'https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400&display=swap\');\
        .text-entrance-char {\
          display: inline-block;\
          transition: opacity var(--fade-dur) cubic-bezier(0.4, 0, 0.2, 1),\
                      transform var(--fade-dur) cubic-bezier(0.4, 0, 0.2, 1),\
                      color 0.3s ease;\
        }\
        .text-entrance-char.visible {\
          opacity: 1 !important;\
          transform: translateY(0px) !important;\
        }\
        .text-entrance-wrap:hover .text-entrance-char {\
          color: var(--hover-color) !important;\
        }\
      '}</style>

      <div
        className="text-entrance-wrap"
        style={{
          ...textWrapStyle,
          '--fade-dur': fadeDuration + 's',
          '--hover-color': primaryColor,
        }}
      >
        {chars.map((c, i) => (
          <span
            key={i + '-' + cycleKey}
            className={'text-entrance-char' + (c.visible ? ' visible' : '')}
            style={{
              fontFamily: '\'Inter\', \'Helvetica Neue\', Arial, sans-serif',
              fontWeight: '300',
              fontSize: fontSize + 'px',
              letterSpacing: letterSpacing,
              color: c.char === ' ' ? 'transparent' : primaryColor,
              opacity: 0,
              transform: 'translateY(' + (fontSize * 0.15) + 'px)',
              whiteSpace: c.char === ' ' ? 'pre' : 'normal',
              lineHeight: 1.15,
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              minWidth: c.char === ' ' ? (fontSize * 0.28) + 'px' : 'auto',
              display: 'inline-block',
            }}
          >
            {c.char === ' ' ? '\u00a0' : c.char}
          </span>
        ))}
      </div>
    </div>
  );
}

export default TextEntrance;