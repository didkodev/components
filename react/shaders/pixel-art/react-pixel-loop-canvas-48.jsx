export default function PixelArtShaderLoop() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var programRef = React.useRef(null);
  var glRef = React.useRef(null);
  var bufferRef = React.useRef(null);
  var resizeObserverRef = React.useRef(null);
  var uniformsRef = React.useRef({
    pixelSize: 22,
    speed: 0.55,
    intensity: 0.54,
    mixAmount: 0.68,
    contrast: 1.25,
    colorA: [0.18, 0.42, 0.95],
    colorB: [0.72, 0.18, 0.95]
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

  function setupRenderer(canvas) {
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return null;

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
      'uniform float u_speed;',
      'uniform float u_intensity;',
      'uniform float u_mixAmount;',
      'uniform float u_contrast;',
      'uniform vec3 u_colorA;',
      'uniform vec3 u_colorB;',
      '',
      'float hash(vec2 p) {',
      '  p = fract(p * vec2(123.34, 345.45));',
      '  p += dot(p, p + 34.345);',
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
      '    v += noise(p) * a;',
      '    p *= 2.0;',
      '    a *= 0.5;',
      '  }',
      '  return v;',
      '}',
      '',
      'mat2 rot(float a) {',
      '  float s = sin(a);',
      '  float c = cos(a);',
      '  return mat2(c, -s, s, c);',
      '}',
      '',
      'void main() {',
      '  vec2 frag = gl_FragCoord.xy;',
      '  vec2 pixelCoord = floor(frag / u_pixelSize) * u_pixelSize;',
      '  vec2 uv = (pixelCoord - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);',
      '  float t = u_time * u_speed;',
      '',
      '  vec2 p = uv * 3.2;',
      '  p *= rot(0.35);',
      '',
      '  float g1 = fbm(p + vec2(t * 0.7, -t * 0.25));',
      '  float g2 = fbm((p * 1.6) * rot(t * 0.18) - vec2(t * 0.35, -t * 0.42));',
      '  float g3 = sin((p.x + g2 * 1.8) * 5.0 - t * 1.6) * 0.5 + 0.5;',
      '',
      '  float bands = floor((g1 * 0.65 + g2 * 0.35 + g3 * 0.45) * (4.0 + u_intensity * 7.0));',
      '  bands /= (4.0 + u_intensity * 7.0);',
      '',
      '  float diamond = abs(uv.x) + abs(uv.y);',
      '  float mask = smoothstep(1.15, 0.15, diamond + g2 * 0.25);',
      '',
      '  float pulse = sin(t * 1.4 + (uv.x + uv.y) * 8.0) * 0.5 + 0.5;',
      '  float field = mix(bands, pulse, u_mixAmount * 0.35) * mask;',
      '',
      '  field = pow(max(field, 0.0), u_contrast);',
      '',
      '  vec3 color = mix(u_colorA, u_colorB, clamp(field * 1.2, 0.0, 1.0));',
      '  color *= 0.35 + field * 1.4;',
      '',
      '  float vignette = smoothstep(1.35, 0.25, length(uv));',
      '  color *= vignette;',
      '',
      '  gl_FragColor = vec4(color, 1.0);',
      '}'
    ].join('\n');

    var program = createProgram(gl, vertexSource, fragmentSource);
    gl.useProgram(program);

    var buffer = gl.createBuffer();
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

    var positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    return {
      gl: gl,
      program: program,
      buffer: buffer,
      uniforms: {
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        time: gl.getUniformLocation(program, 'u_time'),
        pixelSize: gl.getUniformLocation(program, 'u_pixelSize'),
        speed: gl.getUniformLocation(program, 'u_speed'),
        intensity: gl.getUniformLocation(program, 'u_intensity'),
        mixAmount: gl.getUniformLocation(program, 'u_mixAmount'),
        contrast: gl.getUniformLocation(program, 'u_contrast'),
        colorA: gl.getUniformLocation(program, 'u_colorA'),
        colorB: gl.getUniformLocation(program, 'u_colorB')
      }
    };
  }

  function resizeCanvas() {
    var canvas = canvasRef.current;
    var gl = glRef.current;
    if (!canvas || !gl) return;

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

  function draw(time) {
    var gl = glRef.current;
    var programData = programRef.current;
    if (!gl || !programData) return;

    resizeCanvas();

    var canvas = canvasRef.current;
    var uniforms = uniformsRef.current;

    gl.useProgram(programData.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferRef.current);

    gl.uniform2f(programData.uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(programData.uniforms.time, time);
    gl.uniform1f(programData.uniforms.pixelSize, uniforms.pixelSize);
    gl.uniform1f(programData.uniforms.speed, uniforms.speed * SPEED);
    gl.uniform1f(programData.uniforms.intensity, uniforms.intensity);
    gl.uniform1f(programData.uniforms.mixAmount, uniforms.mixAmount);
    gl.uniform1f(programData.uniforms.contrast, uniforms.contrast);
    gl.uniform3f(programData.uniforms.colorA, uniforms.colorA[0], uniforms.colorA[1], uniforms.colorA[2]);
    gl.uniform3f(programData.uniforms.colorB, uniforms.colorB[0], uniforms.colorB[1], uniforms.colorB[2]);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function animate(now) {
    draw(now * 0.001);
    frameRef.current = requestAnimationFrame(animate);
  }

  function registerParams() {
    window.__paramSetters = {
      pixelSize: function(value) {
        uniformsRef.current.pixelSize = value;
      },
      speed: function(value) {
        uniformsRef.current.speed = value;
      },
      intensity: function(value) {
        uniformsRef.current.intensity = value;
      },
      mixAmount: function(value) {
        uniformsRef.current.mixAmount = value;
      },
      contrast: function(value) {
        uniformsRef.current.contrast = value;
      },
      palette: function(value) {
        if (value === 'violet-cyan') {
          uniformsRef.current.colorA = [0.18, 0.42, 0.95];
          uniformsRef.current.colorB = [0.72, 0.18, 0.95];
        }
        if (value === 'teal-magenta') {
          uniformsRef.current.colorA = [0.08, 0.74, 0.66];
          uniformsRef.current.colorB = [0.82, 0.12, 0.54];
        }
        if (value === 'amber-rose') {
          uniformsRef.current.colorA = [0.82, 0.42, 0.10];
          uniformsRef.current.colorB = [0.78, 0.14, 0.38];
        }
      }
    };

    window.__params = [
      { key: 'pixelSize', type: 'range', min: 8, max: 40, step: 1, value: 22 },
      { key: 'speed', type: 'range', min: 0.2, max: 1.4, step: 0.01, value: 0.55 },
      { key: 'intensity', type: 'range', min: 0.1, max: 1, step: 0.01, value: 0.54 },
      { key: 'mixAmount', type: 'range', min: 0, max: 1, step: 0.01, value: 0.68 },
      { key: 'contrast', type: 'range', min: 0.7, max: 2, step: 0.01, value: 1.25 },
      { key: 'palette', type: 'select', options: ['violet-cyan', 'teal-magenta', 'amber-rose'], value: 'violet-cyan' }
    ];
  }

  React.useEffect(function() {
    var canvas = canvasRef.current;
    if (!canvas) return;

    var renderer = setupRenderer(canvas);
    if (!renderer) return;

    glRef.current = renderer.gl;
    programRef.current = renderer;
    bufferRef.current = renderer.buffer;

    resizeCanvas();

    resizeObserverRef.current = new ResizeObserver(function() {
      resizeCanvas();
    });
    resizeObserverRef.current.observe(canvas);

    registerParams();
    frameRef.current = requestAnimationFrame(animate);

    return function() {
      cancelAnimationFrame(frameRef.current);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.__paramSetters = {};
      if (glRef.current && programRef.current) {
        glRef.current.deleteBuffer(bufferRef.current);
        glRef.current.deleteProgram(programRef.current.program);
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
        display: 'block',
        imageRendering: 'pixelated'
      }
    })
  );
}