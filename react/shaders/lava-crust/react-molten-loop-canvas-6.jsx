export default function LavaCrust() {
  const canvasRef = window.React.useRef(null);
  const animRef = window.React.useRef(null);
  const resizeObserverRef = window.React.useRef(null);

  window.React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vertSrc = [
      'attribute vec2 a_pos;',
      'varying vec2 v_uv;',
      'void main() {',
      '  v_uv = a_pos * 0.5 + 0.5;',
      '  gl_Position = vec4(a_pos, 0.0, 1.0);',
      '}'
    ].join('\n');

    const fragSrc = [
      'precision highp float;',
      'varying vec2 v_uv;',
      'uniform float u_time;',
      'uniform vec2 u_res;',

      'float hash(vec2 p) {',
      '  p = fract(p * vec2(234.34, 435.345));',
      '  p += dot(p, p + 34.23);',
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
      '  float v = 0.0;',
      '  float amp = 0.5;',
      '  float freq = 1.0;',
      '  for (int i = 0; i < 8; i++) {',
      '    v += amp * noise(p * freq);',
      '    amp *= 0.5;',
      '    freq *= 2.1;',
      '  }',
      '  return v;',
      '}',

      'void main() {',
      '  vec2 uv = v_uv;',
      '  uv.x *= u_res.x / u_res.y;',

      '  float t = u_time * 0.18;',

      '  vec2 q = vec2(',
      '    fbm(uv + vec2(0.0, 0.0) + t * 0.4),',
      '    fbm(uv + vec2(5.2, 1.3) + t * 0.35)',
      '  );',

      '  vec2 r = vec2(',
      '    fbm(uv + 4.0 * q + vec2(1.7, 9.2) + t * 0.3),',
      '    fbm(uv + 4.0 * q + vec2(8.3, 2.8) - t * 0.25)',
      '  );',

      '  float f = fbm(uv + 4.0 * r + t * 0.2);',

      '  float crackN1 = fbm(uv * 3.5 - t * 0.5 + q * 2.0);',
      '  float crackN2 = fbm(uv * 6.0 + t * 0.3 - r * 1.5);',

      '  float crack = abs(sin(crackN1 * 12.566 + crackN2 * 6.283));',
      '  crack = pow(crack, 0.4);',

      '  float crust = smoothstep(0.3, 0.85, f);',
      '  float glow = 1.0 - crust;',
      '  glow = pow(glow, 1.5);',

      '  float pulse = 0.5 + 0.5 * sin(u_time * 0.9 + f * 8.0);',
      '  glow = glow * (0.7 + 0.3 * pulse);',

      '  float crackEdge = smoothstep(0.55, 0.75, crack) * (1.0 - crust * 0.7);',
      '  crackEdge *= 0.85;',

      '  vec3 lavaDeep = vec3(0.9, 0.05, 0.0);',
      '  vec3 lavaHot  = vec3(1.0, 0.55, 0.0);',
      '  vec3 lavaWhite = vec3(1.0, 0.95, 0.6);',
      '  vec3 crustDark = vec3(0.08, 0.04, 0.03);',
      '  vec3 crustMid  = vec3(0.18, 0.1, 0.07);',
      '  vec3 crustRed  = vec3(0.35, 0.08, 0.02);',

      '  vec3 lavaColor = mix(lavaDeep, lavaHot, glow);',
      '  lavaColor = mix(lavaColor, lavaWhite, pow(glow, 3.5) * 0.85);',

      '  vec3 crustColor = mix(crustDark, crustMid, f * 0.8);',
      '  crustColor = mix(crustColor, crustRed, crackEdge * 0.9);',

      '  vec3 col = mix(lavaColor, crustColor, crust);',

      '  col += lavaHot * crackEdge * (1.0 - crust * 0.5) * 0.7;',

      '  float ember = fbm(uv * 12.0 + t * 2.5);',
      '  float emberMask = step(0.78, ember) * glow * 0.6;',
      '  col += vec3(1.0, 0.8, 0.3) * emberMask;',

      '  float vign = 1.0 - length((v_uv - 0.5) * 1.5);',
      '  vign = clamp(vign, 0.0, 1.0);',
      '  col *= 0.4 + 0.6 * vign;',

      '  col = pow(clamp(col, 0.0, 1.0), vec3(0.9));',

      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    function compileShader(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
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

    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_res');

    let startTime = performance.now();

    function resize() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function render() {
      resize();
      const t = (performance.now() - startTime) / 1000.0;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);

    resizeObserverRef.current = new ResizeObserver(() => { resize(); });
    resizeObserverRef.current.observe(canvas);

    return () => {
      cancelAnimationFrame(animRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
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
        background: '#0a0000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  );
}