declare module '@microsoft/fetch-event-source' {
  export interface FetchEventSourceInit {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
    onopen?: (response: Response) => Promise<void> | void;
    onmessage?: (event: { event: string; data: string; id?: string }) => void;
    onerror?: (error: any) => void | number;
    onclose?: () => void;
    fetch?: typeof fetch;
    openWhenHidden?: boolean;
  }

  export function fetchEventSource(
    url: string,
    options: FetchEventSourceInit
  ): Promise<void>;
}
