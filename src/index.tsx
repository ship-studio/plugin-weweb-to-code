import { useState } from 'react';
import { Modal } from './components/Modal';
import { MainView } from './views/MainView';

function WeWebIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 474 471"
      fill="none"
    >
      <rect width="473.647" height="471" rx="64" fill="currentColor" />
      <path d="M131.181 235.583C99.8733 235.583 73.923 259.525 71.2443 290.497L65.7194 354.117H131.851L142.231 235.416H131.348L131.181 235.583Z" fill="var(--bg-primary, #1a1a1a)" />
      <path d="M385.661 116.883C350.167 116.883 322.376 147.353 325.724 182.679L341.796 354.118H407.928L385.661 116.883Z" fill="var(--bg-primary, #1a1a1a)" />
      <path d="M271.312 168.783C229.792 168.783 192.457 194.398 177.724 233.24L131.851 354.118H197.982L236.824 252.661L275.665 354.118H341.796L271.312 168.783Z" fill="var(--bg-primary, #1a1a1a)" />
    </svg>
  );
}

function ToolbarButton() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        title="WeWeb to Code"
        className="toolbar-icon-btn"
      >
        <WeWebIcon />
      </button>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="WeWeb to Code"
      >
        <MainView />
      </Modal>
    </>
  );
}

export const name = 'WeWeb to Code';

export const slots = {
  toolbar: ToolbarButton,
};

export function onActivate() {
  console.log('[weweb-to-code] Plugin activated');
}

export function onDeactivate() {
  console.log('[weweb-to-code] Plugin deactivated');
}
