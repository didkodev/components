import React, { useState } from 'react';

function VaporwaveLoadingButton() {
  const [isLoading, setIsLoading] = useState(true);
  const [ripples, setRipples] = useState([]);

  const handleClick = () => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const ripple = { id: Date.now(), x, y };
    setRipples([...ripples, ripple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
    }, 600);
  };

  return (
    <div className="component-root dark-component flex items-center justify-center min-h-screen" style={{ background: 'transparent' }}>
      <style>{`
        @keyframes pulseRipple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
          }
        }
        @keyframes shimmerFlow {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .vaporwave-btn {
          position: relative;
          padding: 16px 48px;
          font-size: 18px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          background: linear-gradient(135deg, #00D9FF 0%, #FF006E 50%, #8338EC 100%);
          background-size: 200% 200%;
          animation: shimmerFlow 4s linear infinite;
          color: #fff;
          text-shadow: 0 0 20px rgba(0, 217, 255, 0.8), 0 0 40px rgba(255, 0, 110, 0.6);
          letter-spacing: 1px;
          font-family: 'Inter', 'Helvetica Neue', sans-serif;
        }
        .vaporwave-btn:hover {
          transform: translateY(-2px);
        }
        .vaporwave-btn:active {
          transform: translateY(0);
        }
        .ripple-container {
          position: absolute;
          pointer-events: none;
        }
        .ripple-wave {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 217, 255, 0.6) 0%, rgba(255, 0, 110, 0.4) 50%, rgba(131, 56, 236, 0.2) 100%);
          animation: pulseRipple 600ms ease-out forwards;
        }
      `}</style>
      
      <button
        className="vaporwave-btn"
        onClick={handleClick}
        disabled={isLoading}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          Processing...
        </div>
        
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="ripple-wave"
            style={{
              width: '80px',
              height: '80px',
              left: ripple.x + 'px',
              top: ripple.y + 'px',
            }}
          />
        ))}
      </button>
    </div>
  );
}

export default VaporwaveLoadingButton;