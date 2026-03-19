import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Star, Camera, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/App";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Site } from "@shared/schema";

export default function CheckinCreate() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const currentUser = useCurrentUser();

  const [visitedDate, setVisitedDate] = useState(new Date().toISOString().split("T")[0]);
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const siteQuery = useQuery<Site>({
    queryKey: ["/api/sites", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/sites/${id}`);
      return res.json();
    },
  });

  const checkinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/checkins", {
        user_id: currentUser.id,
        site_id: Number(id),
        visited_date: visitedDate,
        rating,
        note: note || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites", id] });
      toast({ title: "打卡成功", description: "你的打卡记录已保存" });
      navigate(`/sites/${id}`);
    },
    onError: (err: Error) => {
      toast({ title: "打卡失败", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitedDate) {
      toast({ title: "请选择日期", variant: "destructive" });
      return;
    }
    checkinMutation.mutate();
  };

  if (siteQuery.isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const site = siteQuery.data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href={`/sites/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 no-underline">
        <ArrowLeft size={14} /> 返回 {site?.name || "详情"}
      </Link>

      <h1 className="text-lg font-bold mb-1" data-testid="checkin-title">打卡 · {site?.name}</h1>
      <p className="text-sm text-muted-foreground mb-6">记录你的到访体验</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-2">到访日期</label>
          <Input
            type="date"
            value={visitedDate}
            onChange={e => setVisitedDate(e.target.value)}
            required
            data-testid="input-date"
          />
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium mb-2">评分</label>
          <div className="flex items-center gap-1" data-testid="rating-stars">
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} type="button"
                onMouseEnter={() => setHoverRating(i)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(i)}
                className="p-1 transition-transform hover:scale-110"
                data-testid={`star-${i}`}
              >
                <Star size={24}
                  className={`transition-colors ${
                    i <= (hoverRating || rating)
                      ? "fill-current"
                      : "opacity-20"
                  }`}
                  style={{ color: i <= (hoverRating || rating) ? "hsl(var(--gold))" : undefined }}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">{rating} / 5</span>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium mb-2">游记 / 感受</label>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="写下你的感受、建议、或难忘的细节..."
            rows={6}
            data-testid="input-note"
          />
        </div>

        {/* Photo upload placeholder */}
        <div>
          <label className="block text-sm font-medium mb-2">照片（功能开发中）</label>
          <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
            <Camera size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs">照片上传功能将在接入云存储后启用</p>
            <p className="text-xs mt-1">当前支持文字打卡</p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" disabled={checkinMutation.isPending} data-testid="submit-checkin">
            {checkinMutation.isPending ? "提交中..." : "提交打卡"}
          </Button>
          <Link href={`/sites/${id}`}>
            <Button type="button" variant="outline">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
