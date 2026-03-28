export default function LavaCrustShader() {
  const canvasRef = React.useRef(null);
  const wrapRef = React.useRef(null);

  React.useEffect(function () {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const gl =
      canvas.getContext("webgl", {
        antialias: false,
        alpha: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false
      }) || canvas.getContext("experimental-webgl");

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
      "  vec2 u = f * f * (3.0 - 2.0 * f);",
      "  float a = hash(i);",
      "  float b = hash(i + vec2(1.0, 0.0));",
      "  float c = hash(i + vec2(0.0, 1.0));",
      "  float d = hash(i + vec2(1.0, 1.0));",
      "  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);",
      "}",
      "",
      "mat2 rot(float a) {",
      "  float s = sin(a);",
      "  float c = cos(a);",
      "  return mat2(c, -s, s, c);",
      "}",
      "",
      "float fbm(vec2 p) {",
      "  float v = 0.0;",
      "  float a = 0.5;",
      "  for (int i = 0; i < 6; i++) {",
      "    v += a * noise(p);",
      "    p = rot(0.65) * p * 2.02 + vec2(4.1, 2.7);",
      "    a *= 0.52;",
      "  }",
      "  return v;",
      "}",
      "",
      "float ridge(vec2 p) {",
      "  float v = 0.0;",
      "  float a = 0.55;",
      "  for (int i = 0; i < 5; i++) {",
      "    float n = noise(p);",
      "    v += (1.0 - abs(n * 2.0 - 1.0)) * a;",
      "    p = rot(-0.9) * p * 2.18 + vec2(1.7, 5.4);",
      "    a *= 0.58;",
      "  }",
      "  return v;",
      "}",
      "",
      "void main() {",
      "  vec2 uv = gl_FragCoord.xy / u_resolution.xy;",
      "  vec2 p = uv * 2.0 - 1.0;",
      "  p.x *= u_resolution.x / u_resolution.y;",
      "",
      "  float t = u_time * 0.42;",
      "  vec2 flow = vec2(",
      "    fbm(p * 1.6 + vec2(t * 0.35, -t * 0.18)),",
      "    fbm(p * 1.6 + vec2(-t * 0.22, t * 0.31) + 11.7)",
      "  );",
      "",
      "  vec2 q = p * 2.35;",
      "  q += (flow - 0.5) * 1.05;",
      "  q = rot(0.2 * sin(t * 0.7)) * q;",
      "",
      "  float cells = ridge(q * 1.45 + vec2(t * 0.12, -t * 0.08));",
      "  float molten = fbm(q * 2.6 - vec2(t * 0.34, t * 0.19));",
      "  float deep = fbm(q * 4.2 + flow * 1.7 + 20.0);",
      "",
      "  float cracks = smoothstep(0.46, 0.74, cells - molten * 0.18 + deep * 0.08);",
      "  float veins = 1.0 - smoothstep(0.38, 0.56, abs(cells - 0.56 + molten * 0.15));",
      "  float glow = pow(clamp(veins, 0.0, 1.0), 2.6);",
      "  glow += pow(clamp(1.0 - cracks, 0.0, 1.0), 7.0) * 0.65;",
      "",
      "  vec3 crustA = vec3(0.05, 0.02, 0.01);",
      "  vec3 crustB = vec3(0.18, 0.05, 0.03);",
      "  vec3 lavaA = vec3(0.95, 0.23, 0.06);",
      "  vec3 lavaB = vec3(1.0, 0.66, 0.12);",
      "  vec3 lavaC = vec3(1.0, 0.95, 0.45);",
      "",
      "  float heat = clamp(molten * 0.9 + glow * 0.85 + deep * 0.2, 0.0, 1.0);",
      "  vec3 crust = mix(crustA, crustB, clamp(cells * 0.8 + deep * 0.25, 0.0, 1.0));",
      "  vec3 lava = mix(lavaA, lavaB, clamp(heat * 1.15, 0.0, 1.0));",
      "  lava = mix(lava, lavaC, pow(glow, 1.6));",
      "",
      "  vec3 color = mix(lava, crust, cracks);",
      "  color += lavaC * glow * 0.22;",
      "",
      "  float vignette = 1.0 - dot(uv - 0.5, uv - 0.5) * 1.15;",
      "  color *= clamp(vignette, 0.22, 1.0);",
      "  color = pow(color, vec3(0.92));",
      "",
      "  gl_FragColor = vec4(color, 1.0);",
      "}"
    ].join("\n");

    function compile(type, source) {
      const shader = gl.createShader(type);
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
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
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
    const timeLoc = gl.getUniformLocation(program, "u_time");
    const resolutionLoc = gl.getUniformLocation(program, "u_resolution");

    let raf = 0;
    let start = performance.now();
    let width = 1;
    let height = 1;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      const rect = wrap.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    const ro = new ResizeObserver(function () {
      resize();
    });
    ro.observe(wrap);
    resize();

    function frame(now) {
      const t = (now - start) * 0.001 * 1.18;

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.uniform1f(timeLoc, t);
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);

    return function () {
      cancelAnimationFrame(raf);
      ro.disconnect();
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
        height: "540px",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 50%, rgba(40,10,6,1) 0%, rgba(12,4,3,1) 55%, rgba(3,1,1,1) 100%)",
        borderRadius: "22px",
        boxShadow: "inset 0 0 40px rgba(255,120,40,0.08), 0 18px 50px rgba(0,0,0,0.45)"
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%"
        }}
      />
    </div>
  );
}