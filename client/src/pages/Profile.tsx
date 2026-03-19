import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { MapPin, Star, Mountain, Building2, Landmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { UserProfile } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const typeLabels: Record<string, string> = { cave: "石窟", temple: "寺院", mountain: "山" };
const typeIcons: Record<string, any> = { cave: Landmark, temple: Building2, mountain: Mountain };

export default function Profile() {
  const { id } = useParams<{ id: string }>();

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/users", id, "profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${id}/profile`);
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">未找到该用户</p>
      </div>
    );
  }

  // Group checkins by site
  const siteMap = new Map<number, { site: any; checkins: any[] }>();
  for (const c of profile.checkins) {
    if (!c.site) continue;
    if (!siteMap.has(c.site_id)) {
      siteMap.set(c.site_id, { site: c.site, checkins: [] });
    }
    siteMap.get(c.site_id)!.checkins.push(c);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* User info */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
          {(profile.nickname || profile.name)[0]}
        </div>
        <div>
          <h1 className="text-lg font-bold" data-testid="profile-name">{profile.nickname || profile.name}</h1>
          <p className="text-sm text-muted-foreground">{profile.email || "文化遗产探索者"}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8" data-testid="stats-grid">
        <StatCard label="已打卡" value={profile.stats.total_sites} unit="个地点" />
        <StatCard label="国家" value={profile.stats.total_countries} unit="个" />
        <StatCard label="地区" value={profile.stats.total_regions} unit="个" />
        <StatCard label="石窟" value={profile.stats.cave_count} unit="处" />
        <StatCard label="寺院" value={profile.stats.temple_count} unit="座" />
        <StatCard label="山" value={profile.stats.mountain_count} unit="座" />
      </div>

      {/* Visited sites list */}
      <h2 className="text-sm font-semibold mb-4 pb-2 border-b">到访记录</h2>
      {siteMap.size > 0 ? (
        <div className="space-y-4">
          {Array.from(siteMap.values()).map(({ site, checkins }) => {
            const TypeIcon = typeIcons[site.type] || MapPin;
            return (
              <div key={site.id} className="border rounded-lg overflow-hidden bg-card" data-testid={`visited-site-${site.id}`}>
                <div className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <Link href={`/sites/${site.id}`} className="shrink-0 no-underline">
                    <div className="w-20 h-20 rounded overflow-hidden bg-muted">
                      {site.thumbnail_image_url ? (
                        <img src={site.thumbnail_image_url} alt={site.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <TypeIcon size={24} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/sites/${site.id}`} className="text-sm font-semibold hover:text-primary no-underline transition-colors">
                      {site.name}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{typeLabels[site.type]}</Badge>
                      <span>{site.country} · {site.region}</span>
                    </div>

                    {/* Checkins for this site */}
                    <div className="mt-2 space-y-1.5">
                      {checkins.map(c => (
                        <div key={c.id} className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{c.visited_date}</span>
                          <span className="mx-1.5">·</span>
                          <span className="inline-flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={8} className={i < c.rating ? "fill-current" : "opacity-20"}
                                style={{ color: i < c.rating ? "hsl(var(--gold))" : undefined }} />
                            ))}
                          </span>
                          {c.note && (
                            <>
                              <span className="mx-1.5">·</span>
                              <span className="line-clamp-1">{c.note}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm mb-2">还没有打卡记录</p>
          <Link href="/" className="text-primary text-sm hover:underline no-underline">去探索石窟与寺院</Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <div className="text-lg font-bold" style={{ color: value > 0 ? "hsl(var(--gold))" : undefined }}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
