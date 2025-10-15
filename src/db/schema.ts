import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { number } from "zod";

// Users table
export const users = pgTable(
  "users",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    email: varchar({ length: 255 }).notNull(),
    created_at: timestamp({ withTimezone: true }),
    nickname: varchar({ length: 255 }),
    avatar_url: varchar({ length: 255 }),
    locale: varchar({ length: 50 }),
    signin_type: varchar({ length: 50 }),
    signin_ip: varchar({ length: 255 }),
    signin_provider: varchar({ length: 50 }),
    signin_openid: varchar({ length: 255 }),
    invite_code: varchar({ length: 255 }).notNull().default(""),
    updated_at: timestamp({ withTimezone: true }),
    invited_by: varchar({ length: 255 }).notNull().default(""),
    is_affiliate: boolean().notNull().default(false),
  },
  (table) => [
    uniqueIndex("email_provider_unique_idx").on(
      table.email,
      table.signin_provider
    ),
  ]
);

// Orders table
export const orders = pgTable("orders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  order_no: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true }),
  user_uuid: varchar({ length: 255 }).notNull().default(""),
  user_email: varchar({ length: 255 }).notNull().default(""),
  amount: integer().notNull(),
  interval: varchar({ length: 50 }),
  expired_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }).notNull(),
  stripe_session_id: varchar({ length: 255 }),
  credits: integer().notNull(),
  currency: varchar({ length: 50 }),
  sub_id: varchar({ length: 255 }),
  sub_interval_count: integer(),
  sub_cycle_anchor: integer(),
  sub_period_end: integer(),
  sub_period_start: integer(),
  sub_times: integer(),
  product_id: varchar({ length: 255 }),
  product_name: varchar({ length: 255 }),
  valid_months: integer(),
  order_detail: text(),
  paid_at: timestamp({ withTimezone: true }),
  paid_email: varchar({ length: 255 }),
  paid_detail: text(),
});

// API Keys table
export const apikeys = pgTable("apikeys", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  api_key: varchar({ length: 255 }).notNull().unique(),
  title: varchar({ length: 100 }),
  user_uuid: varchar({ length: 255 }).notNull(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
});

// Credits table
export const credits = pgTable("credits", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  trans_no: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true }),
  user_uuid: varchar({ length: 255 }).notNull(),
  trans_type: varchar({ length: 50 }).notNull(),
  credits: integer().notNull(),
  order_no: varchar({ length: 255 }),
  expired_at: timestamp({ withTimezone: true }),
});

// Categories table
export const categories = pgTable("categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull().unique(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  status: varchar({ length: 50 }),
  sort: integer().notNull().default(0),
  created_at: timestamp({ withTimezone: true }),
  updated_at: timestamp({ withTimezone: true }),
});

// Posts table
export const posts = pgTable("posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 255 }).notNull().unique(),
  slug: varchar({ length: 255 }),
  title: varchar({ length: 255 }),
  description: text(),
  content: text(),
  created_at: timestamp({ withTimezone: true }),
  updated_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
  cover_url: varchar({ length: 255 }),
  author_name: varchar({ length: 255 }),
  author_avatar_url: varchar({ length: 255 }),
  locale: varchar({ length: 50 }),
  category_uuid: varchar({ length: 255 }),
});

// Affiliates table
export const affiliates = pgTable("affiliates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_uuid: varchar({ length: 255 }).notNull(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }).notNull().default(""),
  invited_by: varchar({ length: 255 }).notNull(),
  paid_order_no: varchar({ length: 255 }).notNull().default(""),
  paid_amount: integer().notNull().default(0),
  reward_percent: integer().notNull().default(0),
  reward_amount: integer().notNull().default(0),
});

// Feedbacks table
export const feedbacks = pgTable("feedbacks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  created_at: timestamp({ withTimezone: true }),
  status: varchar({ length: 50 }),
  user_uuid: varchar({ length: 255 }),
  content: text(),
  rating: integer(),
});

export const deviceTrialUsage = pgTable(
  "device_trial_usage",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    web_fingerprint: varchar({ length: 255 }).notNull(),
    ip_address: varchar({ length: 45 }).notNull(),
    task_code: varchar({ length: 100 }).notNull(),
    attempts_used: integer().notNull().default(0),
    first_used_at: timestamp({ withTimezone: true }),
    last_used_at: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("device_trial_usage_unique").on(
      table.web_fingerprint,
      table.ip_address,
      table.task_code
    ),
  ]
);

export const taskTrialConfig = pgTable(
  "task_trial_config",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    task_code: varchar({ length: 100 }).notNull(),
    max_attempts: integer().notNull(),
    period_unit: varchar({ length: 20 }).notNull().default("lifetime"), // 可选 day/week/month/lifetime
    period_value: integer(), // 例如 1 天 / 7 天；lifetime 可留空
    description: varchar({ length: 255 }),
    updated_at: timestamp({ withTimezone: true }),
  },
  (table) => [uniqueIndex("task_trial_config_unique").on(table.task_code)]
);

export const invite_codes = pgTable(
  "invite_codes",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    invite_code: varchar({ length: 100 }).notNull(),
    web_fingerprint: varchar({ length: 255 }).notNull(),
    ip_address: varchar({ length: 45 }).notNull(),
    voteup: integer().notNull().default(0),
    votedown: integer().notNull().default(0),
    created_at: timestamp({ withTimezone: true }),
  }
)

export const invite_codes_vote = pgTable(
  "invite_codes_votes",  
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    invite_code: varchar({ length: 100 }).notNull(),
    web_fingerprint: varchar({ length: 255 }).notNull(),
    ip_address: varchar({ length: 45 }).notNull(),
    is_support: boolean("is_support").notNull(),
    created_at: timestamp({ withTimezone: true }),
  }
)