export default function LavaCrustShader() {
  const canvasRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const rafRef = React.useRef(0);
  const resizeObserverRef = React.useRef(null);
  const sizeRef = React.useRef({ width: 0, height: 0, dpr: 1 });

  React.useEffect(function () {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl =
      canvas.getContext("webgl", { antialias: true, alpha: false, preserveDrawingBuffer: false }) ||
      canvas.getContext("experimental-webgl");

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
      "",
      "float hash(vec2 p) {",
      "  p = fract(p * vec2(123.34, 456.21));",
      "  p += dot(p, p + 45.32);",
      "  return fract(p.x * p.y);",
      "}",
      "",
      "float noise(vec2 p) {",
      "  vec2 i = floor(p);",
      "  vec2 f = fract(p);",
      "  f = f * f * (3.0 - 2.0 * f);",
      "  float a = hash(i);",
      "  float b = hash(i + vec2(1.0, 0.0));",
      "  float c = hash(i + vec2(0.0, 1.0));",
      "  float d = hash(i + vec2(1.0, 1.0));",
      "  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);",
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
      "void main() {",
      "  vec2 uv = gl_FragCoord.xy / u_resolution.xy;",
      "  vec2 p = uv - 0.5;",
      "  p.x *= u_resolution.x / u_resolution.y;",
      "",
      "  float t = u_time * 0.42;",
      "  vec2 flow = vec2(",
      "    fbm(p * 1.8 + vec2(t * 0.7, -t * 0.18)),",
      "    fbm(p * 1.8 + vec2(-t * 0.22, t * 0.64))",
      "  );",
      "",
      "  vec2 q = p * 3.6;",
      "  q += (flow - 0.5) * 1.25;",
      "",
      "  float base = fbm(q + vec2(0.0, t * 0.55));",
      "  float fissure = fbm(q * 1.9 - vec2(t * 0.25, -t * 0.12));",
      "  float crust = 1.0 - smoothstep(0.42, 0.72, base + fissure * 0.38);",
      "",
      "  float glowMask = smoothstep(0.46, 0.84, base + fissure * 0.58);",
      "  glowMask = pow(glowMask, 2.2);",
      "",
      "  float crack = abs(base - 0.56);",
      "  float veins = 1.0 - smoothstep(0.0, 0.085, crack);",
      "  veins *= 0.65 + 0.35 * fbm(q * 4.2 + t);",
      "",
      "  vec3 darkA = vec3(0.03, 0.015, 0.02);",
      "  vec3 darkB = vec3(0.15, 0.07, 0.05);",
      "  vec3 lavaA = vec3(0.95, 0.18, 0.05);",
      "  vec3 lavaB = vec3(1.0, 0.65, 0.08);",
      "  vec3 lavaC = vec3(1.0, 0.92, 0.42);",
      "",
      "  vec3 crustColor = mix(darkA, darkB, fbm(q * 0.8));",
      "  vec3 lavaColor = mix(lavaA, lavaB, smoothstep(0.15, 0.85, glowMask));",
      "  lavaColor = mix(lavaColor, lavaC, pow(glowMask, 3.0));",
      "",
      "  float pulse = 0.88 + 0.12 * sin(u_time * 2.0 + base * 8.0);",
      "  lavaColor *= pulse;",
      "",
      "  vec3 color = mix(crustColor, lavaColor, glowMask);",
      "  color += veins * vec3(1.0, 0.45, 0.08) * 0.55;",
      "",
      "  float vignette = smoothstep(1.18, 0.2, length(p));",
      "  color *= vignette;",
      "",
      "  color = pow(color, vec3(0.92));",
      "  gl_FragColor = vec4(color, 1.0);",
      "}"
    ].join("\n");

    function createShader(type, source) {
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

    const vs = createShader(gl.VERTEX_SHADER, vertexSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }

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

    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      sizeRef.current = { width: width, height: height, dpr: dpr };

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      gl.viewport(0, 0, width, height);
    }

    resizeObserverRef.current = new ResizeObserver(function () {
      resize();
    });
    resizeObserverRef.current.observe(container);
    resize();

    const start = performance.now();

    function render(now) {
      const elapsed = (now - start) * 0.001;

      resize();

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(resolutionLoc, sizeRef.current.width, sizeRef.current.height);
      gl.uniform1f(timeLoc, elapsed);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

    return function () {
      cancelAnimationFrame(rafRef.current);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="dark-component"
      style={{
        width: "100%",
        height: "720px",
        position: "relative",
        overflow: "hidden",
        background: "radial-gradient(circle at 50% 50%, #180804 0%, #090303 45%, #020202 100%)",
        borderRadius: "24px",
        boxShadow: "inset 0 0 60px rgba(255,120,20,0.08), 0 20px 60px rgba(0,0,0,0.45)"
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
    </div>
  );
}