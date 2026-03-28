function CyberpunkGlitchText() {
  var GLITCH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&!?<>';

  var [text, setText] = React.useState('Didko.dev');
  var [fontSize, setFontSize] = React.useState(48);
  var [primaryColor, setPrimaryColor] = React.useState('#00ffff');
  var [speed, setSpeed] = React.useState(1);
  var [displayed, setDisplayed] = React.useState('Didko.dev');
  var [glitching, setGlitching] = React.useState(false);

  React.useEffect(function () {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['text'] = setText;
    window.__paramSetters['fontSize'] = function (v) { setFontSize(Number(v)); };
    window.__paramSetters['primaryColor'] = setPrimaryColor;
    window.__paramSetters['speed'] = function (v) { setSpeed(Number(v)); };
  }, []);

  React.useEffect(function () {
    setDisplayed(text);
  }, [text]);

  React.useEffect(function () {
    var triggerInterval = null;
    var frameId = null;
    var startTime = null;
    var glitchDuration = 600 / speed;

    function randomChar() {
      return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    }

    function runGlitch() {
      setGlitching(true);
      startTime = performance.now();

      function frame(now) {
        var elapsed = now - startTime;
        var progress = elapsed / glitchDuration;

        if (progress < 1) {
          var scrambled = text.split('').map(function (ch, i) {
            if (ch === ' ') return ' ';
            var resolveAt = i / text.length;
            if (progress > resolveAt + 0.3) return ch;
            return randomChar();
          }).join('');
          setDisplayed(scrambled);
          frameId = requestAnimationFrame(frame);
        } else {
          setDisplayed(text);
          setGlitching(false);
        }
      }

      frameId = requestAnimationFrame(frame);
    }

    var delay = Math.max(800, 2000 / speed);
    triggerInterval = setInterval(runGlitch, delay);

    return function () {
      clearInterval(triggerInterval);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [text, speed]);

  var glow = '0 0 4px ' + primaryColor + ', 0 0 16px ' + primaryColor + ', 0 0 48px ' + primaryColor;

  var rootStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
    backgroundSize: '28px 28px',
  };

  var textStyle = {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: fontSize + 'px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: primaryColor,
    textShadow: glow,
    letterSpacing: '0.12em',
    userSelect: 'none',
    transition: glitching ? 'none' : 'color 0.3s',
    whiteSpace: 'nowrap',
  };

  return (
    React.createElement('div', { className: 'component-root dark-component', style: rootStyle },
      React.createElement('span', { style: textStyle }, displayed)
    )
  );
}

export default CyberpunkGlitchText;