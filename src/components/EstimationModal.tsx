import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { EstimationTool } from './ui-parts/EstimationTool';

interface EstimationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EstimationModal({ open, onOpenChange }: EstimationModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-md z-[60] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <div className="fixed inset-0 z-[60] flex justify-center pointer-events-none sm:items-center sm:p-4">
          <Dialog.Content className="pointer-events-auto h-full w-full max-w-[430px] bg-background/80 backdrop-blur-xl sm:rounded-[2rem] sm:border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom flex flex-col focus:outline-none overflow-hidden sm:h-[85vh] relative">
            <div className="flex-1 overflow-hidden relative z-10">
              <EstimationTool onClose={() => onOpenChange(false)} />
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
