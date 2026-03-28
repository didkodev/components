function LavaLoopingShader() {
  const mountRef = React.useRef(null);
  const animRef = React.useRef(null);
  const matRef = React.useRef(null);

  const [primaryColor, setPrimaryColor] = React.useState('#ff4400');
  const [secondaryColor, setSecondaryColor] = React.useState('#cc0000');
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
        '  vec2 centered = uv - 0.5;',
        '  centered.x *= uRes.x / uRes.y;',
        '  vec2 p = centered * (1.6 * uScale);',
        '  float t = uTime * 0.55;',
        '',
        '  float w1 = sin(p.x * 2.2 + t + sin(p.y * 1.4 - t * 0.6)) * 0.5 + 0.5;',
        '  float w2 = cos(p.y * 2.0 - t * 0.8 + cos(p.x * 1.7 + t * 0.4)) * 0.5 + 0.5;',
        '  float w3 = sin((p.x + p.y) * 1.8 - t * 0.5) * 0.5 + 0.5;',
        '  float w4 = cos(length(p) * 3.2 - t * 0.9 + sin(p.x * 2.5)) * 0.5 + 0.5;',
        '  float w5 = sin((p.x - p.y) * 2.4 + t * 0.7) * 0.5 + 0.5;',
        '',
        '  float blobField = (w1 * 0.28 + w2 * 0.24 + w3 * 0.18 + w4 * 0.18 + w5 * 0.12);',
        '  float blobs = smoothstep(0.48, 0.82, blobField);',
        '  float innerGlow = smoothstep(0.58, 0.95, blobField);',
        '  float outerGlow = smoothstep(0.32, 0.7, blobField) * (1.0 - smoothstep(0.7, 0.98, blobField));',
        '',
        '  float swirl = sin(p.x * 3.8 + t * 0.6) * cos(p.y * 3.1 - t * 0.4) * 0.5 + 0.5;',
        '  float moltenMix = smoothstep(0.2, 0.8, mix(w3, swirl, 0.5));',
        '',
        '  vec3 col = vec3(0.02, 0.02, 0.02);',
        '  col += mix(uSecondary, uPrimary, moltenMix) * blobs * 0.95;',
        '  col += uPrimary * innerGlow * 0.55;',
        '  col += mix(uPrimary, uSecondary, w2) * outerGlow * 0.35;',
        '',
        '  float haze = smoothstep(0.15, 0.85, blobField) * 0.12;',
        '  col += mix(uSecondary, uPrimary, w1) * haze;',
        '',
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