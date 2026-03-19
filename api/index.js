import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";

// Vercel Neon integration may inject the URL under different env var names
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.STORAGE_URL;

if (!dbUrl) {
  console.error("No database URL found. Checked: DATABASE_URL, POSTGRES_URL, STORAGE_URL");
}

const sql = neon(dbUrl);

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace(/^\/api/, "");
  const method = req.method;

  try {
    // ============ Auth ============
    // Register (email + password)
    if (path === "/auth/register" && method === "POST") {
      const b = req.body;
      if (!b.email || !b.password || !b.name) {
        return res.status(400).json({ error: "请填写邮箱、密码和昵称" });
      }
      const existing = await sql`SELECT id FROM users WHERE email = ${b.email}`;
      if (existing.length > 0) {
        return res.status(409).json({ error: "该邮箱已注册" });
      }
      const hash = hashPassword(b.password);
      const rows = await sql`
        INSERT INTO users (name, nickname, email, password_hash, role)
        VALUES (${b.name}, ${b.name}, ${b.email}, ${hash}, 'user')
        RETURNING id, name, nickname, email, role, avatar_url, is_active`;
      return res.status(201).json(rows[0]);
    }

    // Login
    if (path === "/auth/login" && method === "POST") {
      const b = req.body;
      if (!b.email || !b.password) {
        return res.status(400).json({ error: "请填写邮箱和密码" });
      }
      const hash = hashPassword(b.password);
      const rows = await sql`SELECT id, name, nickname, email, role, avatar_url, is_active FROM users WHERE email = ${b.email} AND password_hash = ${hash}`;
      if (rows.length === 0) {
        return res.status(401).json({ error: "邮箱或密码错误" });
      }
      if (!rows[0].is_active) {
        return res.status(403).json({ error: "账号已被禁用" });
      }
      return res.json(rows[0]);
    }

    // Guest create (no password, just nickname)
    if (path === "/auth/guest" && method === "POST") {
      const b = req.body;
      if (!b.name) {
        return res.status(400).json({ error: "请填写昵称" });
      }
      const rows = await sql`
        INSERT INTO users (name, nickname, role)
        VALUES (${b.name}, ${b.name}, 'guest')
        RETURNING id, name, nickname, email, role, avatar_url, is_active`;
      return res.json(rows[0]);
    }

    // Update own profile (name, nickname, email, avatar, password)
    if (path === "/auth/profile" && method === "PUT") {
      const b = req.body;
      if (!b.user_id) return res.status(400).json({ error: "缺少 user_id" });
      const existing = await sql`SELECT * FROM users WHERE id = ${b.user_id}`;
      if (existing.length === 0) return res.status(404).json({ error: "用户不存在" });
      const c = existing[0];
      
      let newHash = c.password_hash;
      if (b.new_password) {
        newHash = hashPassword(b.new_password);
      }
      
      const rows = await sql`
        UPDATE users SET
          name = ${b.name ?? c.name},
          nickname = ${b.nickname ?? c.nickname},
          email = ${b.email !== undefined ? b.email : c.email},
          avatar_url = ${b.avatar_url !== undefined ? b.avatar_url : c.avatar_url},
          password_hash = ${newHash}
        WHERE id = ${b.user_id}
        RETURNING id, name, nickname, email, role, avatar_url, is_active`;
      return res.json(rows[0]);
    }

    // ============ Admin: User Management ============
    if (path === "/admin/users" && method === "GET") {
      const users = await sql`SELECT id, name, nickname, email, role, is_active, avatar_url, created_at FROM users ORDER BY id`;
      // Add checkin count for each user
      const result = [];
      for (const u of users) {
        const countRow = await sql`SELECT COUNT(*) as count FROM checkins WHERE user_id = ${u.id}`;
        result.push({ ...u, checkin_count: Number(countRow[0].count) });
      }
      return res.json(result);
    }

    // Toggle user active status
    const adminUserToggleMatch = path.match(/^\/admin\/users\/(\d+)\/toggle$/);
    if (adminUserToggleMatch && method === "PUT") {
      const id = Number(adminUserToggleMatch[1]);
      const rows = await sql`UPDATE users SET is_active = NOT is_active WHERE id = ${id} AND role != 'admin' RETURNING id, is_active`;
      if (rows.length === 0) return res.status(404).json({ error: "用户不存在或无法禁用管理员" });
      return res.json(rows[0]);
    }

    // Delete user (admin only, can't delete admins)
    const adminUserDeleteMatch = path.match(/^\/admin\/users\/(\d+)$/);
    if (adminUserDeleteMatch && method === "DELETE") {
      const id = Number(adminUserDeleteMatch[1]);
      const rows = await sql`DELETE FROM users WHERE id = ${id} AND role != 'admin' RETURNING id`;
      if (rows.length === 0) return res.status(404).json({ error: "用户不存在或无法删除管理员" });
      return res.json({ ok: true });
    }

    // ============ Sites ============
    if (path === "/sites" && method === "GET") {
      const { type, country, region, tag, era } = req.query || {};
      let sites;
      if (tag) {
        sites = await sql`
          SELECT DISTINCT s.* FROM sites s
          JOIN site_tags st ON st.site_id = s.id
          JOIN tags t ON t.id = st.tag_id
          WHERE t.name = ${tag}
          ORDER BY s.id`;
      } else {
        sites = await sql`SELECT * FROM sites ORDER BY id`;
      }
      if (type) sites = sites.filter(s => s.type === type);
      if (country) sites = sites.filter(s => s.country === country);
      if (region) sites = sites.filter(s => s.region.includes(region));
      if (era) sites = sites.filter(s => s.founded_period && s.founded_period.includes(era));

      // Enrich with tags and checkin counts
      const result = [];
      for (const site of sites) {
        const tags = await sql`SELECT t.* FROM tags t JOIN site_tags st ON st.tag_id = t.id WHERE st.site_id = ${site.id}`;
        const countRow = await sql`SELECT COUNT(*) as count FROM checkins WHERE site_id = ${site.id}`;
        result.push({ ...site, tags, checkin_count: Number(countRow[0].count) });
      }
      return res.json(result);
    }

    // Site detail
    const siteDetailMatch = path.match(/^\/sites\/(\d+)$/);
    if (siteDetailMatch && method === "GET") {
      const id = Number(siteDetailMatch[1]);
      const rows = await sql`SELECT * FROM sites WHERE id = ${id}`;
      if (rows.length === 0) return res.status(404).json({ error: "Site not found" });
      const site = rows[0];

      const events = await sql`SELECT * FROM site_events WHERE site_id = ${id} ORDER BY sort_order`;
      const media = await sql`SELECT * FROM site_media WHERE site_id = ${id}`;
      const news = await sql`SELECT * FROM news_links WHERE site_id = ${id} ORDER BY published_date DESC NULLS LAST`;
      const tags = await sql`SELECT t.* FROM tags t JOIN site_tags st ON st.tag_id = t.id WHERE st.site_id = ${id}`;

      const relRows = await sql`SELECT * FROM site_relations WHERE site_id = ${id}`;
      const relations = [];
      for (const r of relRows) {
        const rs = await sql`SELECT * FROM sites WHERE id = ${r.related_site_id}`;
        relations.push({ ...r, related_site: rs[0] || null });
      }

      const checkinRows = await sql`SELECT * FROM checkins WHERE site_id = ${id} ORDER BY visited_date DESC`;
      const checkins = [];
      for (const c of checkinRows) {
        const u = await sql`SELECT * FROM users WHERE id = ${c.user_id}`;
        const p = await sql`SELECT * FROM checkin_photos WHERE checkin_id = ${c.id}`;
        checkins.push({ ...c, user: u[0] || null, photos: p });
      }

      return res.json({ ...site, events, media, news, relations, tags, checkins });
    }

    // Create site
    if (path === "/sites" && method === "POST") {
      const b = req.body;
      const rows = await sql`
        INSERT INTO sites (name, type, country, region, coordinates_lat, coordinates_lng,
          main_religion, founded_period, heritage_status, brief_intro, is_active_site,
          cover_image_url, thumbnail_image_url)
        VALUES (${b.name}, ${b.type}, ${b.country}, ${b.region},
          ${b.coordinates_lat || null}, ${b.coordinates_lng || null},
          ${b.main_religion || null}, ${b.founded_period || null},
          ${b.heritage_status || null}, ${b.brief_intro || null},
          ${b.is_active_site || false}, ${b.cover_image_url || null}, ${b.thumbnail_image_url || null})
        RETURNING *`;
      return res.status(201).json(rows[0]);
    }

    // Update site
    const siteUpdateMatch = path.match(/^\/sites\/(\d+)$/);
    if (siteUpdateMatch && method === "PUT") {
      const id = Number(siteUpdateMatch[1]);
      const existing = await sql`SELECT * FROM sites WHERE id = ${id}`;
      if (existing.length === 0) return res.status(404).json({ error: "Site not found" });
      const c = existing[0];
      const b = req.body;
      const rows = await sql`
        UPDATE sites SET
          name = ${b.name ?? c.name}, type = ${b.type ?? c.type},
          country = ${b.country ?? c.country}, region = ${b.region ?? c.region},
          coordinates_lat = ${b.coordinates_lat !== undefined ? b.coordinates_lat : c.coordinates_lat},
          coordinates_lng = ${b.coordinates_lng !== undefined ? b.coordinates_lng : c.coordinates_lng},
          main_religion = ${b.main_religion !== undefined ? b.main_religion : c.main_religion},
          founded_period = ${b.founded_period !== undefined ? b.founded_period : c.founded_period},
          heritage_status = ${b.heritage_status !== undefined ? b.heritage_status : c.heritage_status},
          brief_intro = ${b.brief_intro !== undefined ? b.brief_intro : c.brief_intro},
          is_active_site = ${b.is_active_site !== undefined ? b.is_active_site : c.is_active_site},
          cover_image_url = ${b.cover_image_url !== undefined ? b.cover_image_url : c.cover_image_url},
          thumbnail_image_url = ${b.thumbnail_image_url !== undefined ? b.thumbnail_image_url : c.thumbnail_image_url},
          updated_at = NOW()
        WHERE id = ${id} RETURNING *`;
      return res.json(rows[0]);
    }

    // Delete site
    const siteDeleteMatch = path.match(/^\/sites\/(\d+)$/);
    if (siteDeleteMatch && method === "DELETE") {
      const id = Number(siteDeleteMatch[1]);
      const rows = await sql`DELETE FROM sites WHERE id = ${id} RETURNING id`;
      if (rows.length === 0) return res.status(404).json({ error: "Site not found" });
      return res.json({ ok: true });
    }

    // ============ Events ============
    const eventsMatch = path.match(/^\/sites\/(\d+)\/events$/);
    if (eventsMatch && method === "GET") {
      const events = await sql`SELECT * FROM site_events WHERE site_id = ${Number(eventsMatch[1])} ORDER BY sort_order`;
      return res.json(events);
    }
    if (path === "/events" && method === "POST") {
      const b = req.body;
      const rows = await sql`INSERT INTO site_events (site_id, year_or_period, title, description, sort_order)
        VALUES (${b.site_id}, ${b.year_or_period}, ${b.title}, ${b.description || null}, ${b.sort_order || 0}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }
    const eventUpdateMatch = path.match(/^\/events\/(\d+)$/);
    if (eventUpdateMatch && method === "PUT") {
      const id = Number(eventUpdateMatch[1]);
      const existing = await sql`SELECT * FROM site_events WHERE id = ${id}`;
      if (existing.length === 0) return res.status(404).json({ error: "Event not found" });
      const c = existing[0]; const b = req.body;
      const rows = await sql`UPDATE site_events SET year_or_period = ${b.year_or_period ?? c.year_or_period},
        title = ${b.title ?? c.title}, description = ${b.description !== undefined ? b.description : c.description},
        sort_order = ${b.sort_order ?? c.sort_order} WHERE id = ${id} RETURNING *`;
      return res.json(rows[0]);
    }
    if (eventUpdateMatch && method === "DELETE") {
      const rows = await sql`DELETE FROM site_events WHERE id = ${Number(eventUpdateMatch[1])} RETURNING id`;
      return rows.length > 0 ? res.json({ ok: true }) : res.status(404).json({ error: "Event not found" });
    }

    // ============ Media ============
    const mediaMatch = path.match(/^\/sites\/(\d+)\/media$/);
    if (mediaMatch && method === "GET") {
      const media = await sql`SELECT * FROM site_media WHERE site_id = ${Number(mediaMatch[1])}`;
      return res.json(media);
    }
    if (path === "/media" && method === "POST") {
      const b = req.body;
      const rows = await sql`INSERT INTO site_media (site_id, media_type, url, is_cover_candidate, source_type, description)
        VALUES (${b.site_id}, ${b.media_type}, ${b.url}, ${b.is_cover_candidate || false}, ${b.source_type}, ${b.description || null}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }
    const mediaDeleteMatch = path.match(/^\/media\/(\d+)$/);
    if (mediaDeleteMatch && method === "DELETE") {
      const rows = await sql`DELETE FROM site_media WHERE id = ${Number(mediaDeleteMatch[1])} RETURNING id`;
      return rows.length > 0 ? res.json({ ok: true }) : res.status(404).json({ error: "Media not found" });
    }

    // ============ News ============
    const newsMatch = path.match(/^\/sites\/(\d+)\/news$/);
    if (newsMatch && method === "GET") {
      const news = await sql`SELECT * FROM news_links WHERE site_id = ${Number(newsMatch[1])} ORDER BY published_date DESC NULLS LAST`;
      return res.json(news);
    }
    if (path === "/news" && method === "POST") {
      const b = req.body;
      const rows = await sql`INSERT INTO news_links (site_id, title, source_name, url, published_date, summary)
        VALUES (${b.site_id}, ${b.title}, ${b.source_name || null}, ${b.url}, ${b.published_date || null}, ${b.summary || null}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }
    const newsUpdateMatch = path.match(/^\/news\/(\d+)$/);
    if (newsUpdateMatch && method === "PUT") {
      const id = Number(newsUpdateMatch[1]);
      const existing = await sql`SELECT * FROM news_links WHERE id = ${id}`;
      if (existing.length === 0) return res.status(404).json({ error: "News not found" });
      const c = existing[0]; const b = req.body;
      const rows = await sql`UPDATE news_links SET title = ${b.title ?? c.title},
        source_name = ${b.source_name !== undefined ? b.source_name : c.source_name},
        url = ${b.url ?? c.url}, published_date = ${b.published_date !== undefined ? b.published_date : c.published_date},
        summary = ${b.summary !== undefined ? b.summary : c.summary} WHERE id = ${id} RETURNING *`;
      return res.json(rows[0]);
    }
    if (newsUpdateMatch && method === "DELETE") {
      const rows = await sql`DELETE FROM news_links WHERE id = ${Number(newsUpdateMatch[1])} RETURNING id`;
      return rows.length > 0 ? res.json({ ok: true }) : res.status(404).json({ error: "News not found" });
    }

    // ============ Relations ============
    if (path === "/relations" && method === "POST") {
      const b = req.body;
      const rows = await sql`INSERT INTO site_relations (site_id, related_site_id, relation_type)
        VALUES (${b.site_id}, ${b.related_site_id}, ${b.relation_type}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }
    const relDeleteMatch = path.match(/^\/relations\/(\d+)$/);
    if (relDeleteMatch && method === "DELETE") {
      const rows = await sql`DELETE FROM site_relations WHERE id = ${Number(relDeleteMatch[1])} RETURNING id`;
      return rows.length > 0 ? res.json({ ok: true }) : res.status(404).json({ error: "Relation not found" });
    }

    // ============ Users ============
    if (path === "/users" && method === "GET") {
      return res.json(await sql`SELECT * FROM users ORDER BY id`);
    }
    const userMatch = path.match(/^\/users\/(\d+)$/);
    if (userMatch && method === "GET") {
      const rows = await sql`SELECT * FROM users WHERE id = ${Number(userMatch[1])}`;
      return rows.length > 0 ? res.json(rows[0]) : res.status(404).json({ error: "User not found" });
    }

    // User profile
    const profileMatch = path.match(/^\/users\/(\d+)\/profile$/);
    if (profileMatch && method === "GET") {
      const userId = Number(profileMatch[1]);
      const userRows = await sql`SELECT * FROM users WHERE id = ${userId}`;
      if (userRows.length === 0) return res.status(404).json({ error: "User not found" });
      const user = userRows[0];

      const checkinRows = await sql`SELECT * FROM checkins WHERE user_id = ${userId} ORDER BY visited_date DESC`;
      const checkins = [];
      for (const c of checkinRows) {
        const siteRows = await sql`SELECT * FROM sites WHERE id = ${c.site_id}`;
        const photoRows = await sql`SELECT * FROM checkin_photos WHERE checkin_id = ${c.id}`;
        checkins.push({ ...c, site: siteRows[0] || null, photos: photoRows });
      }

      const siteIds = [...new Set(checkins.map(c => c.site_id))];
      const checkedSites = [];
      for (const sid of siteIds) {
        const rows = await sql`SELECT * FROM sites WHERE id = ${sid}`;
        if (rows.length > 0) checkedSites.push(rows[0]);
      }

      return res.json({
        ...user, checkins,
        stats: {
          total_sites: checkedSites.length,
          total_countries: [...new Set(checkedSites.map(s => s.country))].length,
          total_regions: [...new Set(checkedSites.map(s => s.region))].length,
          cave_count: checkedSites.filter(s => s.type === "cave").length,
          temple_count: checkedSites.filter(s => s.type === "temple").length,
          mountain_count: checkedSites.filter(s => s.type === "mountain").length,
        },
      });
    }

    // ============ Checkins ============
    const checkinsMatch = path.match(/^\/sites\/(\d+)\/checkins$/);
    if (checkinsMatch && method === "GET") {
      const siteId = Number(checkinsMatch[1]);
      const checkinRows = await sql`SELECT * FROM checkins WHERE site_id = ${siteId} ORDER BY visited_date DESC`;
      const result = [];
      for (const c of checkinRows) {
        const u = await sql`SELECT * FROM users WHERE id = ${c.user_id}`;
        const p = await sql`SELECT * FROM checkin_photos WHERE checkin_id = ${c.id}`;
        result.push({ ...c, user: u[0] || null, photos: p });
      }
      return res.json(result);
    }
    if (path === "/checkins" && method === "POST") {
      const b = req.body;
      const rows = await sql`INSERT INTO checkins (user_id, site_id, visited_date, rating, note)
        VALUES (${b.user_id}, ${b.site_id}, ${b.visited_date}, ${b.rating}, ${b.note || null}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }
    const checkinDeleteMatch = path.match(/^\/checkins\/(\d+)$/);
    if (checkinDeleteMatch && method === "DELETE") {
      const rows = await sql`DELETE FROM checkins WHERE id = ${Number(checkinDeleteMatch[1])} RETURNING id`;
      return rows.length > 0 ? res.json({ ok: true }) : res.status(404).json({ error: "Checkin not found" });
    }

    // ============ Checkin Photos ============
    if (path === "/checkin-photos" && method === "POST") {
      const b = req.body;
      const rows = await sql`INSERT INTO checkin_photos (checkin_id, image_url, description)
        VALUES (${b.checkin_id}, ${b.image_url}, ${b.description || null}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }

    // ============ Tags ============
    if (path === "/tags" && method === "GET") {
      return res.json(await sql`SELECT * FROM tags ORDER BY id`);
    }
    if (path === "/tags" && method === "POST") {
      const b = req.body;
      const rows = await sql`INSERT INTO tags (name, category) VALUES (${b.name}, ${b.category || null}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }
    if (path === "/site-tags" && method === "POST") {
      const b = req.body;
      const rows = await sql`INSERT INTO site_tags (site_id, tag_id) VALUES (${b.site_id}, ${b.tag_id})
        ON CONFLICT (site_id, tag_id) DO NOTHING RETURNING *`;
      if (rows.length === 0) {
        const existing = await sql`SELECT * FROM site_tags WHERE site_id = ${b.site_id} AND tag_id = ${b.tag_id}`;
        return res.status(201).json(existing[0]);
      }
      return res.status(201).json(rows[0]);
    }
    const siteTagDeleteMatch = path.match(/^\/site-tags\/(\d+)\/(\d+)$/);
    if (siteTagDeleteMatch && method === "DELETE") {
      const rows = await sql`DELETE FROM site_tags WHERE site_id = ${Number(siteTagDeleteMatch[1])} AND tag_id = ${Number(siteTagDeleteMatch[2])} RETURNING id`;
      return rows.length > 0 ? res.json({ ok: true }) : res.status(404).json({ error: "SiteTag not found" });
    }

    // ============ Filters ============
    if (path === "/filters" && method === "GET") {
      const sites = await sql`SELECT country, region, founded_period FROM sites`;
      const countries = [...new Set(sites.map(s => s.country))].sort();
      const regions = [...new Set(sites.map(s => s.region))].sort();
      const eras = [...new Set(sites.map(s => s.founded_period).filter(Boolean))].sort();
      const tags = await sql`SELECT * FROM tags ORDER BY id`;
      return res.json({ countries, regions, eras, tags });
    }

    // Not found
    return res.status(404).json({ error: "Not found" });
  } catch (e) {
    console.error("API Error:", e);
    return res.status(500).json({ error: e.message });
  }
}
