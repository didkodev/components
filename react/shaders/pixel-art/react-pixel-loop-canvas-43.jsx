export default function PixelArtShader153429() {
  var SPEED = 1.0;
  var COUNT = 5;

  var canvasRef = React.useRef(null);
  var frameRef = React.useRef(0);
  var resizeObserverRef = React.useRef(null);
  var paramsRef = React.useRef({
    colorA: '#2b2f77',
    colorB: '#7a2f8f',
    colorC: '#1db6a3',
    pixelSize: 18,
    flow: 0.9,
    glow: true
  });

  var needsResizeRef = React.useRef(true);

  function registerParams() {
    window.__paramSetters = {
      colorA: function(v) {
        paramsRef.current.colorA = v;
      },
      colorB: function(v) {
        paramsRef.current.colorB = v;
      },
      colorC: function(v) {
        paramsRef.current.colorC = v;
      },
      pixelSize: function(v) {
        paramsRef.current.pixelSize = v;
      },
      flow: function(v) {
        paramsRef.current.flow = v;
      },
      glow: function(v) {
        paramsRef.current.glow = v;
      }
    };
  }

  function hexToRgb(hex) {
    var value = (hex || '').replace('#', '');
    if (value.length === 3) {
      value = value.charAt(0) + value.charAt(0) + value.charAt(1) + value.charAt(1) + value.charAt(2) + value.charAt(2);
    }
    var num = parseInt(value || '0', 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(x, min, max) {
    return Math.max(min, Math.min(max, x));
  }

  function smoothstep(edge0, edge1, x) {
    var t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function fract(x) {
    return x - Math.floor(x);
  }

  function hash2(x, y) {
    var h = Math.sin(x * 127.1 + y * 311.7 + 153.429) * 43758.5453123;
    return fract(h);
  }

  function noise2(x, y) {
    var ix = Math.floor(x);
    var iy = Math.floor(y);
    var fx = x - ix;
    var fy = y - iy;

    var a = hash2(ix, iy);
    var b = hash2(ix + 1, iy);
    var c = hash2(ix, iy + 1);
    var d = hash2(ix + 1, iy + 1);

    var ux = fx * fx * (3 - 2 * fx);
    var uy = fy * fy * (3 - 2 * fy);

    return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
  }

  function fbm(x, y, t, flow) {
    var v = 0;
    var a = 0.5;
    var f = 1.0;
    var i = 0;
    for (i = 0; i < COUNT; i += 1) {
      v += noise2(x * f + t * 0.35 * flow, y * f - t * 0.22 * flow) * a;
      f *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  function setupRenderer(canvas) {
    var ctx = canvas.getContext('2d', { alpha: false });
    return ctx;
  }

  function draw(ctx, time) {
    var canvas = ctx.canvas;
    var dpr = window.devicePixelRatio || 1;

    if (needsResizeRef.current) {
      var rect = canvas.getBoundingClientRect();
      var width = Math.max(1, Math.floor(rect.width * dpr));
      var height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      needsResizeRef.current = false;
    }

    var widthPx = canvas.width;
    var heightPx = canvas.height;

    var p = paramsRef.current;
    var c1 = hexToRgb(p.colorA);
    var c2 = hexToRgb(p.colorB);
    var c3 = hexToRgb(p.colorC);

    var image = ctx.createImageData(widthPx, heightPx);
    var data = image.data;

    var block = Math.max(6, Math.floor(p.pixelSize * dpr));
    var cols = Math.ceil(widthPx / block);
    var rows = Math.ceil(heightPx / block);

    var t = time * (0.35 + 0.65 * p.flow) * SPEED;
    var intensity = 0.29;
    var y = 0;
    var x = 0;

    for (y = 0; y < rows; y += 1) {
      for (x = 0; x < cols; x += 1) {
        var nx = x / Math.max(1, cols);
        var ny = y / Math.max(1, rows);

        var gx = nx - 0.5;
        var gy = ny - 0.5;
        var dist = Math.sqrt(gx * gx + gy * gy);

        var angleWarp = Math.atan2(gy, gx) * 1.5;
        var base = fbm(nx * 4.2 + Math.cos(angleWarp) * 0.7, ny * 4.8 + Math.sin(angleWarp) * 0.7, t, p.flow);
        var band = Math.sin((nx * 8.0 + ny * 6.5 + base * 3.2) * 3.14159 + t * 2.8);
        var swirl = Math.sin(dist * 18.0 - t * 4.5 + base * 6.0);
        var field = base * 0.55 + band * 0.25 + swirl * 0.2;

        var q = smoothstep(0.18, 0.82, field * 0.5 + 0.5);
        var stepA = q < 0.33 ? 0 : q < 0.66 ? 1 : 2;
        var localPulse = 0.5 + 0.5 * Math.sin(t * 3.5 + nx * 10.0 + ny * 14.0);
        var glowMix = p.glow ? localPulse * intensity : 0;

        var rr = 0;
        var gg = 0;
        var bb = 0;

        if (stepA === 0) {
          rr = lerp(c1.r * 0.45, c1.r, glowMix + q * 0.7);
          gg = lerp(c1.g * 0.45, c1.g, glowMix + q * 0.7);
          bb = lerp(c1.b * 0.45, c1.b, glowMix + q * 0.7);
        } else if (stepA === 1) {
          var midT = (q - 0.33) / 0.33;
          rr = lerp(c1.r, c2.r, midT);
          gg = lerp(c1.g, c2.g, midT);
          bb = lerp(c1.b, c2.b, midT);
          rr = lerp(rr * 0.65, rr, 0.75 + glowMix);
          gg = lerp(gg * 0.65, gg, 0.75 + glowMix);
          bb = lerp(bb * 0.65, bb, 0.75 + glowMix);
        } else {
          var highT = (q - 0.66) / 0.34;
          rr = lerp(c2.r, c3.r, highT);
          gg = lerp(c2.g, c3.g, highT);
          bb = lerp(c2.b, c3.b, highT);
          rr = lerp(rr * 0.75, rr, 0.85 + glowMix);
          gg = lerp(gg * 0.75, gg, 0.85 + glowMix);
          bb = lerp(bb * 0.75, bb, 0.85 + glowMix);
        }

        var edge = Math.min(
          x * block,
          y * block,
          widthPx - (x + 1) * block,
          heightPx - (y + 1) * block
        );
        var vignette = smoothstep(-block * 2, widthPx * 0.22, edge);
        rr *= 0.55 + 0.45 * vignette;
        gg *= 0.55 + 0.45 * vignette;
        bb *= 0.6 + 0.4 * vignette;

        var px = x * block;
        var py = y * block;
        var yy = 0;
        var xx = 0;

        for (yy = 0; yy < block; yy += 1) {
          var sy = py + yy;
          if (sy >= heightPx) {
            continue;
          }
          for (xx = 0; xx < block; xx += 1) {
            var sx = px + xx;
            if (sx >= widthPx) {
              continue;
            }

            var idx = (sy * widthPx + sx) * 4;
            var gridShade = 1.0;

            if (p.glow) {
              var gxEdge = Math.min(xx, block - 1 - xx) / Math.max(1, block - 1);
              var gyEdge = Math.min(yy, block - 1 - yy) / Math.max(1, block - 1);
              var inner = Math.min(gxEdge, gyEdge);
              gridShade = 0.82 + 0.3 * smoothstep(0.0, 0.4, inner);
            } else {
              if (xx === 0 || yy === 0) {
                gridShade = 0.82;
              }
            }

            data[idx] = clamp(rr * gridShade, 0, 255);
            data[idx + 1] = clamp(gg * gridShade, 0, 255);
            data[idx + 2] = clamp(bb * gridShade, 0, 255);
            data[idx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(image, 0, 0);
  }

  function animate(ctx) {
    function loop(now) {
      draw(ctx, now * 0.001);
      frameRef.current = requestAnimationFrame(loop);
    }
    frameRef.current = requestAnimationFrame(loop);
  }

  React.useEffect(function() {
    registerParams();

    var canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    var ctx = setupRenderer(canvas);
    if (!ctx) {
      return;
    }

    var observer = new ResizeObserver(function() {
      needsResizeRef.current = true;
    });

    resizeObserverRef.current = observer;
    observer.observe(canvas);

    animate(ctx);

    return function() {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return React.createElement(
    'div',
    {
      className: 'dark-component',
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#0d0d0d',
        overflow: 'hidden'
      }
    },
    React.createElement('canvas', {
      ref: canvasRef,
      style: {
        width: '100%',
        height: '100%',
        display: 'block'
      }
    })
  );
}