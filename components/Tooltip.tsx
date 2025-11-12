'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface TooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: ReactNode;
}

export default function Tooltip({ 
  text, 
  position = 'top', 
  delay = 1000,
  children 
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updatePosition = () => {
    if (!containerRef.current || !tooltipRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = containerRect.top - tooltipRect.height - 8;
        left = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = containerRect.bottom + 8;
        left = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = containerRect.top + (containerRect.height / 2) - (tooltipRect.height / 2);
        left = containerRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = containerRect.top + (containerRect.height / 2) - (tooltipRect.height / 2);
        left = containerRect.right + 8;
        break;
    }

    setTooltipPosition({ top, left });
  };

  const show = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setVisible(true);
      setTimeout(updatePosition, 0);
    }, delay);
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  };

  useEffect(() => {
    if (visible) {
      updatePosition();
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="tooltip-container"
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </div>
      {visible && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] px-3 py-2 bg-gray-900 text-gray-300 text-xs font-medium rounded-md whitespace-nowrap pointer-events-none shadow-lg border border-gray-600"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
          role="tooltip"
        >
          {text}
        </div>
      )}
    </>
  );
}

