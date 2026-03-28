function CyberpunkLoopText() {
  const [text, setText] = React.useState('Didko.dev');
  const [fontSize, setFontSize] = React.useState(48);
  const [primaryColor, setPrimaryColor] = React.useState('#00FFFF');
  const [borderColor, setBorderColor] = React.useState('#FF00FF');
  const [speed, setSpeed] = React.useState(1);

  React.useEffect(() => {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['text'] = setText;
    window.__paramSetters['fontSize'] = (v) => setFontSize(Number(v));
    window.__paramSetters['primaryColor'] = setPrimaryColor;
    window.__paramSetters['borderColor'] = setBorderColor;
    window.__paramSetters['speed'] = (v) => setSpeed(Number(v));
  }, []);

  const [hovered, setHovered] = React.useState(false);
  const [tick, setTick] = React.useState(0);
  const animRef = React.useRef(null);
  const lastTimeRef = React.useRef(null);
  const posRef = React.useRef(0);
  const containerRef = React.useRef(null);
  const textRef = React.useRef(null);

  const separator = '  //  ';
  const segments = [
    'ERROR_CODE_404',
    'SYSTEM_ONLINE',
    'ACCESS_DENIED',
    'INIT_SEQUENCE',
    'NEURAL_LINK_ACTIVE',
    'FIREWALL_BREACH',
    'DATA_STREAM_LIVE',
    text.toUpperCase(),
  ];
  const marqueeText = segments.join(separator) + separator;

  React.useEffect(() => {
    const loop = (timestamp) => {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      const pxPerMs = (speed * 80) / 1000;
      posRef.current += pxPerMs * delta;

      if (textRef.current) {
        const fullWidth = textRef.current.scrollWidth / 2;
        if (posRef.current >= fullWidth) {
          posRef.current -= fullWidth;
        }
      }

      setTick((t) => t + 1);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      lastTimeRef.current = null;
    };
  }, [speed]);

  const glowColor = hovered ? borderColor : primaryColor;
  const textColor = hovered ? borderColor : primaryColor;
  const glowIntensity = hovered ? '0 0 8px ' + glowColor + ', 0 0 20px ' + glowColor + ', 0 0 40px ' + glowColor + ', 0 0 80px ' + glowColor : '0 0 6px ' + glowColor + ', 0 0 14px ' + glowColor + ', 0 0 28px ' + glowColor;

  const scanlineOpacity = hovered ? 0.08 : 0.04;

  const dotPatternStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage:
      'radial-gradient(circle, rgba(0,255,255,0.03) 1px, transparent 1px)',
    backgroundSize: '18px 18px',
    pointerEvents: 'none',
    zIndex: 0,
  };

  const scanlineStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage:
      'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,' + scanlineOpacity + ') 2px, rgba(0,0,0,' + scanlineOpacity + ') 4px)',
    pointerEvents: 'none',
    zIndex: 2,
    transition: 'opacity 0.2s',
  };

  const cornerStyle = (pos) => {
    const base = {
      position: 'absolute',
      width: '14px',
      height: '14px',
      zIndex: 3,
    };
    const borderTop = '2px solid ' + glowColor;
    const borderLeft = '2px solid ' + glowColor;
    const borderRight = '2px solid ' + glowColor;
    const borderBottom = '2px solid ' + glowColor;
    if (pos === 'tl') return Object.assign({}, base, { top: 0, left: 0, borderTop, borderLeft });
    if (pos === 'tr') return Object.assign({}, base, { top: 0, right: 0, borderTop, borderRight });
    if (pos === 'bl') return Object.assign({}, base, { bottom: 0, left: 0, borderBottom, borderLeft });
    if (pos === 'br') return Object.assign({}, base, { bottom: 0, right: 0, borderBottom, borderRight });
    return base;
  };

  const labelStyle = {
    position: 'absolute',
    top: '-22px',
    left: '0',
    fontSize: '10px',
    letterSpacing: '3px',
    color: glowColor,
    fontFamily: "'Courier New', Courier, monospace",
    opacity: 0.7,
    textShadow: '0 0 6px ' + glowColor,
    zIndex: 4,
    transition: 'color 0.2s, text-shadow 0.2s',
    userSelect: 'none',
  };

  const bottomLabelStyle = {
    position: 'absolute',
    bottom: '-22px',
    right: '0',
    fontSize: '10px',
    letterSpacing: '3px',
    color: borderColor,
    fontFamily: "'Courier New', Courier, monospace",
    opacity: 0.6,
    textShadow: '0 0 6px ' + borderColor,
    zIndex: 4,
    userSelect: 'none',
  };

  const wrapperStyle = {
    position: 'relative',
    overflow: 'hidden',
    width: '700px',
    maxWidth: '92vw',
    padding: '18px 0',
    background: '#0A0E27',
    border: '1px solid ' + (hovered ? glowColor : 'rgba(0,255,255,0.18)'),
    boxShadow: hovered
      ? ('0 0 0 1px ' + glowColor + ', 0 0 24px ' + glowColor + ', inset 0 0 30px rgba(0,0,0,0.6)')
      : ('0 0 10px rgba(0,255,255,0.08), inset 0 0 20px rgba(0,0,0,0.5)'),
    cursor: 'default',
    transition: 'border 0.2s, box-shadow 0.2s',
  };

  const trackStyle = {
    display: 'flex',
    flexDirection: 'row',
    whiteSpace: 'nowrap',
    transform: 'translateX(-' + posRef.current + 'px)',
    willChange: 'transform',
    zIndex: 1,
    position: 'relative',
  };

  const charStyle = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: fontSize + 'px',
    fontWeight: '700',
    letterSpacing: '0.12em',
    color: textColor,
    textShadow: glowIntensity,
    imageRendering: 'pixelated',
    WebkitFontSmoothing: 'none',
    MozOsxFontSmoothing: 'unset',
    transition: 'color 0.2s, text-shadow 0.2s',
    userSelect: 'none',
    lineHeight: 1,
  };

  const separatorStyle = Object.assign({}, charStyle, {
    color: borderColor,
    textShadow: '0 0 6px ' + borderColor + ', 0 0 14px ' + borderColor,
    opacity: 0.8,
  });

  const renderMarqueeContent = () => {
    const parts = [];
    const doubledSegments = [...segments, ...segments];
    doubledSegments.forEach((seg, si) => {
      seg.split('').forEach((ch, ci) => {
        parts.push(
          React.createElement('span', { key: 'seg-' + si + '-ch-' + ci, style: charStyle }, ch)
        );
      });
      parts.push(
        React.createElement('span', { key: 'sep-' + si, style: separatorStyle }, separator)
      );
    });
    return parts;
  };

  return React.createElement(
    'div',
    {
      className: 'component-root dark-component',
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      },
    },
    React.createElement('div', { style: dotPatternStyle }),
    React.createElement(
      'div',
      {
        ref: containerRef,
        style: { position: 'relative' },
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      },
      React.createElement('div', { style: labelStyle }, 'SYS_STREAM_v2.4'),
      React.createElement('div', { style: bottomLabelStyle }, '[LOOP_ACTIVE]'),
      React.createElement(
        'div',
        { style: wrapperStyle },
        React.createElement('div', { style: dotPatternStyle }),
        React.createElement('div', { style: scanlineStyle }),
        React.createElement('div', { style: cornerStyle('tl') }),
        React.createElement('div', { style: cornerStyle('tr') }),
        React.createElement('div', { style: cornerStyle('bl') }),
        React.createElement('div', { style: cornerStyle('br') }),
        React.createElement(
          'div',
          {
            ref: textRef,
            style: trackStyle,
          },
          ...renderMarqueeContent()
        )
      )
    )
  );
}

export default CyberpunkLoopText;