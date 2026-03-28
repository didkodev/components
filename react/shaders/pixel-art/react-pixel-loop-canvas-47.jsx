export default function PixelArtShader() {
  var SPEED = 0.35;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var glRef = React.useRef(null);
  var programRef = React.useRef(null);
  var bufferRef = React.useRef(null);
  var uniformsRef = React.useRef({});
  var resizeObserverRef = React.useRef(null);

  var paramsRef = React.useRef({
    colorA: '#3a86ff',
    colorB: '#8338ec',
    colorC: '#ff006e',
    pixelSize: 18,
    flow: 0.31,
    contrast: 0.72
  });

  function compileShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  function setupRenderer() {
    var canvas = canvasRef.current;
    if (!canvas) return null;

    var gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      premultipliedAlpha: false
    });

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
      'uniform vec3 u_colorA;',
      'uniform vec3 u_colorB;',
      'uniform vec3 u_colorC;',
      'uniform float u_pixelSize;',
      'uniform float u_flow;',
      'uniform float u_contrast;',
      '',
      'float hash(vec2 p) {',
      '  p = fract(p * vec2(123.34, 345.45));',
      '  p += dot(p, p + 34.23);',
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
      '  vec2 uv = gl_FragCoord.xy / u_resolution.xy;',
      '  float aspect = u_resolution.x / u_resolution.y;',
      '  vec2 centered = uv - 0.5;',
      '  centered.x *= aspect;',
      '',
      '  float px = max(4.0, u_pixelSize);',
      '  vec2 grid = floor(gl_FragCoord.xy / px) * px;',
      '  vec2 puv = grid / u_resolution.xy;',
      '  vec2 p = puv - 0.5;',
      '  p.x *= aspect;',
      '',
      '  float t = u_time * (0.15 + u_flow * 0.9);',
      '',
      '  float rings = sin(length(p * 6.0) * 10.0 - t * 2.5);',
      '  float waves = sin((p.x + p.y) * 10.0 + t * 1.8) * 0.5 + 0.5;',
      '  float field = fbm(p * (3.5 + u_flow * 3.0) + vec2(t * 0.6, -t * 0.4));',
      '',
      '  float mosaic = field * 0.55 + waves * 0.25 + rings * 0.2;',
      '  mosaic = smoothstep(0.15, 0.85, mosaic);',
      '',
      '  float steps = 8.0 + floor(u_contrast * 8.0);',
      '  mosaic = floor(mosaic * steps) / steps;',
      '',
      '  float band1 = smoothstep(0.1, 0.45, mosaic);',
      '  float band2 = smoothstep(0.45, 0.82, mosaic);',
      '',
      '  vec3 col = mix(u_colorA, u_colorB, band1);',
      '  col = mix(col, u_colorC, band2);',
      '',
      '  float checker = step(0.5, fract((floor(grid.x / px) + floor(grid.y / px)) * 0.5));',
      '  col *= 0.88 + checker * 0.12;',
      '',
      '  float vignette = smoothstep(1.15, 0.2, length(centered));',
      '  col *= vignette;',
      '',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    var vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
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

    glRef.current = gl;
    programRef.current = program;
    bufferRef.current = buffer;
    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      colorA: gl.getUniformLocation(program, 'u_colorA'),
      colorB: gl.getUniformLocation(program, 'u_colorB'),
      colorC: gl.getUniformLocation(program, 'u_colorC'),
      pixelSize: gl.getUniformLocation(program, 'u_pixelSize'),
      flow: gl.getUniformLocation(program, 'u_flow'),
      contrast: gl.getUniformLocation(program, 'u_contrast')
    };

    return gl;
  }

  function hexToRgb(hex) {
    var value = (hex || '#000000').replace('#', '');
    if (value.length === 3) {
      value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2];
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
    var canvas = canvasRef.current;
    var uniforms = uniformsRef.current;
    if (!gl || !canvas || !uniforms) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    var height = Math.max(1, Math.floor(canvas.clientHeight * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    gl.viewport(0, 0, width, height);
    gl.clearColor(0.05, 0.05, 0.05, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var p = paramsRef.current;
    var a = hexToRgb(p.colorA);
    var b = hexToRgb(p.colorB);
    var c = hexToRgb(p.colorC);

    gl.uniform2f(uniforms.resolution, width, height);
    gl.uniform1f(uniforms.time, time);
    gl.uniform3f(uniforms.colorA, a[0], a[1], a[2]);
    gl.uniform3f(uniforms.colorB, b[0], b[1], b[2]);
    gl.uniform3f(uniforms.colorC, c[0], c[1], c[2]);
    gl.uniform1f(uniforms.pixelSize, p.pixelSize);
    gl.uniform1f(uniforms.flow, p.flow);
    gl.uniform1f(uniforms.contrast, p.contrast);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function animate(now) {
    draw(now * 0.001 * SPEED);
    frameRef.current = requestAnimationFrame(animate);
  }

  function registerParams() {
    window.__paramSetters = {
      colorA: function(v) {
        paramsRef.current.colorA = v;
      },
      colorB: function(v) {
        paramsRef.current.colorB = v;
      },
      colorC: function(v) {
        paramsRef.current.colorC = v;
      },
      pixelSize: function(v) {
        paramsRef.current.pixelSize = v;
      },
      flow: function(v) {
        paramsRef.current.flow = v;
      },
      contrast: function(v) {
        paramsRef.current.contrast = v;
      }
    };
  }

  React.useEffect(function() {
    setupRenderer();
    registerParams();

    var canvas = canvasRef.current;
    if (canvas) {
      resizeObserverRef.current = new ResizeObserver(function() {
        draw(performance.now() * 0.001 * SPEED);
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