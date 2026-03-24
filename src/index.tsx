import { useState } from 'react';
import { Modal } from './components/Modal';
import { MainView } from './views/MainView';

function WeWebIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M3 4l3 16h2l2.5-10L13 20h2l3-16h-2l-2 10L11.5 4h-1L8 14 6 4H3z" />
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
