function HoverHeadline() {
  const [text, setText] = React.useState('Didko.dev');
  const [fontSize, setFontSize] = React.useState(64);
  const [primaryColor, setPrimaryColor] = React.useState('#1a1a1a');
  const [borderColor, setBorderColor] = React.useState('#444444');
  const [speed, setSpeed] = React.useState(1);

  const [hovered, setHovered] = React.useState(false);
  const [clicked, setClicked] = React.useState(false);
  const [chars, setChars] = React.useState([]);

  React.useEffect(() => {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['text'] = setText;
    window.__paramSetters['fontSize'] = function(v) { setFontSize(Number(v)); };
    window.__paramSetters['primaryColor'] = setPrimaryColor;
    window.__paramSetters['borderColor'] = setBorderColor;
    window.__paramSetters['speed'] = function(v) { setSpeed(Number(v)); };
  }, []);

  React.useEffect(function() {
    var arr = text.split('').map(function(ch, i) {
      return { char: ch, index: i, hovered: false };
    });
    setChars(arr);
  }, [text]);

  var transitionDuration = (0.3 / speed) + 's';

  function handleCharEnter(index) {
    setChars(function(prev) {
      return prev.map(function(c) {
        return c.index === index ? Object.assign({}, c, { hovered: true }) : c;
      });
    });
  }

  function handleCharLeave(index) {
    setChars(function(prev) {
      return prev.map(function(c) {
        return c.index === index ? Object.assign({}, c, { hovered: false }) : c;
      });
    });
  }

  function handleMouseEnter() {
    setHovered(true);
  }

  function handleMouseLeave() {
    setHovered(false);
    setChars(function(prev) {
      return prev.map(function(c) {
        return Object.assign({}, c, { hovered: false });
      });
    });
  }

  function handleMouseDown() {
    setClicked(true);
  }

  function handleMouseUp() {
    setClicked(false);
  }

  var rootStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    flexDirection: 'column',
    gap: '24px',
    padding: '48px',
    boxSizing: 'border-box',
    cursor: 'pointer',
    userSelect: 'none',
  };

  var subtitleStyle = {
    fontSize: Math.max(14, fontSize * 0.22) + 'px',
    color: '#888888',
    letterSpacing: hovered ? '0.35em' : '0.25em',
    textTransform: 'uppercase',
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    fontWeight: '400',
    transition: 'letter-spacing ' + transitionDuration + ' ease, opacity ' + transitionDuration + ' ease',
    opacity: hovered ? 0.9 : 0.55,
    margin: 0,
  };

  var headlineWrapperStyle = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '0px',
    letterSpacing: hovered ? '0.08em' : '0.01em',
    transition: 'letter-spacing ' + transitionDuration + ' ease',
  };

  var underlineContainerStyle = {
    position: 'relative',
    overflow: 'hidden',
    marginTop: '4px',
  };

  var underlineBaseStyle = {
    height: '1px',
    background: primaryColor,
    opacity: 0.15,
    width: '100%',
  };

  var underlineFillStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '1px',
    background: primaryColor,
    opacity: hovered ? 0.7 : 0,
    width: hovered ? '100%' : '0%',
    transition: 'width ' + (0.5 / speed) + 's ease, opacity ' + transitionDuration + ' ease',
  };

  function getCharStyle(c) {
    var isHov = c.hovered;
    return {
      display: 'inline-block',
      fontSize: fontSize + 'px',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      fontWeight: '700',
      color: isHov ? '#555555' : primaryColor,
      transition: 'color ' + transitionDuration + ' ease, transform ' + transitionDuration + ' ease',
      transform: isHov ? 'translateY(-2px) scaleX(1.03)' : (clicked ? 'scaleX(0.98)' : 'translateY(0px) scaleX(1)'),
      transformOrigin: 'center bottom',
      lineHeight: '1.1',
      whiteSpace: c.char === ' ' ? 'pre' : 'normal',
      minWidth: c.char === ' ' ? (fontSize * 0.28) + 'px' : 'auto',
    };
  }

  var dotGridStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    opacity: 0.035,
    backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    zIndex: 0,
  };

  var contentStyle = {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  };

  return React.createElement(
    'div',
    {
      className: 'component-root dark-component',
      style: rootStyle,
    },
    React.createElement('div', { style: dotGridStyle }),
    React.createElement(
      'div',
      { style: contentStyle },
      React.createElement(
        'p',
        { style: subtitleStyle },
        'Interactive Headline'
      ),
      React.createElement(
        'div',
        {
          style: headlineWrapperStyle,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
          onMouseDown: handleMouseDown,
          onMouseUp: handleMouseUp,
        },
        chars.map(function(c) {
          return React.createElement(
            'span',
            {
              key: c.index,
              style: getCharStyle(c),
              onMouseEnter: function() { handleCharEnter(c.index); },
              onMouseLeave: function() { handleCharLeave(c.index); },
            },
            c.char
          );
        })
      ),
      React.createElement(
        'div',
        { style: underlineContainerStyle },
        React.createElement('div', { style: underlineBaseStyle }),
        React.createElement('div', { style: underlineFillStyle })
      )
    )
  );
}

export default HoverHeadline;