export interface FetchEventSourceInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
  onopen?: (response: Response) => Promise<void> | void;
  onmessage?: (event: { event: string; data: string }) => void;
  onerror?: (error: any) => void | number;
  onclose?: () => void;
}

export async function fetchEventSource(
  url: string,
  {
    method = 'GET',
    headers = {},
    body,
    signal,
    onopen,
    onmessage,
    onerror,
    onclose,
  }: FetchEventSourceInit
): Promise<void> {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        ...headers,
      },
      body,
      signal,
    });

    if (onopen) {
      await onopen(response);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        const lines = event.split('\n');
        let eventName = 'message';
        let eventData = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventName = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            eventData = line.slice(6).trim();
          }
        }

        if (!eventData) continue;

        if (onmessage) {
          onmessage({ event: eventName, data: eventData });
        }
      }
    }

    if (onclose) {
      onclose();
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      if (onclose) {
        onclose();
      }
      return;
    }
    if (onerror) {
      onerror(error);
    } else {
      throw error;
    }
  }
}
