import React from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center ">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-6xl mx-4 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl p-5">
        {title && <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>}
        {children}
      </div>
    </div>
  );
};
