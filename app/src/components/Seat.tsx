'use client';

import { SeatType } from '@/types/types';
import { useState } from 'react';
import Image from 'next/image';

interface SeatProps {
  seat: SeatType;
}

export default function Seat({ seat }: SeatProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const seatClasses = `
    w-6 h-6 m-0.5 rounded flex items-center justify-center 
    transition-all duration-300 ease-in-out cursor-pointer
    ${seat.isOccupied ? 'bg-green-500 text-white' : 'bg-gray-200'}
    hover:scale-105
  `;

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={seatClasses}
        data-host={`${seat.floor}${seat.row}${seat.seat}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {seat.isOccupied && seat.user?.image?.versions?.micro ? (
          <Image 
            src={seat.user.image.versions.micro}
            alt={seat.user.login}
            width={20}
            height={20}
            className="rounded-full"
          />
        ) : (
          <span className="text-xs">{seat.seat.replace('s', '')}</span>
        )}
      </div>
      
      {showTooltip && seat.isOccupied && seat.user && (
        <div className="absolute bottom-full mb-1 bg-black text-white text-xs rounded py-1 px-2 z-10 whitespace-nowrap">
          {seat.user.displayname || seat.user.login}
        </div>
      )}
    </div>
  );
} 