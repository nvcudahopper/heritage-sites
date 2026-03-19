import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Site, Tag } from "@shared/schema";

export default function AdminSiteEdit() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isNew = !id;

  const [form, setForm] = useState({
    name: "", type: "cave" as string, country: "中国", region: "",
    coordinates_lat: "", coordinates_lng: "",
    main_religion: "", founded_period: "", heritage_status: "",
    brief_intro: "", is_active_site: false,
    cover_image_url: "", thumbnail_image_url: "",
  });
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const siteQuery = useQuery<Site>({
    queryKey: ["/api/sites", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/sites/${id}`);
      return res.json();
    },
    enabled: !!id,
  });

  const tagsQuery = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  useEffect(() => {
    if (siteQuery.data) {
      const s = siteQuery.data;
      setForm({
        name: s.name, type: s.type, country: s.country, region: s.region,
        coordinates_lat: s.coordinates_lat?.toString() || "",
        coordinates_lng: s.coordinates_lng?.toString() || "",
        main_religion: s.main_religion || "",
        founded_period: s.founded_period || "",
        heritage_status: s.heritage_status || "",
        brief_intro: s.brief_intro || "",
        is_active_site: s.is_active_site,
        cover_image_url: s.cover_image_url || "",
        thumbnail_image_url: s.thumbnail_image_url || "",
      });
    }
  }, [siteQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name,
        type: form.type,
        country: form.country,
        region: form.region,
        coordinates_lat: form.coordinates_lat ? parseFloat(form.coordinates_lat) : null,
        coordinates_lng: form.coordinates_lng ? parseFloat(form.coordinates_lng) : null,
        main_religion: form.main_religion || null,
        founded_period: form.founded_period || null,
        heritage_status: form.heritage_status || null,
        brief_intro: form.brief_intro || null,
        is_active_site: form.is_active_site,
        cover_image_url: form.cover_image_url || null,
        thumbnail_image_url: form.thumbnail_image_url || null,
      };

      let site: Site;
      if (isNew) {
        const res = await apiRequest("POST", "/api/sites", body);
        site = await res.json();
      } else {
        const res = await apiRequest("PUT", `/api/sites/${id}`, body);
        site = await res.json();
      }

      // Handle tags for new site
      if (isNew && selectedTagIds.length > 0) {
        for (const tagId of selectedTagIds) {
          await apiRequest("POST", "/api/site-tags", { site_id: site.id, tag_id: tagId });
        }
      }

      return site;
    },
    onSuccess: (site) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      toast({ title: isNew ? "创建成功" : "保存成功" });
      navigate(`/sites/${site.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "保存失败", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.country || !form.region) {
      toast({ title: "请填写必填字段", description: "名称、国家、地区为必填", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link href="/admin/sites" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 no-underline">
        <ArrowLeft size={14} /> 返回列表
      </Link>

      <h1 className="text-lg font-bold mb-6" data-testid="edit-title">
        {isNew ? "新增地点" : `编辑 · ${siteQuery.data?.name || ""}`}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Required fields */}
        <div>
          <label className="block text-sm font-medium mb-1.5">名称 <span className="text-destructive">*</span></label>
          <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="莫高窟" required data-testid="input-name" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">类型 <span className="text-destructive">*</span></label>
            <Select value={form.type} onValueChange={v => update("type", v)}>
              <SelectTrigger data-testid="select-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cave">石窟</SelectItem>
                <SelectItem value="temple">寺院</SelectItem>
                <SelectItem value="mountain">山</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">国家 <span className="text-destructive">*</span></label>
            <Input value={form.country} onChange={e => update("country", e.target.value)} placeholder="中国" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">地区 <span className="text-destructive">*</span></label>
          <Input value={form.region} onChange={e => update("region", e.target.value)} placeholder="甘肃敦煌" required />
        </div>

        {/* Optional fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">主要宗教</label>
            <Input value={form.main_religion} onChange={e => update("main_religion", e.target.value)} placeholder="佛教" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">建立年代</label>
            <Input value={form.founded_period} onChange={e => update("founded_period", e.target.value)} placeholder="北魏" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">遗产级别</label>
          <Input value={form.heritage_status} onChange={e => update("heritage_status", e.target.value)} placeholder="世界文化遗产" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">纬度</label>
            <Input type="number" step="any" value={form.coordinates_lat} onChange={e => update("coordinates_lat", e.target.value)} placeholder="40.0362" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">经度</label>
            <Input type="number" step="any" value={form.coordinates_lng} onChange={e => update("coordinates_lng", e.target.value)} placeholder="94.8097" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">简介</label>
          <Textarea value={form.brief_intro} onChange={e => update("brief_intro", e.target.value)}
            placeholder="关于这个地点的历史与文化介绍..."
            rows={5} data-testid="input-intro" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">封面图 URL</label>
          <Input value={form.cover_image_url} onChange={e => update("cover_image_url", e.target.value)} placeholder="https://..." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">缩略图 URL</label>
          <Input value={form.thumbnail_image_url} onChange={e => update("thumbnail_image_url", e.target.value)} placeholder="https://..." />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_active" checked={form.is_active_site} onChange={e => update("is_active_site", e.target.checked)} />
          <label htmlFor="is_active" className="text-sm">是否为在用宗教场所</label>
        </div>

        {/* Tags for new site */}
        {isNew && tagsQuery.data && tagsQuery.data.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1.5">标签</label>
            <div className="flex flex-wrap gap-2">
              {tagsQuery.data.map(tag => (
                <button key={tag.id} type="button"
                  onClick={() => {
                    setSelectedTagIds(ids => ids.includes(tag.id) ? ids.filter(i => i !== tag.id) : [...ids, tag.id]);
                  }}
                  className={`px-2 py-1 rounded text-xs border transition-colors ${
                    selectedTagIds.includes(tag.id) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saveMutation.isPending} data-testid="save-btn">
            {saveMutation.isPending ? "保存中..." : (isNew ? "创建地点" : "保存修改")}
          </Button>
          <Link href="/admin/sites">
            <Button type="button" variant="outline">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
