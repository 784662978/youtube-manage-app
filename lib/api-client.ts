
import { refreshTokenAction } from "@/app/actions/token";

const BASE_URL = "https://dataapi.aipopshort.com/v1/api";

interface ApiConfig extends RequestInit {
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

class ApiClient {
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private async request<T>(endpoint: string, config: ApiConfig = {}): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
    
    // Get token from localStorage (client-side only)
    const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;

    if (!token && !config.skipAuth && typeof window !== "undefined") {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${returnUrl}`;
      throw new Error("Session expired");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...config.headers,
    };

    if (token && !config.skipAuth) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const doRequest = async (currentUrl: string, currentHeaders: Record<string, string>): Promise<T> => {
        const response = await fetch(currentUrl, {
            ...config,
            headers: currentHeaders,
            cache: 'no-store', // Prevent browser caching, especially for Edge infinite loops
        });
        // Handle 401 Unauthorized
        if (response.status === 401 && !config.skipAuth && typeof window !== "undefined") {
             if (!this.isRefreshing) {
                this.isRefreshing = true;
                const userId = localStorage.getItem("user_id");
                const refreshToken = localStorage.getItem("refresh_token") || undefined;
                
                if (userId) {
                    try {
                        const refreshResult = await refreshTokenAction(parseInt(userId), refreshToken);
                        if (refreshResult.success && refreshResult.jwt_token) {
                            localStorage.setItem("jwt_token", refreshResult.jwt_token);
                            if (refreshResult.refresh_token) {
                                localStorage.setItem("refresh_token", refreshResult.refresh_token);
                            }
                            this.isRefreshing = false;
                            this.onRefreshed(refreshResult.jwt_token);
                            // Retry original request
                            currentHeaders["Authorization"] = `Bearer ${refreshResult.jwt_token}`;
                            return doRequest(currentUrl, currentHeaders);
                        }
                    } catch (e) {
                        console.error("Refresh failed", e);
                    }
                }
                
                // If refresh failed or no user_id
                this.isRefreshing = false;
                localStorage.removeItem("jwt_token");
                localStorage.removeItem("user_id");
                
                // Redirect to login with return url
                const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
                window.location.href = `/login?redirect=${returnUrl}`;
                
                throw new Error("Session expired");
             }

             // If already refreshing, wait for new token
             return new Promise<T>((resolve) => {
                 this.addRefreshSubscriber((newToken) => {
                     currentHeaders["Authorization"] = `Bearer ${newToken}`;
                     resolve(doRequest(currentUrl, currentHeaders));
                 });
             });
        }

        if (!response.ok) {
            let errorMessage = `HTTP Error: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.msg) {
                  errorMessage = errorData.msg;
                }
            } catch (e) {
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        return response.json();
    }

    return doRequest(url, headers);
  }

  public get<T>(
    endpoint: string,
    params?: Record<string, any>,
    headers?: Record<string, string>,
    config: ApiConfig = {}
  ) {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          searchParams.append(key, String(params[key]));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    const mergedHeaders = { ...headers, ...config.headers };
    return this.request<T>(url, { ...config, method: "GET", headers: mergedHeaders });
  }

  public post<T>(
    endpoint: string,
    body: any,
    headers?: Record<string, string>,
    config: ApiConfig = {}
  ) {
    const mergedHeaders = { ...headers, ...config.headers };
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      body: JSON.stringify(body),
      headers: mergedHeaders,
    });
  }

  public put<T>(
    endpoint: string,
    body: any,
    headers?: Record<string, string>,
    config: ApiConfig = {}
  ) {
    const mergedHeaders = { ...headers, ...config.headers };
    return this.request<T>(endpoint, {
      ...config,
      method: "PUT",
      body: JSON.stringify(body),
      headers: mergedHeaders,
    });
  }

  public delete<T>(
    endpoint: string,
    headers?: Record<string, string>,
    config: ApiConfig = {}
  ) {
    const mergedHeaders = { ...headers, ...config.headers };
    return this.request<T>(endpoint, { ...config, method: "DELETE", headers: mergedHeaders });
  }
}

export const apiClient = new ApiClient();
