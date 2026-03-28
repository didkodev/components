import React, { useEffect, useState } from 'react';

export default function CyberpunkSpinner() {
  const [rotation, setRotation] = useState(0);
  const [innerRotation, setInnerRotation] = useState(0);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    let frame;
    let start = null;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;

      setRotation((elapsed * 0.18) % 360);
      setInnerRotation((-(elapsed * 0.3)) % 360);
      setPulse(Math.sin(elapsed * 0.004) * 0.5 + 0.5);

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const hexPoints = (cx, cy, r) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      points.push((cx + r * Math.cos(angle)) + ',' + (cy + r * Math.sin(angle)));
    }
    return points.join(' ');
  };

  const triPoints = (cx, cy, r, offset) => {
    const points = [];
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 / 3) * i + offset;
      points.push((cx + r * Math.cos(angle)) + ',' + (cy + r * Math.sin(angle)));
    }
    return points.join(' ');
  };

  const glowIntensity = 8 + pulse * 6;
  const outerGlow = 12 + pulse * 8;

  const segments = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + (rotation * Math.PI / 180);
    const x1 = 64 + 24 * Math.cos(angle);
    const y1 = 64 + 24 * Math.sin(angle);
    const x2 = 64 + 52 * Math.cos(angle + 0.35);
    const y2 = 64 + 52 * Math.sin(angle + 0.35);
    const x3 = 64 + 52 * Math.cos(angle - 0.35);
    const y3 = 64 + 52 * Math.sin(angle - 0.35);
    segments.push(x1 + ',' + y1 + ' ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3);
  }

  const innerSegments = [];
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 / 3) * i + (innerRotation * Math.PI / 180);
    const x1 = 64 + 10 * Math.cos(angle);
    const y1 = 64 + 10 * Math.sin(angle);
    const x2 = 64 + 22 * Math.cos(angle + 0.6);
    const y2 = 64 + 22 * Math.sin(angle + 0.6);
    const x3 = 64 + 22 * Math.cos(angle - 0.6);
    const y3 = 64 + 22 * Math.sin(angle - 0.6);
    innerSegments.push(x1 + ',' + y1 + ' ' + x2 + ',' + y2 + ' ' + x3 + ',' + y3);
  }

  return (
    <div className="component-root dark-component">
      <div className="flex items-center justify-center w-full h-full min-h-32">
        <div className="relative flex items-center justify-center" style={{ width: '128px', height: '128px' }}>
          <svg
            width="128"
            height="128"
            viewBox="0 0 128 128"
            style={{ overflow: 'visible' }}
          >
            <defs>
              <filter id="glow-outer" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={outerGlow * 0.4} result="blur1" />
                <feGaussianBlur stdDeviation={outerGlow * 0.15} result="blur2" />
                <feMerge>
                  <feMergeNode in="blur1" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-inner" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={glowIntensity * 0.3} result="blur1" />
                <feMerge>
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-core" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="grad-segment" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00D9FF" stopOpacity="1" />
                <stop offset="100%" stopColor="#7B00FF" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="grad-inner" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00FFFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#00D9FF" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="grad-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1A0033" stopOpacity="1" />
                <stop offset="100%" stopColor="#0D001A" stopOpacity="1" />
              </linearGradient>
            </defs>

            <polygon
              points={hexPoints(64, 64, 60)}
              fill="url(#grad-bg)"
              stroke="#00D9FF"
              strokeWidth="1.5"
              strokeOpacity="0.4"
              filter="url(#glow-outer)"
            />

            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (Math.PI / 3) * i + (rotation * Math.PI / 180);
              const nextAngle = (Math.PI / 3) * (i + 1) + (rotation * Math.PI / 180);
              const x1 = 64 + 55 * Math.cos(angle);
              const y1 = 64 + 55 * Math.sin(angle);
              const x2 = 64 + 55 * Math.cos(nextAngle);
              const y2 = 64 + 55 * Math.sin(nextAngle);
              return (
                <line
                  key={'edge-' + i}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#00D9FF"
                  strokeWidth={i % 2 === 0 ? "2.5" : "1"}
                  strokeOpacity={i % 2 === 0 ? "1" : "0.5"}
                  filter="url(#glow-inner)"
                />
              );
            })}

            {segments.map((pts, i) => (
              <polygon
                key={'seg-' + i}
                points={pts}
                fill="url(#grad-segment)"
                fillOpacity={i % 2 === 0 ? (0.85 + pulse * 0.15).toString() : (0.4 + pulse * 0.2).toString()}
                stroke="#00FFFF"
                strokeWidth={i % 2 === 0 ? "1.5" : "0.8"}
                filter="url(#glow-outer)"
              />
            ))}

            <polygon
              points={triPoints(64, 64, 28, rotation * Math.PI / 180)}
              fill="none"
              stroke="#00D9FF"
              strokeWidth="2"
              strokeOpacity="0.7"
              filter="url(#glow-inner)"
            />
            <polygon
              points={triPoints(64, 64, 28, rotation * Math.PI / 180 + Math.PI)}
              fill="none"
              stroke="#7B00FF"
              strokeWidth="1.5"
              strokeOpacity="0.8"
              filter="url(#glow-inner)"
            />

            {innerSegments.map((pts, i) => (
              <polygon
                key={'inner-seg-' + i}
                points={pts}
                fill="#00FFFF"
                fillOpacity={(0.7 + pulse * 0.3).toString()}
                stroke="#FFFFFF"
                strokeWidth="0.8"
                filter="url(#glow-core)"
              />
            ))}

            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (Math.PI / 3) * i + (rotation * Math.PI / 180);
              const x = 64 + 42 * Math.cos(angle);
              const y = 64 + 42 * Math.sin(angle);
              return (
                <rect
                  key={'diamond-' + i}
                  x={x - 3}
                  y={y - 3}
                  width="6"
                  height="6"
                  fill={i % 2 === 0 ? "#00D9FF" : "#7B00FF"}
                  fillOpacity="0.9"
                  stroke="#00FFFF"
                  strokeWidth="0.5"
                  transform={'rotate(45, ' + x + ', ' + y + ')'}
                  filter="url(#glow-core)"
                />
              );
            })}

            <circle
              cx="64"
              cy="64"
              r={5 + pulse * 2}
              fill="#00FFFF"
              fillOpacity="1"
              filter="url(#glow-core)"
            />
            <circle
              cx="64"
              cy="64"
              r="3"
              fill="#FFFFFF"
              fillOpacity="1"
            />

            <polygon
              points={hexPoints(64, 64, 60)}
              fill="none"
              stroke="#00D9FF"
              strokeWidth="2"
              strokeOpacity={(0.3 + pulse * 0.4).toString()}
              filter="url(#glow-outer)"
            />

            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (Math.PI / 3) * i + (rotation * Math.PI / 180) + Math.PI / 6;
              const x = 64 + 58 * Math.cos(angle);
              const y = 64 + 58 * Math.sin(angle);
              return (
                <polygon
                  key={'corner-' + i}
                  points={(x - 4) + ',' + y + ' ' + (x + 4) + ',' + y + ' ' + x + ',' + (y - 6)}
                  fill="#00D9FF"
                  fillOpacity={(0.6 + pulse * 0.4).toString()}
                  filter="url(#glow-core)"
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}