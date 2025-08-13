import { useMemo } from "react";
import { useLocalStorage } from "./use-local-storage";
import { isQuestAvailableToday } from "@/lib/quest-utils";
import type { Quest, DailyStats, User } from "@shared/schema";

export function useQuestStats() {
  const [quests] = useLocalStorage<Quest[]>("quests", []);
  const [dailyStats] = useLocalStorage<DailyStats[]>("dailyStats", []);
  const [user] = useLocalStorage<User>("user", {} as User);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const totalDays = dailyStats.length || 1;

    // Daily progress for today - only count quests available today
    const todayQuests = quests.filter(q => isQuestAvailableToday(q));

    const todayCompleted = quests.filter(q => {
      if (q.status === "completed" && q.completedAt) {
        const completedDate = q.completedAt.split('T')[0];
        return completedDate === today;
      }
      return false;
    }).length;

    const dailyProgress = {
      total: todayQuests.length,
      completed: todayCompleted,
      percentage: todayQuests.length > 0 ? Math.round((todayCompleted / todayQuests.length) * 100) : 0,
    };

    // Calculate averages
    const totalTasksCompleted = dailyStats.reduce((sum, stat) => sum + stat.tasksCompleted, 0);
    const totalCoinsEarned = dailyStats.reduce((sum, stat) => sum + stat.coinsEarned, 0);
    const totalCoinsSpent = dailyStats.reduce((sum, stat) => sum + stat.coinsSpent, 0);

    const avgTasksPerDay = totalTasksCompleted / totalDays;
    const avgCoinsPerDay = totalCoinsEarned / totalDays;
    const avgSpentPerDay = totalCoinsSpent / totalDays;

    // Calculate completion rate
    const completedQuests = quests.filter(q => q.status === "completed").length;
    const totalQuests = quests.length || 1;
    const completionRate = (completedQuests / totalQuests) * 100;

    // Calculate best streak
    let currentStreak = 0;
    let bestStreak = 0;
    const sortedStats = [...dailyStats].sort((a, b) => a.date.localeCompare(b.date));
    
    for (const stat of sortedStats) {
      if (stat.allTasksCompleted) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return {
      dailyProgress,
      avgTasksPerDay,
      avgCoinsPerDay,
      avgSpentPerDay,
      completionRate,
      bestStreak: Math.max(bestStreak, user.streak || 0),
      totalTasks: quests.length,
      totalCoins: user.totalCoinsEarned || 0,
      totalSpent: user.totalCoinsSpent || 0,
    };
  }, [quests, dailyStats, user]);

  return { stats, dailyProgress: stats.dailyProgress };
}
