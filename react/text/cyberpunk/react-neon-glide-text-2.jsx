const GlitchSliceText = () => {
  const [text, setText] = React.useState('Didko.dev');
  const [fontSize, setFontSize] = React.useState(32);
  const [primaryColor, setPrimaryColor] = React.useState('#FFFFFF');
  const [speed, setSpeed] = React.useState(1);

  const [phase, setPhase] = React.useState('idle');
  const [flickerOpacity, setFlickerOpacity] = React.useState(1);

  React.useEffect(() => {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['text'] = setText;
    window.__paramSetters['fontSize'] = (v) => setFontSize(Number(v));
    window.__paramSetters['primaryColor'] = setPrimaryColor;
    window.__paramSetters['speed'] = (v) => setSpeed(Number(v));
  }, []);

  React.useEffect(() => {
    let glitchTimer = null;
    let flickerTimer = null;
    let mounted = true;

    const scheduleGlitch = () => {
      const baseDelay = 2200 + Math.random() * 600;
      const delay = baseDelay / speed;
      glitchTimer = setTimeout(() => {
        if (!mounted) return;
        setPhase('glitch');
        setTimeout(() => {
          if (!mounted) return;
          setPhase('idle');
          scheduleGlitch();
        }, 150);
      }, delay);
    };

    const scheduleFlicker = () => {
      const delay = (800 + Math.random() * 1400) / speed;
      flickerTimer = setTimeout(() => {
        if (!mounted) return;
        setFlickerOpacity(0.92);
        setTimeout(() => {
          if (!mounted) return;
          setFlickerOpacity(1);
          scheduleFlicker();
        }, 40);
      }, delay);
    };

    scheduleGlitch();
    scheduleFlicker();

    return () => {
      mounted = false;
      clearTimeout(glitchTimer);
      clearTimeout(flickerTimer);
    };
  }, [speed]);

  const isGlitch = phase === 'glitch';

  const containerStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
  };

  const textStyle = {
    fontSize: fontSize + 'px',
    fontWeight: 800,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    lineHeight: 1,
    letterSpacing: '0.05em',
    color: primaryColor,
    opacity: isGlitch ? 1 : flickerOpacity,
    position: 'relative',
    userSelect: 'none',
  };

  const wrapperStyle = {
    position: 'relative',
    display: 'inline-block',
    lineHeight: 1,
  };

  const sliceHeight = 33.33;

  const sliceBase = {
    position: 'absolute',
    left: 0,
    width: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
  };

  const topSliceStyle = Object.assign({}, sliceBase, {
    top: 0,
    height: sliceHeight + '%',
    transform: isGlitch ? 'translateX(-10px)' : 'translateX(0)',
  });

  const midSliceStyle = Object.assign({}, sliceBase, {
    top: sliceHeight + '%',
    height: sliceHeight + '%',
    transform: isGlitch ? 'translateX(14px)' : 'translateX(0)',
  });

  const botSliceStyle = Object.assign({}, sliceBase, {
    top: (sliceHeight * 2) + '%',
    height: sliceHeight + '%',
    transform: isGlitch ? 'translateX(-6px)' : 'translateX(0)',
  });

  const ghostLayerStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  };

  const cyanGhostText = {
    fontSize: fontSize + 'px',
    fontWeight: 800,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    lineHeight: 1,
    letterSpacing: '0.05em',
    color: '#00FFFF',
    opacity: isGlitch ? 0.7 : 0,
    position: 'absolute',
    top: 0,
    left: '-2px',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.01s',
  };

  const magentaGhostText = {
    fontSize: fontSize + 'px',
    fontWeight: 800,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    lineHeight: 1,
    letterSpacing: '0.05em',
    color: '#FF00FF',
    opacity: isGlitch ? 0.7 : 0,
    position: 'absolute',
    top: 0,
    left: '2px',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.01s',
  };

  const mainTextInner = {
    fontSize: fontSize + 'px',
    fontWeight: 800,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    lineHeight: 1,
    letterSpacing: '0.05em',
    color: primaryColor,
    whiteSpace: 'nowrap',
    display: 'block',
  };

  const clipTop = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    clipPath: 'inset(0 0 ' + (100 - sliceHeight) + '% 0)',
  };

  const clipMid = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    clipPath: 'inset(' + sliceHeight + '% 0 ' + sliceHeight + '% 0)',
  };

  const clipBot = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    clipPath: 'inset(' + (sliceHeight * 2) + '% 0 0 0)',
  };

  const slicedTextBase = {
    fontSize: fontSize + 'px',
    fontWeight: 800,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    lineHeight: 1,
    letterSpacing: '0.05em',
    color: primaryColor,
    whiteSpace: 'nowrap',
    display: 'block',
    userSelect: 'none',
  };

  return React.createElement('div', { className: 'component-root dark-component', style: containerStyle },
    React.createElement('div', { style: { position: 'relative', display: 'inline-block', opacity: isGlitch ? 1 : flickerOpacity } },
      React.createElement('span', { style: Object.assign({}, slicedTextBase, { visibility: isGlitch ? 'hidden' : 'visible' }) }, text),
      isGlitch && React.createElement('div', { style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' } },
        React.createElement('div', { style: { position: 'absolute', top: 0, left: '-2px', clipPath: 'inset(0 0 ' + (100 - sliceHeight) + '% 0)' } },
          React.createElement('span', { style: Object.assign({}, slicedTextBase, { color: '#00FFFF', opacity: 0.7 }) }, text)
        ),
        React.createElement('div', { style: { position: 'absolute', top: 0, left: '2px', clipPath: 'inset(0 0 ' + (100 - sliceHeight) + '% 0)' } },
          React.createElement('span', { style: Object.assign({}, slicedTextBase, { color: '#FF00FF', opacity: 0.7 }) }, text)
        ),
        React.createElement('div', { style: { position: 'absolute', top: 0, left: '-10px', clipPath: 'inset(0 0 ' + (100 - sliceHeight) + '% 0)' } },
          React.createElement('span', { style: slicedTextBase }, text)
        ),
        React.createElement('div', { style: { position: 'absolute', top: 0, left: '-2px', clipPath: 'inset(' + sliceHeight + '% 0 ' + sliceHeight + '% 0)' } },
          React.createElement('span', { style: Object.assign({}, slicedTextBase, { color: '#00FFFF', opacity: 0.7 }) }, text)
        ),
        React.createElement('div', { style: { position: 'absolute', top: 0, left: '2px', clipPath: 'inset(' + sliceHeight + '% 0 ' + sliceHeight + '% 0)' } },
          React.createElement('span', { style: Object.assign({}, slicedTextBase, { color: '#FF00FF', opacity: 0.7 }) }, text)
        ),
        React.createElement('div', { style: { position: 'absolute', top: 0, left: '14px', clipPath: 'inset(' + sliceHeight + '% 0 ' + sliceHeight + '% 0)' } },
          React.createElement('span', { style: slicedTextBase }, text)
        ),
        React.createElement('div', { style: { position: 'absolute', top: 0, left: '-2px', clipPath: 'inset(' + (sliceHeight * 2) + '% 0 0 0)' } },
          React.createElement('span', { style: Object.assign({}, slicedTextBase, { color: '#00FFFF', opacity: 0.7 }) }, text)
        ),
        React.createElement('div', { style: { position: 'absolute', top: 0, left: '2px', clipPath: 'inset(' + (sliceHeight * 2) + '% 0 0 0)' } },
          React.createElement('span', { style: Object.assign({}, slicedTextBase, { color: '#FF00FF', opacity: 0.7 }) }, text)
        ),
        React.createElement('div', { style: { position: 'absolute', top: 0, left: '-6px', clipPath: 'inset(' + (sliceHeight * 2) + '% 0 0 0)' } },
          React.createElement('span', { style: slicedTextBase }, text)
        )
      )
    )
  );
};

export default GlitchSliceText;