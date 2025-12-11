'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactNode;
}

export default function Tooltip({ text, position = 'top', delay = 1000, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const show = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setVisible(true);
      setTimeout(updatePosition, 10);
    }, delay);
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  };

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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      {mounted && typeof window !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          className={`tooltip ${visible ? 'visible' : ''}`}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`
          }}
          role="tooltip"
        >
          {text}
        </div>,
        document.body
      )}
      <style jsx>{`
        .tooltip-container {
          position: relative;
          display: inline-block;
        }

        .tooltip {
          position: fixed;
          z-index: 9999;
          padding: 0.5rem 0.75rem;
          background-color: #111827;
          color: #d1d5db;
          font-size: 0.75rem;
          line-height: 1rem;
          font-weight: 500;
          border-radius: 0.375rem;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
          border: 1px solid #4b5563;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .tooltip.visible {
          opacity: 1;
        }
      `}</style>
    </>
  );
}

