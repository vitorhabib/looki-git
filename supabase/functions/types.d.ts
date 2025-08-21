// Tipos globais para o ambiente Deno nas funções do Supabase

declare global {
  // Console API
  const console: {
    log(...args: any[]): void;
    error(...args: any[]): void;
    warn(...args: any[]): void;
    info(...args: any[]): void;
    debug(...args: any[]): void;
  };

  // Web APIs
  class Response {
    constructor(body?: BodyInit | null, init?: ResponseInit);
    readonly ok: boolean;
    readonly status: number;
    readonly statusText: string;
    readonly headers: Headers;
    json(): Promise<any>;
    text(): Promise<string>;
  }

  interface ResponseInit {
    status?: number;
    statusText?: string;
    headers?: HeadersInit;
  }

  type BodyInit = ReadableStream | XMLHttpRequestBodyInit;
  type XMLHttpRequestBodyInit = Blob | BufferSource | FormData | URLSearchParams | string;
  type HeadersInit = Headers | string[][] | Record<string, string>;

  class Headers {
    constructor(init?: HeadersInit);
    get(name: string): string | null;
    set(name: string, value: string): void;
  }

  namespace Deno {
    interface Env {
      get(key: string): string | undefined;
    }
    
    const env: Env;
    
    interface Addr {
      hostname: string;
      port: number;
      transport: "tcp" | "udp";
    }
    
    interface ListenOptions {
      port?: number;
      hostname?: string;
      transport?: "tcp" | "udp";
    }
    
    interface Listener {
      addr: Addr;
      close(): void;
    }
    
    interface HttpConn {
      close(): void;
    }
    
    namespace errors {
      class Http extends Error {
        constructor(message: string);
      }
    }
    
    function listen(options: ListenOptions): Listener;
  }
}

// Declarações de módulos para URLs do Deno
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export interface ConnInfo {
    readonly localAddr: any;
    readonly remoteAddr: any;
  }
  
  export type Handler = (
    request: Request,
    connInfo: ConnInfo,
  ) => Response | Promise<Response>;
  
  export function serve(handler: Handler, options?: any): Promise<void>;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
  export { createClient } from "@supabase/supabase-js";
}

export {};