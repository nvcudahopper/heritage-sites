import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Save, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import type { AuthUser } from "@shared/schema";

export default function Settings() {
  const { user, setUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">请先登录才能访问设置页面</p>
        <Link href="/login">
          <Button data-testid="button-goto-login">前往登录</Button>
        </Link>
      </div>
    );
  }

  return <SettingsForm user={user} setUser={setUser} navigate={navigate} />;
}

function SettingsForm({
  user,
  setUser,
  navigate,
}: {
  user: AuthUser;
  setUser: (u: AuthUser | null) => void;
  navigate: (to: string) => void;
}) {
  const { toast } = useToast();
  const canChangePassword = user.role === "admin" || user.role === "user";

  const [nickname, setNickname] = useState(user.nickname || "");
  const [email, setEmail] = useState(user.email || "");
  const [newPassword, setNewPassword] = useState("");

  const profileMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, any> = {
        user_id: user.id,
        name: user.name,
        nickname: nickname || null,
        email: email || null,
      };
      if (canChangePassword && newPassword) {
        body.new_password = newPassword;
      }
      const res = await apiRequest("PUT", "/api/auth/profile", body);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "保存失败");
      }
      return res.json();
    },
    onSuccess: (data: AuthUser) => {
      setUser(data);
      setNewPassword("");
      toast({ title: "资料已更新", description: "你的个人资料已成功保存" });
    },
    onError: (err: Error) => {
      toast({ title: "保存失败", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href={`/profile/${user.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 no-underline">
        <ArrowLeft size={14}/> 返回我的主页
      </Link>

      <h1 className="text-lg font-bold mb-1" data-testid="settings-title">账号设置</h1>
      <p className="text-sm text-muted-foreground mb-6">管理你的个人资料和账号信息</p>

      {/* Current user info card */}
      <div className="border rounded-lg bg-card p-4 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold shrink-0">
          {(user.nickname || user.name)[0]}
        </div>
        <div>
          <p className="text-sm font-semibold" data-testid="current-name">{user.nickname || user.name}</p>
          <p className="text-xs text-muted-foreground" data-testid="current-email">{user.email || "未设置邮箱"}</p>
          <p className="text-xs text-muted-foreground capitalize" data-testid="current-role">
            {user.role === "admin" ? "管理员" : user.role === "user" ? "用户" : "访客"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile section */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold">基本信息</h2>

          <div className="space-y-1.5">
            <Label htmlFor="settings-nickname">昵称</Label>
            <Input
              id="settings-nickname"
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="你的显示昵称"
              data-testid="input-nickname"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-email">邮箱</Label>
            <Input
              id="settings-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              data-testid="input-email"
            />
          </div>
        </div>

        {/* Password section (only for admin/user roles) */}
        {canChangePassword && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-muted-foreground"/>
                <h2 className="text-sm font-semibold">修改密码</h2>
              </div>
              <p className="text-xs text-muted-foreground">留空则不修改密码</p>
              <div className="space-y-1.5">
                <Label htmlFor="settings-new-password">新密码</Label>
                <Input
                  id="settings-new-password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="输入新密码（至少8位）"
                  minLength={8}
                  autoComplete="new-password"
                  data-testid="input-new-password"
                />
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={profileMutation.isPending} data-testid="button-save-settings">
            <Save size={14} className="mr-1.5"/>
            {profileMutation.isPending ? "保存中..." : "保存修改"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(`/profile/${user.id}`)} data-testid="button-cancel-settings">
            取消
          </Button>
        </div>
      </form>
    </div>
  );
}
