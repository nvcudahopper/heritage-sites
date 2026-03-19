import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { MapPin, Calendar, Star, ExternalLink, Clock, BookOpen, Image, Newspaper, Users, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SiteDetail as SiteDetailType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

const typeLabels: Record<string, string> = { cave: "石窟", temple: "寺院", mountain: "山" };

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const { data: site, isLoading } = useQuery<SiteDetailType>({
    queryKey: ["/api/sites", id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/sites/${id}`);
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">未找到该地点</p>
        <Link href="/" className="text-primary text-sm hover:underline">返回首页</Link>
      </div>
    );
  }

  const coverImages = site.media.filter(m => m.is_cover_candidate && m.media_type === "image");
  const allImages = site.media.filter(m => m.media_type === "image");
  const heroImages = coverImages.length > 0 ? coverImages : (site.cover_image_url ? [{ id: 0, url: site.cover_image_url, description: site.name }] : []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 no-underline" data-testid="back-link">
        <ArrowLeft size={14} /> 返回列表
      </Link>

      {/* Hero image */}
      {heroImages.length > 0 && <HeroCarousel images={heroImages} />}
      {!heroImages.length && site.cover_image_url && (
        <div className="rounded-lg overflow-hidden mb-6 aspect-video bg-muted">
          <img src={site.cover_image_url} alt={site.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Basic info header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h1 className="text-xl font-bold mb-1" data-testid="site-name">{site.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">{typeLabels[site.type] || site.type}</Badge>
              <span className="flex items-center gap-1"><MapPin size={12}/> {site.country} · {site.region}</span>
            </div>
          </div>
          <Link href={`/sites/${site.id}/checkin`}>
            <Button size="sm" className="shrink-0" data-testid="checkin-button">
              <Star size={14} className="mr-1" /> 打卡
            </Button>
          </Link>
        </div>

        {/* Meta info pills */}
        <div className="flex flex-wrap gap-2 mt-3">
          {site.main_religion && (
            <span className="px-2 py-1 rounded text-xs bg-muted">{site.main_religion}</span>
          )}
          {site.founded_period && (
            <span className="px-2 py-1 rounded text-xs bg-muted flex items-center gap-1">
              <Clock size={10}/> {site.founded_period}
            </span>
          )}
          {site.heritage_status && (
            <span className="px-2 py-1 rounded text-xs border-gold text-gold border" style={{ color: "hsl(var(--gold))", borderColor: "hsl(var(--gold))" }}>
              {site.heritage_status}
            </span>
          )}
          {site.is_active_site && (
            <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">在用宗教场所</span>
          )}
        </div>

        {/* Tags */}
        {site.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {site.tags.map(tag => (
              <Badge key={tag.id} variant="secondary" className="text-xs">{tag.name}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Brief intro */}
      {site.brief_intro && (
        <section className="mb-8" data-testid="section-intro">
          <SectionHeader icon={BookOpen} title="简介" />
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
            {site.brief_intro}
          </p>
        </section>
      )}

      {/* Timeline */}
      {site.events.length > 0 && (
        <section className="mb-8" data-testid="section-timeline">
          <SectionHeader icon={Calendar} title="历史时间线" />
          <div className="relative ml-4 pl-6 border-l-2 border-border space-y-6">
            {site.events.map((event, i) => (
              <div key={event.id} className="relative" data-testid={`timeline-event-${i}`}>
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                <div className="text-xs font-medium text-gold mb-1" style={{ color: "hsl(var(--gold))" }}>
                  {event.year_or_period}
                </div>
                <h4 className="text-sm font-semibold mb-1">{event.title}</h4>
                {event.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related sites */}
      {site.relations.length > 0 && (
        <section className="mb-8" data-testid="section-relations">
          <SectionHeader icon={Users} title="关联地点" />
          <div className="space-y-2">
            {site.relations.map(rel => (
              <div key={rel.id} className="flex items-center gap-3 p-3 rounded border bg-card">
                {rel.related_site ? (
                  <Link href={`/sites/${rel.related_site_id}`} className="text-sm font-medium text-primary hover:underline no-underline">
                    {rel.related_site.name}
                  </Link>
                ) : (
                  <span className="text-sm">未知地点</span>
                )}
                <span className="text-xs text-muted-foreground">— {rel.relation_type}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gallery */}
      {allImages.length > 0 && (
        <section className="mb-8" data-testid="section-gallery">
          <SectionHeader icon={Image} title="图库" />
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {allImages.map((m, i) => (
              <button key={m.id}
                onClick={() => setLightboxIdx(i)}
                className="aspect-square rounded overflow-hidden bg-muted hover:opacity-80 transition-opacity"
                data-testid={`gallery-image-${i}`}
              >
                <img src={m.url} alt={m.description || ""} className="w-full h-full object-cover" loading="lazy"/>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightboxIdx !== null && allImages.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
          <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(Math.max(0, lightboxIdx - 1)); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <ChevronLeft size={24}/>
          </button>
          <img src={allImages[lightboxIdx].url} alt={allImages[lightboxIdx].description || ""} 
            className="max-w-[90vw] max-h-[85vh] object-contain" onClick={e => e.stopPropagation()}/>
          <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(Math.min(allImages.length - 1, lightboxIdx + 1)); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
            <ChevronRight size={24}/>
          </button>
          {allImages[lightboxIdx].description && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded">
              {allImages[lightboxIdx].description}
            </div>
          )}
          <button onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 text-white text-2xl hover:opacity-80">✕</button>
        </div>
      )}

      {/* News */}
      {site.news.length > 0 && (
        <section className="mb-8" data-testid="section-news">
          <SectionHeader icon={Newspaper} title="最新新闻 / 文章" />
          <div className="space-y-2">
            {site.news.map(n => (
              <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded border bg-card hover:bg-muted/50 transition-colors no-underline group"
                data-testid={`news-${n.id}`}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">{n.title}</h4>
                  {n.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.summary}</p>}
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {n.source_name && <span>{n.source_name}</span>}
                    {n.published_date && <span>{n.published_date}</span>}
                  </div>
                </div>
                <ExternalLink size={14} className="shrink-0 text-muted-foreground mt-1" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Checkins */}
      <section className="mb-8" data-testid="section-checkins">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader icon={Star} title="打卡记录" />
          <Link href={`/sites/${site.id}/checkin`}>
            <Button variant="outline" size="sm" className="text-xs" data-testid="add-checkin">
              新增打卡
            </Button>
          </Link>
        </div>
        {site.checkins.length > 0 ? (
          <div className="space-y-3">
            {site.checkins.map(c => (
              <div key={c.id} className="p-4 rounded-lg border bg-card" data-testid={`checkin-${c.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                      {(c.user?.nickname || c.user?.name || "?")[0]}
                    </div>
                    <span className="text-sm font-medium">{c.user?.nickname || c.user?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{c.visited_date}</span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} className={i < c.rating ? "fill-current" : "opacity-30"}
                          style={{ color: i < c.rating ? "hsl(var(--gold))" : undefined }} />
                      ))}
                    </div>
                  </div>
                </div>
                {c.note && <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">{c.note}</p>}
                {c.photos && c.photos.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {c.photos.map(p => (
                      <img key={p.id} src={p.image_url} alt={p.description || ""} className="w-16 h-16 rounded object-cover shrink-0"/>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">还没有打卡记录，来做第一个吧</p>
        )}
      </section>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold mb-4 pb-2 border-b">
      <Icon size={16} className="text-muted-foreground" />
      {title}
    </h3>
  );
}

function HeroCarousel({ images }: { images: { id: number; url: string; description?: string | null }[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="relative rounded-lg overflow-hidden mb-6 aspect-video bg-muted">
      <img src={images[currentIdx].url} alt={images[currentIdx].description || ""} className="w-full h-full object-cover" />
      {images.length > 1 && (
        <>
          <button onClick={() => setCurrentIdx((currentIdx - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white">
            <ChevronLeft size={18}/>
          </button>
          <button onClick={() => setCurrentIdx((currentIdx + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white">
            <ChevronRight size={18}/>
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setCurrentIdx(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === currentIdx ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
        </>
      )}
      {images[currentIdx].description && (
        <div className="absolute bottom-3 left-3 text-white text-xs bg-black/40 px-2 py-1 rounded">
          {images[currentIdx].description}
        </div>
      )}
    </div>
  );
}
