import axios from '@/lib/axios';
import { SquareIntegrationState } from '@/lib/types';
import { useCallback, useEffect, useRef, useState } from 'react';

type WorkerResponse = {
  success: boolean;
  encryptedString: string;
};

export default function useSquareConnection(mode?: string, state?: SquareIntegrationState) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  const checkConnection = useCallback(() => {
    if (typeof window === 'undefined') return;

    setLoading(true);

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    workerRef.current?.terminate();

    const credentials = state
      ? mode
        ? {
            key: state.credentials.test.apiKey,
            location: state.credentials.test.locationId,
            merchant: state.credentials.test.merchantId,
          }
        : {
            key: state.credentials.live.apiKey,
            location: state.credentials.live.locationId,
            merchant: state.credentials.live.merchantId,
          }
      : undefined;

    const params = new URLSearchParams({
      mode: String(mode ?? ''),
      key: credentials?.key ?? '',
      location: credentials?.location ?? '',
      merchant: credentials?.merchant ?? '',
    });

    const worker = new Worker(new URL('../worker/squareConnection.worker.ts', import.meta.url), {
      type: 'module',
    });

    workerRef.current = worker;

    worker.onmessage = async (event: MessageEvent<WorkerResponse>) => {
      if (requestId !== requestIdRef.current) return;

      const { success, encryptedString } = event.data;

      if (!success) {
        setConnected(false);
        setLoading(false);
        worker.terminate();
        return;
      }

      try {
        const res = await axios.get('/square/check', {
          params: {
            data: encryptedString,
          },
        });

        if (requestId !== requestIdRef.current) return;

        setConnected(res.data?.success);
      } catch {
        if (requestId === requestIdRef.current) {
          setConnected(false);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }

        worker.terminate();
      }
    };

    worker.onerror = () => {
      if (requestId === requestIdRef.current) {
        setConnected(false);
        setLoading(false);
      }

      worker.terminate();
    };

    worker.postMessage(params.toString());
  }, [mode, state]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      workerRef.current?.terminate();
    };
  }, []);

  return {
    loading,
    connected,
    checkConnection,
  };
}
