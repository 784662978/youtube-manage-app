"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    // Clear local storage
    localStorage.removeItem("jwt_token")
    localStorage.removeItem("user_id")
    localStorage.removeItem("refresh_token")
    
    // Redirect to login
    router.push("/login")
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleLogout} title="退出登录">
      <LogOut className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">退出登录</span>
    </Button>
  )
}