'use client';
import { useState, useEffect } from 'react';

export default function TrafficWarning({ message, closeText }: { message: string, closeText: string }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem('traffic-warning-dismissed');
    if (dismissed) {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-200 px-4 py-2 text-sm flex justify-between items-center z-50">
      <span>
        <i className="fas fa-exclamation-triangle mr-2"></i>
        {message}
      </span>
      <button 
        onClick={() => {
          setIsVisible(false);
          localStorage.setItem('traffic-warning-dismissed', 'true');
        }}
        className="ml-4 hover:opacity-75 font-semibold"
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
}
