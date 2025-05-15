import React from 'react';

function Legend() {
  const legendItems = [
    { class: 'seat-available', label: 'Available' },
    { class: 'seat-occupied', label: 'Occupied' },
    { class: 'seat-unavailable', label: 'Unavailable' }
  ];

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-3">Legend</h2>
      <div className="flex flex-wrap items-center gap-4">
        {legendItems.map((item) => (
          <div key={item.class} className="flex items-center">
            <div className={`seat ${item.class} mr-2`}></div>
            <span className="text-sm text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Legend;
