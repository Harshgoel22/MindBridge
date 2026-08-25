import React, { useState, useRef, useCallback, useEffect } from 'react';
import roboIcon from './../../../assets/Images/robo.png'; // Make sure this path is correct
import MediBot from './MediBot';

const DRAG_THRESHOLD_PX = 5; // ignore tiny jitter so real clicks still open the chat
const ICON_SIZE = 100;

function Bot() {
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [position, setPosition] = useState({ right: 20, bottom: 20 });

  // Refs, not state, for drag bookkeeping — avoids stale-closure/render-timing
  // issues and lets us distinguish "click" from "drag" reliably.
  const isPointerDownRef = useRef(false);
  const didDragRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, right: 0, bottom: 0 });

  const handleMouseDown = useCallback((e) => {
    isPointerDownRef.current = true;
    didDragRef.current = false;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      right: position.right,
      bottom: position.bottom,
    };
  }, [position]);

  const handleMouseMove = useCallback((e) => {
    if (!isPointerDownRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    if (!didDragRef.current) {
      const moved = Math.abs(deltaX) > DRAG_THRESHOLD_PX || Math.abs(deltaY) > DRAG_THRESHOLD_PX;
      if (!moved) return; // still just a click-in-progress, not a drag yet
      didDragRef.current = true;
    }

    // Moving the mouse right/down should decrease distance-from-right/bottom.
    let nextRight = dragStartRef.current.right - deltaX;
    let nextBottom = dragStartRef.current.bottom - deltaY;

    // Keep the icon fully on-screen.
    const maxRight = window.innerWidth - ICON_SIZE;
    const maxBottom = window.innerHeight - ICON_SIZE;
    nextRight = Math.min(Math.max(nextRight, 0), Math.max(maxRight, 0));
    nextBottom = Math.min(Math.max(nextBottom, 0), Math.max(maxBottom, 0));

    setPosition({ right: nextRight, bottom: nextBottom });
  }, []);

  const handleMouseUp = useCallback(() => {
    isPointerDownRef.current = false;
    // didDragRef is intentionally left as-is until the click handler reads it;
    // it gets reset on the next mousedown.
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleChatClick = () => {
    if (didDragRef.current) {
      // This click was the tail end of a drag — don't toggle the chat.
      didDragRef.current = false;
      return;
    }
    setChatbotOpen((prev) => !prev);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: `${position.bottom}px`,
        right: `${position.right}px`,
        zIndex: 1000,
      }}
    >
      <div
        onClick={handleChatClick}
        onMouseDown={handleMouseDown}
        style={{
          width: `${ICON_SIZE}px`,
          height: `${ICON_SIZE}px`,
          cursor: 'pointer',
          transition: 'transform 0.3s ease',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <img
          src={roboIcon}
          alt="Chat Icon"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
            pointerEvents: 'none', // let the wrapping div own all mouse events
          }}
        />
      </div>
      {chatbotOpen && <MediBot onClose={() => setChatbotOpen(false)} />}
    </div>
  );
}

export default Bot;