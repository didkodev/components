export default function LavaCrustShader() {
  var canvasRef = React.useRef(null);
  var wrapRef = React.useRef(null);
  var rafRef = React.useRef(0);
  var roRef = React.useRef(null);
  var stateRef = React.useRef({
    width: 0,
    height: 0,
    dpr: 1,
    time: 0,
    start: 0,
    pointerX: 0.5,
    pointerY: 0.5
  });

  React.useEffect(function () {
    var canvas = canvasRef.current;
    var wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    var gl =
      canvas.getContext("webgl", {
        antialias: true,
        alpha: true,
        premultipliedAlpha: true
      }) ||
      canvas.getContext("experimental-webgl");

    if (!gl) return;

    var vertexSource = [
      "attribute vec2 a_position;",
      "void main(){",
      "  gl_Position = vec4(a_position, 0.0, 1.0);",
      "}"
    ].join("\n");

    var fragmentSource = [
      "precision highp float;",
      "uniform vec2 u_resolution;",
      "uniform float u_time;",
      "uniform vec2 u_pointer;",
      "",
      "float hash(vec2 p){",
      "  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);",
      "}",
      "",
      "float noise(vec2 p){",
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
      "mat2 rot(float a){",
      "  float s = sin(a);",
      "  float c = cos(a);",
      "  return mat2(c, -s, s, c);",
      "}",
      "",
      "float fbm(vec2 p){",
      "  float v = 0.0;",
      "  float a = 0.5;",
      "  for(int i = 0; i < 7; i++){",
      "    v += a * noise(p);",
      "    p = rot(0.55) * p * 2.03 + vec2(7.1, 3.7);",
      "    a *= 0.53;",
      "  }",
      "  return v;",
      "}",
      "",
      "float ridged(vec2 p){",
      "  float v = 0.0;",
      "  float a = 0.55;",
      "  for(int i = 0; i < 6; i++){",
      "    float n = noise(p);",
      "    n = 1.0 - abs(n * 2.0 - 1.0);",
      "    v += n * a;",
      "    p = rot(-0.42) * p * 2.11 + vec2(1.8, 9.2);",
      "    a *= 0.58;",
      "  }",
      "  return v;",
      "}",
      "",
      "void main(){",
      "  vec2 uv = gl_FragCoord.xy / u_resolution.xy;",
      "  vec2 p = uv * 2.0 - 1.0;",
      "  p.x *= u_resolution.x / u_resolution.y;",
      "",
      "  float t = u_time * 0.38;",
      "  vec2 ptr = (u_pointer * 2.0 - 1.0);",
      "  ptr.x *= u_resolution.x / u_resolution.y;",
      "",
      "  vec2 q = p;",
      "  q += 0.08 * vec2(sin(t * 1.1 + p.y * 3.0), cos(t * 1.3 + p.x * 2.7));",
      "  q += ptr * 0.12;",
      "",
      "  float flow = fbm(q * 2.6 + vec2(t * 0.9, -t * 0.45));",
      "  float flow2 = fbm(q * 4.8 - vec2(t * 0.5, t * 0.8));",
      "  float crackBase = ridged(q * 5.5 + flow * 1.8 + vec2(-t * 0.4, t * 0.25));",
      "  float crackVein = ridged(q * 11.0 + flow2 * 0.9 - vec2(t * 0.35, t * 0.2));",
      "",
      "  float crust = smoothstep(0.48, 0.8, crackBase * 0.95 + crackVein * 0.45);",
      "  float fissure = 1.0 - smoothstep(0.34, 0.56, crackBase + crackVein * 0.55);",
      "  float ember = smoothstep(0.22, 0.74, fbm(q * 7.0 - vec2(t * 1.1, -t * 0.4) + fissure * 0.4));",
      "",
      "  float pulse = 0.65 + 0.35 * sin(u_time * 1.5 + flow * 6.2831);",
      "  float lava = fissure * (0.72 + 0.95 * ember) * pulse;",
      "  lava += pow(max(fissure, 0.0), 3.0) * 1.4;",
      "",
      "  vec3 bg = vec3(0.015, 0.01, 0.012);",
      "  vec3 crustColor = mix(vec3(0.08, 0.045, 0.03), vec3(0.2, 0.11, 0.06), crust);",
      "  crustColor *= 0.55 + 0.45 * flow;",
      "",
      "  vec3 lavaA = vec3(0.95, 0.15, 0.04);",
      "  vec3 lavaB = vec3(1.0, 0.48, 0.05);",
      "  vec3 lavaC = vec3(1.0, 0.9, 0.42);",
      "  vec3 lavaColor = mix(lavaA, lavaB, smoothstep(0.1, 0.6, ember));",
      "  lavaColor = mix(lavaColor, lavaC, smoothstep(0.55, 1.2, lava));",
      "",
      "  float glow = smoothstep(0.0, 0.9, fissure) * (0.35 + 0.65 * ember);",
      "  vec3 color = mix(bg, crustColor, crust);",
      "  color += lavaColor * lava * 1.15;",
      "  color += lavaB * glow * 0.18;",
      "",
      "  float vignette = 1.0 - dot(uv - 0.5, uv - 0.5) * 0.9;",
      "  color *= clamp(vignette, 0.25, 1.0);",
      "  color = pow(color, vec3(0.92));",
      "",
      "  gl_FragColor = vec4(color, 1.0);",
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

    var vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return;

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    var positionBuffer = gl.createBuffer();
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

    var positionLocation = gl.getAttribLocation(program, "a_position");
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    var timeLocation = gl.getUniformLocation(program, "u_time");
    var pointerLocation = gl.getUniformLocation(program, "u_pointer");

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    function resize() {
      var rect = wrap.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      stateRef.current.width = Math.max(1, Math.floor(rect.width));
      stateRef.current.height = Math.max(1, Math.floor(rect.height));
      stateRef.current.dpr = dpr;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function render(ts) {
      if (!stateRef.current.start) stateRef.current.start = ts;
      stateRef.current.time = (ts - stateRef.current.start) * 0.001;

      gl.useProgram(program);
      gl.uniform2f(
        resolutionLocation,
        canvas.width,
        canvas.height
      );
      gl.uniform1f(timeLocation, stateRef.current.time);
      gl.uniform2f(
        pointerLocation,
        stateRef.current.pointerX,
        stateRef.current.pointerY
      );

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(render);
    }

    function onPointerMove(e) {
      var rect = canvas.getBoundingClientRect();
      stateRef.current.pointerX = (e.clientX - rect.left) / Math.max(1, rect.width);
      stateRef.current.pointerY = 1 - (e.clientY - rect.top) / Math.max(1, rect.height);
    }

    function onPointerLeave() {
      stateRef.current.pointerX = 0.5;
      stateRef.current.pointerY = 0.5;
    }

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    roRef.current = new ResizeObserver(function () {
      resize();
    });
    roRef.current.observe(wrap);

    resize();
    rafRef.current = requestAnimationFrame(render);

    return function () {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      if (roRef.current) roRef.current.disconnect();
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return React.createElement(
    "div",
    {
      ref: wrapRef,
      className: "dark-component",
      style: {
        width: "100%",
        height: "680px",
        position: "relative",
        overflow: "hidden",
        borderRadius: "20px",
        background:
          "radial-gradient(circle at 50% 40%, rgba(60,16,8,0.45), rgba(5,5,8,1) 70%)",
        boxShadow:
          "0 0 0 1px rgba(255,120,60,0.08) inset, 0 20px 60px rgba(0,0,0,0.45)"
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
          left: "18px",
          bottom: "14px",
          color: "rgba(255,190,140,0.72)",
          fontFamily: "system-ui, sans-serif",
          fontSize: "12px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          pointerEvents: "none",
          textShadow: "0 0 12px rgba(255,120,40,0.28)"
        }
      },
      "Lava Crust"
    )
  );
}