export default function PixelArtShader() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var containerRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var glRef = React.useRef(null);
  var programRef = React.useRef(null);
  var bufferRef = React.useRef(null);
  var uniformsRef = React.useRef({});
  var startTimeRef = React.useRef(0);
  var sizeRef = React.useRef({ width: 1, height: 1, dpr: 1 });

  var [params, setParams] = React.useState({
    pixelSize: 18,
    warp: 0.37,
    density: 6,
    colorA: '#3a1c71',
    colorB: '#d76d77',
    colorC: '#ffaf7b'
  });

  function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  function createProgram(gl, vertexSource, fragmentSource) {
    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
  }

  function hexToRgb(hex) {
    var clean = hex.replace('#', '');
    var bigint = parseInt(clean, 16);
    return [
      ((bigint >> 16) & 255) / 255,
      ((bigint >> 8) & 255) / 255,
      (bigint & 255) / 255
    ];
  }

  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) return;

    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) return;

    glRef.current = gl;

    var vertexSource = [
      'attribute vec2 a_position;',
      'void main() {',
      '  gl_Position = vec4(a_position, 0.0, 1.0);',
      '}'
    ].join('\n');

    var fragmentSource = [
      'precision mediump float;',
      'uniform vec2 u_resolution;',
      'uniform float u_time;',
      'uniform float u_pixelSize;',
      'uniform float u_warp;',
      'uniform float u_density;',
      'uniform vec3 u_colorA;',
      'uniform vec3 u_colorB;',
      'uniform vec3 u_colorC;',
      '',
      'float hash(vec2 p) {',
      '  p = fract(p * vec2(123.34, 456.21));',
      '  p += dot(p, p + 34.45);',
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
      '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
      '}',
      '',
      'float fbm(vec2 p) {',
      '  float v = 0.0;',
      '  float a = 0.5;',
      '  for (int i = 0; i < 4; i++) {',
      '    v += noise(p) * a;',
      '    p *= 2.0;',
      '    a *= 0.5;',
      '  }',
      '  return v;',
      '}',
      '',
      'void main() {',
      '  vec2 frag = gl_FragCoord.xy;',
      '  vec2 pixelCoord = floor(frag / u_pixelSize) * u_pixelSize;',
      '  vec2 uv = pixelCoord / u_resolution;',
      '  vec2 p = uv * 2.0 - 1.0;',
      '  p.x *= u_resolution.x / u_resolution.y;',
      '',
      '  float t = u_time * 0.18;',
      '  float ang = atan(p.y, p.x);',
      '  float rad = length(p);',
      '',
      '  float swirl = sin(ang * (3.0 + u_density) + t) * u_warp * 0.35;',
      '  vec2 q = p;',
      '  q += vec2(cos(ang * 2.0 + t), sin(ang * 3.0 - t)) * swirl;',
      '',
      '  float rings = sin(rad * (10.0 + u_density * 2.0) - t * 3.0);',
      '  float cells = fbm(q * (2.2 + u_density * 0.45) + vec2(t * 0.6, -t * 0.45));',
      '  float blocks = floor((cells + rings * 0.25) * 6.0) / 6.0;',
      '',
      '  float band = smoothstep(0.15, 0.85, uv.y + sin(uv.x * 4.0 + t) * 0.12);',
      '  vec3 grad = mix(u_colorA, u_colorB, band);',
      '  grad = mix(grad, u_colorC, smoothstep(0.35, 0.95, blocks));',
      '',
      '  float sparkle = step(0.92, hash(floor(pixelCoord / u_pixelSize) + floor(u_time * 3.0)));',
      '  vec3 color = grad * (0.55 + blocks * 0.9);',
      '  color += sparkle * u_colorC * 0.18;',
      '',
      '  float vignette = 1.0 - smoothstep(0.35, 1.25, rad);',
      '  color *= 0.45 + vignette * 0.75;',
      '',
      '  gl_FragColor = vec4(color, 1.0);',
      '}'
    ].join('\n');

    var program = createProgram(gl, vertexSource, fragmentSource);
    programRef.current = program;

    var buffer = gl.createBuffer();
    bufferRef.current = buffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
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
      pixelSize: gl.getUniformLocation(program, 'u_pixelSize'),
      warp: gl.getUniformLocation(program, 'u_warp'),
      density: gl.getUniformLocation(program, 'u_density'),
      colorA: gl.getUniformLocation(program, 'u_colorA'),
      colorB: gl.getUniformLocation(program, 'u_colorB'),
      colorC: gl.getUniformLocation(program, 'u_colorC')
    };
  }

  function draw(now) {
    var gl = glRef.current;
    var program = programRef.current;
    if (!gl || !program) return;

    var width = sizeRef.current.width * sizeRef.current.dpr;
    var height = sizeRef.current.height * sizeRef.current.dpr;
    gl.viewport(0, 0, width, height);
    gl.useProgram(program);

    var colorA = hexToRgb(params.colorA);
    var colorB = hexToRgb(params.colorB);
    var colorC = hexToRgb(params.colorC);

    gl.uniform2f(uniformsRef.current.resolution, width, height);
    gl.uniform1f(uniformsRef.current.time, now);
    gl.uniform1f(uniformsRef.current.pixelSize, params.pixelSize * sizeRef.current.dpr);
    gl.uniform1f(uniformsRef.current.warp, params.warp);
    gl.uniform1f(uniformsRef.current.density, params.density);
    gl.uniform3f(uniformsRef.current.colorA, colorA[0], colorA[1], colorA[2]);
    gl.uniform3f(uniformsRef.current.colorB, colorB[0], colorB[1], colorB[2]);
    gl.uniform3f(uniformsRef.current.colorC, colorC[0], colorC[1], colorC[2]);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function animate(time) {
    if (!startTimeRef.current) startTimeRef.current = time;
    var elapsed = ((time - startTimeRef.current) / 1000) * SPEED;
    draw(elapsed);
    frameRef.current = requestAnimationFrame(animate);
  }

  function registerParams() {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters.pixelSize = function(value) {
      setParams(function(prev) {
        return Object.assign({}, prev, { pixelSize: value });
      });
    };
    window.__paramSetters.warp = function(value) {
      setParams(function(prev) {
        return Object.assign({}, prev, { warp: value });
      });
    };
    window.__paramSetters.density = function(value) {
      setParams(function(prev) {
        return Object.assign({}, prev, { density: value });
      });
    };
    window.__paramSetters.colorA = function(value) {
      setParams(function(prev) {
        return Object.assign({}, prev, { colorA: value });
      });
    };
    window.__paramSetters.colorB = function(value) {
      setParams(function(prev) {
        return Object.assign({}, prev, { colorB: value });
      });
    };
    window.__paramSetters.colorC = function(value) {
      setParams(function(prev) {
        return Object.assign({}, prev, { colorC: value });
      });
    };
  }

  React.useEffect(function() {
    registerParams();
  }, []);

  React.useEffect(function() {
    setupRenderer();

    var container = containerRef.current;
    var canvas = canvasRef.current;
    if (!container || !canvas) return;

    function handleResize() {
      var rect = container.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = {
        width: Math.max(1, Math.floor(rect.width)),
        height: Math.max(1, Math.floor(rect.height)),
        dpr: dpr
      };
      canvas.width = sizeRef.current.width * dpr;
      canvas.height = sizeRef.current.height * dpr;
      canvas.style.width = sizeRef.current.width + 'px';
      canvas.style.height = sizeRef.current.height + 'px';
    }

    handleResize();

    var observer = new ResizeObserver(function() {
      handleResize();
    });
    observer.observe(container);
    resizeObserverRef.current = observer;

    frameRef.current = requestAnimationFrame(animate);

    return function() {
      cancelAnimationFrame(frameRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    };
  }, []);

  return React.createElement(
    'div',
    {
      ref: containerRef,
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
        display: 'block',
        width: '100%',
        height: '100%'
      }
    })
  );
}