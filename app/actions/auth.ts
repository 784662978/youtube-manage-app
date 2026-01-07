"use server";

import { apiClient } from "@/lib/api-client";
import { cookies } from "next/headers";

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

    const result = await apiClient.post<ApiResponse>("/auth/login", payload);

    if (result.success && result.response) {
      const { refresh_token, jwt_token, user_id } = result.response;

      const cookieStore = await cookies();
      cookieStore.set("refresh_token", refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return {
        success: true,
        message: "登录成功",
        data: {
          user_id,
          jwt_token,
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

export async function refreshTokenAction(userId: number) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return { success: false, message: "No refresh token found" };
    }

    // 调用刷新 Token 接口
    // 注意：这里我们使用 apiClient 进行调用，但要确保不会无限循环调用刷新
    // 实际接口调用可以不需要拦截器，或者我们直接用 fetch 避免副作用
    const response = await fetch("https://data.aipopshort.com/v1/api/auth/refresh-token", {
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
        
        // 更新 Cookie 中的 refresh_token (如果服务端返回了新的)
        if (newRefreshToken) {
            cookieStore.set("refresh_token", newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 7 * 24 * 60 * 60,
            });
        }
        
        return { success: true, jwt_token };
    }
    
    return { success: false };

  } catch (error) {
    console.error("Refresh Token Error:", error);
    return { success: false };
  }
}
