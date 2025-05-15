import { useState } from 'react';

function Seat({ seat, position }) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Determine seat class based on status
  const getSeatClass = () => {
    if (!seat) return 'seat-unavailable';
    if (seat.is_occupied) return 'seat-occupied';
    return 'seat-available';
  };
  
  // Format display text (seat number or first initial)
  const displayText = seat?.user?.login 
    ? seat.user.login.charAt(0).toUpperCase()
    : seat?.host?.split('r')[1] || '?';
  
  // Handle tooltip positioning to avoid edge overflow
  const tooltipStyle = {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    width: 'max-content',
    maxWidth: '200px',
  };

  return (
    <div 
      className="relative"
      style={{ gridRow: position.row, gridColumn: position.col }}
    >
      <div
        className={`seat ${getSeatClass()}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {displayText}
      </div>

      {showTooltip && seat?.user && (
        <div 
          className="bg-gray-900 text-white text-xs rounded py-1 px-2 mt-1 shadow-lg"
          style={tooltipStyle}
        >
          <div className="font-bold mb-1">{seat.user.login}</div>
          <div className="flex items-center">
            <img 
              src={seat.user.image_url || '/default-avatar.svg'} 
              alt={`${seat.user.login}'s avatar`}
              className="w-6 h-6 rounded-full mr-1"
              onError={(e) => {
                e.target.src = '/default-avatar.svg';
              }}
            />
            <span>{seat.user.displayname || seat.user.login}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Seat;
