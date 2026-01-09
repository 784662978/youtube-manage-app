"use server";

import { cookies } from "next/headers";

export async function refreshTokenAction(userId: number) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return { success: false, message: "No refresh token found" };
    }

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
         // Silently fail or log
         return { success: false };
    }

    const data = await response.json();
    
    if (data.success && data.response) {
        const { jwt_token, refresh_token: newRefreshToken } = data.response;
        
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
