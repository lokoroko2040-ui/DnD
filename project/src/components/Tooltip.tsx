import { useState, useRef, useEffect, type ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  maxWidth?: number;
}

export function Tooltip({ content, children, maxWidth = 340 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    setVisible(true);
  }

  function hide() {
    setVisible(false);
  }

  useEffect(() => {
    if (!visible || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tipWidth = maxWidth + 28;
    const tipHeight = tipRef.current?.offsetHeight || 200;

    let x = rect.left + rect.width / 2 - tipWidth / 2;
    let y = rect.top - tipHeight - 10;

    if (y < 8) y = rect.bottom + 10;
    if (x < 8) x = 8;
    if (x + tipWidth > window.innerWidth - 8) x = window.innerWidth - tipWidth - 8;

    setPosition({ x, y });
  }, [visible, maxWidth]);

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex cursor-help"
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={(e) => {
          e.stopPropagation();
          if (visible) hide(); else show();
        }}
        onTouchStart={() => {
          touchTimer.current = setTimeout(() => { show(); }, 300);
        }}
        onTouchEnd={() => {
          if (touchTimer.current) { clearTimeout(touchTimer.current); touchTimer.current = null; }
        }}
      >
        {children}
      </span>
      {visible && (
        <div
          ref={tipRef}
          className="dnd-tooltip fade-in"
          style={{ left: position.x, top: position.y, maxWidth }}
          onClick={(e) => { e.stopPropagation(); hide(); }}
        >
          {content}
        </div>
      )}
    </>
  );
}

interface TooltipCardProps {
  title: string;
  children: ReactNode;
  ability?: string;
}

export function TooltipCard({ title, children, ability }: TooltipCardProps) {
  return (
    <div>
      <div className="font-fantasy text-[#e8d5a8] text-sm font-semibold mb-1 border-b border-[#c8aa6e]/30 pb-1">
        {title}
        {ability && <span className="text-[#8a7350] text-[10px] ml-2 normal-case font-body">{ability}</span>}
      </div>
      <div className="text-[#d4c5a0] text-xs leading-relaxed">{children}</div>
    </div>
  );
}
