// src/hooks/useCountdown.js
import { useState, useEffect } from 'react';

function formatDuration(ms){
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = n => String(n).padStart(2, '0');

  if(days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function useCountdown(startDateStr, endDateStr){
  const [timerData, setTimerData] = useState(null);

  useEffect(() => {
    if(!endDateStr){
      setTimerData(null);
      return;
    }

    const calc = () => {
      const now = Date.now();
      const end = new Date(endDateStr).getTime();
      const start = startDateStr ? new Date(startDateStr).getTime() : null;

      if(start && now < start){
        return { type: 'starting', label: 'Inicia en', clock: formatDuration(Math.max(0, start - now)) };
      }
      if(now < end){
        return { type: 'running', label: 'Termina en', clock: formatDuration(Math.max(0, end - now)) };
      }
      return { type: 'expired', label: 'Plazo', clock: 'Expirada' };
    };

    setTimerData(calc());
    const interval = setInterval(() => setTimerData(calc()), 1000);
    return () => clearInterval(interval);
  }, [startDateStr, endDateStr]);

  return timerData;
}