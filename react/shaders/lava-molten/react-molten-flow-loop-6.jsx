export default function LavaMolten() {
  const canvasRef = window.React.useRef(null);
  const animRef = window.React.useRef(null);
  const startTimeRef = window.React.useRef(null);

  window.React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vertSrc = [
      'attribute vec2 position;',
      'void main() {',
      '  gl_Position = vec4(position, 0.0, 1.0);',
      '}'
    ].join('\n');

    const fragSrc = [
      'precision highp float;',
      'uniform float time;',
      'uniform vec2 resolution;',

      'float hash(vec2 p) {',
      '  p = fract(p * vec2(127.1, 311.7));',
      '  p += dot(p, p + 19.19);',
      '  return fract(p.x * p.y);',
      '}',

      'float noise(vec2 p) {',
      '  vec2 i = floor(p);',
      '  vec2 f = fract(p);',
      '  vec2 u = f * f * (3.0 - 2.0 * f);',
      '  float a = hash(i);',
      '  float b = hash(i + vec2(1.0, 0.0));',
      '  float c = hash(i + vec2(0.0, 1.0));',
      '  float d = hash(i + vec2(1.0, 1.0));',
      '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
      '}',

      'float fbm(vec2 p) {',
      '  float val = 0.0;',
      '  float amp = 0.5;',
      '  float freq = 1.0;',
      '  for (int i = 0; i < 7; i++) {',
      '    val += amp * noise(p * freq);',
      '    amp *= 0.52;',
      '    freq *= 2.1;',
      '    p += vec2(0.31, 0.17);',
      '  }',
      '  return val;',
      '}',

      'float lava(vec2 p, float t) {',
      '  vec2 q = vec2(',
      '    fbm(p + vec2(0.0, 0.0)),',
      '    fbm(p + vec2(5.2, 1.3))',
      '  );',
      '  vec2 r = vec2(',
      '    fbm(p + 4.0 * q + vec2(1.7 + t * 0.15, 9.2)),',
      '    fbm(p + 4.0 * q + vec2(8.3 + t * 0.126, 2.8))',
      '  );',
      '  return fbm(p + 4.5 * r + vec2(t * 0.08, t * 0.05));',
      '}',

      'vec3 lavaColor(float f) {',
      '  vec3 c0 = vec3(0.02, 0.0, 0.0);',
      '  vec3 c1 = vec3(0.4, 0.02, 0.0);',
      '  vec3 c2 = vec3(0.9, 0.18, 0.0);',
      '  vec3 c3 = vec3(1.0, 0.55, 0.0);',
      '  vec3 c4 = vec3(1.0, 0.92, 0.3);',
      '  vec3 c5 = vec3(1.0, 1.0, 0.9);',
      '  float t = clamp(f, 0.0, 1.0);',
      '  if (t < 0.2) return mix(c0, c1, t / 0.2);',
      '  if (t < 0.42) return mix(c1, c2, (t - 0.2) / 0.22);',
      '  if (t < 0.62) return mix(c2, c3, (t - 0.42) / 0.2);',
      '  if (t < 0.82) return mix(c3, c4, (t - 0.62) / 0.2);',
      '  return mix(c4, c5, (t - 0.82) / 0.18);',
      '}',

      'void main() {',
      '  vec2 uv = gl_FragCoord.xy / resolution.xy;',
      '  float aspect = resolution.x / resolution.y;',
      '  vec2 p = uv * vec2(aspect, 1.0) * 2.8;',

      '  float t = time * 0.38;',

      '  float f1 = lava(p, t);',
      '  float f2 = lava(p * 1.7 + vec2(3.1, 1.9), t * 1.2);',
      '  float f3 = lava(p * 0.6 + vec2(1.5, 0.8), t * 0.7);',

      '  float combined = f1 * 0.5 + f2 * 0.3 + f3 * 0.2;',

      '  float cells = sin(combined * 18.0 - t * 1.2) * 0.5 + 0.5;',
      '  float pulse = sin(combined * 28.0 + t * 2.0) * 0.5 + 0.5;',

      '  float lf = combined * 0.7 + cells * 0.18 + pulse * 0.12;',
      '  lf = pow(lf, 1.15);',

      '  vec3 col = lavaColor(lf);',

      '  float glow = pow(clamp(lf * 1.3 - 0.3, 0.0, 1.0), 2.5);',
      '  col += vec3(1.0, 0.4, 0.0) * glow * 0.35;',

      '  float dark = pow(clamp(1.0 - lf * 2.2, 0.0, 1.0), 3.0);',
      '  col -= vec3(0.08, 0.02, 0.0) * dark;',

      '  col = pow(col, vec3(0.9));',

      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const vert = compileShader(gl.VERTEX_SHADER, vertSrc);
    const frag = compileShader(gl.FRAGMENT_SHADER, fragSrc);
    const prog = gl.createProgram();
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(prog, 'time');
    const resLoc = gl.getUniformLocation(prog, 'resolution');

    const ro = new ResizeObserver(() => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    });
    ro.observe(canvas.parentElement);
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    startTimeRef.current = performance.now();

    function render(now) {
      const t = (now - startTimeRef.current) * 0.001;
      gl.uniform1f(timeLoc, t);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <div
      className="dark-component"
      style={{
        width: '100%',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}