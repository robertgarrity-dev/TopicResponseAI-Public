import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Remove AUTH_API_KEY logging from client code
const AUTH_API_KEY = import.meta.env.VITE_AUTH_API_KEY;
const CORS_TOKEN = import.meta.env.VITE_CORS_TOKEN;

if (!AUTH_API_KEY || !CORS_TOKEN) {
  console.error("❌ Authentication configuration error");
  throw new Error("Required authentication tokens are not configured");
}

// Function to check response status
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }
}

// Function for API Requests with API Key Authentication
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": AUTH_API_KEY,
    "x-cors-token": CORS_TOKEN,
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

export const getQueryFn: <T>(options: {
  on401: "returnNull" | "throw";
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const headers: Record<string, string> = {
        "x-api-key": AUTH_API_KEY,
        "x-cors-token": CORS_TOKEN,
      };

      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers,
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

// Configure React Query Client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});