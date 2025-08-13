import { CheckSquare, Gift, TrendingUp, User, Calendar } from "lucide-react";

type ActiveTab = "quests" | "rewards" | "progress" | "profile" | "calendar";

interface FloatingNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export function FloatingNavigation({ activeTab, onTabChange }: FloatingNavigationProps) {
  const tabs = [
    { id: "quests" as const, label: "Quests", icon: CheckSquare },
    { id: "calendar" as const, label: "Calendar", icon: Calendar },
    { id: "rewards" as const, label: "Rewards", icon: Gift },
    { id: "progress" as const, label: "Progress", icon: TrendingUp },
    { id: "profile" as const, label: "Profile", icon: User },
  ];

  return (
    <nav className="floating-nav">
      <div className="flex space-x-1 sm:space-x-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 min-w-[60px] xs:min-w-[70px] sm:min-w-[80px] ${
                isActive
                  ? "bg-gradient-to-r from-primary to-primary-dark text-white"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline text-xs sm:text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
