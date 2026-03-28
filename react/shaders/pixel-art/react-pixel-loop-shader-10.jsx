export default function PixelArtShader476658() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var programRef = React.useRef(null);
  var glRef = React.useRef(null);
  var resizeObserverRef = React.useRef(null);
  var uniformsRef = React.useRef({
    pixelSize: 14,
    flowSpeed: 1.4,
    intensity: 0.58,
    colorA: [0.18, 0.12, 0.42],
    colorB: [0.92, 0.26, 0.58],
    colorC: [0.16, 0.72, 0.62],
    pulse: true
  });

  var paramsRef = React.useRef({});

  function compileShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  function createProgram(gl, vertexSource, fragmentSource) {
    var vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
  }

  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) return;

    var gl = canvas.getContext('webgl', { antialias: false, alpha: false });
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
      'uniform float u_flowSpeed;',
      'uniform float u_intensity;',
      'uniform vec3 u_colorA;',
      'uniform vec3 u_colorB;',
      'uniform vec3 u_colorC;',
      'uniform float u_pulse;',
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
      '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
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
      '  vec2 pixel = floor(frag / u_pixelSize) * u_pixelSize;',
      '  vec2 uv = pixel / u_resolution;',
      '  vec2 centered = (pixel - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);',
      '',
      '  float t = u_time * u_flowSpeed;',
      '',
      '  float radial = length(centered);',
      '  float angle = atan(centered.y, centered.x);',
      '',
      '  vec2 swirlUv = vec2(',
      '    radial * 3.4 + sin(angle * 4.0 + t * 0.8) * 0.25,',
      '    angle * 1.6 + t * 0.35',
      '  );',
      '',
      '  float n1 = fbm(swirlUv + vec2(t * 0.18, -t * 0.1));',
      '  float n2 = fbm(centered * 7.0 + vec2(-t * 0.24, t * 0.19));',
      '  float rings = sin(radial * 28.0 - t * 3.2 + n2 * 4.0);',
      '  float shards = sin(angle * 7.0 + t * 1.7) * 0.5 + 0.5;',
      '  float field = mix(n1, n2, 0.45) + rings * 0.22 + shards * 0.18;',
      '',
      '  float pulse = 1.0;',
      '  if (u_pulse > 0.5) {',
      '    pulse = 0.82 + 0.18 * sin(t * 1.8);',
      '  }',
      '',
      '  field *= (0.85 + u_intensity * 0.9) * pulse;',
      '',
      '  float q1 = smoothstep(0.18, 0.42, field);',
      '  float q2 = smoothstep(0.44, 0.68, field);',
      '  float q3 = smoothstep(0.7, 0.95, field);',
      '',
      '  vec3 col = mix(u_colorA, u_colorB, q1);',
      '  col = mix(col, u_colorC, q2);',
      '  col += q3 * 0.16 * (u_colorB + u_colorC);',
      '',
      '  float checker = mod(floor(pixel.x / u_pixelSize) + floor(pixel.y / u_pixelSize), 2.0);',
      '  col *= 0.92 + checker * 0.08;',
      '',
      '  float vignette = smoothstep(1.2, 0.18, radial);',
      '  col *= vignette + 0.12;',
      '',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    var program = createProgram(gl, vertexSource, fragmentSource);
    programRef.current = program;

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

    gl.useProgram(program);

    var positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  }

  function draw(time) {
    var gl = glRef.current;
    var program = programRef.current;
    var canvas = canvasRef.current;
    if (!gl || !program || !canvas) return;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);

    var uniforms = uniformsRef.current;

    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time);
    gl.uniform1f(gl.getUniformLocation(program, 'u_pixelSize'), uniforms.pixelSize);
    gl.uniform1f(gl.getUniformLocation(program, 'u_flowSpeed'), uniforms.flowSpeed * SPEED);
    gl.uniform1f(gl.getUniformLocation(program, 'u_intensity'), uniforms.intensity);
    gl.uniform3f(gl.getUniformLocation(program, 'u_colorA'), uniforms.colorA[0], uniforms.colorA[1], uniforms.colorA[2]);
    gl.uniform3f(gl.getUniformLocation(program, 'u_colorB'), uniforms.colorB[0], uniforms.colorB[1], uniforms.colorB[2]);
    gl.uniform3f(gl.getUniformLocation(program, 'u_colorC'), uniforms.colorC[0], uniforms.colorC[1], uniforms.colorC[2]);
    gl.uniform1f(gl.getUniformLocation(program, 'u_pulse'), uniforms.pulse ? 1 : 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function animate(now) {
    draw(now * 0.001);
    frameRef.current = requestAnimationFrame(animate);
  }

  function resizeCanvas() {
    var canvas = canvasRef.current;
    if (!canvas) return;

    var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    var width = Math.floor(canvas.clientWidth * dpr);
    var height = Math.floor(canvas.clientHeight * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function registerParams() {
    paramsRef.current = {
      pixelSize: {
        type: 'range',
        min: 6,
        max: 28,
        step: 1,
        value: uniformsRef.current.pixelSize
      },
      flowSpeed: {
        type: 'range',
        min: 0.4,
        max: 2.4,
        step: 0.01,
        value: uniformsRef.current.flowSpeed
      },
      intensity: {
        type: 'range',
        min: 0.2,
        max: 1.0,
        step: 0.01,
        value: uniformsRef.current.intensity
      },
      colorA: {
        type: 'color',
        value: '#2e1f6b'
      },
      colorB: {
        type: 'color',
        value: '#ea4294'
      },
      colorC: {
        type: 'color',
        value: '#29b89e'
      }
    };

    window.__paramSetters = {
      pixelSize: function(value) {
        uniformsRef.current.pixelSize = Number(value);
      },
      flowSpeed: function(value) {
        uniformsRef.current.flowSpeed = Number(value);
      },
      intensity: function(value) {
        uniformsRef.current.intensity = Number(value);
      },
      colorA: function(value) {
        uniformsRef.current.colorA = hexToRgb(value);
      },
      colorB: function(value) {
        uniformsRef.current.colorB = hexToRgb(value);
      },
      colorC: function(value) {
        uniformsRef.current.colorC = hexToRgb(value);
      }
    };
  }

  function hexToRgb(hex) {
    var clean = (hex || '').replace('#', '');
    var safe = clean.length === 3
      ? clean.charAt(0) + clean.charAt(0) + clean.charAt(1) + clean.charAt(1) + clean.charAt(2) + clean.charAt(2)
      : clean;
    var num = parseInt(safe || '000000', 16);
    return [
      ((num >> 16) & 255) / 255,
      ((num >> 8) & 255) / 255,
      (num & 255) / 255
    ];
  }

  React.useEffect(function() {
    setupRenderer();
    registerParams();
    resizeCanvas();

    var canvas = canvasRef.current;
    if (canvas) {
      resizeObserverRef.current = new ResizeObserver(function() {
        resizeCanvas();
      });
      resizeObserverRef.current.observe(canvas);
    }

    frameRef.current = requestAnimationFrame(animate);

    return function() {
      cancelAnimationFrame(frameRef.current);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.__paramSetters = {};
    };
  }, []);

  return (
    <div
      className="dark-component"
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: '#0d0d0d' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}