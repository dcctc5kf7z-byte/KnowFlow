'use client';

import { useUIStore } from '@/stores/uiStore';
import CaptureModal from './CaptureModal';

export default function FAB() {
  const toggleCapture = useUIStore(state => state.toggleCapture);

  return (
    <>
      <button
        onClick={toggleCapture}
        className="fixed bottom-20 right-4 md:bottom-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center text-2xl z-30"
      >
        +
      </button>
      <CaptureModal />
    </>
  );
}
