
export async function refreshTokenAction(userId: number, refreshToken?: string) {
  try {
    if (!refreshToken) {
      return { success: false, message: "No refresh token provided" };
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
        
        // Return new tokens to client
        return { success: true, jwt_token, refresh_token: newRefreshToken };
    }
    
    return { success: false };

  } catch (error) {
    console.error("Refresh Token Error:", error);
    return { success: false };
  }
}
