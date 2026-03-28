function LavaLoopingShader() {
  const mountRef = React.useRef(null);
  const animRef = React.useRef(null);
  const matRef = React.useRef(null);

  const [primaryColor, setPrimaryColor] = React.useState('#ff5500');
  const [secondaryColor, setSecondaryColor] = React.useState('#ffcc00');
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
        '  vec2 p = (uv - 0.5) * uScale + 0.5;',
        '  float t = uTime * 1.5;',
        '  float angle = 2.3387412;',
        '  mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));',
        '  vec2 q = rot * (p - 0.5);',
        '  float field = 0.0;',
        '  for (int i = 0; i < 7; i++) {',
        '    float fi = float(i);',
        '    float ph = fi * 0.9;',
        '    vec2 c = vec2(',
        '      0.28 * sin(t * (0.32 + fi * 0.03) + ph) + 0.10 * cos(t * (0.71 + fi * 0.02) + ph * 1.7),',
        '      0.22 * cos(t * (0.26 + fi * 0.025) + ph * 1.3) + 0.12 * sin(t * (0.63 + fi * 0.015) + ph * 2.1)',
        '    );',
        '    c = rot * c;',
        '    float r = 0.16 + 0.03 * sin(ph * 1.7 + t * 0.4);',
        '    float d = length(q - c);',
        '    field += (r * r) / max(d * d, 0.001);',
        '  }',
        '  float w1 = sin((p.x * 3.2 + p.y * 2.1) + t * 0.35) * 0.5 + 0.5;',
        '  float w2 = cos((p.y * 4.4 - p.x * 1.7) + t * 0.28 + 1.4) * 0.5 + 0.5;',
        '  float w3 = sin(length(p - 0.5) * 9.0 - t * 0.42 + 0.8) * 0.5 + 0.5;',
        '  float w4 = cos((p.x + p.y) * 5.3 - t * 0.31 + 2.2) * 0.5 + 0.5;',
        '  float lava = smoothstep(1.8, 2.4, field);',
        '  float rim = (smoothstep(1.35, 1.8, field) - smoothstep(1.8, 2.25, field)) * 1.2;',
        '  float mixWave = smoothstep(0.15, 0.85, (w1 * 0.3 + w2 * 0.25 + w3 * 0.25 + w4 * 0.2));',
        '  vec3 base = vec3(0.02, 0.02, 0.02);',
        '  vec3 lavaCol = mix(uPrimary, uSecondary, mixWave);',
        '  vec3 col = base;',
        '  col += lavaCol * lava * 0.95;',
        '  col += mix(uSecondary, uPrimary, w3) * rim * 0.9;',
        '  col += mix(uPrimary, uSecondary, w2) * rim * 0.45;',
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
export default LavaLoopingShader;