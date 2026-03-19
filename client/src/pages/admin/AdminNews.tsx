import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { NewsLink, Site } from "@shared/schema";

export default function AdminNews() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", source_name: "", url: "", published_date: "", summary: "",
  });

  const siteQuery = useQuery<Site>({
    queryKey: ["/api/sites", id],
    queryFn: async () => { const res = await apiRequest("GET", `/api/sites/${id}`); return res.json(); },
  });

  const newsQuery = useQuery<NewsLink[]>({
    queryKey: ["/api/sites", id, "news"],
    queryFn: async () => { const res = await apiRequest("GET", `/api/sites/${id}/news`); return res.json(); },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/news", {
        site_id: Number(id), title: form.title,
        source_name: form.source_name || null,
        url: form.url, published_date: form.published_date || null,
        summary: form.summary || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites", id, "news"] });
      setForm({ title: "", source_name: "", url: "", published_date: "", summary: "" });
      setShowForm(false);
      toast({ title: "新闻已添加" });
    },
    onError: (err: Error) => toast({ title: "添加失败", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (newsId: number) => { await apiRequest("DELETE", `/api/news/${newsId}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites", id, "news"] });
      toast({ title: "已删除" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url) { toast({ title: "请填写标题和URL", variant: "destructive" }); return; }
    createMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/admin/sites" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 no-underline">
        <ArrowLeft size={14} /> 返回列表
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold">新闻/文章管理</h1>
          <p className="text-sm text-muted-foreground">{siteQuery.data?.name || "加载中..."}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} className="mr-1" /> 添加链接
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-card mb-6 space-y-4" data-testid="news-form">
          <div>
            <label className="block text-sm font-medium mb-1">标题 <span className="text-destructive">*</span></label>
            <Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="文章标题" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">链接 URL <span className="text-destructive">*</span></label>
            <Input value={form.url} onChange={e => setForm(f => ({...f, url: e.target.value}))} placeholder="https://..." required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">来源</label>
              <Input value={form.source_name} onChange={e => setForm(f => ({...f, source_name: e.target.value}))} placeholder="人民日报" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">发布日期</label>
              <Input type="date" value={form.published_date} onChange={e => setForm(f => ({...f, published_date: e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">摘要</label>
            <Textarea value={form.summary} onChange={e => setForm(f => ({...f, summary: e.target.value}))} rows={2} placeholder="简短摘要..." />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? "保存中..." : "保存"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>取消</Button>
          </div>
        </form>
      )}

      {newsQuery.isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : newsQuery.data && newsQuery.data.length > 0 ? (
        <div className="space-y-2">
          {newsQuery.data.map(n => (
            <div key={n.id} className="flex items-start gap-3 p-4 border rounded-lg bg-card" data-testid={`news-item-${n.id}`}>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold line-clamp-2">{n.title}</h4>
                {n.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.summary}</p>}
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {n.source_name && <span>{n.source_name}</span>}
                  {n.published_date && <span>{n.published_date}</span>}
                  <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                    查看 <ExternalLink size={10} />
                  </a>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive shrink-0"
                onClick={() => { if (confirm("确认删除？")) deleteMutation.mutate(n.id); }}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-8 text-sm text-muted-foreground">暂无新闻链接</p>
      )}
    </div>
  );
}
