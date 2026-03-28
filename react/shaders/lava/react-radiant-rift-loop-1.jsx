export default function LavaShader() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var programRef = React.useRef(null);
  var glRef = React.useRef(null);
  var resizeObserverRef = React.useRef(null);
  var startTimeRef = React.useRef(0);
  var uniformsRef = React.useRef({});

  var [params, setParams] = React.useState({
    colorA: '#ff4d00',
    colorB: '#ff9a00',
    colorC: '#7a1400',
    flowSpeed: 1.75,
    turbulence: 1.0,
    pulse: true
  });

  // Register parameter setters for external controls
  function registerParams() {
    window.__paramSetters = {
      colorA: function (value) {
        setParams(function (prev) {
          return Object.assign({}, prev, { colorA: value });
        });
      },
      colorB: function (value) {
        setParams(function (prev) {
          return Object.assign({}, prev, { colorB: value });
        });
      },
      colorC: function (value) {
        setParams(function (prev) {
          return Object.assign({}, prev, { colorC: value });
        });
      },
      flowSpeed: function (value) {
        setParams(function (prev) {
          return Object.assign({}, prev, { flowSpeed: value });
        });
      },
      turbulence: function (value) {
        setParams(function (prev) {
          return Object.assign({}, prev, { turbulence: value });
        });
      },
      pulse: function (value) {
        setParams(function (prev) {
          return Object.assign({}, prev, { pulse: value });
        });
      }
    };
  }

  // Convert hex color to normalized rgb
  function hexToRgb(hex) {
    var clean = hex.replace('#', '');
    var bigint = parseInt(clean, 16);
    return [
      ((bigint >> 16) & 255) / 255,
      ((bigint >> 8) & 255) / 255,
      (bigint & 255) / 255
    ];
  }

  // Compile shader helper
  function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  // Link program helper
  function createProgram(gl, vertexSource, fragmentSource) {
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return null;

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  // Setup WebGL renderer and resources
  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) return;

    var gl = canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) return;

    glRef.current = gl;

    var vertexSource = [
      'attribute vec2 a_position;',
      'varying vec2 v_uv;',
      'void main() {',
      '  v_uv = a_position * 0.5 + 0.5;',
      '  gl_Position = vec4(a_position, 0.0, 1.0);',
      '}'
    ].join('\n');

    var fragmentSource = [
      'precision highp float;',
      'varying vec2 v_uv;',
      'uniform vec2 u_resolution;',
      'uniform float u_time;',
      'uniform vec3 u_colorA;',
      'uniform vec3 u_colorB;',
      'uniform vec3 u_colorC;',
      'uniform float u_speed;',
      'uniform float u_turbulence;',
      'uniform float u_pulse;',
      '',
      'float hash(vec2 p) {',
      '  p = fract(p * vec2(123.34, 456.21));',
      '  p += dot(p, p + 45.32);',
      '  return fract(p.x * p.y);',
      '}',
      '',
      'float noise(vec2 p) {',
      '  vec2 i = floor(p);',
      '  vec2 f = fract(p);',
      '  float a = hash(i);',
      '  float b = hash(i + vec2(1.0, 0.0));',
      '  float c = hash(i + vec2(0.0, 1.0));',
      '  float d = hash(i + vec2(1.0, 1.0));',
      '  vec2 u = f * f * (3.0 - 2.0 * f);',
      '  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;',
      '}',
      '',
      'float fbm(vec2 p) {',
      '  float value = 0.0;',
      '  float amp = 0.5;',
      '  for (int i = 0; i < 6; i++) {',
      '    value += amp * noise(p);',
      '    p *= 2.0;',
      '    amp *= 0.5;',
      '  }',
      '  return value;',
      '}',
      '',
      'void main() {',
      '  vec2 uv = v_uv;',
      '  vec2 p = (uv - 0.5) * 2.0;',
      '  p.x *= u_resolution.x / u_resolution.y;',
      '',
      '  float t = u_time * (0.22 + u_speed * 0.35);',
      '  float pulseWave = u_pulse > 0.5 ? (0.5 + 0.5 * sin(u_time * 1.6)) : 0.5;',
      '',
      '  vec2 flow = p;',
      '  flow.y += t * 1.25;',
      '  flow.x += sin(flow.y * 2.4 + t * 0.9) * 0.25;',
      '',
      '  float n1 = fbm(flow * (2.4 + u_turbulence * 1.8));',
      '  float n2 = fbm((flow + vec2(n1 * 0.8, -t * 0.4)) * (3.4 + u_turbulence * 2.2));',
      '  float n3 = fbm((flow + vec2(-n2 * 0.5, n1 * 0.4)) * 5.5);',
      '',
      '  float lava = n1 * 0.5 + n2 * 0.35 + n3 * 0.15;',
      '  lava += pulseWave * 0.18;',
      '',
      '  float veins = smoothstep(0.48, 0.88, lava + sin((p.y + n2) * 8.0 - t * 3.0) * 0.08);',
      '  float glow = smoothstep(0.55, 1.0, lava) * (1.1 + pulseWave * 0.5);',
      '  float crust = smoothstep(0.15, 0.6, lava);',
      '',
      '  vec3 col = mix(u_colorC, u_colorA, crust);',
      '  col = mix(col, u_colorB, veins);',
      '  col += u_colorB * glow * 0.35;',
      '',
      '  float vignette = 1.0 - dot(uv - 0.5, uv - 0.5) * 1.4;',
      '  col *= max(vignette, 0.2);',
      '',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    var program = createProgram(gl, vertexSource, fragmentSource);
    if (!program) return;

    programRef.current = program;

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1
      ]),
      gl.STATIC_DRAW
    );

    gl.useProgram(program);

    var positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      colorA: gl.getUniformLocation(program, 'u_colorA'),
      colorB: gl.getUniformLocation(program, 'u_colorB'),
      colorC: gl.getUniformLocation(program, 'u_colorC'),
      speed: gl.getUniformLocation(program, 'u_speed'),
      turbulence: gl.getUniformLocation(program, 'u_turbulence'),
      pulse: gl.getUniformLocation(program, 'u_pulse')
    };
  }

  // Resize canvas using ResizeObserver for responsive rendering
  function setupResizeObserver() {
    var canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      var gl = glRef.current;
      if (!gl) return;

      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.max(1, Math.floor(rect.width * dpr));
      var height = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    resize();

    var observer = new ResizeObserver(function () {
      resize();
    });
    observer.observe(canvas);
    resizeObserverRef.current = observer;
  }

  // Draw a single frame
  function draw(timeMs) {
    var gl = glRef.current;
    var program = programRef.current;
    if (!gl || !program) return;

    var t = (timeMs - startTimeRef.current) * 0.001;
    var rgbA = hexToRgb(params.colorA);
    var rgbB = hexToRgb(params.colorB);
    var rgbC = hexToRgb(params.colorC);

    gl.useProgram(program);
    gl.clearColor(0.03, 0.02, 0.02, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform2f(uniformsRef.current.resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(uniformsRef.current.time, t * SPEED);
    gl.uniform3f(uniformsRef.current.colorA, rgbA[0], rgbA[1], rgbA[2]);
    gl.uniform3f(uniformsRef.current.colorB, rgbB[0], rgbB[1], rgbB[2]);
    gl.uniform3f(uniformsRef.current.colorC, rgbC[0], rgbC[1], rgbC[2]);
    gl.uniform1f(uniformsRef.current.speed, params.flowSpeed);
    gl.uniform1f(uniformsRef.current.turbulence, params.turbulence);
    gl.uniform1f(uniformsRef.current.pulse, params.pulse ? 1.0 : 0.0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Animate continuously with requestAnimationFrame
  function animate(timeMs) {
    if (!startTimeRef.current) {
      startTimeRef.current = timeMs;
    }
    draw(timeMs);
    frameRef.current = window.requestAnimationFrame(animate);
  }

  // Initialize renderer and animation once
  React.useEffect(function () {
    registerParams();
    setupRenderer();
    setupResizeObserver();
    frameRef.current = window.requestAnimationFrame(animate);

    return function () {
      window.cancelAnimationFrame(frameRef.current);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (glRef.current && programRef.current) {
        glRef.current.deleteProgram(programRef.current);
      }
    };
  }, []);

  return React.createElement(
    'div',
    {
      className: 'dark-component',
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#0d0d0d',
        overflow: 'hidden'
      }
    },
    React.createElement('canvas', {
      ref: canvasRef,
      style: {
        width: '100%',
        height: '100%',
        display: 'block'
      }
    })
  );
}