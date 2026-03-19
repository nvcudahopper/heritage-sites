import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Shield, Ban, Trash2, CheckCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AdminUser {
  id: number;
  name: string;
  nickname: string | null;
  email: string | null;
  role: "admin" | "user" | "guest";
  is_active: boolean;
  checkin_count: number;
}

const roleLabels: Record<string, string> = {
  admin: "管理员",
  user: "用户",
  guest: "访客",
};

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  user: "secondary",
  guest: "outline",
};

export default function AdminUsers() {
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PUT", `/api/admin/users/${userId}/toggle`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "操作失败");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "状态已更新" });
    },
    onError: (err: Error) => {
      toast({ title: "操作失败", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || "删除失败");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDeleteTarget(null);
      toast({ title: "用户已删除" });
    },
    onError: (err: Error) => {
      toast({ title: "删除失败", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link href="/admin/sites" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 no-underline">
        <ArrowLeft size={14}/> 返回管理
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Users size={20} className="text-muted-foreground"/>
        <div>
          <h1 className="text-lg font-bold" data-testid="admin-users-title">用户管理</h1>
          <p className="text-sm text-muted-foreground">查看和管理所有用户账号</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg"/>)}
        </div>
      ) : !users || users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users size={32} className="mx-auto mb-3 opacity-30"/>
          <p className="text-sm">暂无用户数据</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_1.5fr_1fr_1fr_auto] gap-4 px-4 py-2.5 bg-muted/40 border-b text-xs font-medium text-muted-foreground">
            <span>ID / 姓名</span>
            <span>邮箱</span>
            <span>角色 / 状态</span>
            <span>打卡数</span>
            <span>操作</span>
          </div>

          <div className="divide-y">
            {users.map(u => {
              const isAdmin = u.role === "admin";
              return (
                <div
                  key={u.id}
                  className="flex flex-col md:grid md:grid-cols-[1fr_1.5fr_1fr_1fr_auto] md:items-center gap-2 md:gap-4 px-4 py-3"
                  data-testid={`user-row-${u.id}`}
                >
                  {/* ID / Name */}
                  <div>
                    <div className="text-sm font-medium" data-testid={`user-name-${u.id}`}>
                      {u.nickname || u.name}
                    </div>
                    <div className="text-xs text-muted-foreground">#{u.id}</div>
                  </div>

                  {/* Email */}
                  <div className="text-sm text-muted-foreground truncate" data-testid={`user-email-${u.id}`}>
                    {u.email || <span className="italic opacity-50">未设置</span>}
                  </div>

                  {/* Role / Status */}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={roleBadgeVariant[u.role] || "outline"} className="text-[10px]" data-testid={`user-role-${u.id}`}>
                      {isAdmin && <Shield size={9} className="mr-0.5"/>}
                      {roleLabels[u.role] || u.role}
                    </Badge>
                    <Badge
                      variant={u.is_active ? "outline" : "destructive"}
                      className="text-[10px]"
                      data-testid={`user-status-${u.id}`}
                    >
                      {u.is_active ? "正常" : "已封禁"}
                    </Badge>
                  </div>

                  {/* Checkin count */}
                  <div className="text-sm" data-testid={`user-checkins-${u.id}`}>
                    {u.checkin_count} 次
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Shield size={11}/> 受保护
                      </span>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleMutation.mutate(u.id)}
                          disabled={toggleMutation.isPending}
                          className="h-7 px-2 text-xs"
                          data-testid={`button-toggle-${u.id}`}
                          title={u.is_active ? "封禁用户" : "解封用户"}
                        >
                          {u.is_active ? (
                            <><Ban size={12} className="mr-1 text-orange-500"/> 封禁</>
                          ) : (
                            <><CheckCircle size={12} className="mr-1 text-green-500"/> 解封</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteTarget(u)}
                          disabled={deleteMutation.isPending}
                          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                          data-testid={`button-delete-${u.id}`}
                          title="删除用户"
                        >
                          <Trash2 size={12}/>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除用户「{deleteTarget?.nickname || deleteTarget?.name}」吗？
              此操作不可撤销，该用户的所有打卡数据也将被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="dialog-cancel-delete">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="dialog-confirm-delete"
            >
              {deleteMutation.isPending ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
