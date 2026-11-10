import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';

export function ModalWrapper({ isOpen, onClose, children, className = '', overlayClassName = '' }) {
  const [render, setRender] = useState(isOpen);
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (render) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [render]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setRender(true);
    } else if (render) {
      // Animate out gently before unmounting
      if (overlayRef.current && panelRef.current) {
        gsap.to(panelRef.current, {
          opacity: 0,
          scale: 0.97,
          y: 8,
          duration: 0.2,
          ease: 'power2.in'
        });
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => setRender(false)
        });
      } else {
        setRender(false);
      }
    }
  }, [isOpen, render]);

  useEffect(() => {
    if (render && isOpen && overlayRef.current && panelRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.28, ease: 'power2.out' }
      );
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.96, y: 14 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'power3.out' }
      );
    }
  }, [render, isOpen]);

  if (!render) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          onClose();
        }
      }}
      className={`fixed inset-0 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto ${overlayClassName}`}
      style={{ zIndex: 9999 }}
    >
      <div ref={panelRef} className={`relative my-auto ${className}`}>
        {children}
      </div>
    </div>,
    document.body
  );
}

