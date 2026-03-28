export default function CosmosShader() {
  const canvasRef = React.useRef(null);
  const wrapRef = React.useRef(null);
  const rafRef = React.useRef(0);
  const resizeRef = React.useRef(null);

  React.useEffect(function () {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const gl =
      canvas.getContext("webgl", { antialias: true, alpha: true }) ||
      canvas.getContext("experimental-webgl", { antialias: true, alpha: true });

    if (!gl) return;

    const vertexSource = [
      "attribute vec2 a_position;",
      "void main() {",
      "  gl_Position = vec4(a_position, 0.0, 1.0);",
      "}"
    ].join("\n");

    const fragmentSource = [
      "precision highp float;",
      "uniform vec2 u_resolution;",
      "uniform float u_time;",
      "uniform float u_intensity;",
      "",
      "float hash(vec2 p) {",
      "  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);",
      "}",
      "",
      "float noise(vec2 p) {",
      "  vec2 i = floor(p);",
      "  vec2 f = fract(p);",
      "  vec2 u = f * f * (3.0 - 2.0 * f);",
      "  float a = hash(i + vec2(0.0, 0.0));",
      "  float b = hash(i + vec2(1.0, 0.0));",
      "  float c = hash(i + vec2(0.0, 1.0));",
      "  float d = hash(i + vec2(1.0, 1.0));",
      "  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);",
      "}",
      "",
      "float fbm(vec2 p) {",
      "  float v = 0.0;",
      "  float a = 0.5;",
      "  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);",
      "  for (int i = 0; i < 6; i++) {",
      "    v += a * noise(p);",
      "    p = m * p;",
      "    a *= 0.5;",
      "  }",
      "  return v;",
      "}",
      "",
      "float starField(vec2 uv, float t) {",
      "  vec2 gv = fract(uv) - 0.5;",
      "  vec2 id = floor(uv);",
      "  float n = hash(id);",
      "  float s = smoothstep(0.12, 0.0, length(gv));",
      "  float twinkle = 0.55 + 0.45 * sin(t * (1.2 + n * 2.5) + n * 6.2831);",
      "  return s * step(0.78, n) * twinkle;",
      "}",
      "",
      "void main() {",
      "  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);",
      "  float t = u_time * 0.72;",
      "",
      "  float r = length(uv);",
      "  float a = atan(uv.y, uv.x);",
      "",
      "  vec2 flow = vec2(",
      "    cos(a * 2.0 + t * 0.6) * 0.35,",
      "    sin(a * 3.0 - t * 0.5) * 0.35",
      "  );",
      "",
      "  float nebula = fbm(uv * 2.2 + flow + vec2(t * 0.08, -t * 0.04));",
      "  nebula += 0.5 * fbm(uv * 4.0 - flow * 1.4 - vec2(t * 0.03, t * 0.06));",
      "  nebula /= 1.5;",
      "",
      "  float ring = sin(16.0 * r - t * 2.2 + nebula * 4.0);",
      "  float spiral = sin(a * 4.0 - r * 12.0 + t * 1.6 + nebula * 3.0);",
      "  float waves = 0.5 + 0.5 * ring * 0.55 + 0.5 + 0.5 * spiral * 0.45;",
      "  waves *= 0.5;",
      "",
      "  float glow = smoothstep(1.18, 0.12, r);",
      "  float core = smoothstep(0.28, 0.0, r);",
      "  float dust = smoothstep(0.25, 0.95, nebula + waves * 0.35) * glow;",
      "",
      "  vec3 c1 = vec3(0.04, 0.02, 0.10);",
      "  vec3 c2 = vec3(0.14, 0.10, 0.35);",
      "  vec3 c3 = vec3(0.08, 0.42, 0.78);",
      "  vec3 c4 = vec3(0.85, 0.24, 0.98);",
      "  vec3 c5 = vec3(1.00, 0.72, 0.35);",
      "",
      "  vec3 col = mix(c1, c2, smoothstep(0.0, 0.35, nebula));",
      "  col = mix(col, c3, smoothstep(0.25, 0.62, nebula + waves * 0.2));",
      "  col = mix(col, c4, smoothstep(0.45, 0.9, dust));",
      "  col += c5 * core * (0.65 + 0.35 * sin(t * 1.2 + a * 2.0));",
      "",
      "  float stars = 0.0;",
      "  stars += starField(uv * 18.0 + vec2(t * 0.03, t * 0.01), t) * 0.9;",
      "  stars += starField(uv * 32.0 - vec2(t * 0.02, t * 0.04), t + 3.0) * 0.7;",
      "  stars += starField(uv * 54.0 + vec2(-t * 0.05, t * 0.02), t + 6.0) * 0.45;",
      "",
      "  col += stars * vec3(0.9, 0.95, 1.0);",
      "  col += dust * vec3(0.25, 0.1, 0.35) * u_intensity * 0.9;",
      "  col *= glow + 0.08;",
      "",
      "  float vignette = smoothstep(1.45, 0.35, r);",
      "  col *= vignette;",
      "  col = pow(col, vec3(0.85));",
      "",
      "  gl_FragColor = vec4(col, 1.0);",
      "}"
    ].join("\n");

    function compile(type, source) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compile(gl.VERTEX_SHADER, vertexSource);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    const buffer = gl.createBuffer();
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

    const positionLoc = gl.getAttribLocation(program, "a_position");
    const resolutionLoc = gl.getUniformLocation(program, "u_resolution");
    const timeLoc = gl.getUniformLocation(program, "u_time");
    const intensityLoc = gl.getUniformLocation(program, "u_intensity");

    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    function resize() {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    resizeRef.current = new ResizeObserver(function () {
      resize();
    });
    resizeRef.current.observe(wrap);
    resize();

    const start = performance.now();
    const intensity = 0.62;
    const speed = 0.9;

    function frame(now) {
      resize();
      const time = ((now - start) / 1000) * speed;
      gl.useProgram(program);
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, time);
      gl.uniform1f(intensityLoc, intensity);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);

    return function () {
      cancelAnimationFrame(rafRef.current);
      if (resizeRef.current) resizeRef.current.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="dark-component"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "560px",
        position: "relative",
        overflow: "hidden",
        background: "radial-gradient(circle at 50% 50%, rgba(18,16,38,1) 0%, rgba(6,7,16,1) 55%, rgba(2,2,8,1) 100%)",
        borderRadius: "24px",
        boxShadow: "inset 0 0 80px rgba(120,80,255,0.08), 0 10px 40px rgba(0,0,0,0.35)"
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block"
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "0",
          pointerEvents: "none",
          background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.0) 60%), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.0) 24%, rgba(255,255,255,0.03) 100%)",
          mixBlendMode: "screen"
        }}
      />
    </div>
  );
}