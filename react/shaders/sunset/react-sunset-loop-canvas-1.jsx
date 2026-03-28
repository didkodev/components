function SunsetLoopingShader() {
  const mountRef = React.useRef(null);
  const animRef = React.useRef(null);
  const matRef = React.useRef(null);

  const [primaryColor, setPrimaryColor] = React.useState('#ff6b00');
  const [secondaryColor, setSecondaryColor] = React.useState('#9900ff');
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
        '  float w1 = sin(p.x * 3.2 + t * 0.9) * 0.5 + 0.5;',
        '  float w2 = cos(p.y * 2.7 - t * 0.7 + 1.4) * 0.5 + 0.5;',
        '  float w3 = sin((p.x + p.y) * 2.1 + t * 0.6 + 2.2) * 0.5 + 0.5;',
        '  float w4 = cos(length(p - vec2(0.12 * sin(t * 0.4), 0.08 * cos(t * 0.5))) * 7.5 - t * 0.8) * 0.5 + 0.5;',
        '  float w5 = sin(length(p + vec2(0.18 * cos(t * 0.3), 0.14 * sin(t * 0.45))) * 6.0 + t * 0.5) * 0.5 + 0.5;',
        '  float blobA = smoothstep(0.35, 0.88, w1 * 0.35 + w3 * 0.4 + w4 * 0.45);',
        '  float blobB = smoothstep(0.30, 0.85, w2 * 0.4 + w5 * 0.5 + w3 * 0.25);',
        '  float blend = smoothstep(0.2, 0.8, (w1 + w2 + w3 + w4 + w5) / 5.0);',
        '  float glow = smoothstep(0.45, 1.0, blobA + blobB * 0.8) * 0.35;',
        '  vec3 col = vec3(0.02, 0.02, 0.02);',
        '  col += uPrimary * blobA * 0.75;',
        '  col += uSecondary * blobB * 0.65;',
        '  col += mix(uPrimary, uSecondary, blend) * 0.45;',
        '  col += mix(uPrimary, uSecondary, 0.3 + 0.3 * sin(t + p.x * 2.0 + p.y * 2.0)) * glow;',
        '  col = mix(col, mix(uPrimary, uSecondary, blend), smoothstep(0.55, 0.95, glow) * 0.18);',
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
export default SunsetLoopingShader;