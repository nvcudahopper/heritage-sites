import { neon } from "@neondatabase/serverless";
import type {
  Site, InsertSite, SiteRelation, InsertSiteRelation,
  SiteEvent, InsertSiteEvent, SiteMedia, InsertSiteMedia,
  NewsLink, InsertNewsLink, User, InsertUser,
  Checkin, InsertCheckin, CheckinPhoto, InsertCheckinPhoto,
  Tag, InsertTag, SiteTag, InsertSiteTag,
  SiteWithDetails, SiteDetail, UserProfile,
} from "../shared/schema";

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

  // Auth
  registerUser(name: string, email: string, passwordHash: string): Promise<any>;
  loginUser(email: string, passwordHash: string): Promise<any | null>;
  createGuestUser(name: string): Promise<any>;
  updateProfile(userId: number, name?: string, nickname?: string, email?: string, avatarUrl?: string, passwordHash?: string): Promise<any | null>;
  getAllUsersWithStats(): Promise<any[]>;
  toggleUserActive(userId: number): Promise<any | null>;
  deleteUser(userId: number): Promise<boolean>;
}

const DATABASE_URL = process.env.DATABASE_URL || "";
const sql = neon(DATABASE_URL);

function toSite(row: any): Site {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    country: row.country,
    region: row.region,
    coordinates_lat: row.coordinates_lat,
    coordinates_lng: row.coordinates_lng,
    main_religion: row.main_religion,
    founded_period: row.founded_period,
    heritage_status: row.heritage_status,
    brief_intro: row.brief_intro,
    is_active_site: row.is_active_site,
    cover_image_url: row.cover_image_url,
    thumbnail_image_url: row.thumbnail_image_url,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

function toCheckin(row: any): Checkin {
  return {
    id: row.id,
    user_id: row.user_id,
    site_id: row.site_id,
    visited_date: row.visited_date,
    rating: row.rating,
    note: row.note,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

export class PgStorage implements IStorage {

  // ============ Sites ============
  async getSites(filters?: { type?: string; country?: string; region?: string; tag?: string; era?: string }): Promise<SiteWithDetails[]> {
    let sites: Site[];

    if (filters?.tag) {
      const rows = await sql`
        SELECT DISTINCT s.* FROM sites s
        JOIN site_tags st ON st.site_id = s.id
        JOIN tags t ON t.id = st.tag_id
        WHERE t.name = ${filters.tag}
        ORDER BY s.id
      `;
      sites = rows.map(toSite);
    } else {
      const rows = await sql`SELECT * FROM sites ORDER BY id`;
      sites = rows.map(toSite);
    }

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

    // Enrich with tags and checkin counts
    const result: SiteWithDetails[] = [];
    for (const site of sites) {
      const tags = await sql`
        SELECT t.* FROM tags t
        JOIN site_tags st ON st.tag_id = t.id
        WHERE st.site_id = ${site.id}
      `;
      const countRow = await sql`SELECT COUNT(*) as count FROM checkins WHERE site_id = ${site.id}`;
      result.push({
        ...site,
        tags: tags as Tag[],
        checkin_count: Number(countRow[0].count),
      });
    }

    return result;
  }

  async getSite(id: number): Promise<SiteDetail | undefined> {
    const rows = await sql`SELECT * FROM sites WHERE id = ${id}`;
    if (rows.length === 0) return undefined;
    const site = toSite(rows[0]);

    const events = await sql`SELECT * FROM site_events WHERE site_id = ${id} ORDER BY sort_order`;
    const media = await sql`SELECT * FROM site_media WHERE site_id = ${id}`;
    const news = await sql`SELECT * FROM news_links WHERE site_id = ${id} ORDER BY published_date DESC NULLS LAST`;

    const relRows = await sql`SELECT * FROM site_relations WHERE site_id = ${id}`;
    const relations = [];
    for (const r of relRows) {
      const relSiteRows = await sql`SELECT * FROM sites WHERE id = ${r.related_site_id}`;
      relations.push({
        ...r as unknown as SiteRelation,
        related_site: relSiteRows.length > 0 ? toSite(relSiteRows[0]) : undefined,
      });
    }

    const tags = await sql`
      SELECT t.* FROM tags t
      JOIN site_tags st ON st.tag_id = t.id
      WHERE st.site_id = ${id}
    `;

    const checkinRows = await sql`SELECT * FROM checkins WHERE site_id = ${id} ORDER BY visited_date DESC`;
    const checkins = [];
    for (const c of checkinRows) {
      const userRows = await sql`SELECT * FROM users WHERE id = ${c.user_id}`;
      const photoRows = await sql`SELECT * FROM checkin_photos WHERE checkin_id = ${c.id}`;
      checkins.push({
        ...toCheckin(c),
        user: userRows.length > 0 ? userRows[0] as User : undefined,
        photos: photoRows as CheckinPhoto[],
      });
    }

    return {
      ...site,
      events: events as SiteEvent[],
      media: media as SiteMedia[],
      news: news as NewsLink[],
      relations,
      tags: tags as Tag[],
      checkins,
    };
  }

  async createSite(input: InsertSite): Promise<Site> {
    const rows = await sql`
      INSERT INTO sites (name, type, country, region, coordinates_lat, coordinates_lng,
        main_religion, founded_period, heritage_status, brief_intro, is_active_site,
        cover_image_url, thumbnail_image_url)
      VALUES (${input.name}, ${input.type}, ${input.country}, ${input.region},
        ${input.coordinates_lat ?? null}, ${input.coordinates_lng ?? null},
        ${input.main_religion ?? null}, ${input.founded_period ?? null},
        ${input.heritage_status ?? null}, ${input.brief_intro ?? null},
        ${input.is_active_site ?? false},
        ${input.cover_image_url ?? null}, ${input.thumbnail_image_url ?? null})
      RETURNING *
    `;
    return toSite(rows[0]);
  }

  async updateSite(id: number, input: Partial<InsertSite>): Promise<Site | undefined> {
    const existing = await sql`SELECT * FROM sites WHERE id = ${id}`;
    if (existing.length === 0) return undefined;

    const current = existing[0];
    const rows = await sql`
      UPDATE sites SET
        name = ${input.name ?? current.name},
        type = ${input.type ?? current.type},
        country = ${input.country ?? current.country},
        region = ${input.region ?? current.region},
        coordinates_lat = ${input.coordinates_lat !== undefined ? input.coordinates_lat : current.coordinates_lat},
        coordinates_lng = ${input.coordinates_lng !== undefined ? input.coordinates_lng : current.coordinates_lng},
        main_religion = ${input.main_religion !== undefined ? input.main_religion : current.main_religion},
        founded_period = ${input.founded_period !== undefined ? input.founded_period : current.founded_period},
        heritage_status = ${input.heritage_status !== undefined ? input.heritage_status : current.heritage_status},
        brief_intro = ${input.brief_intro !== undefined ? input.brief_intro : current.brief_intro},
        is_active_site = ${input.is_active_site !== undefined ? input.is_active_site : current.is_active_site},
        cover_image_url = ${input.cover_image_url !== undefined ? input.cover_image_url : current.cover_image_url},
        thumbnail_image_url = ${input.thumbnail_image_url !== undefined ? input.thumbnail_image_url : current.thumbnail_image_url},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return toSite(rows[0]);
  }

  async deleteSite(id: number): Promise<boolean> {
    const rows = await sql`DELETE FROM sites WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }

  // ============ Events ============
  async getEventsBySite(siteId: number): Promise<SiteEvent[]> {
    const rows = await sql`SELECT * FROM site_events WHERE site_id = ${siteId} ORDER BY sort_order`;
    return rows as SiteEvent[];
  }

  async createEvent(input: InsertSiteEvent): Promise<SiteEvent> {
    const rows = await sql`
      INSERT INTO site_events (site_id, year_or_period, title, description, sort_order)
      VALUES (${input.site_id}, ${input.year_or_period}, ${input.title},
        ${input.description ?? null}, ${input.sort_order ?? 0})
      RETURNING *
    `;
    return rows[0] as SiteEvent;
  }

  async updateEvent(id: number, input: Partial<InsertSiteEvent>): Promise<SiteEvent | undefined> {
    const existing = await sql`SELECT * FROM site_events WHERE id = ${id}`;
    if (existing.length === 0) return undefined;
    const current = existing[0];
    const rows = await sql`
      UPDATE site_events SET
        year_or_period = ${input.year_or_period ?? current.year_or_period},
        title = ${input.title ?? current.title},
        description = ${input.description !== undefined ? input.description : current.description},
        sort_order = ${input.sort_order ?? current.sort_order}
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] as SiteEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const rows = await sql`DELETE FROM site_events WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }

  // ============ Media ============
  async getMediaBySite(siteId: number): Promise<SiteMedia[]> {
    const rows = await sql`SELECT * FROM site_media WHERE site_id = ${siteId}`;
    return rows as SiteMedia[];
  }

  async createMedia(input: InsertSiteMedia): Promise<SiteMedia> {
    const rows = await sql`
      INSERT INTO site_media (site_id, media_type, url, is_cover_candidate, source_type, description)
      VALUES (${input.site_id}, ${input.media_type}, ${input.url},
        ${input.is_cover_candidate ?? false}, ${input.source_type}, ${input.description ?? null})
      RETURNING *
    `;
    return rows[0] as SiteMedia;
  }

  async deleteMedia(id: number): Promise<boolean> {
    const rows = await sql`DELETE FROM site_media WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }

  // ============ News ============
  async getNewsBySite(siteId: number): Promise<NewsLink[]> {
    const rows = await sql`SELECT * FROM news_links WHERE site_id = ${siteId} ORDER BY published_date DESC NULLS LAST`;
    return rows as NewsLink[];
  }

  async createNews(input: InsertNewsLink): Promise<NewsLink> {
    const rows = await sql`
      INSERT INTO news_links (site_id, title, source_name, url, published_date, summary)
      VALUES (${input.site_id}, ${input.title}, ${input.source_name ?? null},
        ${input.url}, ${input.published_date ?? null}, ${input.summary ?? null})
      RETURNING *
    `;
    return rows[0] as NewsLink;
  }

  async updateNews(id: number, input: Partial<InsertNewsLink>): Promise<NewsLink | undefined> {
    const existing = await sql`SELECT * FROM news_links WHERE id = ${id}`;
    if (existing.length === 0) return undefined;
    const current = existing[0];
    const rows = await sql`
      UPDATE news_links SET
        title = ${input.title ?? current.title},
        source_name = ${input.source_name !== undefined ? input.source_name : current.source_name},
        url = ${input.url ?? current.url},
        published_date = ${input.published_date !== undefined ? input.published_date : current.published_date},
        summary = ${input.summary !== undefined ? input.summary : current.summary}
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] as NewsLink;
  }

  async deleteNews(id: number): Promise<boolean> {
    const rows = await sql`DELETE FROM news_links WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }

  // ============ Relations ============
  async getRelationsBySite(siteId: number): Promise<(SiteRelation & { related_site?: Site })[]> {
    const rows = await sql`SELECT * FROM site_relations WHERE site_id = ${siteId}`;
    const result = [];
    for (const r of rows) {
      const relSiteRows = await sql`SELECT * FROM sites WHERE id = ${r.related_site_id}`;
      result.push({
        ...r as unknown as SiteRelation,
        related_site: relSiteRows.length > 0 ? toSite(relSiteRows[0]) : undefined,
      });
    }
    return result;
  }

  async createRelation(input: InsertSiteRelation): Promise<SiteRelation> {
    const rows = await sql`
      INSERT INTO site_relations (site_id, related_site_id, relation_type)
      VALUES (${input.site_id}, ${input.related_site_id}, ${input.relation_type})
      RETURNING *
    `;
    return rows[0] as SiteRelation;
  }

  async deleteRelation(id: number): Promise<boolean> {
    const rows = await sql`DELETE FROM site_relations WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }

  // ============ Users ============
  async getUser(id: number): Promise<User | undefined> {
    const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
    return rows.length > 0 ? rows[0] as User : undefined;
  }

  async getUsers(): Promise<User[]> {
    const rows = await sql`SELECT * FROM users ORDER BY id`;
    return rows as User[];
  }

  async createUser(input: InsertUser): Promise<User> {
    const rows = await sql`
      INSERT INTO users (name, nickname, email, avatar_url)
      VALUES (${input.name}, ${input.nickname ?? null}, ${input.email ?? null}, ${input.avatar_url ?? null})
      RETURNING *
    `;
    return rows[0] as User;
  }

  // ============ Checkins ============
  async getCheckinsBySite(siteId: number): Promise<(Checkin & { user?: User; photos?: CheckinPhoto[] })[]> {
    const checkinRows = await sql`SELECT * FROM checkins WHERE site_id = ${siteId} ORDER BY visited_date DESC`;
    const result = [];
    for (const c of checkinRows) {
      const userRows = await sql`SELECT * FROM users WHERE id = ${c.user_id}`;
      const photoRows = await sql`SELECT * FROM checkin_photos WHERE checkin_id = ${c.id}`;
      result.push({
        ...toCheckin(c),
        user: userRows.length > 0 ? userRows[0] as User : undefined,
        photos: photoRows as CheckinPhoto[],
      });
    }
    return result;
  }

  async getCheckinsByUser(userId: number): Promise<(Checkin & { site?: Site; photos?: CheckinPhoto[] })[]> {
    const checkinRows = await sql`SELECT * FROM checkins WHERE user_id = ${userId} ORDER BY visited_date DESC`;
    const result = [];
    for (const c of checkinRows) {
      const siteRows = await sql`SELECT * FROM sites WHERE id = ${c.site_id}`;
      const photoRows = await sql`SELECT * FROM checkin_photos WHERE checkin_id = ${c.id}`;
      result.push({
        ...toCheckin(c),
        site: siteRows.length > 0 ? toSite(siteRows[0]) : undefined,
        photos: photoRows as CheckinPhoto[],
      });
    }
    return result;
  }

  async createCheckin(input: InsertCheckin): Promise<Checkin> {
    const rows = await sql`
      INSERT INTO checkins (user_id, site_id, visited_date, rating, note)
      VALUES (${input.user_id}, ${input.site_id}, ${input.visited_date},
        ${input.rating}, ${input.note ?? null})
      RETURNING *
    `;
    return toCheckin(rows[0]);
  }

  async deleteCheckin(id: number): Promise<boolean> {
    const rows = await sql`DELETE FROM checkins WHERE id = ${id} RETURNING id`;
    return rows.length > 0;
  }

  // ============ Checkin Photos ============
  async createCheckinPhoto(input: InsertCheckinPhoto): Promise<CheckinPhoto> {
    const rows = await sql`
      INSERT INTO checkin_photos (checkin_id, image_url, description)
      VALUES (${input.checkin_id}, ${input.image_url}, ${input.description ?? null})
      RETURNING *
    `;
    return rows[0] as CheckinPhoto;
  }

  // ============ Tags ============
  async getTags(): Promise<Tag[]> {
    const rows = await sql`SELECT * FROM tags ORDER BY id`;
    return rows as Tag[];
  }

  async createTag(input: InsertTag): Promise<Tag> {
    const rows = await sql`
      INSERT INTO tags (name, category)
      VALUES (${input.name}, ${input.category ?? null})
      RETURNING *
    `;
    return rows[0] as Tag;
  }

  async getTagsBySite(siteId: number): Promise<Tag[]> {
    const rows = await sql`
      SELECT t.* FROM tags t
      JOIN site_tags st ON st.tag_id = t.id
      WHERE st.site_id = ${siteId}
    `;
    return rows as Tag[];
  }

  async addSiteTag(input: InsertSiteTag): Promise<SiteTag> {
    const rows = await sql`
      INSERT INTO site_tags (site_id, tag_id)
      VALUES (${input.site_id}, ${input.tag_id})
      ON CONFLICT (site_id, tag_id) DO NOTHING
      RETURNING *
    `;
    if (rows.length === 0) {
      // Already exists, just return it
      const existing = await sql`SELECT * FROM site_tags WHERE site_id = ${input.site_id} AND tag_id = ${input.tag_id}`;
      return existing[0] as SiteTag;
    }
    return rows[0] as SiteTag;
  }

  async removeSiteTag(siteId: number, tagId: number): Promise<boolean> {
    const rows = await sql`DELETE FROM site_tags WHERE site_id = ${siteId} AND tag_id = ${tagId} RETURNING id`;
    return rows.length > 0;
  }

  // ============ Profile ============
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const userRows = await sql`SELECT * FROM users WHERE id = ${userId}`;
    if (userRows.length === 0) return undefined;
    const user = userRows[0] as User;

    const checkinRows = await sql`SELECT * FROM checkins WHERE user_id = ${userId} ORDER BY visited_date DESC`;
    const checkins = [];
    for (const c of checkinRows) {
      const siteRows = await sql`SELECT * FROM sites WHERE id = ${c.site_id}`;
      const photoRows = await sql`SELECT * FROM checkin_photos WHERE checkin_id = ${c.id}`;
      checkins.push({
        ...toCheckin(c),
        site: siteRows.length > 0 ? toSite(siteRows[0]) : undefined,
        photos: photoRows as CheckinPhoto[],
      });
    }

    const checkedSiteIds = [...new Set(checkins.map(c => c.site_id))];
    const checkedSites: Site[] = [];
    for (const sid of checkedSiteIds) {
      const rows = await sql`SELECT * FROM sites WHERE id = ${sid}`;
      if (rows.length > 0) checkedSites.push(toSite(rows[0]));
    }

    return {
      ...user,
      checkins,
      stats: {
        total_sites: checkedSites.length,
        total_countries: [...new Set(checkedSites.map(s => s.country))].length,
        total_regions: [...new Set(checkedSites.map(s => s.region))].length,
        cave_count: checkedSites.filter(s => s.type === "cave").length,
        temple_count: checkedSites.filter(s => s.type === "temple").length,
        mountain_count: checkedSites.filter(s => s.type === "mountain").length,
      },
    };
  }

  // ============ Auth ============
  async registerUser(name: string, email: string, passwordHash: string) {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) throw new Error("该邮箱已注册");
    const rows = await sql`
      INSERT INTO users (name, nickname, email, password_hash, role)
      VALUES (${name}, ${name}, ${email}, ${passwordHash}, 'user')
      RETURNING id, name, nickname, email, role, avatar_url, is_active`;
    return rows[0];
  }

  async loginUser(email: string, passwordHash: string) {
    const rows = await sql`SELECT id, name, nickname, email, role, avatar_url, is_active FROM users WHERE email = ${email} AND password_hash = ${passwordHash}`;
    return rows.length > 0 ? rows[0] : null;
  }

  async createGuestUser(name: string) {
    const rows = await sql`
      INSERT INTO users (name, nickname, role)
      VALUES (${name}, ${name}, 'guest')
      RETURNING id, name, nickname, email, role, avatar_url, is_active`;
    return rows[0];
  }

  async updateProfile(userId: number, name?: string, nickname?: string, email?: string, avatarUrl?: string, passwordHash?: string) {
    const existing = await sql`SELECT * FROM users WHERE id = ${userId}`;
    if (existing.length === 0) return null;
    const c = existing[0];
    const rows = await sql`
      UPDATE users SET
        name = ${name ?? c.name},
        nickname = ${nickname ?? c.nickname},
        email = ${email !== undefined ? email : c.email},
        avatar_url = ${avatarUrl !== undefined ? avatarUrl : c.avatar_url},
        password_hash = ${passwordHash ?? c.password_hash}
      WHERE id = ${userId}
      RETURNING id, name, nickname, email, role, avatar_url, is_active`;
    return rows[0];
  }

  async getAllUsersWithStats() {
    const users = await sql`SELECT id, name, nickname, email, role, is_active, avatar_url, created_at FROM users ORDER BY id`;
    const result = [];
    for (const u of users) {
      const countRow = await sql`SELECT COUNT(*) as count FROM checkins WHERE user_id = ${u.id}`;
      result.push({ ...u, checkin_count: Number(countRow[0].count) });
    }
    return result;
  }

  async toggleUserActive(userId: number) {
    const rows = await sql`UPDATE users SET is_active = NOT is_active WHERE id = ${userId} AND role != 'admin' RETURNING id, is_active`;
    return rows.length > 0 ? rows[0] : null;
  }

  async deleteUser(userId: number) {
    const rows = await sql`DELETE FROM users WHERE id = ${userId} AND role != 'admin' RETURNING id`;
    return rows.length > 0;
  }
}

export const storage = new PgStorage();
