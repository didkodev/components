export default function PixelArtShader970248() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var wrapRef = React.useRef(null);
  var glRef = React.useRef(null);
  var programRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var uniformsRef = React.useRef({});
  var paramsRef = React.useRef({
    pixelSize: 24,
    warp: 0.48,
    flow: 0.22,
    contrast: 1.1,
    colorA: '#2b7cff',
    colorB: '#7a2cff'
  });

  React.useEffect(function () {
    setupRenderer();
    registerParams();
    startResizeObserver();
    animate();

    return function () {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      var gl = glRef.current;
      if (gl) {
        var program = programRef.current;
        if (program) {
          gl.deleteProgram(program);
        }
      }
    };
  }, []);

  function registerParams() {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters.pixelSize = function (value) {
      paramsRef.current.pixelSize = value;
    };
    window.__paramSetters.warp = function (value) {
      paramsRef.current.warp = value;
    };
    window.__paramSetters.flow = function (value) {
      paramsRef.current.flow = value;
    };
    window.__paramSetters.contrast = function (value) {
      paramsRef.current.contrast = value;
    };
    window.__paramSetters.colorA = function (value) {
      paramsRef.current.colorA = value;
    };
    window.__paramSetters.colorB = function (value) {
      paramsRef.current.colorB = value;
    };
  }

  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    var gl =
      canvas.getContext('webgl', { antialias: false, alpha: false }) ||
      canvas.getContext('experimental-webgl', { antialias: false, alpha: false });

    if (!gl) {
      return;
    }

    glRef.current = gl;

    var vertexShaderSource = [
      'attribute vec2 a_position;',
      'void main() {',
      '  gl_Position = vec4(a_position, 0.0, 1.0);',
      '}'
    ].join('\n');

    var fragmentShaderSource = [
      'precision mediump float;',
      'uniform vec2 u_resolution;',
      'uniform float u_time;',
      'uniform float u_pixelSize;',
      'uniform float u_warp;',
      'uniform float u_flow;',
      'uniform float u_contrast;',
      'uniform vec3 u_colorA;',
      'uniform vec3 u_colorB;',
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
      '  float v = 0.0;',
      '  float a = 0.5;',
      '  for (int i = 0; i < 4; i++) {',
      '    v += a * noise(p);',
      '    p *= 2.0;',
      '    a *= 0.5;',
      '  }',
      '  return v;',
      '}',
      '',
      'void main() {',
      '  vec2 frag = gl_FragCoord.xy;',
      '  float px = max(4.0, u_pixelSize);',
      '  vec2 pixelCoord = floor(frag / px) * px;',
      '  vec2 uv = pixelCoord / u_resolution.xy;',
      '  vec2 p = uv * 2.0 - 1.0;',
      '  p.x *= u_resolution.x / u_resolution.y;',
      '',
      '  float t = u_time * (0.25 + u_flow * 1.8);',
      '  float angle = atan(p.y, p.x);',
      '  float radius = length(p);',
      '',
      '  float spiral = sin(angle * 7.0 - radius * 12.0 + t * 3.0);',
      '  float bands = sin((p.x + p.y) * 10.0 + t * 2.2);',
      '  float cell = fbm(p * (3.0 + u_warp * 8.0) + vec2(t * 0.35, -t * 0.25));',
      '  float twist = fbm(vec2(angle * 2.0, radius * 6.0 - t * 0.7));',
      '',
      '  float v = 0.0;',
      '  v += spiral * 0.45;',
      '  v += bands * 0.2;',
      '  v += cell * 0.9;',
      '  v += twist * 0.55;',
      '  v += sin(radius * 18.0 - t * 4.0) * u_warp * 0.35;',
      '',
      '  v = 0.5 + 0.5 * sin(v * 3.14159);',
      '  v = smoothstep(0.15, 0.85, v);',
      '  v = pow(v, max(0.35, 1.4 - u_contrast * 0.6));',
      '',
      '  float poster = floor(v * (4.0 + u_contrast * 3.0)) / (4.0 + u_contrast * 3.0);',
      '  vec3 color = mix(u_colorA, u_colorB, poster);',
      '',
      '  float edgeGridX = step(0.92, fract(frag.x / px));',
      '  float edgeGridY = step(0.92, fract(frag.y / px));',
      '  float grid = max(edgeGridX, edgeGridY) * 0.08;',
      '',
      '  color *= 0.55 + poster * 1.15;',
      '  color -= grid;',
      '',
      '  gl_FragColor = vec4(color, 1.0);',
      '}'
    ].join('\n');

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    var program = createProgram(gl, vertexShader, fragmentShader);

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
      pixelSize: gl.getUniformLocation(program, 'u_pixelSize'),
      warp: gl.getUniformLocation(program, 'u_warp'),
      flow: gl.getUniformLocation(program, 'u_flow'),
      contrast: gl.getUniformLocation(program, 'u_contrast'),
      colorA: gl.getUniformLocation(program, 'u_colorA'),
      colorB: gl.getUniformLocation(program, 'u_colorB')
    };

    resizeCanvas();
  }

  function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
  }

  function startResizeObserver() {
    if (!wrapRef.current) {
      return;
    }

    resizeObserverRef.current = new ResizeObserver(function () {
      resizeCanvas();
    });

    resizeObserverRef.current.observe(wrapRef.current);
  }

  function resizeCanvas() {
    var canvas = canvasRef.current;
    var wrap = wrapRef.current;
    var gl = glRef.current;

    if (!canvas || !wrap || !gl) {
      return;
    }

    var rect = wrap.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function hexToRgb(hex) {
    var value = (hex || '#000000').replace('#', '');
    if (value.length === 3) {
      value = value.charAt(0) + value.charAt(0) + value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2);
    }
    var num = parseInt(value, 16);
    return [
      ((num >> 16) & 255) / 255,
      ((num >> 8) & 255) / 255,
      (num & 255) / 255
    ];
  }

  function draw(time) {
    var gl = glRef.current;
    var program = programRef.current;
    var canvas = canvasRef.current;
    if (!gl || !program || !canvas) {
      return;
    }

    var uniforms = uniformsRef.current;
    var params = paramsRef.current;
    var colorA = hexToRgb(params.colorA);
    var colorB = hexToRgb(params.colorB);

    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, time);
    gl.uniform1f(uniforms.pixelSize, params.pixelSize);
    gl.uniform1f(uniforms.warp, params.warp);
    gl.uniform1f(uniforms.flow, params.flow * SPEED);
    gl.uniform1f(uniforms.contrast, params.contrast);
    gl.uniform3f(uniforms.colorA, colorA[0], colorA[1], colorA[2]);
    gl.uniform3f(uniforms.colorB, colorB[0], colorB[1], colorB[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function animate() {
    var start = performance.now();

    function loop(now) {
      var elapsed = (now - start) * 0.001;
      draw(elapsed);
      frameRef.current = requestAnimationFrame(loop);
    }

    frameRef.current = requestAnimationFrame(loop);
  }

  return React.createElement(
    'div',
    {
      ref: wrapRef,
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
        display: 'block',
        imageRendering: 'pixelated'
      }
    })
  );
}