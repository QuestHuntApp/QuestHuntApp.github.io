import { useState } from "react";
import { Crown, Coins, Flame, Moon, Sun } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useQuestStats } from "@/hooks/use-quest-stats";
import { useTheme } from "@/components/theme-provider";
import { FloatingNavigation } from "@/components/floating-navigation";
import { QuestsView } from "@/components/quests-view";
import { CalendarView } from "@/components/calendar-view";
import { RewardsView } from "@/components/rewards-view";
import { ProgressView } from "@/components/progress-view";
import { ProfileView } from "@/components/profile-view";
import type { User } from "@shared/schema";

type ActiveTab = "quests" | "rewards" | "progress" | "profile" | "calendar";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("quests");
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useLocalStorage<User>("user", {
    nickname: "Hero",
    coins: 0,
    streak: 0,
    totalTasksCompleted: 0,
    totalCoinsEarned: 0,
    totalCoinsSpent: 0,
    achievements: [],
    createdAt: new Date().toISOString(),
  });

  const { dailyProgress } = useQuestStats();

  const renderActiveView = () => {
    switch (activeTab) {
      case "quests":
        return <QuestsView key="quests" user={user} setUser={setUser} />;
      case "calendar":
        return <CalendarView key="calendar" user={user} setUser={setUser} />;
      case "rewards":
        return <RewardsView key="rewards" user={user} setUser={setUser} />;
      case "progress":
        return <ProgressView key="progress" />;
      case "profile":
        return <ProfileView key="profile" />;
      default:
        return <QuestsView key="quests" user={user} setUser={setUser} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center flex-shrink-0">
            <Crown className="text-white h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">QuestHunt</h1>
            <p className="text-muted-foreground text-sm truncate">Welcome back, {user?.nickname || "Hero"}!</p>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
          {/* Stats Display */}
          <div className="flex items-center space-x-2 sm:space-x-3 bg-card rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 shadow-sm flex-1 sm:flex-none">
            <div className="flex items-center space-x-1">
              <Coins className="text-accent h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-semibold text-foreground text-sm">{user?.coins?.toLocaleString() || 0}</span>
            </div>
            <div className="w-px h-4 sm:h-6 bg-border"></div>
            <div className="flex items-center space-x-1">
              <Flame className="text-red-500 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-semibold text-foreground text-sm">{user?.streak || 0}</span>
            </div>
          </div>
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center flex-shrink-0"
          >
            {theme === "dark" ? (
              <Sun className="text-foreground h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Moon className="text-foreground h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>
        </div>
      </header>

      {/* Daily Progress Banner - Only show on quests tab */}
      {activeTab === "quests" && (
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 text-white">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Today's Progress</h2>
              <p className="opacity-90 text-sm sm:text-base">
                You have completed <span className="font-bold">{dailyProgress.completed}</span> of{" "}
                <span className="font-bold">{dailyProgress.total}</span> quests
              </p>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end space-x-4 sm:space-x-0">
              <div className="text-2xl sm:text-3xl font-bold">{dailyProgress.percentage}%</div>
              <div className="w-16 sm:w-20 h-2 bg-white/20 rounded-full">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${dailyProgress.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active View Container */}
      <div id="active-view">{renderActiveView()}</div>

      {/* Floating Navigation */}
      <FloatingNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}