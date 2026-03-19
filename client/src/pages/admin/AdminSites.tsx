import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Edit, Trash2, Calendar, Image, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SiteWithDetails } from "@shared/schema";

const typeLabels: Record<string, string> = { cave: "石窟", temple: "寺院", mountain: "山" };

export default function AdminSites() {
  const { toast } = useToast();

  const { data: sites, isLoading } = useQuery<SiteWithDetails[]>({
    queryKey: ["/api/sites"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/sites/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      toast({ title: "已删除" });
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold" data-testid="admin-title">地点管理</h1>
          <p className="text-sm text-muted-foreground">新增、编辑、删除石窟 / 寺院 / 山</p>
        </div>
        <Link href="/admin/sites/new">
          <Button size="sm" data-testid="add-site-btn">
            <Plus size={14} className="mr-1" /> 新增地点
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : sites && sites.length > 0 ? (
        <div className="space-y-2">
          {sites.map(site => (
            <div key={site.id} className="flex items-center gap-4 p-4 border rounded-lg bg-card" data-testid={`admin-site-${site.id}`}>
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded overflow-hidden bg-muted shrink-0">
                {site.thumbnail_image_url ? (
                  <img src={site.thumbnail_image_url} alt={site.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">📍</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">{site.name}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{typeLabels[site.type] || site.type}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{site.country} · {site.region}</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Link href={`/admin/sites/${site.id}/events`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="时间线">
                    <Calendar size={14} />
                  </Button>
                </Link>
                <Link href={`/admin/sites/${site.id}/media`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="图片">
                    <Image size={14} />
                  </Button>
                </Link>
                <Link href={`/admin/sites/${site.id}/news`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="新闻">
                    <Newspaper size={14} />
                  </Button>
                </Link>
                <Link href={`/admin/sites/${site.id}/edit`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="编辑">
                    <Edit size={14} />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" title="删除"
                  onClick={() => {
                    if (confirm(`确认删除「${site.name}」？`)) {
                      deleteMutation.mutate(site.id);
                    }
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">还没有地点数据</p>
        </div>
      )}
    </div>
  );
}
