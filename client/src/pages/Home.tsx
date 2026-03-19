import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import { MapPin, Star, Filter, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { SiteWithDetails, Tag } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const typeLabels: Record<string, string> = {
  cave: "石窟",
  temple: "寺院",
  mountain: "山",
};

const typeIcons: Record<string, string> = {
  cave: "🏛",
  temple: "🛕",
  mountain: "🏔",
};

export default function Home() {
  const [filters, setFilters] = useState<{
    type?: string; country?: string; region?: string; tag?: string; era?: string;
  }>({});
  const [showFilters, setShowFilters] = useState(false);

  const sitesQuery = useQuery<SiteWithDetails[]>({
    queryKey: ["/api/sites", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.type) params.set("type", filters.type);
      if (filters.country) params.set("country", filters.country);
      if (filters.region) params.set("region", filters.region);
      if (filters.tag) params.set("tag", filters.tag);
      if (filters.era) params.set("era", filters.era);
      const url = `/api/sites${params.toString() ? `?${params}` : ""}`;
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  const filtersQuery = useQuery<{
    countries: string[];
    regions: string[];
    eras: string[];
    tags: Tag[];
  }>({
    queryKey: ["/api/filters"],
  });

  const clearFilters = () => setFilters({});
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero header */}
      <div className="text-center mb-10">
        <h1 className="text-xl font-bold mb-2 tracking-tight" data-testid="page-title">
          石窟与寺院打卡簿
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          记录我们在石壁与香火之间的足迹
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 border rounded text-sm hover:bg-muted transition-colors"
          data-testid="toggle-filters"
        >
          <Filter size={14} />
          筛选
          <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
          {hasFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
        </button>

        {showFilters && (
          <div className="mt-3 p-4 border rounded-lg bg-card space-y-4" data-testid="filter-panel">
            {/* Type filter */}
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-2">类型</label>
              <div className="flex flex-wrap gap-2">
                {["cave", "temple", "mountain"].map(t => (
                  <button key={t}
                    onClick={() => setFilters(f => ({ ...f, type: f.type === t ? undefined : t }))}
                    className={`px-3 py-1 rounded text-xs border transition-colors ${
                      filters.type === t ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                    }`}
                    data-testid={`filter-type-${t}`}
                  >
                    {typeIcons[t]} {typeLabels[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Country filter */}
            {filtersQuery.data?.countries && filtersQuery.data.countries.length > 1 && (
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-2">国家</label>
                <div className="flex flex-wrap gap-2">
                  {filtersQuery.data.countries.map(c => (
                    <button key={c}
                      onClick={() => setFilters(f => ({ ...f, country: f.country === c ? undefined : c }))}
                      className={`px-3 py-1 rounded text-xs border transition-colors ${
                        filters.country === c ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tag filter */}
            {filtersQuery.data?.tags && filtersQuery.data.tags.length > 0 && (
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-2">标签</label>
                <div className="flex flex-wrap gap-2">
                  {filtersQuery.data.tags.map(tag => (
                    <button key={tag.id}
                      onClick={() => setFilters(f => ({ ...f, tag: f.tag === tag.name ? undefined : tag.name }))}
                      className={`px-3 py-1 rounded text-xs border transition-colors ${
                        filters.tag === tag.name ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-primary hover:underline" data-testid="clear-filters">
                清除所有筛选
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      {sitesQuery.data && (
        <p className="text-xs text-muted-foreground mb-4">
          共 {sitesQuery.data.length} 个地点
        </p>
      )}

      {/* Sites grid */}
      {sitesQuery.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg border overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : sitesQuery.data && sitesQuery.data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sitesQuery.data.map(site => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">没有找到匹配的地点</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-2 text-xs text-primary hover:underline">
              清除筛选条件
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SiteCard({ site }: { site: SiteWithDetails }) {
  return (
    <Link href={`/sites/${site.id}`} className="no-underline group" data-testid={`site-card-${site.id}`}>
      <div className="rounded-lg border overflow-hidden bg-card hover:shadow-md transition-shadow">
        {/* Image */}
        <div className="relative h-40 overflow-hidden bg-muted">
          {site.thumbnail_image_url ? (
            <img
              src={site.thumbnail_image_url}
              alt={site.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">
              {typeIcons[site.type] || "📍"}
            </div>
          )}
          {/* Type badge */}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs bg-background/80 backdrop-blur">
              {typeIcons[site.type]} {typeLabels[site.type] || site.type}
            </Badge>
          </div>
          {/* Checkin count */}
          {(site.checkin_count ?? 0) > 0 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs bg-background/80 backdrop-blur">
                <Star size={10} className="mr-1 text-gold fill-current" style={{ color: "hsl(var(--gold))" }} />
                {site.checkin_count} 次打卡
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
            {site.name}
          </h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin size={12} />
            <span>{site.country} · {site.region}</span>
          </div>
          {site.tags && site.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {site.tags.slice(0, 3).map(tag => (
                <span key={tag.id} className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
