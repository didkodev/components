export default function LavaMoltenShader() {
  const canvasRef = React.useRef(null);
  const wrapRef = React.useRef(null);
  const rafRef = React.useRef(0);
  const resizeRef = React.useRef(null);

  React.useEffect(function () {
    var canvas = canvasRef.current;
    var wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    var gl =
      canvas.getContext("webgl", { antialias: true, alpha: false }) ||
      canvas.getContext("experimental-webgl", { antialias: true, alpha: false });

    if (!gl) return;

    var vertexSource = [
      "attribute vec2 a_position;",
      "void main() {",
      "  gl_Position = vec4(a_position, 0.0, 1.0);",
      "}"
    ].join("\n");

    var fragmentSource = [
      "precision highp float;",
      "uniform vec2 u_resolution;",
      "uniform float u_time;",
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
      "    a *= 0.52;",
      "  }",
      "  return v;",
      "}",
      "",
      "void main() {",
      "  vec2 uv = gl_FragCoord.xy / u_resolution.xy;",
      "  vec2 p = uv - 0.5;",
      "  p.x *= u_resolution.x / u_resolution.y;",
      "",
      "  float t = u_time * 0.72;",
      "  vec2 flow = vec2(",
      "    fbm(p * 2.2 + vec2(0.0, -t * 1.2)),",
      "    fbm(p * 2.8 + vec2(4.2, -t * 0.9))",
      "  );",
      "",
      "  vec2 q = p * 3.1;",
      "  q += 0.45 * vec2(",
      "    sin(q.y * 2.0 + t * 1.7),",
      "    cos(q.x * 1.7 - t * 1.3)",
      "  );",
      "  q += (flow - 0.5) * 1.15;",
      "",
      "  float n1 = fbm(q + vec2(0.0, -t * 1.8));",
      "  float n2 = fbm(q * 1.7 - vec2(1.3, t * 1.15));",
      "  float lava = n1 * 0.7 + n2 * 0.45;",
      "",
      "  float veins = smoothstep(0.48, 0.9, lava + 0.16 * sin((p.y + lava) * 12.0 - t * 2.2));",
      "  float glow = pow(max(veins, 0.0), 2.4);",
      "  float crust = 1.0 - smoothstep(0.24, 0.7, lava);",
      "",
      "  vec3 deep = vec3(0.04, 0.01, 0.01);",
      "  vec3 rock = vec3(0.16, 0.04, 0.02);",
      "  vec3 ember = vec3(0.88, 0.19, 0.03);",
      "  vec3 hot = vec3(1.0, 0.48, 0.03);",
      "  vec3 core = vec3(1.0, 0.88, 0.25);",
      "",
      "  vec3 col = mix(deep, rock, clamp(crust * 1.15, 0.0, 1.0));",
      "  col = mix(col, ember, smoothstep(0.36, 0.7, veins) * 0.85);",
      "  col = mix(col, hot, smoothstep(0.58, 0.9, veins));",
      "  col = mix(col, core, smoothstep(0.78, 1.0, glow));",
      "",
      "  float vignette = 1.0 - dot(p * 0.75, p * 0.75);",
      "  col *= 0.75 + 0.45 * clamp(vignette, 0.0, 1.0);",
      "",
      "  float sparks = pow(noise(p * 18.0 + vec2(0.0, -t * 4.0)), 14.0) * glow * 1.8;",
      "  col += vec3(1.0, 0.55, 0.12) * sparks;",
      "",
      "  gl_FragColor = vec4(col, 1.0);",
      "}"
    ].join("\n");

    function compile(type, source) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    var vs = compile(gl.VERTEX_SHADER, vertexSource);
    var fs = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vs || !fs) return;

    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

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

    var positionLoc = gl.getAttribLocation(program, "a_position");
    var timeLoc = gl.getUniformLocation(program, "u_time");
    var resLoc = gl.getUniformLocation(program, "u_resolution");

    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    function resize() {
      var rect = wrap.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.max(1, Math.floor(rect.width * dpr));
      var height = Math.max(1, Math.floor(rect.height * dpr));
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

    var start = performance.now();

    function render(now) {
      var t = (now - start) * 0.001;
      gl.useProgram(program);
      gl.uniform1f(timeLoc, t);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

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
        height: "540px",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 50%, rgba(60,10,4,1) 0%, rgba(20,3,3,1) 55%, rgba(5,1,1,1) 100%)",
        borderRadius: "24px",
        boxShadow:
          "inset 0 0 40px rgba(255,120,40,0.08), 0 18px 50px rgba(0,0,0,0.45)"
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
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 50% 120%, rgba(255,180,80,0.08), rgba(0,0,0,0) 45%), linear-gradient(180deg, rgba(255,120,30,0.05), rgba(0,0,0,0.1))"
        }}
      />
    </div>
  );
}