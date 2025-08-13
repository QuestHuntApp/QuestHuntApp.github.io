import { useState } from "react";
import { Coins, Clock, Calendar, CheckCircle, Edit, Trash2, TriangleAlert, SkipForward, ChevronDown, ChevronRight } from "lucide-react";
import { formatDistanceToNow, isAfter, parseISO } from "date-fns";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { isQuestAvailableToday } from "@/lib/quest-utils";
import type { Quest, User, DailyStats, Subquest } from "@shared/schema";

interface QuestCardProps {
  quest: Quest;
  onEdit: (quest: Quest) => void;
  onDelete: (questId: string) => void;
  quests: Quest[];
  setQuests: (quests: Quest[] | ((prev: Quest[]) => Quest[])) => void;
  user: User;
  setUser: (user: User | ((prev: User) => User)) => void;
  hideActions?: boolean;
  calendarDate?: Date;
}

export function QuestCard({ quest, onEdit, onDelete, quests, setQuests, user, setUser, hideActions = false, calendarDate }: QuestCardProps) {
  const { toast } = useToast();
  const [dailyStats, setDailyStats] = useLocalStorage<DailyStats[]>("dailyStats", []);
  const [showSubquests, setShowSubquests] = useState(false);

  const isCompleted = quest.status === "completed";
  const isSkipped = quest.status === "skipped";
  const isOverdue = quest.dueTime && !isCompleted && !isSkipped && isAfter(new Date(), parseISO(`${quest.startDate}T${quest.dueTime}`));
  const isCountBased = quest.type === "count";
  const isDailyQuest = quest.type === "daily";
  const hasSubquests = quest.subquests && quest.subquests.length > 0;
  const allSubquestsCompleted = hasSubquests ? quest.subquests.every(sq => sq.completed) : true;
  const isUnavailable = !isCompleted && (calendarDate
    ? (quest.type === "daily" && calendarDate.toISOString().split('T')[0] > new Date().toISOString().split('T')[0])
    : !isQuestAvailableToday(quest));
  
  const isFutureQuest = !isCompleted && calendarDate && quest.type === "daily" && calendarDate.toISOString().split('T')[0] > new Date().toISOString().split('T')[0];

  const getBorderColor = () => {
    if (isCompleted) return "border-secondary";
    if (isOverdue) return "border-destructive";
    if (isDailyQuest) return "border-primary";
    if (isCountBased) return "border-accent";
    return "border-purple";
  };

  const getTypeLabel = () => {
    switch (quest.type) {
      case "daily":
        return { label: "Daily", color: "bg-orange-100 text-orange-700" };
      case "weekly":
        return { label: "Weekly", color: "bg-blue-100 text-blue-700" };
      case "count":
        return { label: "Count", color: "bg-blue-100 text-blue-700" };
      default:
        return null;
    }
  };

  const canComplete = () => {
    if (isCompleted) return false;
    if (isCountBased) return quest.currentCount >= (quest.targetCount || 1);
    return true;
  };

  const incrementCount = () => {
    if (!isCountBased || isCompleted || isUnavailable) return;

    const newCount = quest.currentCount + 1;
    const targetCount = quest.targetCount || 1;

    setQuests((prev: Quest[]) => prev.map((q: Quest) => 
      q.id === quest.id 
        ? { 
            ...q, 
            currentCount: newCount,
            status: (newCount >= targetCount ? "completed" : "active") as Quest['status'],
            completedAt: newCount >= targetCount ? new Date().toISOString() : undefined
          }
        : q
    ));

    if (newCount >= targetCount) {
      completeQuest();
    }

    toast({
      title: "Progress Updated",
      description: `${newCount}/${targetCount} completed`,
    });
  };

  const completeQuest = () => {
    if (!canComplete() || isUnavailable) return;

    const today = new Date().toISOString().split('T')[0];

    // Update quest status
    const updatedQuests = quests.map((q: Quest) => 
      q.id === quest.id 
        ? { 
            ...q, 
            status: "completed" as const, 
            completedAt: new Date().toISOString(),
            lastCompletedDate: today
          }
        : q
    );
    setQuests(updatedQuests);

    // Update user stats
    setUser(prev => ({
      ...prev,
      coins: prev.coins + quest.coinReward,
      totalTasksCompleted: prev.totalTasksCompleted + 1,
      totalCoinsEarned: prev.totalCoinsEarned + quest.coinReward,
    }));

    // Update daily stats
    setDailyStats(prev => {
      const todayStats = prev.find(stat => stat.date === today);
      if (todayStats) {
        return prev.map(stat => 
          stat.date === today 
            ? {
                ...stat,
                tasksCompleted: stat.tasksCompleted + 1,
                coinsEarned: stat.coinsEarned + quest.coinReward,
              }
            : stat
        );
      } else {
        return [...prev, {
          date: today,
          tasksCompleted: 1,
          coinsEarned: quest.coinReward,
          coinsSpent: 0,
          allTasksCompleted: false,
        }];
      }
    });

    toast({
      title: "Quest Completed! 🎉",
      description: `You earned ${quest.coinReward} coins`,
    });
  };

  const skipQuest = () => {
    const updatedQuests = quests.map((q: Quest) => 
      q.id === quest.id 
        ? { ...q, status: "skipped" as const }
        : q
    );
    setQuests(updatedQuests);

    toast({
      title: "Quest Skipped",
      description: "The quest has been skipped.",
    });
  };

  const toggleSubquest = (subquestId: string) => {
    const updatedQuests = quests.map(q => 
      q.id === quest.id 
        ? {
            ...q,
            subquests: q.subquests.map(sq => 
              sq.id === subquestId 
                ? { 
                    ...sq, 
                    completed: !sq.completed, 
                    completedAt: !sq.completed ? new Date().toISOString() : undefined 
                  }
                : sq
            )
          }
        : q
    );
    setQuests(updatedQuests);
  };

  const getTimeDisplay = () => {
    if (quest.dueTime) {
      const dueDateTime = parseISO(`${quest.startDate}T${quest.dueTime}`);
      if (isOverdue) {
        return {
          icon: TriangleAlert,
          text: `${formatDistanceToNow(dueDateTime)} overdue`,
          color: "text-destructive",
        };
      } else {
        return {
          icon: Clock,
          text: formatDistanceToNow(dueDateTime, { addSuffix: true }),
          color: "text-slate-600",
        };
      }
    }
    return {
      icon: Calendar,
      text: "No deadline",
      color: "text-slate-600",
    };
  };

  const typeLabel = getTypeLabel();
  const timeDisplay = getTimeDisplay();
  const TimeIcon = timeDisplay.icon;

  return (
    <div className={`quest-card bg-white rounded-2xl p-4 shadow-sm border-l-4 ${getBorderColor()} ${isCompleted ? 'opacity-40' : ''} ${isSkipped ? 'opacity-40' : ''} ${isUnavailable ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex-shrink-0">
            {isCompleted ? (
              <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                <CheckCircle className="text-white h-4 w-4" />
              </div>
            ) : isCountBased ? (
              <div className="w-6 h-6 border-2 border-accent rounded-full flex items-center justify-center">
                <span className="text-accent text-xs font-bold">
                  {quest.currentCount}/{quest.targetCount || 1}
                </span>
              </div>
            ) : (
              <button
                onClick={completeQuest}
                disabled={!canComplete() || !allSubquestsCompleted || isUnavailable}
                className={`w-6 h-6 border-2 rounded-full hover:bg-opacity-100 group transition-colors ${
                  !allSubquestsCompleted || isUnavailable
                    ? "border-gray-300 cursor-not-allowed"
                    : isOverdue 
                    ? "border-destructive hover:bg-destructive" 
                    : "border-primary hover:bg-primary"
                }`}
              >
                <CheckCircle className="text-transparent group-hover:text-white h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className={`font-medium text-slate-800 ${isCompleted || isSkipped ? 'line-through' : ''}`}>
                {quest.title}
              </h4>
              {typeLabel && (
                <span className={`px-2 py-1 text-xs font-medium rounded-lg ${typeLabel.color}`}>
                  {typeLabel.label}
                </span>
              )}
              {isSkipped && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                  Skipped
                </span>
              )}
              {isFutureQuest ? (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-lg">
                  Future Quest
                </span>
              ) : isUnavailable && (
                <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded-lg">
                  Not Available Today
                </span>
              )}
              {isOverdue && !isSkipped && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-lg">
                  Overdue
                </span>
              )}
            </div>
            {quest.description && (
              <p className="text-sm text-slate-500 truncate">{quest.description}</p>
            )}
            {hasSubquests && (
              <div className="mt-2">
                <button 
                  onClick={() => setShowSubquests(!showSubquests)}
                  className="flex items-center space-x-1 text-sm text-slate-600 hover:text-slate-800"
                >
                  {showSubquests ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span>Subquests ({quest.subquests.filter(sq => sq.completed).length}/{quest.subquests.length})</span>
                </button>

                {showSubquests && (
                  <div className="mt-2 space-y-1 ml-4">
                    {quest.subquests.map((subquest: Subquest) => (
                      <div key={subquest.id} className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleSubquest(subquest.id)}
                          className={`w-4 h-4 border rounded ${subquest.completed ? 'bg-secondary border-secondary' : 'border-gray-300'}`}
                        >
                          {subquest.completed && <CheckCircle className="w-3 h-3 text-white" />}
                        </button>
                        <span className={`text-sm ${subquest.completed ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                          {subquest.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {isCountBased && !isCompleted && (
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex space-x-1">
                  {Array.from({ length: quest.targetCount || 1 }).map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full ${
                        index < quest.currentCount ? "bg-accent" : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={incrementCount}
                  disabled={isUnavailable}
                  className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                    isUnavailable 
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                      : "bg-accent text-white hover:bg-yellow-500"
                  }`}
                >
                  +1
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-1">
            <Coins className="text-accent h-4 w-4" />
            <span className="font-medium text-slate-600">{quest.coinReward}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="font-medium text-slate-600">#{quest.priority}</span>
          </div>
          {!isCompleted && (
            <div className={`flex items-center space-x-1 ${timeDisplay.color}`}>
              <TimeIcon className="h-4 w-4" />
              <span>{timeDisplay.text}</span>
            </div>
          )}
          {isCompleted && (
            <span className="text-secondary font-medium">Completed</span>
          )}
          {!hideActions && (
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(quest)}
                className="w-8 h-8 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors"
              >
                <Edit className="text-slate-400 h-3 w-3" />
              </button>
              <button
                onClick={() => onDelete(quest.id)}
                className="w-8 h-8 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors"
              >
                <Trash2 className="text-slate-400 hover:text-red-500 h-3 w-3" />
              </button>
              {!isCompleted && !isSkipped && (
                <button
                  onClick={skipQuest}
                  className="w-8 h-8 hover:bg-gray-50 rounded-lg flex items-center justify-center transition-colors"
                >
                  <SkipForward className="text-slate-400 hover:text-gray-600 h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}