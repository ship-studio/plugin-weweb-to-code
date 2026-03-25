import { useEffect, useCallback } from 'react';
import type { ReactNode, MouseEvent } from 'react';
import { STYLE_ID, PLUGIN_CSS } from '../styles';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
}

/**
 * Reusable modal shell with overlay, header, body, escape-to-close.
 * Injects plugin CSS on mount and cleans up on unmount.
 */
export function Modal({ open, onClose, title, headerRight, children }: ModalProps) {
  // Inject CSS on mount, remove on unmount
  useEffect(() => {
    if (!open) return;

    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = PLUGIN_CSS;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(STYLE_ID);
      if (el) el.remove();
    };
  }, [open]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Close on overlay click (not modal body)
  const handleOverlayClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <div className="ww2c-overlay" onClick={handleOverlayClick}>
      <div className="ww2c-modal">
        <div className="ww2c-modal-header">
          <svg
            width="16"
            height="16"
            viewBox="0 0 474 471"
            fill="none"
          >
            <rect width="473.647" height="471" rx="64" fill="currentColor" />
            <path d="M131.181 235.583C99.8733 235.583 73.923 259.525 71.2443 290.497L65.7194 354.117H131.851L142.231 235.416H131.348L131.181 235.583Z" fill="var(--bg-primary, #1a1a1a)" />
            <path d="M385.661 116.883C350.167 116.883 322.376 147.353 325.724 182.679L341.796 354.118H407.928L385.661 116.883Z" fill="var(--bg-primary, #1a1a1a)" />
            <path d="M271.312 168.783C229.792 168.783 192.457 194.398 177.724 233.24L131.851 354.118H197.982L236.824 252.661L275.665 354.118H341.796L271.312 168.783Z" fill="var(--bg-primary, #1a1a1a)" />
          </svg>
          <span className="ww2c-modal-title">{title}</span>
          {headerRight && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              {headerRight}
            </div>
          )}
        </div>
        <div className="ww2c-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
