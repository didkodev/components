export default function LavaCrustShader() {
  const canvasRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const rafRef = React.useRef(0);
  const resizeObserverRef = React.useRef(null);
  const uniformsRef = React.useRef({
    time: 0,
    width: 1,
    height: 1,
    dpr: 1,
    mouseX: 0.5,
    mouseY: 0.5
  });

  React.useEffect(function () {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl =
      canvas.getContext("webgl", {
        antialias: true,
        alpha: true,
        premultipliedAlpha: true
      }) ||
      canvas.getContext("experimental-webgl");

    if (!gl) return;

    const vertexSource = [
      "attribute vec2 aPosition;",
      "void main() {",
      "  gl_Position = vec4(aPosition, 0.0, 1.0);",
      "}"
    ].join("\n");

    const fragmentSource = [
      "precision highp float;",
      "uniform vec2 uResolution;",
      "uniform float uTime;",
      "uniform vec2 uMouse;",
      "",
      "float hash(vec2 p) {",
      "  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);",
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
      "float cracks(vec2 uv, float t) {",
      "  vec2 p = uv;",
      "  float n1 = fbm(p * 4.5 + vec2(t * 0.12, -t * 0.08));",
      "  float n2 = fbm(p * 8.5 - vec2(t * 0.18, t * 0.11));",
      "  float n3 = fbm(p * 14.0 + vec2(-t * 0.07, t * 0.16));",
      "  float field = n1 * 0.65 + n2 * 0.25 + n3 * 0.10;",
      "  float ridge = abs(field - 0.52);",
      "  float c = 1.0 - smoothstep(0.0, 0.055, ridge);",
      "  return c;",
      "}",
      "",
      "void main() {",
      "  vec2 uv = gl_FragCoord.xy / uResolution.xy;",
      "  vec2 p = uv - 0.5;",
      "  p.x *= uResolution.x / uResolution.y;",
      "",
      "  float t = uTime * 0.55;",
      "  vec2 drift = vec2(0.0, t * 0.22);",
      "  vec2 warp = vec2(",
      "    fbm(p * 2.4 + vec2(0.0, t * 0.35)),",
      "    fbm(p * 2.4 + vec2(5.2, -t * 0.28))",
      "  );",
      "  warp = (warp - 0.5) * 0.38;",
      "",
      "  vec2 q = p + drift + warp;",
      "  float crust = cracks(q, t);",
      "",
      "  float molten = fbm(q * 3.8 - vec2(0.0, t * 0.75));",
      "  molten += 0.5 * fbm(q * 7.0 + vec2(t * 0.35, -t * 0.45));",
      "  molten /= 1.5;",
      "",
      "  float glow = smoothstep(0.28, 0.92, molten);",
      "  glow *= 1.0 - crust * 0.88;",
      "",
      "  float ember = pow(max(glow, 0.0), 1.8);",
      "  float heat = smoothstep(0.45, 1.0, molten) * (1.0 - crust * 0.6);",
      "",
      "  vec3 coal = vec3(0.03, 0.02, 0.025);",
      "  vec3 rock = vec3(0.14, 0.07, 0.05);",
      "  vec3 red = vec3(0.75, 0.08, 0.03);",
      "  vec3 orange = vec3(0.98, 0.34, 0.02);",
      "  vec3 yellow = vec3(1.0, 0.78, 0.18);",
      "  vec3 magenta = vec3(0.55, 0.08, 0.18);",
      "",
      "  vec3 lava = mix(red, orange, smoothstep(0.25, 0.7, heat));",
      "  lava = mix(lava, yellow, smoothstep(0.7, 1.0, heat));",
      "  lava = mix(lava, magenta, smoothstep(0.0, 0.35, 1.0 - heat) * 0.22);",
      "",
      "  vec3 base = mix(coal, rock, smoothstep(0.15, 0.55, molten) * 0.35);",
      "  vec3 color = mix(base, lava, ember);",
      "",
      "  float rim = smoothstep(1.15, 0.12, length(p));",
      "  color *= rim;",
      "",
      "  float pulse = 0.96 + 0.04 * sin(uTime * 1.7);",
      "  color *= pulse;",
      "",
      "  float vignette = smoothstep(0.95, 0.22, length(p * vec2(0.92, 1.08)));",
      "  color *= vignette;",
      "",
      "  gl_FragColor = vec4(color, 1.0);",
      "}"
    ].join("\n");

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }

    const positionBuffer = gl.createBuffer();
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

    const aPosition = gl.getAttribLocation(program, "aPosition");
    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uMouse = gl.getUniformLocation(program, "uMouse");

    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";

      uniformsRef.current.width = width;
      uniformsRef.current.height = height;
      uniformsRef.current.dpr = dpr;

      gl.viewport(0, 0, width, height);
    }

    resizeObserverRef.current = new ResizeObserver(function () {
      resize();
    });
    resizeObserverRef.current.observe(container);

    function onPointerMove(event) {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(1, rect.width);
      const y = (event.clientY - rect.top) / Math.max(1, rect.height);
      uniformsRef.current.mouseX = Math.max(0, Math.min(1, x));
      uniformsRef.current.mouseY = Math.max(0, Math.min(1, 1 - y));
    }

    container.addEventListener("pointermove", onPointerMove);

    const start = performance.now();

    function render(now) {
      uniformsRef.current.time = (now - start) * 0.001;

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uResolution, uniformsRef.current.width, uniformsRef.current.height);
      gl.uniform1f(uTime, uniformsRef.current.time);
      gl.uniform2f(uMouse, uniformsRef.current.mouseX, uniformsRef.current.mouseY);

      gl.clearColor(0.01, 0.005, 0.01, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafRef.current = requestAnimationFrame(render);
    }

    resize();
    rafRef.current = requestAnimationFrame(render);

    return function () {
      cancelAnimationFrame(rafRef.current);
      container.removeEventListener("pointermove", onPointerMove);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return React.createElement(
    "div",
    {
      ref: containerRef,
      className: "dark-component",
      style: {
        position: "relative",
        width: "100%",
        height: "640px",
        overflow: "hidden",
        borderRadius: "24px",
        background: "radial-gradient(circle at 50% 50%, rgba(40,10,8,0.55) 0%, rgba(8,4,10,1) 70%)",
        boxShadow: "inset 0 0 80px rgba(255,80,20,0.08), 0 20px 60px rgba(0,0,0,0.45)"
      }
    },
    React.createElement("canvas", {
      ref: canvasRef,
      style: {
        display: "block",
        width: "100%",
        height: "100%"
      }
    }),
    React.createElement(
      "div",
      {
        style: {
          position: "absolute",
          left: "24px",
          top: "20px",
          color: "rgba(255,210,170,0.9)",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "12px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          pointerEvents: "none",
          textShadow: "0 0 12px rgba(255,120,40,0.35)"
        }
      },
      "Lava Crust"
    )
  );
}