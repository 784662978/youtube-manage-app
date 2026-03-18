
import { apiClient } from "@/lib/api-client";
import type { UserRole } from "@/lib/permissions";

interface LoginResponseData {
  user_id: number;
  jwt_token: string;
  refresh_token: string;
  user_role?: UserRole; // 新增用户角色字段
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
    user_role?: UserRole; // 新增用户角色字段
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
      const { refresh_token, jwt_token, user_id, user_role } = result.response;

      // 调试：打印后端返回的完整响应，排查角色字段
      console.log('[Auth] 后端登录响应:', {
        user_id,
        user_role,
        hasUserRole: !!user_role,
        userRoleType: typeof user_role,
        fullResponse: result.response
      });

      // In static export, we cannot set cookies on server side.
      // We return the tokens to the client to handle storage (e.g. localStorage)
      
      // 验证 user_role 是否为有效值
      const validRole = (user_role === 'admin' || user_role === 'user') ? user_role : 'user';
      
      return {
        success: true,
        message: "登录成功",
        data: {
          user_id,
          jwt_token,
          refresh_token,
          user_role: validRole,
        },
      };
    } else {
      return {
        success: false,
        message: result.msg || "登录失败，请检查账号密码",
      };
    }
  } catch (error: unknown) {
    console.error("Login Error:", error);
    const errorMessage = error instanceof Error ? error.message : "服务器连接失败，请稍后重试";
    return {
      success: false,
      message: errorMessage,
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
