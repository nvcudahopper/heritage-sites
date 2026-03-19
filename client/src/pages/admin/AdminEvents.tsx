import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SiteEvent, Site } from "@shared/schema";

export default function AdminEvents() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ year_or_period: "", title: "", description: "", sort_order: "0" });

  const siteQuery = useQuery<Site>({
    queryKey: ["/api/sites", id],
    queryFn: async () => { const res = await apiRequest("GET", `/api/sites/${id}`); return res.json(); },
  });

  const eventsQuery = useQuery<SiteEvent[]>({
    queryKey: ["/api/sites", id, "events"],
    queryFn: async () => { const res = await apiRequest("GET", `/api/sites/${id}/events`); return res.json(); },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/events", {
        site_id: Number(id),
        year_or_period: form.year_or_period,
        title: form.title,
        description: form.description || null,
        sort_order: parseInt(form.sort_order) || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites", id, "events"] });
      setForm({ year_or_period: "", title: "", description: "", sort_order: "0" });
      setShowForm(false);
      toast({ title: "事件已添加" });
    },
    onError: (err: Error) => toast({ title: "添加失败", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: number) => { await apiRequest("DELETE", `/api/events/${eventId}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites", id, "events"] });
      toast({ title: "已删除" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.year_or_period || !form.title) {
      toast({ title: "请填写时间和标题", variant: "destructive" });
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/admin/sites" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 no-underline">
        <ArrowLeft size={14} /> 返回列表
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold">时间线管理</h1>
          <p className="text-sm text-muted-foreground">{siteQuery.data?.name || "加载中..."}</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} data-testid="add-event-btn">
          <Plus size={14} className="mr-1" /> 添加事件
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-card mb-6 space-y-4" data-testid="event-form">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">时间 <span className="text-destructive">*</span></label>
              <Input value={form.year_or_period} onChange={e => setForm(f => ({...f, year_or_period: e.target.value}))} placeholder="公元366年" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">排序</label>
              <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({...f, sort_order: e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">标题 <span className="text-destructive">*</span></label>
            <Input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="事件标题" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} placeholder="事件详细描述..." />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={createMutation.isPending}>
              {createMutation.isPending ? "保存中..." : "保存"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>取消</Button>
          </div>
        </form>
      )}

      {/* Events list */}
      {eventsQuery.isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : eventsQuery.data && eventsQuery.data.length > 0 ? (
        <div className="space-y-2">
          {eventsQuery.data.map(event => (
            <div key={event.id} className="flex items-start gap-3 p-4 border rounded-lg bg-card" data-testid={`event-${event.id}`}>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium mb-1" style={{ color: "hsl(var(--gold))" }}>{event.year_or_period}</div>
                <h4 className="text-sm font-semibold">{event.title}</h4>
                {event.description && <p className="text-xs text-muted-foreground mt-1">{event.description}</p>}
                <span className="text-[10px] text-muted-foreground">排序: {event.sort_order}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive shrink-0"
                onClick={() => { if (confirm("确认删除？")) deleteMutation.mutate(event.id); }}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-8 text-sm text-muted-foreground">暂无时间线事件</p>
      )}
    </div>
  );
}
