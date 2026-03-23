import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useStore } from '../store';
import clsx from 'clsx';

// Phase 4: Use React.memo and Zustand selectors to ensure only the updated cell re-renders
const BedCell = React.memo(({ id }: { id: number }) => {
  const bed = useStore((state) => state.bedsCache[id]);

  if (!bed) return null;

  return (
    <div 
      className={clsx(
        "bed-cell h-16 rounded-2xl flex items-center justify-center font-bold text-sm transition-all bed-cell-will-change shadow-sm",
        {
          "bg-green-100 text-green-700 border border-green-200": bed.status === "AVAILABLE",
          "bg-yellow-100 text-yellow-700 border border-yellow-200": bed.status === "RESERVED",
          "bg-red-100 text-red-700 border border-red-200": bed.status === "OCCUPIED"
        }
      )}
    >
      {bed.bedNumber}
    </div>
  );
});

export const BedGrid = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Extract just the ids for the initial render so adding/removing beds updates the list
  const bedsCache = useStore((state) => state.bedsCache);
  const bedIds = Object.keys(bedsCache).map(Number);

  useEffect(() => {
    if (bedIds.length > 0 && containerRef.current) {
      // Phase 4: On load, use a GSAP stagger (30ms per cell) to reveal the grid
      gsap.fromTo('.bed-cell', 
        { scale: 0.8, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, stagger: 0.03, ease: 'back.out(1.7)' }
      );
    }
  }, [bedIds.length]);

  return (
    <div 
      ref={containerRef}
      className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-3 h-full overflow-y-auto pr-2 pb-6"
    >
      {bedIds.length === 0 ? (
        <p className="text-gray-500 col-span-full">Loading beds...</p>
      ) : (
        bedIds.map(id => <BedCell key={id} id={id} />)
      )}
    </div>
  );
};
