import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import type { AuthUser } from "@shared/schema";

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regNickname, setRegNickname] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });
      if (!res.ok) {
        const data = await res.json();
        setLoginError(data.message || data.error || "登录失败，请检查邮箱和密码");
        return;
      }
      const data: AuthUser = await res.json();
      login(data);
      navigate("/");
    } catch (err: any) {
      setLoginError(err.message || "登录失败，请稍后重试");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/register", {
        nickname: regNickname,
        email: regEmail,
        password: regPassword,
      });
      if (!res.ok) {
        const data = await res.json();
        setRegError(data.message || data.error || "注册失败，请检查信息后重试");
        return;
      }
      const data: AuthUser = await res.json();
      login(data);
      navigate("/");
    } catch (err: any) {
      setRegError(err.message || "注册失败，请稍后重试");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none" aria-label="石窟打卡" className="mx-auto mb-3">
            <path d="M16 2L4 14v14a2 2 0 002 2h20a2 2 0 002-2V14L16 2z" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path d="M12 30V20a4 4 0 018 0v10" stroke="currentColor" strokeWidth="2"/>
            <circle cx="16" cy="12" r="3" stroke="hsl(var(--gold))" strokeWidth="2" fill="none"/>
          </svg>
          <h1 className="text-lg font-bold tracking-wide">石窟寺院志</h1>
          <p className="text-sm text-muted-foreground mt-1">记录你在石壁与香火之间的足迹</p>
        </div>

        <div className="border rounded-xl bg-card shadow-sm p-6">
          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="login" data-testid="tab-login">登录</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">注册</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">邮箱</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                    data-testid="input-login-email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password">密码</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="输入密码"
                    required
                    autoComplete="current-password"
                    data-testid="input-login-password"
                  />
                </div>

                {loginError && (
                  <p className="text-sm text-red-500" data-testid="login-error">{loginError}</p>
                )}

                <Button type="submit" className="w-full" disabled={loginLoading} data-testid="button-login">
                  {loginLoading ? "登录中..." : "登录"}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-nickname">昵称</Label>
                  <Input
                    id="reg-nickname"
                    type="text"
                    value={regNickname}
                    onChange={e => setRegNickname(e.target.value)}
                    placeholder="你的昵称"
                    required
                    data-testid="input-reg-nickname"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email">邮箱</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                    data-testid="input-reg-email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-password">密码</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="至少8位"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    data-testid="input-reg-password"
                  />
                </div>

                {regError && (
                  <p className="text-sm text-red-500" data-testid="register-error">{regError}</p>
                )}

                <Button type="submit" className="w-full" disabled={regLoading} data-testid="button-register">
                  {regLoading ? "注册中..." : "创建账号"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Guest link */}
        <div className="text-center mt-5">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground no-underline transition-colors" data-testid="link-guest">
            以访客身份继续 →
          </Link>
        </div>
      </div>
    </div>
  );
}
