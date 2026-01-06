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
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="relative">
        <CardHeader>
          <CardTitle>欢迎回来</CardTitle>
          <CardDescription>
            输入账号登录YouTuBe管理系统
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">账号</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">密码</FieldLabel>
                </div>
                <Input id="password" type="password" required />
              </Field>
              <Field>
                <Button type="submit">登录</Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <BorderBeam duration={8} size={100} />
      </Card>
    </div>
  )
}