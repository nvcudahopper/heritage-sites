import type {
  Site, InsertSite, SiteRelation, InsertSiteRelation,
  SiteEvent, InsertSiteEvent, SiteMedia, InsertSiteMedia,
  NewsLink, InsertNewsLink, User, InsertUser,
  Checkin, InsertCheckin, CheckinPhoto, InsertCheckinPhoto,
  Tag, InsertTag, SiteTag, InsertSiteTag,
  SiteWithDetails, SiteDetail, UserProfile,
} from "@shared/schema";

export interface IStorage {
  // Sites
  getSites(filters?: { type?: string; country?: string; region?: string; tag?: string; era?: string }): Promise<SiteWithDetails[]>;
  getSite(id: number): Promise<SiteDetail | undefined>;
  createSite(site: InsertSite): Promise<Site>;
  updateSite(id: number, site: Partial<InsertSite>): Promise<Site | undefined>;
  deleteSite(id: number): Promise<boolean>;

  // Events
  getEventsBySite(siteId: number): Promise<SiteEvent[]>;
  createEvent(event: InsertSiteEvent): Promise<SiteEvent>;
  updateEvent(id: number, event: Partial<InsertSiteEvent>): Promise<SiteEvent | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Media
  getMediaBySite(siteId: number): Promise<SiteMedia[]>;
  createMedia(media: InsertSiteMedia): Promise<SiteMedia>;
  deleteMedia(id: number): Promise<boolean>;

  // News
  getNewsBySite(siteId: number): Promise<NewsLink[]>;
  createNews(news: InsertNewsLink): Promise<NewsLink>;
  updateNews(id: number, news: Partial<InsertNewsLink>): Promise<NewsLink | undefined>;
  deleteNews(id: number): Promise<boolean>;

  // Relations
  getRelationsBySite(siteId: number): Promise<(SiteRelation & { related_site?: Site })[]>;
  createRelation(relation: InsertSiteRelation): Promise<SiteRelation>;
  deleteRelation(id: number): Promise<boolean>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;

  // Checkins
  getCheckinsBySite(siteId: number): Promise<(Checkin & { user?: User; photos?: CheckinPhoto[] })[]>;
  getCheckinsByUser(userId: number): Promise<(Checkin & { site?: Site; photos?: CheckinPhoto[] })[]>;
  createCheckin(checkin: InsertCheckin): Promise<Checkin>;
  deleteCheckin(id: number): Promise<boolean>;

  // Checkin Photos
  createCheckinPhoto(photo: InsertCheckinPhoto): Promise<CheckinPhoto>;

  // Tags
  getTags(): Promise<Tag[]>;
  createTag(tag: InsertTag): Promise<Tag>;
  getTagsBySite(siteId: number): Promise<Tag[]>;
  addSiteTag(siteTag: InsertSiteTag): Promise<SiteTag>;
  removeSiteTag(siteId: number, tagId: number): Promise<boolean>;

  // Profile
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
}

export class MemStorage implements IStorage {
  private sites: Map<number, Site> = new Map();
  private siteRelations: Map<number, SiteRelation> = new Map();
  private siteEvents: Map<number, SiteEvent> = new Map();
  private siteMedia: Map<number, SiteMedia> = new Map();
  private newsLinks: Map<number, NewsLink> = new Map();
  private users: Map<number, User> = new Map();
  private checkins: Map<number, Checkin> = new Map();
  private checkinPhotos: Map<number, CheckinPhoto> = new Map();
  private tags: Map<number, Tag> = new Map();
  private siteTags: Map<number, SiteTag> = new Map();

  private nextId: { [key: string]: number } = {
    sites: 1, relations: 1, events: 1, media: 1, news: 1,
    users: 1, checkins: 1, photos: 1, tags: 1, siteTags: 1,
  };

  private getId(key: string): number {
    const id = this.nextId[key];
    this.nextId[key]++;
    return id;
  }

  constructor() {
    this.seed();
  }

  // ============ Sites ============
  async getSites(filters?: { type?: string; country?: string; region?: string; tag?: string; era?: string }): Promise<SiteWithDetails[]> {
    let sites = Array.from(this.sites.values());

    if (filters?.type) {
      sites = sites.filter(s => s.type === filters.type);
    }
    if (filters?.country) {
      sites = sites.filter(s => s.country === filters.country);
    }
    if (filters?.region) {
      sites = sites.filter(s => s.region.includes(filters.region!));
    }
    if (filters?.era) {
      sites = sites.filter(s => s.founded_period?.includes(filters.era!) ?? false);
    }
    if (filters?.tag) {
      const tagSiteIds = Array.from(this.siteTags.values())
        .filter(st => {
          const tag = this.tags.get(st.tag_id);
          return tag && tag.name === filters.tag;
        })
        .map(st => st.site_id);
      sites = sites.filter(s => tagSiteIds.includes(s.id));
    }

    return sites.map(s => {
      const tags = this.getTagsForSiteSync(s.id);
      const checkinCount = Array.from(this.checkins.values()).filter(c => c.site_id === s.id).length;
      return { ...s, tags, checkin_count: checkinCount };
    });
  }

