import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { IngestionPipelineEvent } from '@vayura/api-contracts/ingestion-events';
import { TOKEN_KEY } from '@/hooks/use-auth';
import { useActiveClientStore } from '@/hooks/use-active-client';
import { useAuthStore } from '@/hooks/use-auth';
import { getIngestionWebSocketUrl } from '@/lib/ingestion-ws';
import { useIngestionLiveStore } from '@/hooks/use-ingestion-live';
import { friendlyIngestionError } from '@/lib/ingestion-errors';

const RECONNECT_MS = 3000;

function isPipelineEvent(value: unknown): value is IngestionPipelineEvent {
  if (!value || typeof value !== 'object') return false;
  return 'type' in value && typeof (value as { type: unknown }).type === 'string';
}

function applyEvent(
  event: IngestionPipelineEvent,
  patchUpload: ReturnType<typeof useIngestionLiveStore.getState>['patchUpload'],
  queryClient: ReturnType<typeof useQueryClient>,
  orgId: string,
): void {
  const { uploadId } = event;

  switch (event.type) {
    case 'upload_status':
      patchUpload(uploadId, { uploadStatus: event.uploadStatus });
      break;
    case 'step_started':
      patchUpload(uploadId, {
        currentStep: event.step,
        stepLabel: event.stepLabel,
        uploadStatus: event.uploadStatus,
      });
      break;
    case 'step_completed':
      patchUpload(uploadId, {
        currentStep: event.step,
        stepLabel: event.stepLabel,
        completedSteps: event.completedSteps,
        uploadStatus: event.uploadStatus,
      });
      break;
    case 'pipeline_completed':
      patchUpload(uploadId, { uploadStatus: event.uploadStatus });
      toast.success(event.message, {
        description: `${event.originalFilename} — ${event.lineCount} line${event.lineCount === 1 ? '' : 's'} ready to review.`,
        duration: 8000,
      });
      break;
    case 'pipeline_failed':
      patchUpload(uploadId, { uploadStatus: 'failed' });
      toast.error('Document processing failed', {
        description: `${event.originalFilename}: ${friendlyIngestionError(event.message)}`,
        duration: 8000,
      });
      break;
  }

  void queryClient.invalidateQueries({ queryKey: ['uploads', orgId] });
  void queryClient.invalidateQueries({ queryKey: ['uploadDetail', orgId, uploadId] });
  void queryClient.invalidateQueries({ queryKey: ['upload', orgId, uploadId] });
}

/** Keeps a WebSocket open for the active client org and refreshes upload queries on pipeline events. */
export function useIngestionEvents(): void {
  const orgId = useActiveClientStore((s) => s.activeClientId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const patchUpload = useIngestionLiveStore((s) => s.patchUpload);
  const setWsConnected = useIngestionLiveStore((s) => s.setWsConnected);
  const reconnectTimer = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!orgId || !isAuthenticated) {
      setWsConnected(false);
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const url = token ? getIngestionWebSocketUrl(orgId, token) : null;
    if (!url) return;

    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        setWsConnected(true);
      };

      ws.onmessage = (message) => {
        try {
          const parsed: unknown = JSON.parse(String(message.data));
          if (parsed && typeof parsed === 'object' && (parsed as { type?: string }).type === 'connected') {
            return;
          }
          if (!isPipelineEvent(parsed)) return;
          applyEvent(parsed, patchUpload, queryClient, orgId);
        } catch {
          // ignore malformed payloads
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        socketRef.current = null;
        if (!cancelled) {
          reconnectTimer.current = window.setTimeout(connect, RECONNECT_MS);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      cancelled = true;
      setWsConnected(false);
      if (reconnectTimer.current !== null) {
        window.clearTimeout(reconnectTimer.current);
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [orgId, isAuthenticated, patchUpload, queryClient, setWsConnected]);
}
