import { useMemo } from "react";
import { CheckSquare, Coins, Flame, TrendingUp } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useQuestStats } from "@/hooks/use-quest-stats";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { DailyStats, Quest, Reward } from "@shared/schema";

export function ProgressView() {
  const [dailyStats] = useLocalStorage<DailyStats[]>("dailyStats", []);
  const [quests] = useLocalStorage<Quest[]>("quests", []);
  const [rewards] = useLocalStorage<Reward[]>("rewards", []);
  const { stats } = useQuestStats();

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayStats = dailyStats.find(stat => stat.date === date);
      
      // Count rewards bought on this day
      const rewardsBought = rewards.filter(reward => {
        if (!reward.purchasedAt) return false;
        const purchaseDate = reward.purchasedAt.split('T')[0];
        return purchaseDate === date;
      }).length;
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        tasks: dayStats?.tasksCompleted || 0,
        coins: dayStats?.coinsEarned || 0,
        spent: dayStats?.coinsSpent || 0,
        rewards: rewardsBought,
      };
    });
  }, [dailyStats, rewards]);

  const getMostCompletedTask = () => {
    const taskCounts = quests
      .filter(q => q.status === "completed")
      .reduce((acc, quest) => {
        acc[quest.title] = (acc[quest.title] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const mostCompleted = Object.entries(taskCounts)
      .sort(([, a], [, b]) => b - a)[0];

    return mostCompleted ? mostCompleted[0] : "None yet";
  };

  const getMostLikedReward = () => {
    const purchasedRewards = rewards.filter(r => r.purchased);
    if (purchasedRewards.length === 0) return "None yet";
    
    // For now, return the most expensive purchased reward as "most liked"
    const mostExpensive = purchasedRewards
      .sort((a, b) => b.cost - a.cost)[0];
    
    return mostExpensive.title;
  };

  const progressStats = [
    {
      title: "Avg Tasks/Day",
      value: stats.avgTasksPerDay.toFixed(1),
      icon: CheckSquare,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Avg Coins/Day",
      value: stats.avgCoinsPerDay.toFixed(0),
      icon: Coins,
      color: "bg-accent/10 text-accent",
    },
    {
      title: "Best Streak",
      value: stats.bestStreak.toString(),
      icon: Flame,
      color: "bg-red-100 text-red-500",
    },
    {
      title: "Completion Rate",
      value: `${stats.completionRate.toFixed(0)}%`,
      icon: TrendingUp,
      color: "bg-secondary/10 text-secondary",
    },
  ];

  const additionalStats = [
    { label: "Total Tasks", value: stats.totalTasks },
    { label: "Total Coins", value: stats.totalCoins.toLocaleString() },
    { label: "Total Spent", value: stats.totalSpent.toLocaleString() },
    { label: "Avg Spent/Day", value: stats.avgSpentPerDay.toFixed(0) },
    { label: "Most Completed Task", value: getMostCompletedTask() },
    { label: "Most Liked Reward", value: getMostLikedReward() },
  ];

  return (
    <div className="progress-view">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Progress Analytics</h3>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {progressStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">{stat.title}</p>
                  <p className="font-bold text-xl text-slate-800">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly Progress Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
        <h3 className="font-semibold text-slate-800 mb-6">Weekly Progress</h3>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="hsl(214.3 87.1% 59.8%)" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(214.3 87.1% 59.8%)", strokeWidth: 2, r: 4 }}
                  name="Tasks Completed"
                />
                <Line 
                  type="monotone" 
                  dataKey="coins" 
                  stroke="hsl(41 92% 49%)" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(41 92% 49%)", strokeWidth: 2, r: 4 }}
                  name="Coins Earned"
                />
                <Line 
                  type="monotone" 
                  dataKey="spent" 
                  stroke="hsl(0 72% 51%)" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(0 72% 51%)", strokeWidth: 2, r: 4 }}
                  name="Coins Spent"
                />
                <Line 
                  type="monotone" 
                  dataKey="rewards" 
                  stroke="hsl(262 83% 58%)" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(262 83% 58%)", strokeWidth: 2, r: 4 }}
                  name="Rewards Bought"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Chart Legend */}
          <div className="lg:w-48 flex lg:flex-col gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "hsl(214.3 87.1% 59.8%)" }}></div>
              <span className="text-sm text-slate-600">Tasks Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "hsl(41 92% 49%)" }}></div>
              <span className="text-sm text-slate-600">Coins Earned</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "hsl(0 72% 51%)" }}></div>
              <span className="text-sm text-slate-600">Coins Spent</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "hsl(262 83% 58%)" }}></div>
              <span className="text-sm text-slate-600">Rewards Bought</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-6">Detailed Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {additionalStats.map((stat, index) => (
            <div key={index} className="border-l-4 border-primary pl-4">
              <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
              <p className="font-semibold text-slate-800 text-lg">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
