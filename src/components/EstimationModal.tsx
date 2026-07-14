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
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <div className="fixed inset-0 z-50 flex justify-center pointer-events-none">
          <Dialog.Content className="pointer-events-auto h-full w-full max-w-[430px] border-x border-border bg-background shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom flex flex-col focus:outline-none overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <EstimationTool onClose={() => onOpenChange(false)} />
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
