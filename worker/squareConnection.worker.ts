// src/workers/squareConnection.worker.ts
import { EncryptString } from '@/lib/functions';

self.onmessage = (event: MessageEvent<string>) => {
  try {
    const encryptedString = EncryptString(event.data);

    self.postMessage({
      success: true,
      encryptedString,
    });
  } catch {
    self.postMessage({
      success: false,
      encryptedString: '',
    });
  }
};

export {};
