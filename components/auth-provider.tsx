"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const PUBLIC_PATHS = ["/login"];

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
      // User is NOT logged in and visiting a private route
      // Redirect to login with return url
      const queryString = searchParams.toString();
      const returnUrl = encodeURIComponent(pathname + (queryString ? `?${queryString}` : ""));
      router.replace(`/login?redirect=${returnUrl}`);
      setIsAuthorized(false);
    } else if (token && isPublicPath) {
      // User IS logged in and visiting a public route (like login)
      // Redirect to home or stored return url
      const redirectUrl = searchParams.get("redirect") || "/";
      router.replace(redirectUrl);
      setIsAuthorized(true); // Technically we are redirecting, but setting true prevents flash of login page
    } else {
      // 1. Logged in + Private Route -> OK
      // 2. Not Logged in + Public Route -> OK
      setIsAuthorized(true);
    }
  }, [pathname, searchParams, router]);

  // Show nothing while checking authentication to prevent content flash
  // You could replace this with a global loading spinner
  if (!isAuthorized) {
      return <GlobalLoader />; 
  }

  return <>{children}</>;
}
