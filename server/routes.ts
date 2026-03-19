import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertSiteSchema, insertSiteEventSchema, insertSiteMediaSchema,
  insertNewsLinkSchema, insertCheckinSchema, insertCheckinPhotoSchema,
  insertSiteRelationSchema, insertTagSchema, insertSiteTagSchema,
} from "../shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ============ Sites ============
  app.get("/api/sites", async (req, res) => {
    try {
      const { type, country, region, tag, era } = req.query;
      const sites = await storage.getSites({
        type: type as string,
        country: country as string,
        region: region as string,
        tag: tag as string,
        era: era as string,
      });
      res.json(sites);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/sites/:id", async (req, res) => {
    try {
      const site = await storage.getSite(Number(req.params.id));
      if (!site) return res.status(404).json({ error: "Site not found" });
      res.json(site);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/sites", async (req, res) => {
    try {
      const parsed = insertSiteSchema.parse(req.body);
      const site = await storage.createSite(parsed);
      res.status(201).json(site);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/sites/:id", async (req, res) => {
    try {
      const site = await storage.updateSite(Number(req.params.id), req.body);
      if (!site) return res.status(404).json({ error: "Site not found" });
      res.json(site);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/sites/:id", async (req, res) => {
    try {
      const ok = await storage.deleteSite(Number(req.params.id));
      if (!ok) return res.status(404).json({ error: "Site not found" });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ============ Events ============
  app.get("/api/sites/:siteId/events", async (req, res) => {
    try {
      const events = await storage.getEventsBySite(Number(req.params.siteId));
      res.json(events);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const parsed = insertSiteEventSchema.parse(req.body);
      const event = await storage.createEvent(parsed);
      res.status(201).json(event);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.updateEvent(Number(req.params.id), req.body);
      if (!event) return res.status(404).json({ error: "Event not found" });
      res.json(event);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const ok = await storage.deleteEvent(Number(req.params.id));
      if (!ok) return res.status(404).json({ error: "Event not found" });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ============ Media ============
  app.get("/api/sites/:siteId/media", async (req, res) => {
    try {
      const media = await storage.getMediaBySite(Number(req.params.siteId));
      res.json(media);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/media", async (req, res) => {
    try {
      const parsed = insertSiteMediaSchema.parse(req.body);
      const media = await storage.createMedia(parsed);
      res.status(201).json(media);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/media/:id", async (req, res) => {
    try {
      const ok = await storage.deleteMedia(Number(req.params.id));
      if (!ok) return res.status(404).json({ error: "Media not found" });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ============ News ============
  app.get("/api/sites/:siteId/news", async (req, res) => {
    try {
      const news = await storage.getNewsBySite(Number(req.params.siteId));
      res.json(news);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/news", async (req, res) => {
    try {
      const parsed = insertNewsLinkSchema.parse(req.body);
      const news = await storage.createNews(parsed);
      res.status(201).json(news);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/news/:id", async (req, res) => {
    try {
      const news = await storage.updateNews(Number(req.params.id), req.body);
      if (!news) return res.status(404).json({ error: "News not found" });
      res.json(news);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/news/:id", async (req, res) => {
    try {
      const ok = await storage.deleteNews(Number(req.params.id));
      if (!ok) return res.status(404).json({ error: "News not found" });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ============ Relations ============
  app.post("/api/relations", async (req, res) => {
    try {
      const parsed = insertSiteRelationSchema.parse(req.body);
      const rel = await storage.createRelation(parsed);
      res.status(201).json(rel);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/relations/:id", async (req, res) => {
    try {
      const ok = await storage.deleteRelation(Number(req.params.id));
      if (!ok) return res.status(404).json({ error: "Relation not found" });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ============ Users ============
  app.get("/api/users", async (_req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(Number(req.params.id));
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/users/:id/profile", async (req, res) => {
    try {
      const profile = await storage.getUserProfile(Number(req.params.id));
      if (!profile) return res.status(404).json({ error: "User not found" });
      res.json(profile);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ============ Checkins ============
  app.get("/api/sites/:siteId/checkins", async (req, res) => {
    try {
      const checkins = await storage.getCheckinsBySite(Number(req.params.siteId));
      res.json(checkins);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/checkins", async (req, res) => {
    try {
      const parsed = insertCheckinSchema.parse(req.body);
      const checkin = await storage.createCheckin(parsed);
      res.status(201).json(checkin);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/checkins/:id", async (req, res) => {
    try {
      const ok = await storage.deleteCheckin(Number(req.params.id));
      if (!ok) return res.status(404).json({ error: "Checkin not found" });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ============ Checkin Photos ============
  app.post("/api/checkin-photos", async (req, res) => {
    try {
      const parsed = insertCheckinPhotoSchema.parse(req.body);
      const photo = await storage.createCheckinPhoto(parsed);
      res.status(201).json(photo);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ============ Tags ============
  app.get("/api/tags", async (_req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/tags", async (req, res) => {
    try {
      const parsed = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(parsed);
      res.status(201).json(tag);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/site-tags", async (req, res) => {
    try {
      const parsed = insertSiteTagSchema.parse(req.body);
      const st = await storage.addSiteTag(parsed);
      res.status(201).json(st);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/site-tags/:siteId/:tagId", async (req, res) => {
    try {
      const ok = await storage.removeSiteTag(Number(req.params.siteId), Number(req.params.tagId));
      if (!ok) return res.status(404).json({ error: "SiteTag not found" });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ============ Filters (distinct values) ============
  app.get("/api/filters", async (_req, res) => {
    try {
      const sites = await storage.getSites();
      const countries = [...new Set(sites.map(s => s.country))].sort();
      const regions = [...new Set(sites.map(s => s.region))].sort();
      const eras = [...new Set(sites.map(s => s.founded_period).filter(Boolean))].sort() as string[];
      const tags = await storage.getTags();
      res.json({ countries, regions, eras, tags });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return httpServer;
}
