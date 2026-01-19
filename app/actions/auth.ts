
import { apiClient } from "@/lib/api-client";

interface LoginResponseData {
  user_id: number;
  jwt_token: string;
  refresh_token: string;
}

interface ApiResponse {
  status: number;
  success: boolean;
  msg: string;
  response: LoginResponseData;
}

export type LoginState = {
  success: boolean;
  message?: string;
  data?: {
    user_id: number;
    jwt_token: string;
    refresh_token?: string;
  };
};

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, message: "请输入账号和密码" };
  }

  try {
    const payload = {
      eamil: email,
      pass_word: password,
    };

    const result = await apiClient.post<ApiResponse>("/auth/login", payload, undefined, { skipAuth: true });

    if (result.success && result.response) {
      const { refresh_token, jwt_token, user_id } = result.response;

      // In static export, we cannot set cookies on server side.
      // We return the tokens to the client to handle storage (e.g. localStorage)
      
      return {
        success: true,
        message: "登录成功",
        data: {
          user_id,
          jwt_token,
          refresh_token
        },
      };
    } else {
      return {
        success: false,
        message: result.msg || "登录失败，请检查账号密码",
      };
    }
  } catch (error: any) {
    console.error("Login Error:", error.message);
    return {
      success: false,
      message: error.message || "服务器连接失败，请稍后重试",
    };
  }
}

// Client-side compatible refresh token action
export async function refreshTokenAction(userId: number, currentRefreshToken?: string) {
  try {
    const refreshToken = currentRefreshToken;

    if (!refreshToken) {
      return { success: false, message: "No refresh token provided" };
    }

    // 调用刷新 Token 接口
    const response = await fetch("https://dataapi.aipopshort.com/v1/api/auth/refresh-token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Timestamp": Date.now().toString(),
            "X-Nonce": Math.random().toString(36).substring(7),
        },
        body: JSON.stringify({
            user_id: userId,
            refresh_token: refreshToken
        })
    });

    if (!response.ok) {
        throw new Error(`Refresh failed with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.response) {
        const { jwt_token, refresh_token: newRefreshToken } = data.response;
        
        return { success: true, jwt_token, refresh_token: newRefreshToken };
    }
    
    return { success: false };

  } catch (error) {
    console.error("Refresh Token Error:", error);
    return { success: false };
  }
}
