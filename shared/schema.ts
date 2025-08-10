import { z } from "zod";

export type QuestType = "once" | "daily" | "weekly" | "count" | "weekends" | "weekdays" | "biweekly" | "monthly" | "custom";
export type QuestPriority = "low" | "medium" | "high" | "urgent";
export type QuestStatus = "active" | "completed" | "overdue" | "skipped";
export type RewardAvailability = "onetime" | "unlimited" | "everyday" | "weekdays" | "weekends" | "every_other_day" | "every_other_week" | "custom";

export const subquestSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  completed: z.boolean().default(false),
  completedAt: z.string().optional(),
});

export const questSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["once", "daily", "weekly", "count", "weekends", "weekdays", "biweekly", "monthly", "custom"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  coinReward: z.number().min(1).max(1000),
  targetCount: z.number().min(1).max(100).optional(),
  currentCount: z.number().min(0).default(0),
  startDate: z.string(),
  dueTime: z.string(),
  customDays: z.array(z.number()).optional(), // 0-6 for Sunday-Saturday
  subquests: z.array(subquestSchema).default([]),
  status: z.enum(["active", "completed", "overdue", "skipped"]).default("active"),
  completedAt: z.string().optional(),
  createdAt: z.string(),
  lastCompletedDate: z.string().optional(),
  pointsDeducted: z.boolean().default(false),
});

export const insertQuestSchema = questSchema.omit({
  id: true,
  status: true,
  completedAt: true,
  createdAt: true,
  currentCount: true,
  lastCompletedDate: true,
  pointsDeducted: true,
});

export const rewardSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  cost: z.number().min(1, "Cost must be at least 1"),
  emoji: z.string().default("🎁"),
  availability: z.enum(["onetime", "unlimited", "everyday", "weekdays", "weekends", "every_other_day", "every_other_week", "custom"]).default("onetime"),
  limitPerDay: z.number().min(1).default(1),
  limitPeriod: z.enum(["day", "weekend", "nolimit"]).default("day"),
  timerMinutes: z.number().min(0).optional(),
  customDays: z.array(z.number()).optional(),
  purchased: z.boolean().default(false),
  purchasedAt: z.string().optional(),
  lastPurchased: z.string().optional(),
  purchaseCount: z.number().default(0),
  isOnCooldown: z.boolean().default(false),
  cooldownUntil: z.string().optional(),
  createdAt: z.string(),
});

export const insertRewardSchema = rewardSchema.omit({
  id: true,
  purchased: true,
  purchasedAt: true,
  lastPurchased: true,
  purchaseCount: true,
  isOnCooldown: true,
  cooldownUntil: true,
  createdAt: true,
});

export const achievementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  emoji: z.string(),
  unlockedAt: z.string().optional(),
  progress: z.number().default(0),
  target: z.number(),
  category: z.enum(["quests", "coins", "streak", "rewards", "completion"]),
});

export const userSchema = z.object({
  nickname: z.string().default("Hero"),
  coins: z.number().default(0),
  streak: z.number().default(0),
  lastActiveDate: z.string().optional(),
  totalTasksCompleted: z.number().default(0),
  totalCoinsEarned: z.number().default(0),
  totalCoinsSpent: z.number().default(0),
  achievements: z.array(achievementSchema).default([]),
  createdAt: z.string(),
});

export const dailyStatsSchema = z.object({
  date: z.string(),
  tasksCompleted: z.number().default(0),
  coinsEarned: z.number().default(0),
  coinsSpent: z.number().default(0),
  allTasksCompleted: z.boolean().default(false),
});

export type Subquest = z.infer<typeof subquestSchema>;
export type Quest = z.infer<typeof questSchema>;
export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type Reward = z.infer<typeof rewardSchema>;
export type InsertReward = z.infer<typeof insertRewardSchema>;
export type Achievement = z.infer<typeof achievementSchema>;
export type User = z.infer<typeof userSchema>;
export type DailyStats = z.infer<typeof dailyStatsSchema>;
