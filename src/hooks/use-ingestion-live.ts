import { create } from 'zustand';
import type { IngestionStatus, IngestionStepKind } from '@vayura/api-contracts/common';

export type UploadLiveState = {
  currentStep?: IngestionStepKind;
  stepLabel?: string;
  completedSteps: IngestionStepKind[];
  uploadStatus?: IngestionStatus;
};

type IngestionLiveStore = {
  wsConnected: boolean;
  byUpload: Record<string, UploadLiveState>;
  setWsConnected: (connected: boolean) => void;
  patchUpload: (uploadId: string, patch: Partial<UploadLiveState>) => void;
  clearUpload: (uploadId: string) => void;
};

export const useIngestionLiveStore = create<IngestionLiveStore>((set) => ({
  wsConnected: false,
  byUpload: {},
  setWsConnected: (connected) => set({ wsConnected: connected }),
  patchUpload: (uploadId, patch) =>
    set((state) => {
      const prev = state.byUpload[uploadId] ?? { completedSteps: [] };
      return {
        byUpload: {
          ...state.byUpload,
          [uploadId]: { ...prev, ...patch },
        },
      };
    }),
  clearUpload: (uploadId) =>
    set((state) => {
      const next = { ...state.byUpload };
      delete next[uploadId];
      return { byUpload: next };
    }),
}));
