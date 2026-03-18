"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BorderBeam } from "@/components/ui/border-beam"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useActionState, useEffect } from "react"
import { loginAction, LoginState } from "@/app/actions/auth"
import { useRouter } from "next/navigation"
import { usePermission } from "@/components/permission-provider"

const initialState: LoginState = {
  success: false,
  message: "",
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)
  const router = useRouter()
  const { setRole } = usePermission() // 获取权限更新方法

  useEffect(() => {
    if (state.success && state.data) {
      // 存储 JWT Token 到 LocalStorage
      try {
        localStorage.setItem("jwt_token", state.data.jwt_token)
        localStorage.setItem("user_id", state.data.user_id.toString())
        if (state.data.refresh_token) {
          localStorage.setItem("refresh_token", state.data.refresh_token)
        }
        // 同步更新 PermissionProvider 的角色状态
        if (state.data.user_role) {
          console.log('[Login] 设置用户角色:', state.data.user_role)
          setRole(state.data.user_role) // 同时更新 localStorage 和 Provider state
        }
      } catch (e) {
        console.error("Failed to save token to localStorage", e)
      }
      
      // 登录成功后跳转
      // user 角色跳转到排期监控，admin 跳转到频道列表
      const targetPath = state.data.user_role === 'user' 
        ? "/monitor/schedule" 
        : "/Channel/list"
      router.replace(targetPath)
    }
  }, [state, router, setRole])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>欢迎回来</CardTitle>
          <CardDescription>
            输入账号登录YouTuBe管理系统
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">账号</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  required
                  placeholder="请输入账号"
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">密码</FieldLabel>
                </div>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  required 
                  placeholder="请输入密码"
                />
              </Field>
              
              {state.message && !state.success && (
                <div className="text-sm text-red-500 font-medium">
                  {state.message}
                </div>
              )}

              <Field>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "登录中..." : "登录"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <BorderBeam duration={8} size={100} />
      </Card>
    </div>
  )
}
