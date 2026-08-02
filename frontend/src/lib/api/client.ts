let currentToken: string | null = null;
let apiBaseUrl = '/api/v1';

export function setClientToken(token: string | null): void {
  currentToken = token;
}

export function getClientToken(): string | null {
  return currentToken;
}

export function setApiBaseUrl(url: string): void {
  apiBaseUrl = url;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function refreshAuthToken(): Promise<string | null> {
  try {
    const res = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.accessToken) {
      currentToken = data.accessToken;
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (currentToken) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response = await fetch(url, config);

  if (response.status === 401) {
    const newToken = await refreshAuthToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(url, { ...config, headers });
    }
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // Ignored if response is non-json
    }
    throw new ApiError(
      response.status,
      errorData.error || `HTTP error ${response.status}`,
      errorData.details
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
