import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SiteMedia, Site } from "@shared/schema";

export default function AdminMedia() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    url: "", media_type: "image" as string, source_type: "official" as string,
    is_cover_candidate: false, description: "",
  });

  const siteQuery = useQuery<Site>({
    queryKey: ["/api/sites", id],
    queryFn: async () => { const res = await apiRequest("GET", `/api/sites/${id}`); return res.json(); },
  });

  const mediaQuery = useQuery<SiteMedia[]>({
    queryKey: ["/api/sites", id, "media"],
    queryFn: async () => { const res = await apiRequest("GET", `/api/sites/${id}/media`); return res.json(); },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/media", {
        site_id: Number(id), url: form.url, media_type: form.media_type,
        source_type: form.source_type, is_cover_candidate: form.is_cover_candidate,
        description: form.description || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites", id, "media"] });
      setForm({ url: "", media_type: "image", source_type: "official", is_cover_candidate: false, description: "" });
      setShowForm(false);
      toast({ title: "图片已添加" });
    },
    onError: (err: Error) => toast({ title: "添加失败", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (mediaId: number) => { await apiRequest("DELETE", `/api/media/${mediaId}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites", id, "media"] });
      toast({ title: "已删除" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url) { toast({ title: "请填写URL", variant: "destructive" }); return; }
    createMutation.mutate();
  };

  const sourceLabels: Record<string, string> = {
    official: "官方/资料图", my_photo: "我的实拍", friend_photo: "朋友实拍", web_reference: "网络引用",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/admin/sites" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 no-underline">
        <ArrowLeft size={14} /> 返回列表
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold">图片管理</h1>
          <p className="text-sm text-muted-foreground">{siteQuery.data?.name || "加载中..."}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} className="mr-1" /> 添加图片
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-card mb-6 space-y-4" data-testid="media-form">
          <div>
            <label className="block text-sm font-medium mb-1">图片 URL <span className="text-destructive">*</span></label>
            <Input value={form.url} onChange={e => setForm(f => ({...f, url: e.target.value}))} placeholder="https://..." required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">类型</label>
              <Select value={form.media_type} onValueChange={v => setForm(f => ({...f, media_type: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">图片</SelectItem>
                  <SelectItem value="video">视频</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">来源</label>
              <Select value={form.source_type} onValueChange={v => setForm(f => ({...f, source_type: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="official">官方/资料图</SelectItem>
                  <SelectItem value="my_photo">我的实拍</SelectItem>
                  <SelectItem value="friend_photo">朋友实拍</SelectItem>
                  <SelectItem value="web_reference">网络引用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">说明</label>
            <Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="北崖大佛" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="cover" checked={form.is_cover_candidate} onChange={e => setForm(f => ({...f, is_cover_candidate: e.target.checked}))} />
            <label htmlFor="cover" className="text-sm">作为封面轮播候选</label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? "保存中..." : "保存"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>取消</Button>
          </div>
        </form>
      )}

      {mediaQuery.isLoading ? (
        <div className="grid grid-cols-3 gap-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square" />)}</div>
      ) : mediaQuery.data && mediaQuery.data.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {mediaQuery.data.map(m => (
            <div key={m.id} className="relative group rounded-lg overflow-hidden border bg-card" data-testid={`media-${m.id}`}>
              <div className="aspect-square">
                <img src={m.url} alt={m.description || ""} className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="destructive" size="sm" className="h-8"
                  onClick={() => { if (confirm("确认删除？")) deleteMutation.mutate(m.id); }}>
                  <Trash2 size={12} className="mr-1" /> 删除
                </Button>
              </div>
              <div className="p-2 space-y-1">
                {m.description && <p className="text-xs truncate">{m.description}</p>}
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[10px]">{sourceLabels[m.source_type] || m.source_type}</Badge>
                  {m.is_cover_candidate && <Star size={10} className="fill-current" style={{ color: "hsl(var(--gold))" }} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-8 text-sm text-muted-foreground">暂无图片</p>
      )}
    </div>
  );
}
