function CyberpunkTextEntrance() {
  const [text, setText] = React.useState('Didko.dev');
  const [fontSize, setFontSize] = React.useState(72);
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

  const [displayChars, setDisplayChars] = React.useState([]);
  const [phase, setPhase] = React.useState('idle');
  const [scanLine, setScanLine] = React.useState(0);
  const [glitchActive, setGlitchActive] = React.useState(false);
  const [glitchOffset, setGlitchOffset] = React.useState({ x: 0, y: 0 });
  const [rgbShift, setRgbShift] = React.useState(0);
  const [flickerIndex, setFlickerIndex] = React.useState(-1);
  const [settled, setSettled] = React.useState(false);
  const [corruptChar, setCorruptChar] = React.useState({});
  const [scanLinePos, setScanLinePos] = React.useState(0);

  const GLITCH_CHARS = '!@#$%^&*<>?/\\|[]{}~`0123456789ABCDEF';

  const randomGlitch = () => {
    return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
  };

  React.useEffect(() => {
    setDisplayChars([]);
    setPhase('entering');
    setSettled(false);
    setCorruptChar({});
    setGlitchActive(false);
    setRgbShift(0);

    let charIndex = 0;
    const chars = text.split('');
    const baseInterval = 60 / speed;

    const revealInterval = setInterval(() => {
      if (charIndex < chars.length) {
        const idx = charIndex;
        setDisplayChars(prev => {
          const next = [...prev];
          next[idx] = { char: chars[idx], corrupted: true, glitch: randomGlitch() };
          return next;
        });

        setTimeout(() => {
          setDisplayChars(prev => {
            const next = [...prev];
            if (next[idx]) {
              next[idx] = { char: chars[idx], corrupted: false, glitch: '' };
            }
            return next;
          });
        }, 80 / speed);

        charIndex++;
      } else {
        clearInterval(revealInterval);
        setTimeout(() => {
          setPhase('settling');
          setRgbShift(6);
          setTimeout(() => setRgbShift(3), 80 / speed);
          setTimeout(() => setRgbShift(0), 160 / speed);
          setTimeout(() => {
            setSettled(true);
            setPhase('settled');
          }, 400 / speed);
        }, 200 / speed);
      }
    }, baseInterval);

    return () => clearInterval(revealInterval);
  }, [text, speed]);

  React.useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanLinePos(prev => (prev + 2 * speed) % 120);
    }, 16);
    return () => clearInterval(scanInterval);
  }, [speed]);

  React.useEffect(() => {
    if (phase === 'idle' || phase === 'entering') return;

    const glitchLoop = setInterval(() => {
      if (Math.random() < 0.18) {
        setGlitchActive(true);
        setGlitchOffset({
          x: (Math.random() - 0.5) * 8,
          y: (Math.random() - 0.5) * 3
        });
        setRgbShift(Math.floor(Math.random() * 5) + 2);

        const corruptCount = Math.floor(Math.random() * 3) + 1;
        const newCorrupt = {};
        for (let i = 0; i < corruptCount; i++) {
          const idx = Math.floor(Math.random() * text.length);
          newCorrupt[idx] = randomGlitch();
        }
        setCorruptChar(newCorrupt);

        setTimeout(() => {
          setGlitchActive(false);
          setGlitchOffset({ x: 0, y: 0 });
          setRgbShift(0);
          setCorruptChar({});
        }, 60 + Math.random() * 80);
      }
    }, 1200 / speed);

    return () => clearInterval(glitchLoop);
  }, [phase, text, speed]);

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

  const bgStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: '#0a0a0a',
    zIndex: 0,
  };

  const dotGridStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: 'radial-gradient(circle, rgba(0,255,65,0.04) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    zIndex: 1,
  };

  const scanLinesOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
    zIndex: 2,
    pointerEvents: 'none',
  };

  const movingScanStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(180deg, transparent ' + (scanLinePos - 2) + '%, rgba(0,255,65,0.06) ' + scanLinePos + '%, rgba(0,255,65,0.03) ' + (scanLinePos + 1) + '%, transparent ' + (scanLinePos + 3) + '%)',
    zIndex: 3,
    pointerEvents: 'none',
  };

  const textWrapperStyle = {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 60px',
  };

  const textLayerBaseStyle = {
    fontFamily: "'Space Mono', 'Courier New', 'Lucida Console', monospace",
    fontSize: fontSize + 'px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    lineHeight: 1.1,
    position: 'relative',
    display: 'block',
    userSelect: 'none',
  };

  const charStyle = (idx) => {
    const isCorrupted = displayChars[idx] && displayChars[idx].corrupted;
    const isGlitched = glitchActive && corruptChar[idx] !== undefined;
    const isVisible = displayChars[idx] !== undefined;

    let color = '#000000';
    if (isVisible) {
      if (isCorrupted || isGlitched) {
        color = primaryColor;
      } else {
        color = '#ffffff';
      }
    }

    return {
      display: 'inline-block',
      color: color,
      opacity: isVisible ? 1 : 0,
      transition: isCorrupted ? 'none' : 'color 0.05s',
      position: 'relative',
    };
  };

  const renderTextLayer = (offsetX, offsetY, layerColor, layerOpacity, zIdx) => {
    return React.createElement(
      'div',
      {
        style: {
          ...textLayerBaseStyle,
          color: layerColor,
          opacity: layerOpacity,
          position: 'absolute',
          top: 0,
          left: 0,
          transform: 'translate(' + offsetX + 'px, ' + offsetY + 'px)',
          zIndex: zIdx,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }
      },
      text.split('').map((char, idx) => {
        const isVisible = displayChars[idx] !== undefined;
        return React.createElement(
          'span',
          { key: idx, style: { opacity: isVisible ? 1 : 0 } },
          char === ' ' ? '\u00A0' : char
        );
      })
    );
  };

  const mainTextStyle = {
    ...textLayerBaseStyle,
    color: '#ffffff',
    position: 'relative',
    zIndex: 5,
    transform: glitchActive ? ('translate(' + glitchOffset.x + 'px, ' + glitchOffset.y + 'px)') : 'translate(0,0)',
    whiteSpace: 'nowrap',
  };

  const glitchBarCount = 3;
  const glitchBars = glitchActive
    ? Array.from({ length: glitchBarCount }, (_, i) => {
        const top = 10 + Math.random() * 80;
        const height = 2 + Math.random() * 6;
        const width = 20 + Math.random() * 60;
        const left = Math.random() * (100 - width);
        return { top, height, width, left };
      })
    : [];

  const decorLineStyle = {
    width: '100%',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, ' + primaryColor + ', transparent)',
    margin: '12px 0',
    opacity: settled ? 0.7 : 0.3,
    transition: 'opacity 0.3s',
  };

  const subTextStyle = {
    fontFamily: "'Space Mono', 'Courier New', monospace",
    fontSize: Math.max(12, fontSize * 0.2) + 'px',
    color: primaryColor,
    letterSpacing: '0.25em',
    opacity: settled ? 0.85 : 0,
    transition: 'opacity 0.4s ease',
    textTransform: 'uppercase',
    marginTop: '8px',
  };

  const cornerDecorStyle = (pos) => {
    const base = {
      position: 'absolute',
      width: '20px',
      height: '20px',
      opacity: settled ? 0.8 : 0.2,
      transition: 'opacity 0.4s',
    };
    const borderW = '2px solid ' + primaryColor;
    if (pos === 'tl') return { ...base, top: 8, left: 8, borderTop: borderW, borderLeft: borderW };
    if (pos === 'tr') return { ...base, top: 8, right: 8, borderTop: borderW, borderRight: borderW };
    if (pos === 'bl') return { ...base, bottom: 8, left: 8, borderBottom: borderW, borderLeft: borderW };
    if (pos === 'br') return { ...base, bottom: 8, right: 8, borderBottom: borderW, borderRight: borderW };
    return base;
  };

  const statusStyle = {
    fontFamily: "'Space Mono', 'Courier New', monospace",
    fontSize: '11px',
    color: primaryColor,
    opacity: 0.5,
    letterSpacing: '0.15em',
    marginBottom: '16px',
    textTransform: 'uppercase',
  };

  return React.createElement(
    'div',
    { className: 'component-root dark-component', style: containerStyle },
    React.createElement('div', { style: bgStyle }),
    React.createElement('div', { style: dotGridStyle }),
    React.createElement('div', { style: scanLinesOverlayStyle }),
    React.createElement('div', { style: movingScanStyle }),

    glitchActive && glitchBars.map((bar, i) =>
      React.createElement('div', {
        key: 'glitchbar-' + i,
        style: {
          position: 'absolute',
          top: bar.top + '%',
          left: bar.left + '%',
          width: bar.width + '%',
          height: bar.height + 'px',
          background: primaryColor,
          opacity: 0.12,
          zIndex: 8,
          pointerEvents: 'none',
        }
      })
    ),

    React.createElement(
      'div',
      { style: textWrapperStyle },
      React.createElement('div', { style: cornerDecorStyle('tl') }),
      React.createElement('div', { style: cornerDecorStyle('tr') }),
      React.createElement('div', { style: cornerDecorStyle('bl') }),
      React.createElement('div', { style: cornerDecorStyle('br') }),

      React.createElement(
        'div',
        {
          style: {
            fontFamily: "'Space Mono', 'Courier New', monospace",
            fontSize: '11px',
            color: primaryColor,
            opacity: phase === 'entering' ? 0.9 : 0.4,
            letterSpacing: '0.2em',
            marginBottom: '20px',
            textTransform: 'uppercase',
            transition: 'opacity 0.3s',
          }
        },
        phase === 'entering' ? '> LOADING...' : (phase === 'settling' ? '> DECRYPTING...' : '> SYS OK')
      ),

      React.createElement('div', { style: decorLineStyle }),

      React.createElement(
        'div',
        { style: { position: 'relative', display: 'inline-block' } },

        rgbShift > 0 && renderTextLayer(-rgbShift, 0, '#ff0040', 0.55, 3),
        rgbShift > 0 && renderTextLayer(rgbShift, 0, '#00ffff', 0.55, 4),

        React.createElement(
          'div',
          { style: mainTextStyle },
          text.split('').map((char, idx) => {
            const charData = displayChars[idx];
            const isVisible = charData !== undefined;
            const isCorrupted = charData && charData.corrupted;
            const isGlitched = glitchActive && corruptChar[idx] !== undefined;

            let displayChar = char === ' ' ? '\u00A0' : char;
            if (isGlitched) displayChar = corruptChar[idx];
            else if (isCorrupted) displayChar = charData.glitch || char;

            let charColor = '#ffffff';
            if (!isVisible) charColor = 'transparent';
            else if (isCorrupted || isGlitched) charColor = primaryColor;

            const borderColorVal = (isCorrupted || isGlitched) ? 'transparent' : 'transparent';

            return React.createElement(
              'span',
              {
                key: idx,
                style: {
                  display: 'inline-block',
                  color: charColor,
                  opacity: isVisible ? 1 : 0,
                  transition: 'none',
                  position: 'relative',
                  WebkitTextStroke: (isCorrupted || isGlitched) ? '0px' : ('1px ' + (settled ? borderColor : 'transparent')),
                }
              },
              displayChar
            );
          })
        )
      ),

      React.createElement('div', { style: decorLineStyle }),

      React.createElement(
        'div',
        { style: subTextStyle },
        '// CYBERPUNK INTERFACE v2.0'
      )
    )
  );
}

export default CyberpunkTextEntrance;