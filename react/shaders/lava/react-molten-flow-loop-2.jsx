function LavaLampShader() {
  const mountRef = React.useRef(null);
  const animRef = React.useRef(null);
  const matRef = React.useRef(null);

  const [primaryColor, setPrimaryColor] = React.useState('#ff2200');
  const [secondaryColor, setSecondaryColor] = React.useState('#ffaa00');
  const [speed, setSpeed] = React.useState(1);
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    window.__paramSetters = window.__paramSetters || {};
    window.__paramSetters['primaryColor'] = function(v) {
      setPrimaryColor(v);
      if (matRef.current) { var c = new THREE.Color(v); matRef.current.uniforms.uPrimary.value.set(c.r, c.g, c.b); }
    };
    window.__paramSetters['secondaryColor'] = function(v) {
      setSecondaryColor(v);
      if (matRef.current) { var c = new THREE.Color(v); matRef.current.uniforms.uSecondary.value.set(c.r, c.g, c.b); }
    };
    window.__paramSetters['speed'] = function(v) {
      setSpeed(Number(v));
      if (matRef.current) matRef.current.uniforms.uSpeed.value = Number(v);
    };
    window.__paramSetters['scale'] = function(v) {
      setScale(Number(v));
      if (matRef.current) matRef.current.uniforms.uScale.value = Number(v);
    };
  }, []);

  React.useEffect(function() {
    var el = mountRef.current;
    if (!el) return;
    var scene = new THREE.Scene();
    var cam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    var renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    var pc = new THREE.Color(primaryColor);
    var sc = new THREE.Color(secondaryColor);
    var mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uRes: { value: new THREE.Vector2(el.clientWidth, el.clientHeight) },
        uPrimary: { value: new THREE.Vector3(pc.r, pc.g, pc.b) },
        uSecondary: { value: new THREE.Vector3(sc.r, sc.g, sc.b) },
        uSpeed: { value: 1.0 },
        uScale: { value: 1.0 }
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }',
      fragmentShader: [
        'uniform float uTime;',
        'uniform vec2 uRes;',
        'uniform vec3 uPrimary;',
        'uniform vec3 uSecondary;',
        'uniform float uSpeed;',
        'uniform float uScale;',
        'varying vec2 vUv;',
        'void main() {',
        '  vec2 uv = vUv;',
        '  vec2 p = (uv - 0.5) * uScale;',
        '  float t = uTime * 0.55;',
        '  float angle = radians(64.0);',
        '  mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));',
        '  vec2 flow = rot * p;',
        '  float field = 0.0;',
        '  float d1 = length(flow - vec2(sin(t * 0.70 + 0.2) * 0.22, cos(t * 0.55 + 1.1) * 0.18));',
        '  float d2 = length(flow - vec2(cos(t * 0.62 + 1.4) * 0.28, sin(t * 0.48 + 2.0) * 0.20));',
        '  float d3 = length(flow - vec2(sin(t * 0.58 + 2.3) * 0.24, cos(t * 0.66 + 2.8) * 0.22));',
        '  float d4 = length(flow - vec2(cos(t * 0.74 + 3.2) * 0.20, sin(t * 0.57 + 3.7) * 0.26));',
        '  float d5 = length(flow - vec2(sin(t * 0.69 + 4.1) * 0.30, cos(t * 0.52 + 4.6) * 0.17));',
        '  float d6 = length(flow - vec2(cos(t * 0.53 + 5.0) * 0.26, sin(t * 0.71 + 5.5) * 0.23));',
        '  float d7 = length(flow - vec2(sin(t * 0.61 + 5.9) * 0.21, cos(t * 0.59 + 0.7) * 0.28));',
        '  float d8 = length(flow - vec2(cos(t * 0.67 + 0.9) * 0.25, sin(t * 0.64 + 1.8) * 0.21));',
        '  field += 0.050 / (d1 * d1 + 0.020);',
        '  field += 0.052 / (d2 * d2 + 0.022);',
        '  field += 0.049 / (d3 * d3 + 0.021);',
        '  field += 0.054 / (d4 * d4 + 0.023);',
        '  field += 0.051 / (d5 * d5 + 0.020);',
        '  field += 0.053 / (d6 * d6 + 0.022);',
        '  field += 0.048 / (d7 * d7 + 0.021);',
        '  field += 0.055 / (d8 * d8 + 0.024);',
        '  float w1 = sin(flow.x * 3.2 + t * 0.9 + sin(flow.y * 2.1)) * 0.5 + 0.5;',
        '  float w2 = cos(flow.y * 4.1 - t * 0.7 + flow.x * 1.8) * 0.5 + 0.5;',
        '  float w3 = sin((flow.x + flow.y) * 3.6 + t * 0.8 + 1.7) * 0.5 + 0.5;',
        '  float w4 = cos(length(flow) * 8.0 - t * 1.0 + 0.9) * 0.5 + 0.5;',
        '  float blobMask = smoothstep(1.05, 1.45, field);',
        '  float inner = smoothstep(1.18, 1.85, field);',
        '  float rim = smoothstep(0.98, 1.18, field) - smoothstep(1.18, 1.38, field);',
        '  float mixWave = clamp(w1 * 0.30 + w2 * 0.25 + w3 * 0.25 + w4 * 0.20, 0.0, 1.0);',
        '  vec3 col = vec3(0.02);',
        '  vec3 lava = mix(uPrimary, uSecondary, mixWave);',
        '  col += lava * blobMask * 0.55;',
        '  col += mix(uPrimary, uSecondary, w3) * inner * 0.45;',
        '  col += mix(uSecondary, uPrimary, w2) * rim * 0.9;',
        '  col = clamp(col, 0.0, 1.0);',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    matRef.current = mat;
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), mat));

    var ro = new ResizeObserver(function() {
      renderer.setSize(el.clientWidth, el.clientHeight);
      mat.uniforms.uRes.value.set(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);

    var t = 0;
    function loop() {
      animRef.current = requestAnimationFrame(loop);
      t += 0.016 * mat.uniforms.uSpeed.value;
      mat.uniforms.uTime.value = t;
      renderer.render(scene, cam);
    }
    loop();

    return function() {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return React.createElement('div', {
    ref: mountRef,
    className: 'component-root dark-component',
    style: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }
  });
}
export default LavaLampShader;