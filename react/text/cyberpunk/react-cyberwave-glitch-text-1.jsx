function ChromaticGlitchText() {
  const [text, setText] = React.useState('Didko.dev');
  const [fontSize, setFontSize] = React.useState(64);
  const [primaryColor, setPrimaryColor] = React.useState('#ffffff');
  const [speed, setSpeed] = React.useState(1);

  React.useEffect(() => {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['text'] = setText;
    window.__paramSetters['fontSize'] = (v) => setFontSize(Number(v));
    window.__paramSetters['primaryColor'] = setPrimaryColor;
    window.__paramSetters['speed'] = (v) => setSpeed(Number(v));
  }, []);

  const [isGlitching, setIsGlitching] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [glitchFrame, setGlitchFrame] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      let frame = 0;
      const burst = setInterval(() => {
        frame++;
        setGlitchFrame(frame);
        if (frame >= 8) {
          clearInterval(burst);
          setIsGlitching(false);
          setGlitchFrame(0);
        }
      }, 60 / speed);
    }, 3000 / speed);
    return () => clearInterval(interval);
  }, [speed]);

  const getOffsets = () => {
    const base = isGlitching ? (glitchFrame % 2 === 0 ? 6 : -4) : 2;
    const hover = isHovered ? 2.5 : 1;
    const r = base * hover;
    const b = -base * hover;
    const ry = isGlitching ? (glitchFrame % 3 === 0 ? 3 : -1) * hover : 0;
    const by = isGlitching ? (glitchFrame % 3 === 1 ? -2 : 1) * hover : 0;
    return { r, b, ry, by };
  };

  const { r, b, ry, by } = getOffsets();

  const glitchSkew = isGlitching && glitchFrame % 2 === 0
    ? 'skewX(' + (-1.5 * speed) + 'deg)'
    : 'skewX(0deg)';

  const textShadow =
    r + 'px ' + ry + 'px 0 #ff0033, ' +
    b + 'px ' + by + 'px 0 #0033ff, ' +
    '0 0 ' + (isHovered ? '18px' : '8px') + ' ' + primaryColor;

  const subtitleOpacity = isGlitching ? 0.3 + (glitchFrame * 0.05) : 0.35;

  const rootStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    backgroundImage:
      'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.018) 3px, rgba(255,255,255,0.018) 4px)',
    cursor: 'default',
    userSelect: 'none',
  };

  const textStyle = {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: fontSize + 'px',
    fontWeight: 900,
    color: primaryColor,
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    textShadow: textShadow,
    transform: glitchSkew,
    transition: isGlitching ? 'none' : 'text-shadow 0.3s ease, transform 0.3s ease',
    lineHeight: 1.1,
    position: 'relative',
    display: 'inline-block',
    filter: isGlitching && glitchFrame % 3 === 0
      ? 'brightness(1.4) contrast(1.2)'
      : isHovered ? 'brightness(1.15)' : 'brightness(1)',
  };

  const subtitleStyle = {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: Math.max(12, fontSize * 0.18) + 'px',
    fontWeight: 400,
    color: primaryColor,
    letterSpacing: '0.45em',
    textTransform: 'uppercase',
    opacity: subtitleOpacity,
    marginTop: '14px',
    textShadow: (r * 0.5) + 'px 0 0 #ff0033, ' + (b * 0.5) + 'px 0 0 #0033ff',
    transition: 'opacity 0.2s',
  };

  return (
    <div className="component-root dark-component" style={rootStyle}>
      <span
        style={textStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {text}
      </span>
      <span style={subtitleStyle}>
        {'// cyber.interface.active'}
      </span>
    </div>
  );
}

export default ChromaticGlitchText;