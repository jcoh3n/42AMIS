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
    w-7 h-7 m-0.5 rounded-md flex items-center justify-center 
    transition-all duration-200 ease-in-out cursor-pointer text-xs
    ${seat.isOccupied 
      ? 'bg-green-600 text-white shadow-md' 
      : 'bg-gray-200 hover:bg-gray-300'}
    hover:scale-110
  `;

  const seatNumber = seat.seat.replace(/[rs]/g, '');

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={seatClasses}
        data-host={`${seat.floor}${seat.id}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {seat.isOccupied && seat.user?.image?.versions?.micro ? (
          <Image 
            src={seat.user.image.versions.micro}
            alt={seat.user.login}
            width={24}
            height={24}
            className="rounded-full border border-white"
          />
        ) : (
          <span className="font-medium">{seatNumber}</span>
        )}
      </div>
      
      {showTooltip && seat.isOccupied && seat.user && (
        <div className="absolute bottom-full mb-2 bg-black bg-opacity-90 text-white text-xs rounded py-1.5 px-2.5 z-10 whitespace-nowrap shadow-lg">
          <div className="font-semibold">{seat.user.displayname || seat.user.login}</div>
          <div className="text-gray-300 text-[10px]">{`${seat.floor}${seat.id}`}</div>
        </div>
      )}
    </div>
  );
} 