  async getSite(id: number): Promise<SiteDetail | undefined> {
    const site = this.sites.get(id);
    if (!site) return undefined;

    const events = Array.from(this.siteEvents.values())
      .filter(e => e.site_id === id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const media = Array.from(this.siteMedia.values())
      .filter(m => m.site_id === id);

    const news = Array.from(this.newsLinks.values())
      .filter(n => n.site_id === id)
      .sort((a, b) => (b.published_date || '').localeCompare(a.published_date || ''));

    const relations = Array.from(this.siteRelations.values())
      .filter(r => r.site_id === id)
      .map(r => ({
        ...r,
        related_site: this.sites.get(r.related_site_id),
      }));

    const tags = this.getTagsForSiteSync(id);

    const checkins = Array.from(this.checkins.values())
      .filter(c => c.site_id === id)
      .sort((a, b) => b.visited_date.localeCompare(a.visited_date))
      .map(c => ({
        ...c,
        user: this.users.get(c.user_id),
        photos: Array.from(this.checkinPhotos.values()).filter(p => p.checkin_id === c.id),
      }));

    return { ...site, events, media, news, relations, tags, checkins };
  }

  async createSite(input: InsertSite): Promise<Site> {
    const id = this.getId('sites');
    const now = new Date().toISOString();
    const site: Site = {
      id,
      name: input.name,
      type: input.type,
      country: input.country,
      region: input.region,
      coordinates_lat: input.coordinates_lat ?? null,
      coordinates_lng: input.coordinates_lng ?? null,
      main_religion: input.main_religion ?? null,
      founded_period: input.founded_period ?? null,
      heritage_status: input.heritage_status ?? null,
      brief_intro: input.brief_intro ?? null,
      is_active_site: input.is_active_site ?? false,
      cover_image_url: input.cover_image_url ?? null,
      thumbnail_image_url: input.thumbnail_image_url ?? null,
      created_at: now,
      updated_at: now,
    };
    this.sites.set(id, site);
    return site;
  }

  async updateSite(id: number, input: Partial<InsertSite>): Promise<Site | undefined> {
    const existing = this.sites.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...input, updated_at: new Date().toISOString() };
    this.sites.set(id, updated);
    return updated;
  }

  async deleteSite(id: number): Promise<boolean> {
    return this.sites.delete(id);
  }

  // ============ Events ============
  async getEventsBySite(siteId: number): Promise<SiteEvent[]> {
    return Array.from(this.siteEvents.values())
      .filter(e => e.site_id === siteId)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  async createEvent(input: InsertSiteEvent): Promise<SiteEvent> {
    const id = this.getId('events');
    const event: SiteEvent = { id, ...input, description: input.description ?? null, sort_order: input.sort_order ?? 0 };
    this.siteEvents.set(id, event);
    return event;
  }

  async updateEvent(id: number, input: Partial<InsertSiteEvent>): Promise<SiteEvent | undefined> {
    const existing = this.siteEvents.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...input };
    this.siteEvents.set(id, updated as SiteEvent);
    return updated as SiteEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.siteEvents.delete(id);
  }

  // ============ Media ============
  async getMediaBySite(siteId: number): Promise<SiteMedia[]> {
    return Array.from(this.siteMedia.values()).filter(m => m.site_id === siteId);
  }

  async createMedia(input: InsertSiteMedia): Promise<SiteMedia> {
    const id = this.getId('media');
    const media: SiteMedia = { id, ...input, description: input.description ?? null, is_cover_candidate: input.is_cover_candidate ?? false };
    this.siteMedia.set(id, media);
    return media;
  }

  async deleteMedia(id: number): Promise<boolean> {
    return this.siteMedia.delete(id);
  }

  // ============ News ============
  async getNewsBySite(siteId: number): Promise<NewsLink[]> {
    return Array.from(this.newsLinks.values())
      .filter(n => n.site_id === siteId)
      .sort((a, b) => (b.published_date || '').localeCompare(a.published_date || ''));
  }

