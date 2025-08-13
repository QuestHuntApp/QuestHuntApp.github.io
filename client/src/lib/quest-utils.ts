import { isAfter, parseISO } from "date-fns";
import type { Quest } from "@shared/schema";

export function isQuestAvailableOnDate(quest: Quest, date: Date): boolean {
  const today = date.toISOString().split('T')[0];
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Check if quest has started
  if (quest.startDate > today) {
    return false;
  }
  
  // For now, we don't have endDate property, so skip this check
  
  // Check day-of-week availability based on quest type
  switch (quest.type) {
    case "daily":
      return true; // Available every day
      
    case "weekly":
      // Check if it's the right day of week for weekly quests
      if (quest.customDays && quest.customDays.length > 0) {
        return quest.customDays.includes(dayOfWeek);
      }
      return true; // If no specific days set, available daily
      
    case "weekends":
      return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      
    case "weekdays":
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
      
    case "biweekly":
      // For biweekly, check if it's an appropriate week
      const weeksSinceStart = Math.floor((date.getTime() - new Date(quest.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weeksSinceStart % 2 === 0;
      
    case "monthly":
      // For monthly, check if it's the right day of the month
      const startDate = new Date(quest.startDate);
      return date.getDate() === startDate.getDate();
      
    case "custom":
      // Check if the specific date matches
      if (quest.customDays && quest.customDays.length > 0) {
        return quest.customDays.includes(dayOfWeek);
      }
      return false;
      
    case "once":
      // One-time quests are available until completed
      return quest.status === "active";
      
    case "count":
      // Count-based quests are available until target is reached
      return quest.status === "active";
      
    default:
      return false;
  }
}

export function isQuestOverdue(quest: Quest): boolean {
  // For now, we don't have deadline property, so return false
  return false;
}

export function canCompleteQuest(quest: Quest): boolean {
  if (quest.status === "completed") return false;
  
  if (quest.type === "count") {
    return quest.currentCount >= (quest.targetCount || 1);
  }
  
  return true;
}

export function getQuestStatusColor(quest: Quest): string {
  if (quest.status === "completed") return "border-secondary";
  if (isQuestOverdue(quest)) return "border-destructive";
  
  switch (quest.type) {
    case "daily":
      return "border-primary";
    case "count":
      return "border-accent";
    default:
      return "border-purple";
  }
}

export function getQuestTypeLabel(quest: Quest) {
  switch (quest.type) {
    case "daily":
      return { label: "Daily", color: "bg-orange-100 text-orange-700" };
    case "weekly":
      return { label: "Weekly", color: "bg-blue-100 text-blue-700" };
    case "weekends":
      return { label: "Weekends", color: "bg-purple-100 text-purple-700" };
    case "weekdays":
      return { label: "Weekdays", color: "bg-green-100 text-green-700" };
    case "biweekly":
      return { label: "Bi-weekly", color: "bg-indigo-100 text-indigo-700" };
    case "monthly":
      return { label: "Monthly", color: "bg-pink-100 text-pink-700" };
    case "count":
      return { label: "Count", color: "bg-blue-100 text-blue-700" };
    case "once":
      return { label: "Once", color: "bg-gray-100 text-gray-700" };
    case "custom":
      return { label: "Custom", color: "bg-yellow-100 text-yellow-700" };
    default:
      return null;
  }
}

export function shouldResetDailyQuest(quest: Quest, lastCompletedDate?: string): boolean {
  if (quest.type !== "daily") return false;
  if (!lastCompletedDate) return true;
  
  const today = new Date().toISOString().split('T')[0];
  return lastCompletedDate !== today;
}

export function calculateStreakUpdate(allQuestsCompleted: boolean, currentStreak: number): number {
  if (allQuestsCompleted) {
    return currentStreak + 1;
  } else {
    return 0;
  }
}

export function isQuestAvailableToday(quest: Quest): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const todayDateString = today.toISOString().split('T')[0];
  
  // Skip completed or skipped quests
  if (quest.status === "completed" || quest.status === "skipped") {
    return false;
  }
  
  // Check if quest start date is in the future
  if (quest.startDate > todayDateString) {
    return false;
  }
  
  switch (quest.type) {
    case "once":
      // Once quests are available until completed
      return quest.status === "active";
      
    case "daily":
      // Daily quests are only available on the current day and if not completed today
      if (quest.status !== "active") return false;
      
      // If quest was completed today, it's not available
      if (quest.completedAt) {
        const completedDate = quest.completedAt.split('T')[0];
        if (completedDate === todayDateString) {
          return false;
        }
      }
      
      return true;
      
    case "weekly":
      // Weekly quests are available every day of the week
      return quest.status === "active";
      
    case "weekends":
      // Only show on Saturday (6) and Sunday (0)
      return quest.status === "active" && (dayOfWeek === 0 || dayOfWeek === 6);
      
    case "weekdays":
      // Only show Monday (1) through Friday (5)
      return quest.status === "active" && (dayOfWeek >= 1 && dayOfWeek <= 5);
      
    case "biweekly":
      // Show every day (biweekly refers to completion frequency, not availability)
      return quest.status === "active";
      
    case "monthly":
      // Show every day (monthly refers to completion frequency, not availability)
      return quest.status === "active";
      
    case "count":
      // Count-based quests are available until target is reached
      return quest.status === "active";
      
    case "custom":
      // Check custom days array (0-6 for Sunday-Saturday)
      if (!quest.customDays || quest.customDays.length === 0) {
        return quest.status === "active";
      }
      return quest.status === "active" && quest.customDays.includes(dayOfWeek);
      
    default:
      return quest.status === "active";
  }
}
