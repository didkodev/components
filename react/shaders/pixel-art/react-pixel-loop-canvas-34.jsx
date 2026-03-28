export default function PixelArtShader147285() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var glRef = React.useRef(null);
  var programRef = React.useRef(null);
  var bufferRef = React.useRef(null);
  var uniformsRef = React.useRef({});
  var startTimeRef = React.useRef(0);
  var paramsRef = React.useRef({
    pixelSize: 14,
    motion: 0.45,
    intensity: 0.85,
    colorA: '#7c3aed',
    colorB: '#06b6d4',
    warp: 0.6
  });

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
    if (!canvas) {
      return;
    }

    var gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) {
      return;
    }
    glRef.current = gl;

    var vertexSource = [
      'attribute vec2 aPosition;',
      'void main() {',
      '  gl_Position = vec4(aPosition, 0.0, 1.0);',
      '}'
    ].join('\n');

    var fragmentSource = [
      'precision mediump float;',
      'uniform vec2 uResolution;',
      'uniform float uTime;',
      'uniform float uPixelSize;',
      'uniform float uMotion;',
      'uniform float uIntensity;',
      'uniform float uWarp;',
      'uniform vec3 uColorA;',
      'uniform vec3 uColorB;',
      '',
      'float hash(vec2 p) {',
      '  p = fract(p * vec2(123.34, 345.45));',
      '  p += dot(p, p + 34.345);',
      '  return fract(p.x * p.y);',
      '}',
      '',
      'float box(vec2 p, vec2 b) {',
      '  vec2 d = abs(p) - b;',
      '  return max(d.x, d.y);',
      '}',
      '',
      'void main() {',
      '  vec2 uv = gl_FragCoord.xy / uResolution.xy;',
      '  float px = max(4.0, uPixelSize);',
      '  vec2 grid = floor(gl_FragCoord.xy / px);',
      '  vec2 pixelUv = (grid * px) / uResolution.xy;',
      '  vec2 centered = pixelUv - 0.5;',
      '  centered.x *= uResolution.x / uResolution.y;',
      '',
      '  float t = uTime * (0.35 + uMotion * 1.4);',
      '  float layers = 0.0;',
      '',
      '  vec2 p1 = centered * (5.0 + uIntensity * 3.0);',
      '  p1.x += sin(centered.y * 8.0 + t * 1.4) * 0.25 * uWarp;',
      '  p1.y += cos(centered.x * 7.0 - t * 1.1) * 0.18 * uWarp;',
      '  vec2 g1 = fract(p1) - 0.5;',
      '  float n1 = hash(floor(p1));',
      '  float s1 = step(box(g1, vec2(0.18 + 0.12 * sin(t + n1 * 6.2831), 0.18)), 0.0);',
      '',
      '  vec2 p2 = centered * (8.0 + uIntensity * 4.0);',
      '  p2.x += sin(t * 0.8 + floor(p2.y) * 0.7) * 0.6 * uWarp;',
      '  p2.y += cos(t * 0.9 + floor(p2.x) * 0.8) * 0.4 * uWarp;',
      '  vec2 g2 = fract(p2) - 0.5;',
      '  float n2 = hash(floor(p2) + 10.0);',
      '  float crossA = step(abs(g2.x), 0.08 + 0.06 * n2) * step(abs(g2.y), 0.32);',
      '  float crossB = step(abs(g2.y), 0.08 + 0.06 * n2) * step(abs(g2.x), 0.32);',
      '',
      '  vec2 p3 = centered * (3.5 + uIntensity * 2.0);',
      '  float bands = sin(p3.x * 3.0 + t) + cos(p3.y * 4.0 - t * 1.2);',
      '  bands = smoothstep(-0.2, 0.7, bands);',
      '',
      '  layers += s1 * (0.55 + 0.45 * n1);',
      '  layers += max(crossA, crossB) * 0.8;',
      '  layers += bands * 0.35;',
      '',
      '  float vignette = smoothstep(1.25, 0.15, length(centered));',
      '  float pulse = 0.5 + 0.5 * sin(t * 1.7);',
      '  float mixAmt = clamp(layers * 0.65 + pulse * 0.2 + centered.y * 0.25 + 0.35, 0.0, 1.0);',
      '  vec3 color = mix(uColorA, uColorB, mixAmt);',
      '  color *= (0.25 + layers * 0.95) * vignette;',
      '  color += 0.08 * vec3(hash(grid + floor(t * 2.0)));',
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

    var positionLocation = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'uResolution'),
      time: gl.getUniformLocation(program, 'uTime'),
      pixelSize: gl.getUniformLocation(program, 'uPixelSize'),
      motion: gl.getUniformLocation(program, 'uMotion'),
      intensity: gl.getUniformLocation(program, 'uIntensity'),
      warp: gl.getUniformLocation(program, 'uWarp'),
      colorA: gl.getUniformLocation(program, 'uColorA'),
      colorB: gl.getUniformLocation(program, 'uColorB')
    };
  }

  function resizeCanvas() {
    var canvas = canvasRef.current;
    var gl = glRef.current;
    if (!canvas || !gl) {
      return;
    }

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
    var program = programRef.current;
    var uniforms = uniformsRef.current;
    if (!gl || !program || !uniforms) {
      return;
    }

    resizeCanvas();

    var colorA = hexToRgb(paramsRef.current.colorA);
    var colorB = hexToRgb(paramsRef.current.colorB);

    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(uniforms.time, time);
    gl.uniform1f(uniforms.pixelSize, paramsRef.current.pixelSize);
    gl.uniform1f(uniforms.motion, paramsRef.current.motion * SPEED);
    gl.uniform1f(uniforms.intensity, paramsRef.current.intensity);
    gl.uniform1f(uniforms.warp, paramsRef.current.warp);
    gl.uniform3f(uniforms.colorA, colorA[0], colorA[1], colorA[2]);
    gl.uniform3f(uniforms.colorB, colorB[0], colorB[1], colorB[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function animate(now) {
    if (!startTimeRef.current) {
      startTimeRef.current = now;
    }
    var elapsed = (now - startTimeRef.current) * 0.001;
    draw(elapsed);
    frameRef.current = requestAnimationFrame(animate);
  }

  function registerParams() {
    window.__paramSetters = {
      pixelSize: function(value) {
        paramsRef.current.pixelSize = value;
      },
      motion: function(value) {
        paramsRef.current.motion = value;
      },
      intensity: function(value) {
        paramsRef.current.intensity = value;
      },
      colorA: function(value) {
        paramsRef.current.colorA = value;
      },
      colorB: function(value) {
        paramsRef.current.colorB = value;
      },
      warp: function(value) {
        paramsRef.current.warp = value;
      }
    };

    window.__params = [
      {
        name: 'pixelSize',
        type: 'range',
        min: 6,
        max: 28,
        step: 1,
        value: paramsRef.current.pixelSize
      },
      {
        name: 'motion',
        type: 'range',
        min: 0.1,
        max: 1.2,
        step: 0.01,
        value: paramsRef.current.motion
      },
      {
        name: 'intensity',
        type: 'range',
        min: 0.2,
        max: 1,
        step: 0.01,
        value: paramsRef.current.intensity
      },
      {
        name: 'warp',
        type: 'range',
        min: 0,
        max: 1,
        step: 0.01,
        value: paramsRef.current.warp
      },
      {
        name: 'colorA',
        type: 'color',
        value: paramsRef.current.colorA
      },
      {
        name: 'colorB',
        type: 'color',
        value: paramsRef.current.colorB
      }
    ];
  }

  React.useEffect(function() {
    setupRenderer();
    resizeCanvas();
    registerParams();

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
      var gl = glRef.current;
      if (gl && programRef.current) {
        gl.deleteProgram(programRef.current);
      }
      if (gl && bufferRef.current) {
        gl.deleteBuffer(bufferRef.current);
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