  async createNews(input: InsertNewsLink): Promise<NewsLink> {
    const id = this.getId('news');
    const news: NewsLink = {
      id, site_id: input.site_id, title: input.title,
      source_name: input.source_name ?? null, url: input.url,
      published_date: input.published_date ?? null, summary: input.summary ?? null,
    };
    this.newsLinks.set(id, news);
    return news;
  }

  async updateNews(id: number, input: Partial<InsertNewsLink>): Promise<NewsLink | undefined> {
    const existing = this.newsLinks.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...input };
    this.newsLinks.set(id, updated as NewsLink);
    return updated as NewsLink;
  }

  async deleteNews(id: number): Promise<boolean> {
    return this.newsLinks.delete(id);
  }

  // ============ Relations ============
  async getRelationsBySite(siteId: number): Promise<(SiteRelation & { related_site?: Site })[]> {
    return Array.from(this.siteRelations.values())
      .filter(r => r.site_id === siteId)
      .map(r => ({ ...r, related_site: this.sites.get(r.related_site_id) }));
  }

  async createRelation(input: InsertSiteRelation): Promise<SiteRelation> {
    const id = this.getId('relations');
    const rel: SiteRelation = { id, ...input };
    this.siteRelations.set(id, rel);
    return rel;
  }

  async deleteRelation(id: number): Promise<boolean> {
    return this.siteRelations.delete(id);
  }

  // ============ Users ============
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(input: InsertUser): Promise<User> {
    const id = this.getId('users');
    const user: User = { id, name: input.name, nickname: input.nickname ?? null, email: input.email ?? null, avatar_url: input.avatar_url ?? null };
    this.users.set(id, user);
    return user;
  }

  // ============ Checkins ============
  async getCheckinsBySite(siteId: number): Promise<(Checkin & { user?: User; photos?: CheckinPhoto[] })[]> {
    return Array.from(this.checkins.values())
      .filter(c => c.site_id === siteId)
      .sort((a, b) => b.visited_date.localeCompare(a.visited_date))
      .map(c => ({
        ...c,
        user: this.users.get(c.user_id),
        photos: Array.from(this.checkinPhotos.values()).filter(p => p.checkin_id === c.id),
      }));
  }

  async getCheckinsByUser(userId: number): Promise<(Checkin & { site?: Site; photos?: CheckinPhoto[] })[]> {
    return Array.from(this.checkins.values())
      .filter(c => c.user_id === userId)
      .sort((a, b) => b.visited_date.localeCompare(a.visited_date))
      .map(c => ({
        ...c,
        site: this.sites.get(c.site_id),
        photos: Array.from(this.checkinPhotos.values()).filter(p => p.checkin_id === c.id),
      }));
  }

  async createCheckin(input: InsertCheckin): Promise<Checkin> {
    const id = this.getId('checkins');
    const checkin: Checkin = {
      id, user_id: input.user_id, site_id: input.site_id,
      visited_date: input.visited_date, rating: input.rating,
      note: input.note ?? null, created_at: new Date().toISOString(),
    };
    this.checkins.set(id, checkin);
    return checkin;
  }

  async deleteCheckin(id: number): Promise<boolean> {
    return this.checkins.delete(id);
  }

  // ============ Checkin Photos ============
  async createCheckinPhoto(input: InsertCheckinPhoto): Promise<CheckinPhoto> {
    const id = this.getId('photos');
    const photo: CheckinPhoto = { id, checkin_id: input.checkin_id, image_url: input.image_url, description: input.description ?? null };
    this.checkinPhotos.set(id, photo);
    return photo;
  }

  // ============ Tags ============
  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async createTag(input: InsertTag): Promise<Tag> {
    const id = this.getId('tags');
    const tag: Tag = { id, name: input.name, category: input.category ?? null };
    this.tags.set(id, tag);
    return tag;
  }

  async getTagsBySite(siteId: number): Promise<Tag[]> {
    return this.getTagsForSiteSync(siteId);
  }

  async addSiteTag(input: InsertSiteTag): Promise<SiteTag> {
    const id = this.getId('siteTags');
    const st: SiteTag = { id, site_id: input.site_id, tag_id: input.tag_id };
    this.siteTags.set(id, st);
    return st;
  }

  async removeSiteTag(siteId: number, tagId: number): Promise<boolean> {
    for (const [id, st] of this.siteTags.entries()) {
      if (st.site_id === siteId && st.tag_id === tagId) {
        this.siteTags.delete(id);
        return true;
      }
    }
    return false;
  }

  // ============ Profile ============
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const userCheckins = Array.from(this.checkins.values())
      .filter(c => c.user_id === userId)
      .sort((a, b) => b.visited_date.localeCompare(a.visited_date))
      .map(c => ({
        ...c,
        site: this.sites.get(c.site_id),
        photos: Array.from(this.checkinPhotos.values()).filter(p => p.checkin_id === c.id),
      }));

    const checkedSiteIds = [...new Set(userCheckins.map(c => c.site_id))];
    const checkedSites = checkedSiteIds.map(id => this.sites.get(id)).filter(Boolean) as Site[];

    return {
      ...user,
      checkins: userCheckins,
      stats: {
        total_sites: checkedSites.length,
        total_countries: [...new Set(checkedSites.map(s => s.country))].length,
        total_regions: [...new Set(checkedSites.map(s => s.region))].length,
        cave_count: checkedSites.filter(s => s.type === 'cave').length,
        temple_count: checkedSites.filter(s => s.type === 'temple').length,
        mountain_count: checkedSites.filter(s => s.type === 'mountain').length,
      },
    };
  }

  // ============ Helper ============
  private getTagsForSiteSync(siteId: number): Tag[] {
    const tagIds = Array.from(this.siteTags.values())
      .filter(st => st.site_id === siteId)
      .map(st => st.tag_id);
    return tagIds.map(id => this.tags.get(id)).filter(Boolean) as Tag[];
  }

  // ============ Seed Data ============
  private seed() {
    // --- Tags ---
    const tagData: InsertTag[] = [
      { name: "四大石窟", category: "group" },
      { name: "世界文化遗产", category: "heritage" },
      { name: "丝绸之路", category: "route" },
      { name: "全国重点文物保护单位", category: "heritage" },
      { name: "佛教圣地", category: "religion" },
      { name: "道教圣地", category: "religion" },
      { name: "世界自然与文化双遗产", category: "heritage" },
    ];
    const tagMap: Record<string, number> = {};
    for (const t of tagData) {
      const tag = { id: this.getId('tags'), name: t.name, category: t.category ?? null };
      this.tags.set(tag.id, tag);
      tagMap[t.name] = tag.id;
    }

    // --- Users ---
    const u1: User = { id: this.getId('users'), name: "访客", nickname: "默认用户", email: null, avatar_url: null };
    this.users.set(u1.id, u1);
    const u2: User = { id: this.getId('users'), name: "小明", nickname: "石窟爱好者", email: "xm@example.com", avatar_url: null };
    this.users.set(u2.id, u2);

    // --- Sites: 石窟 ---
    const mogao = this.seedSite({
      name: "莫高窟", type: "cave", country: "中国", region: "甘肃敦煌",
      coordinates_lat: 40.0362, coordinates_lng: 94.8097,
      main_religion: "佛教", founded_period: "前秦（公元366年）",
      heritage_status: "世界文化遗产",
      brief_intro: "莫高窟又称千佛洞，坐落于河西走廊西端的敦煌市境内，始建于前秦宣昭帝建元二年（公元366年），历经十六国、北朝、隋、唐、五代、西夏、元等朝代的兴建修缮，形成规模宏大的石窟群。现存洞窟735个，壁画4.5万平方米、泥质彩塑2415尊，是世界上现存规模最大、内容最丰富的佛教艺术地。",
      is_active_site: false,
      cover_image_url: "https://images.unsplash.com/photo-1609665558965-8e4c789cd7c5?w=1200&h=675&fit=crop",
      thumbnail_image_url: "https://images.unsplash.com/photo-1609665558965-8e4c789cd7c5?w=400&h=300&fit=crop",
    }, ["四大石窟", "世界文化遗产", "丝绸之路", "全国重点文物保护单位"], tagMap);

    const yungang = this.seedSite({
      name: "云冈石窟", type: "cave", country: "中国", region: "山西大同",
      coordinates_lat: 40.1097, coordinates_lng: 113.1323,
      main_religion: "佛教", founded_period: "北魏（公元460年）",
      heritage_status: "世界文化遗产",
      brief_intro: "云冈石窟位于山西省大同市西郊武州山南麓，依山开凿，东西绵延约一公里。现存主要洞窟45个，大小窟龛252个，石雕造像五万一千余尊。其中第20窟的露天大佛高13.7米，是云冈石窟的代表作。石窟造像气势宏伟，内容丰富多彩，被称为中国古代雕刻艺术的宝库。",
      is_active_site: false,
      cover_image_url: "https://images.unsplash.com/photo-1590123752840-cc32399d0e59?w=1200&h=675&fit=crop",
      thumbnail_image_url: "https://images.unsplash.com/photo-1590123752840-cc32399d0e59?w=400&h=300&fit=crop",
    }, ["四大石窟", "世界文化遗产", "全国重点文物保护单位"], tagMap);

    const longmen = this.seedSite({
      name: "龙门石窟", type: "cave", country: "中国", region: "河南洛阳",
      coordinates_lat: 34.5644, coordinates_lng: 112.4696,
      main_religion: "佛教", founded_period: "北魏（公元493年）",
      heritage_status: "世界文化遗产",
      brief_intro: "龙门石窟位于河南省洛阳市南郊伊河两岸的龙门山与香山上，是中国石刻艺术宝库之一。开凿于北魏孝文帝迁都洛阳之际，之后历经东魏、西魏、北齐、隋、唐、五代的营造，南北长达1公里，今存有窟龛2345个，造像10万余尊，碑刻题记2800余品。其中卢舍那大佛为龙门石窟最大造像。",
      is_active_site: false,
      cover_image_url: "https://images.unsplash.com/photo-1591792111137-5b8219d5fad6?w=1200&h=675&fit=crop",
      thumbnail_image_url: "https://images.unsplash.com/photo-1591792111137-5b8219d5fad6?w=400&h=300&fit=crop",
    }, ["四大石窟", "世界文化遗产", "全国重点文物保护单位"], tagMap);

    const maijishan = this.seedSite({
      name: "麦积山石窟", type: "cave", country: "中国", region: "甘肃天水",
      coordinates_lat: 34.3509, coordinates_lng: 106.0012,
      main_religion: "佛教", founded_period: "后秦（公元384年）",
      heritage_status: "世界文化遗产",
      brief_intro: "麦积山石窟位于甘肃省天水市麦积区，因山形如麦垛而得名。石窟始建于后秦时期，大兴于北魏明元帝、太武帝时期，以精美的泥塑艺术闻名于世。现存窟龛194个，泥塑、石雕7800多件，壁画1000多平方米，被誉为「东方雕塑陈列馆」。",
      is_active_site: false,
      cover_image_url: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=1200&h=675&fit=crop",
      thumbnail_image_url: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=400&h=300&fit=crop",
    }, ["四大石窟", "世界文化遗产", "丝绸之路", "全国重点文物保护单位"], tagMap);

    const dazu = this.seedSite({
      name: "大足石刻", type: "cave", country: "中国", region: "重庆大足",
      coordinates_lat: 29.7026, coordinates_lng: 105.7109,
      main_religion: "佛教/道教/儒教", founded_period: "唐末五代（公元892年）",
      heritage_status: "世界文化遗产",
      brief_intro: "大足石刻位于重庆市大足区境内，是唐末、宋初时期宗教摩崖石刻的杰作。造像始建于初唐，历经唐末至南宋，明清也有部分雕刻，以北山、宝顶山、南山、石篆山、石门山五处最为集中。大足石刻是中国晚期石窟艺术的代表，融佛教、道教、儒教三教造像于一体，以鲜明的民族化、世俗化特色著称。",
      is_active_site: false,
      cover_image_url: "https://images.unsplash.com/photo-1558431382-27e303142255?w=1200&h=675&fit=crop",
      thumbnail_image_url: "https://images.unsplash.com/photo-1558431382-27e303142255?w=400&h=300&fit=crop",
    }, ["世界文化遗产", "全国重点文物保护单位"], tagMap);

    // --- Sites: 寺院 ---
    const famen = this.seedSite({
      name: "法门寺", type: "temple", country: "中国", region: "陕西扶风",
      coordinates_lat: 34.4442, coordinates_lng: 107.8952,
      main_religion: "佛教", founded_period: "东汉（公元68年）",
      heritage_status: "全国重点文物保护单位",
      brief_intro: "法门寺位于陕西省宝鸡市扶风县城北约10公里的法门镇，始建于东汉。1987年在修复宝塔时发现了唐代地宫，出土了佛指舍利以及大量唐代宫廷珍宝，震惊世界。法门寺因供奉佛祖释迦牟尼指骨舍利而闻名于世，被联合国教科文组织评为「世界第九大奇迹」。",
      is_active_site: true,
      cover_image_url: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=1200&h=675&fit=crop",
      thumbnail_image_url: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=300&fit=crop",
    }, ["全国重点文物保护单位", "佛教圣地"], tagMap);

    const shaolin = this.seedSite({
      name: "少林寺", type: "temple", country: "中国", region: "河南登封",
      coordinates_lat: 34.5078, coordinates_lng: 112.9365,
      main_religion: "佛教", founded_period: "北魏太和十九年（公元495年）",
      heritage_status: "世界文化遗产",
      brief_intro: "少林寺位于河南省郑州市登封市嵩山五乳峰下，因坐落于嵩山腹地少室山茂密丛林之中而得名。始建于北魏太和十九年（495年），是中国佛教禅宗祖庭和中国功夫的发源地。寺内保存有大量珍贵的文物古迹，被列为全国重点文物保护单位。",
      is_active_site: true,
      cover_image_url: "https://images.unsplash.com/photo-1598887142487-3c854d51eabb?w=1200&h=675&fit=crop",
      thumbnail_image_url: "https://images.unsplash.com/photo-1598887142487-3c854d51eabb?w=400&h=300&fit=crop",
    }, ["世界文化遗产", "全国重点文物保护单位", "佛教圣地"], tagMap);

    const hanshan = this.seedSite({
      name: "寒山寺", type: "temple", country: "中国", region: "江苏苏州",
      coordinates_lat: 31.3166, coordinates_lng: 120.5670,
      main_religion: "佛教", founded_period: "南朝梁天监年间（公元502-519年）",
      heritage_status: "全国重点文物保护单位",
      brief_intro: "寒山寺位于苏州市姑苏区，初名「妙利普明塔院」。因唐代诗人张继的《枫桥夜泊》一诗而名扬天下。「月落乌啼霜满天，江枫渔火对愁眠。姑苏城外寒山寺，夜半钟声到客船。」寺内古迹众多，有张继诗的石刻碑文、寒山与拾得的故事等。",
      is_active_site: true,
      cover_image_url: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=1200&h=675&fit=crop",
      thumbnail_image_url: "https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=300&fit=crop",
    }, ["全国重点文物保护单位", "佛教圣地"], tagMap);

    const lingyin = this.seedSite({
      name: "灵隐寺", type: "temple", country: "中国", region: "浙江杭州",
      coordinates_lat: 30.2408, coordinates_lng: 120.1005,
      main_religion: "佛教", founded_period: "东晋咸和元年（公元326年）",
      heritage_status: "全国重点文物保护单位",
      brief_intro: "灵隐寺位于浙江省杭州市西湖西北面，背靠北高峰，面朝飞来峰，始建于东晋咸和元年（326年），距今已有约一千七百年的历史。灵隐寺是中国佛教著名寺院之一，也是杭州最负盛名的古刹。",
      is_active_site: true,
      cover_image_url: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&h=675&fit=crop",
      thumbnail_image_url: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop",
    }, ["全国重点文物保护单位", "佛教圣地"], tagMap);

    const baima = this.seedSite({
      name: "白马寺", type: "temple", country: "中国", region: "河南洛阳",
      coordinates_lat: 34.7321, coordinates_lng: 112.5629,
      main_religion: "佛教", founded_period: "东汉永平十一年（公元68年）",
      heritage_status: "全国重点文物保护单位",
      brief_intro: "白马寺位于河南省洛阳市东郊，是中国第一座由官方营建的佛教寺院，被称为「中国第一古刹」。东汉明帝派使者西行求法，使者与天竺高僧摄摩腾、竺法兰以白马驮载佛经、佛像来到洛阳，建白马寺以安置。",
      is_active_site: true,
      cover_image_url: "https://images.unsplash.com/photo-1577037905339-6e6d8153c759?w=1200&h=675&fit=crop",
      thumbnail_image_url: "https://images.unsplash.com/photo-1577037905339-6e6d8153c759?w=400&h=300&fit=crop",
    }, ["全国重点文物保护单位", "佛教圣地"], tagMap);

    // --- Foreign temples ---
    const todaiji = this.seedSite({
      name: "东大寺", type: "temple", country: "日本", region: "奈良",
      coordinates_lat: 34.6889, coordinates_lng: 135.8398,
      main_religion: "佛教", founded_period: "天平十五年（公元743年）",
      heritage_status: "世界文化遗产",
      brief_intro: "东大寺位于日本奈良市，是华严宗大本山。大佛殿（金堂）是世界最大的木造建筑之一，殿内供奉有卢舍那大佛坐像，高约15米。东大寺是全日本68所国分寺的总寺院，于1998年作为「古都奈良的文化财」被列入世界文化遗产。",
      is_active_site: true,
      cover_image_url: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&h=675&fit=crop",
      thumbnail_image_url: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=300&fit=crop",
    }, ["世界文化遗产", "佛教圣地"], tagMap);

    const ajanta = this.seedSite({
      name: "阿旃陀石窟", type: "cave", country: "印度", region: "马哈拉施特拉邦",
      coordinates_lat: 20.5522, coordinates_lng: 75.7003,
      main_religion: "佛教", founded_period: "公元前2世纪",
      heritage_status: "世界文化遗产",
      brief_intro: "阿旃陀石窟位于印度马哈拉施特拉邦北部，是印度古代佛教文化的遗址。石窟群共30座，凿于公元前2世纪至公元6世纪之间，以精美的壁画和石雕闻名，是印度古代艺术的最高成就之一。1983年被列入世界文化遗产名录。",
      is_active_site: false,
      cover_image_url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&h=675&fit=crop",
      thumbnail_image_url: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=300&fit=crop",
    }, ["世界文化遗产"], tagMap);

    // --- Events for Mogao ---
    this.seedEvents(mogao.id, [
      { year_or_period: "前秦建元二年（公元366年）", title: "乐僔法师始凿第一窟", description: "前秦僧人乐僔路经三危山，忽见金光闪耀如万佛现世，遂于崖壁凿建第一座洞窟。", sort_order: 1 },
      { year_or_period: "北魏至隋", title: "大规模开凿时期", description: "历经北魏、西魏、北周至隋代，洞窟数量大幅增长，壁画风格从西域风格逐渐融合中原特色。", sort_order: 2 },
      { year_or_period: "唐代（618-907年）", title: "鼎盛时期", description: "唐代是莫高窟建设最繁盛时期，开凿洞窟千余个，壁画和彩塑达到最高艺术水准。", sort_order: 3 },
      { year_or_period: "公元1900年", title: "藏经洞被发现", description: "道士王圆箓在清理积沙时偶然发现17号洞窟（藏经洞），内藏约五万件从4世纪到11世纪的经卷文书。", sort_order: 4 },
      { year_or_period: "公元1961年", title: "被列为全国重点文物保护单位", description: "中华人民共和国国务院公布莫高窟为全国第一批重点文物保护单位。", sort_order: 5 },
      { year_or_period: "公元1987年", title: "被列入世界文化遗产名录", description: "联合国教科文组织将莫高窟列入世界文化遗产名录。", sort_order: 6 },
    ]);

    // Events for Yungang
    this.seedEvents(yungang.id, [
      { year_or_period: "北魏和平初年（公元460年）", title: "昙曜五窟开凿", description: "高僧昙曜主持开凿第16-20窟，即著名的「昙曜五窟」，以北魏五帝为原型雕刻五尊大佛。", sort_order: 1 },
      { year_or_period: "北魏太和年间（477-499年）", title: "大规模扩建", description: "孝文帝迁都前后，云冈石窟进行了大规模的扩建，形成了规模宏大的石窟群。", sort_order: 2 },
      { year_or_period: "公元2001年", title: "被列入世界文化遗产名录", description: "联合国教科文组织将云冈石窟列入世界文化遗产名录。", sort_order: 3 },
    ]);

    // Events for Longmen
    this.seedEvents(longmen.id, [
      { year_or_period: "北魏太和十七年（公元493年）", title: "孝文帝迁都洛阳始凿", description: "北魏孝文帝迁都洛阳后，开始在龙门伊水两岸开凿石窟。", sort_order: 1 },
      { year_or_period: "唐代（公元675年）", title: "奉先寺卢舍那大佛完工", description: "唐高宗时期，奉先寺大型摩崖像龛完工，主尊卢舍那大佛高17.14米，据传以武则天为蓝本雕刻。", sort_order: 2 },
      { year_or_period: "公元2000年", title: "被列入世界文化遗产名录", description: "联合国教科文组织将龙门石窟列入世界文化遗产名录。", sort_order: 3 },
    ]);

    // Events for Famen Si
    this.seedEvents(famen.id, [
      { year_or_period: "东汉明帝年间（公元68年）", title: "始建", description: "法门寺据传始建于东汉明帝时期，初名「阿育王寺」。", sort_order: 1 },
      { year_or_period: "唐代", title: "迎佛骨盛典", description: "唐代皇帝曾多次迎请法门寺佛骨舍利到长安供养，规模盛大。", sort_order: 2 },
      { year_or_period: "公元1987年", title: "唐代地宫发掘", description: "修复法门寺宝塔时发现唐代地宫，出土佛指舍利及两千余件唐代珍贵文物。", sort_order: 3 },
    ]);

    // --- Relations ---
    this.seedRelation(longmen.id, baima.id, "同属洛阳佛教遗产");
    this.seedRelation(longmen.id, shaolin.id, "同属河南佛教名胜");
    this.seedRelation(mogao.id, maijishan.id, "同属丝绸之路石窟群");

    // --- News Links ---
    this.seedNews(mogao.id, [
      { title: "敦煌研究院发布2024年度莫高窟壁画保护报告", source_name: "光明日报", url: "https://www.gmw.cn", published_date: "2024-12-15", summary: "报告显示莫高窟壁画数字化工程已覆盖80%以上的洞窟。" },
      { title: "数字敦煌全球共享平台升级上线", source_name: "人民日报", url: "https://www.people.com.cn", published_date: "2024-11-20", summary: "升级后的平台提供更高分辨率的洞窟全景漫游体验。" },
    ]);
    this.seedNews(yungang.id, [
      { title: "云冈石窟数字化保护项目取得新进展", source_name: "新华社", url: "https://www.xinhua.com", published_date: "2024-10-08", summary: "3D打印技术首次成功复制云冈石窟第12窟。" },
    ]);

    // --- Checkins ---
    const c1 = this.seedCheckin(u1.id, mogao.id, "2024-08-15", 5, "震撼，壁画的色彩和细节超乎想象。参观了几个特窟，九层楼的佛像让人肃然起敬。");
    const c2 = this.seedCheckin(u1.id, yungang.id, "2024-06-20", 4, "北魏的石雕非常有力量感，尤其是昙曜五窟的大佛。夏天去的，太阳很晒但值得。");
    const c3 = this.seedCheckin(u2.id, longmen.id, "2024-09-01", 5, "卢舍那大佛的微笑至今令我难忘。建议春秋季去，可以坐游船在伊河上远眺石窟全景。");
    this.seedCheckin(u1.id, famen.id, "2024-07-10", 4, "地宫的文物非常震撼，佛指舍利的安保很严格。寺院本身也很壮观。");
    this.seedCheckin(u2.id, mogao.id, "2024-10-05", 5, "国庆去的人很多，但还是值得。特窟需要额外预约，强烈推荐。");
  }

  private seedSite(input: InsertSite, tagNames: string[], tagMap: Record<string, number>): Site {
    const id = this.getId('sites');
    const now = new Date().toISOString();
    const site: Site = {
      id,
      name: input.name,
      type: input.type,
      country: input.country,
      region: input.region,
      coordinates_lat: input.coordinates_lat ?? null,
      coordinates_lng: input.coordinates_lng ?? null,
      main_religion: input.main_religion ?? null,
      founded_period: input.founded_period ?? null,
      heritage_status: input.heritage_status ?? null,
      brief_intro: input.brief_intro ?? null,
      is_active_site: input.is_active_site ?? false,
      cover_image_url: input.cover_image_url ?? null,
      thumbnail_image_url: input.thumbnail_image_url ?? null,
      created_at: now,
      updated_at: now,
    };
    this.sites.set(id, site);
    for (const tn of tagNames) {
      if (tagMap[tn]) {
        const stId = this.getId('siteTags');
        this.siteTags.set(stId, { id: stId, site_id: id, tag_id: tagMap[tn] });
      }
    }
    return site;
  }

  private seedEvents(siteId: number, events: { year_or_period: string; title: string; description: string; sort_order: number }[]) {
    for (const e of events) {
      const id = this.getId('events');
      this.siteEvents.set(id, { id, site_id: siteId, year_or_period: e.year_or_period, title: e.title, description: e.description, sort_order: e.sort_order });
    }
  }

  private seedRelation(siteId: number, relatedSiteId: number, relationType: string) {
    const id = this.getId('relations');
    this.siteRelations.set(id, { id, site_id: siteId, related_site_id: relatedSiteId, relation_type: relationType });
  }

  private seedNews(siteId: number, news: { title: string; source_name: string; url: string; published_date: string; summary: string }[]) {
    for (const n of news) {
      const id = this.getId('news');
      this.newsLinks.set(id, { id, site_id: siteId, title: n.title, source_name: n.source_name, url: n.url, published_date: n.published_date, summary: n.summary });
    }
  }

  private seedCheckin(userId: number, siteId: number, date: string, rating: number, note: string): Checkin {
    const id = this.getId('checkins');
    const checkin: Checkin = { id, user_id: userId, site_id: siteId, visited_date: date, rating, note, created_at: new Date().toISOString() };
    this.checkins.set(id, checkin);
    return checkin;
  }
}

export const storage = new MemStorage();
