function GlitchDecryptText() {
  const [text, setText] = React.useState('Didko.dev');
  const [fontSize, setFontSize] = React.useState(72);
  const [primaryColor, setPrimaryColor] = React.useState('#ff6b00');
  const [speed, setSpeed] = React.useState(1);

  React.useEffect(() => {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['text'] = setText;
    window.__paramSetters['fontSize'] = (v) => setFontSize(Number(v));
    window.__paramSetters['primaryColor'] = setPrimaryColor;
    window.__paramSetters['speed'] = (v) => setSpeed(Number(v));
  }, []);

  const [displayText, setDisplayText] = React.useState(text);
  const [isHovered, setIsHovered] = React.useState(false);
  const [glitchOffset, setGlitchOffset] = React.useState(0);
  const intervalRef = React.useRef(null);
  const frameRef = React.useRef(0);

  const glitchChars = 'X#@!%&*$?0123456789ABCDEF/\\|<>';

  const randomChar = () => glitchChars[Math.floor(Math.random() * glitchChars.length)];

  const runGlitch = React.useCallback(() => {
    const upper = text.toUpperCase();
    const baseInterval = isHovered ? 60 : 120;
    const adjustedInterval = baseInterval / speed;
    const burstLength = isHovered ? 6 : 4;

    let burst = 0;
    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      burst++;
      if (burst < burstLength) {
        const glitched = upper.split('').map((ch) => {
          if (ch === ' ') return ' ';
          return Math.random() < (isHovered ? 0.7 : 0.5) ? randomChar() : ch;
        }).join('');
        setDisplayText(glitched);
        setGlitchOffset(isHovered ? (Math.random() - 0.5) * 8 : (Math.random() - 0.5) * 4);
      } else {
        setDisplayText(upper);
        setGlitchOffset(0);
        clearInterval(intervalRef.current);
        const pause = (isHovered ? 400 : 800) / speed;
        intervalRef.current = setTimeout(() => {
          frameRef.current++;
          runGlitch();
        }, pause);
      }
    }, adjustedInterval);
  }, [text, isHovered, speed]);

  React.useEffect(() => {
    runGlitch();
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(intervalRef.current);
    };
  }, [runGlitch]);

  React.useEffect(() => {
    setDisplayText(text.toUpperCase());
  }, [text]);

  const innerGlow = primaryColor;
  const midGlow = '#cc3300';
  const outerGlow = '#5a0000';

  const shadowNormal =
    '0 0 4px ' + innerGlow + ', ' +
    '0 0 12px ' + innerGlow + ', ' +
    '0 0 28px ' + midGlow + ', ' +
    '0 0 60px ' + outerGlow;

  const shadowHover =
    '0 0 2px #ffffff, ' +
    '0 0 6px ' + innerGlow + ', ' +
    '0 0 16px ' + innerGlow + ', ' +
    '0 0 36px ' + midGlow + ', ' +
    '0 0 80px ' + outerGlow + ', ' +
    '0 0 120px ' + outerGlow;

  const rootStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    backgroundImage:
      'radial-gradient(circle, #ff6b0008 1px, transparent 1px)',
    backgroundSize: '28px 28px',
    cursor: 'default',
  };

  const textStyle = {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: fontSize + 'px',
    fontWeight: '900',
    letterSpacing: '0.12em',
    color: primaryColor,
    textShadow: isHovered ? shadowHover : shadowNormal,
    transform: 'translateX(' + glitchOffset + 'px)',
    transition: isHovered
      ? 'textShadow 0.05s ease, transform 0.03s ease'
      : 'textShadow 0.2s ease, transform 0.08s ease',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    position: 'relative',
    filter: isHovered
      ? 'brightness(1.3) contrast(1.1)'
      : 'brightness(1)',
  };

  return (
    <div
      className="component-root dark-component"
      style={rootStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={textStyle}>{displayText}</span>
    </div>
  );
}

export default GlitchDecryptText;