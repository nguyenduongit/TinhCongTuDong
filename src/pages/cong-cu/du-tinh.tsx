import React from 'react';
import { useLocation } from 'wouter';
import { EstimationTool } from '@/components/ui-parts/EstimationTool';

export default function EstimationPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col relative overflow-hidden">
      <div className="w-full max-w-[430px] mx-auto bg-background flex flex-col h-[100dvh] relative">
        <EstimationTool onClose={() => setLocation('/')} />
      </div>
    </div>
  );
}
