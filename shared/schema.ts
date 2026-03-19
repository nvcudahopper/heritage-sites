import { z } from "zod";

// ============ Type Enums ============
export const SiteType = z.enum(["cave", "temple", "mountain"]);
export type SiteType = z.infer<typeof SiteType>;

export const MediaType = z.enum(["image", "video"]);
export type MediaType = z.infer<typeof MediaType>;

export const SourceType = z.enum(["official", "my_photo", "friend_photo", "web_reference"]);
export type SourceType = z.infer<typeof SourceType>;

// ============ Sites ============
export interface Site {
  id: number;
  name: string;
  type: string; // cave | temple | mountain
  country: string;
  region: string;
  coordinates_lat: number | null;
  coordinates_lng: number | null;
  main_religion: string | null;
  founded_period: string | null;
  heritage_status: string | null;
  brief_intro: string | null;
  is_active_site: boolean;
  cover_image_url: string | null;
  thumbnail_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export const insertSiteSchema = z.object({
  name: z.string().min(1, "名称不能为空"),
  type: SiteType,
  country: z.string().min(1, "国家不能为空"),
  region: z.string().min(1, "地区不能为空"),
  coordinates_lat: z.number().nullable().optional(),
  coordinates_lng: z.number().nullable().optional(),
  main_religion: z.string().nullable().optional(),
  founded_period: z.string().nullable().optional(),
  heritage_status: z.string().nullable().optional(),
  brief_intro: z.string().nullable().optional(),
  is_active_site: z.boolean().default(false),
  cover_image_url: z.string().nullable().optional(),
  thumbnail_image_url: z.string().nullable().optional(),
});
export type InsertSite = z.infer<typeof insertSiteSchema>;

// ============ Site Relations ============
export interface SiteRelation {
  id: number;
  site_id: number;
  related_site_id: number;
  relation_type: string;
}

export const insertSiteRelationSchema = z.object({
  site_id: z.number(),
  related_site_id: z.number(),
  relation_type: z.string().min(1),
});
export type InsertSiteRelation = z.infer<typeof insertSiteRelationSchema>;

// ============ Site Events ============
export interface SiteEvent {
  id: number;
  site_id: number;
  year_or_period: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export const insertSiteEventSchema = z.object({
  site_id: z.number(),
  year_or_period: z.string().min(1, "时间不能为空"),
  title: z.string().min(1, "标题不能为空"),
  description: z.string().nullable().optional(),
  sort_order: z.number().default(0),
});
export type InsertSiteEvent = z.infer<typeof insertSiteEventSchema>;

// ============ Site Media ============
export interface SiteMedia {
  id: number;
  site_id: number;
  media_type: string;
  url: string;
  is_cover_candidate: boolean;
  source_type: string;
  description: string | null;
}

export const insertSiteMediaSchema = z.object({
  site_id: z.number(),
  media_type: MediaType,
  url: z.string().min(1),
  is_cover_candidate: z.boolean().default(false),
  source_type: SourceType,
  description: z.string().nullable().optional(),
});
export type InsertSiteMedia = z.infer<typeof insertSiteMediaSchema>;

// ============ News Links ============
export interface NewsLink {
  id: number;
  site_id: number;
  title: string;
  source_name: string | null;
  url: string;
  published_date: string | null;
  summary: string | null;
}

export const insertNewsLinkSchema = z.object({
  site_id: z.number(),
  title: z.string().min(1, "标题不能为空"),
  source_name: z.string().nullable().optional(),
  url: z.string().url("请输入有效的URL"),
  published_date: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
});
export type InsertNewsLink = z.infer<typeof insertNewsLinkSchema>;

// ============ Users ============
export interface User {
  id: number;
  name: string;
  nickname: string | null;
  email: string | null;
  avatar_url: string | null;
}

export const insertUserSchema = z.object({
  name: z.string().min(1),
  nickname: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;

// ============ Checkins ============
export interface Checkin {
  id: number;
  user_id: number;
  site_id: number;
  visited_date: string;
  rating: number;
  note: string | null;
  created_at: string;
}

export const insertCheckinSchema = z.object({
  user_id: z.number(),
  site_id: z.number(),
  visited_date: z.string().min(1, "日期不能为空"),
  rating: z.number().min(1).max(5),
  note: z.string().nullable().optional(),
});
export type InsertCheckin = z.infer<typeof insertCheckinSchema>;

// ============ Checkin Photos ============
export interface CheckinPhoto {
  id: number;
  checkin_id: number;
  image_url: string;
  description: string | null;
}

export const insertCheckinPhotoSchema = z.object({
  checkin_id: z.number(),
  image_url: z.string().min(1),
  description: z.string().nullable().optional(),
});
export type InsertCheckinPhoto = z.infer<typeof insertCheckinPhotoSchema>;

// ============ Tags ============
export interface Tag {
  id: number;
  name: string;
  category: string | null; // e.g. "heritage", "route", "group"
}

export const insertTagSchema = z.object({
  name: z.string().min(1),
  category: z.string().nullable().optional(),
});
export type InsertTag = z.infer<typeof insertTagSchema>;

// ============ Site Tags (many-to-many) ============
export interface SiteTag {
  id: number;
  site_id: number;
  tag_id: number;
}

export const insertSiteTagSchema = z.object({
  site_id: z.number(),
  tag_id: z.number(),
});
export type InsertSiteTag = z.infer<typeof insertSiteTagSchema>;

// ============ Composite types for frontend ============
export interface SiteWithDetails extends Site {
  tags?: Tag[];
  checkin_count?: number;
  user_checked_in?: boolean;
}

export interface SiteDetail extends Site {
  events: SiteEvent[];
  media: SiteMedia[];
  news: NewsLink[];
  relations: (SiteRelation & { related_site?: Site })[];
  tags: Tag[];
  checkins: (Checkin & { user?: User; photos?: CheckinPhoto[] })[];
}

export interface UserProfile extends User {
  checkins: (Checkin & { site?: Site; photos?: CheckinPhoto[] })[];
  stats: {
    total_sites: number;
    total_countries: number;
    total_regions: number;
    cave_count: number;
    temple_count: number;
    mountain_count: number;
  };
}
