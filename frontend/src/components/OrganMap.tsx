import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const OrganMap = () => {
  const mapRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Phase 4: GSAP stroke-dashoffset draw animation on mount (600ms)
    const svg = mapRef.current;
    if (!svg) return;

    gsap.fromTo(
      svg.querySelectorAll('.organ-path'),
      { strokeDasharray: 500, strokeDashoffset: 500 },
      {
        strokeDashoffset: 0,
        duration: 0.6,
        ease: 'power2.inOut',
        stagger: 0.1,
      }
    );

    // 3s breathing pulse for 'Affected' organs
    // e.g., mapping heart to affected
    gsap.to('.organ-affected', {
      scale: 1.05,
      opacity: 0.8,
      fill: '#ef4444',
      duration: 1.5,
      yoyo: true,
      repeat: -1,
      transformOrigin: '50% 50%',
      ease: 'sine.inOut',
    });
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {/* Silhoutte of a body with organs */}
      <svg
        ref={mapRef}
        viewBox="0 0 200 400"
        className="w-full h-full max-h-[300px]"
        style={{ willChange: 'transform' }} // Phase 5 Optimization
      >
        <clipPath id="body-clip">
          <path d="M 100 20 C 130 20 150 50 150 90 C 150 120 170 150 170 200 C 170 300 130 380 130 380 L 70 380 C 70 380 30 300 30 200 C 30 150 50 120 50 90 C 50 50 70 20 100 20 Z" />
        </clipPath>
        
        {/* Body outline */}
        <path 
          className="organ-path"
          fill="none" 
          stroke="#e5e7eb" 
          strokeWidth="3"
          d="M 100 20 C 130 20 150 50 150 90 C 150 120 170 150 170 200 C 170 300 130 380 130 380 L 70 380 C 70 380 30 300 30 200 C 30 150 50 120 50 90 C 50 50 70 20 100 20 Z"
        />
        
        {/* Heart */}
        <path
          className="organ-path organ-affected"
          fill="#fee2e2"
          stroke="#f87171"
          strokeWidth="2"
          d="M 100 120 C 110 110 125 110 125 125 C 125 140 100 155 100 155 C 100 155 75 140 75 125 C 75 110 90 110 100 120 Z"
        />

        {/* Lungs */}
        <path
          className="organ-path"
          fill="#e0e7ff"
          stroke="#818cf8"
          strokeWidth="2"
          d="M 85 115 C 75 125 65 150 80 160 C 95 150 90 125 85 115 Z"
        />
        <path
          className="organ-path"
          fill="#e0e7ff"
          stroke="#818cf8"
          strokeWidth="2"
          d="M 115 115 C 125 125 135 150 120 160 C 105 150 110 125 115 115 Z"
        />
      </svg>
    </div>
  );
};
