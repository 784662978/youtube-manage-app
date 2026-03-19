"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// 修改 PUBLIC_PATHS 支持两种格式
const PUBLIC_PATHS = ["/login", "/login/"];

import { GlobalLoader } from "@/components/ui/global-loader";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem("jwt_token");
    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

    if (!token && !isPublicPath) {
      // 未登录且访问私有路由，跳转到登录页
      const queryString = searchParams.toString();
      const returnUrl = encodeURIComponent(
        pathname + (queryString ? `?${queryString}` : "")
      );
      
      // 使用 window.location 强制跳转，避免路由守卫冲突
      window.location.href = `/login/?redirect=${returnUrl}`;
      setIsAuthorized(false);
      return;
    } 
    
    if (token && isPublicPath) {
      // 已登录且访问登录页，跳转到首页
      const redirectUrl = searchParams.get("redirect") || "/";
      router.replace(redirectUrl);
      setIsAuthorized(true);
      return;
    }
    
    // 已登录 + 私有路由 或 未登录 + 公开路由
    setIsAuthorized(true);
  }, [pathname, searchParams, router]);

  // Show nothing while checking authentication to prevent content flash
  // You could replace this with a global loading spinner
  if (!isAuthorized) {
      return <GlobalLoader />; 
  }

  return <>{children}</>;
}
