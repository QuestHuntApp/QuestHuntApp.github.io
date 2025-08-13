import { useState } from "react";
import { Plus, Coins } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { CreateRewardModal } from "./create-reward-modal";
import { Button } from "@/components/ui/button";
import type { Reward, User, DailyStats } from "@shared/schema";

interface RewardsViewProps {
  user: User;
  setUser: (user: User | ((prev: User) => User)) => void;
}

export function RewardsView({ user, setUser }: RewardsViewProps) {
  const { toast } = useToast();
  const [rewards, setRewards] = useLocalStorage<Reward[]>("rewards", []);
  const [dailyStats, setDailyStats] = useLocalStorage<DailyStats[]>("dailyStats", []);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const canPurchaseReward = (reward: Reward) => {
    if (user.coins < reward.cost) return false;
    if (reward.isOnCooldown) return false;
    
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check availability restrictions
    switch (reward.availability) {
      case "onetime":
        return !reward.purchased;
      case "unlimited":
        return true;
      case "everyday":
        return true;
      case "weekdays":
        return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
      case "weekends":
        return dayOfWeek === 0 || dayOfWeek === 6; // Saturday and Sunday
      case "custom":
        return reward.customDays?.includes(dayOfWeek) || false;
      default:
        return true;
    }
  };

  const handlePurchaseReward = (reward: Reward) => {
    if (!canPurchaseReward(reward)) {
      if (user.coins < reward.cost) {
        toast({
          title: "Insufficient Coins",
          description: `You need ${reward.cost - user.coins} more coins to purchase this reward.`,
          variant: "destructive",
        });
      } else if (reward.isOnCooldown) {
        toast({
          title: "Reward on Cooldown",
          description: "This reward is currently on cooldown.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reward Unavailable",
          description: "This reward is not available today.",
          variant: "destructive",
        });
      }
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Update user coins and total spent
    setUser(prev => ({
      ...prev,
      coins: prev.coins - reward.cost,
      totalCoinsSpent: prev.totalCoinsSpent + reward.cost,
    }));

    // Update reward with purchase info and cooldown if applicable
    setRewards(prev => prev.map(r => 
      r.id === reward.id 
        ? { 
            ...r, 
            purchased: reward.availability === "onetime" ? true : r.purchased,
            purchaseCount: (r.purchaseCount || 0) + 1,
            lastPurchasedAt: new Date().toISOString(),
            isOnCooldown: reward.timerMinutes ? true : false,
            cooldownUntil: reward.timerMinutes 
              ? new Date(Date.now() + reward.timerMinutes * 60000).toISOString()
              : undefined
          }
        : r
    ));

    // Update daily stats
    setDailyStats(prev => {
      const todayStats = prev.find(stat => stat.date === today);
      if (todayStats) {
        return prev.map(stat => 
          stat.date === today 
            ? { ...stat, coinsSpent: stat.coinsSpent + reward.cost }
            : stat
        );
      } else {
        return [...prev, {
          date: today,
          tasksCompleted: 0,
          coinsEarned: 0,
          coinsSpent: reward.cost,
          allTasksCompleted: false,
        }];
      }
    });

    // Start timer if applicable
    if (reward.timerMinutes) {
      setTimeout(() => {
        setRewards(prev => prev.map(r => 
          r.id === reward.id 
            ? { ...r, isOnCooldown: false, cooldownUntil: undefined }
            : r
        ));
      }, reward.timerMinutes * 60000);
    }

    toast({
      title: "Reward Purchased! 🎉",
      description: `You've purchased "${reward.title}" for ${reward.cost} coins.`,
    });
  };

  const handleEditReward = (reward: Reward) => {
    setEditingReward(reward);
    setIsCreateModalOpen(true);
  };

  const handleDeleteReward = (rewardId: string) => {
    setRewards(prev => prev.filter(r => r.id !== rewardId));
    toast({
      title: "Reward Deleted",
      description: "The reward has been removed from your collection.",
    });
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingReward(null);
  };

  const getAvailabilityText = (reward: Reward) => {
    switch (reward.availability) {
      case "onetime": return "One-time only";
      case "unlimited": return "Unlimited";
      case "everyday": return "Available daily";
      case "weekdays": return "Weekdays only";
      case "weekends": return "Weekends only";
      case "custom": return "Custom days";
      default: return "Available";
    }
  };

  return (
    <div className="rewards-view">
      {/* Rewards Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h3 className="text-lg font-semibold text-slate-800">Your Rewards</h3>
        <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-3">
          <div className="flex items-center space-x-2 bg-white rounded-xl px-3 sm:px-4 py-2 shadow-sm justify-center xs:justify-start">
            <Coins className="text-accent h-4 w-4" />
            <span className="font-semibold text-slate-700">{user.coins?.toLocaleString() || 0}</span>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-accent to-yellow-500 hover:shadow-lg w-full xs:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="xs:inline">New Reward</span>
          </Button>
        </div>
      </div>

      {/* All Rewards */}
      {rewards.length > 0 && (
        <div className="mb-8">
          <h4 className="text-md font-medium text-slate-700 mb-4">Your Rewards</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map(reward => {
              const canPurchase = canPurchaseReward(reward);
              const isPurchased = reward.availability === "onetime" && reward.purchased;
              const isOnCooldown = reward.isOnCooldown;
              
              return (
                <div key={reward.id} className={`reward-card bg-white rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 ${isPurchased ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-4xl">{reward.emoji}</div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditReward(reward)}
                        className="text-xs px-2 py-1"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-slate-800 mb-2">{reward.title}</h4>
                  
                  {reward.description && (
                    <p className="text-sm text-slate-600 mb-3">{reward.description}</p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Availability:</span>
                      <span className="text-slate-700">{getAvailabilityText(reward)}</span>
                    </div>
                    
                    {reward.purchaseCount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Purchased:</span>
                        <span className="text-slate-700">{reward.purchaseCount} times</span>
                      </div>
                    )}
                    
                    {reward.timerMinutes && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Cooldown:</span>
                        <span className="text-slate-700">{reward.timerMinutes} minutes</span>
                      </div>
                    )}
                    
                    {isOnCooldown && reward.cooldownUntil && (
                      <div className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        On cooldown until {new Date(reward.cooldownUntil).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Coins className="text-accent h-4 w-4" />
                      <span className="font-bold text-slate-700">{reward.cost}</span>
                    </div>
                    
                    {isPurchased ? (
                      <span className="text-secondary font-medium text-sm">Purchased</span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handlePurchaseReward(reward)}
                        disabled={!canPurchase}
                        className={`${canPurchase ? 'bg-accent hover:bg-yellow-500' : 'bg-gray-300 cursor-not-allowed'}`}
                      >
                        Purchase
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {rewards.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎁</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">No rewards yet</h3>
          <p className="text-slate-500 mb-6">
            Create custom rewards to motivate yourself!
          </p>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-accent to-yellow-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Reward
          </Button>
        </div>
      )}

      <CreateRewardModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        editingReward={editingReward}
        rewards={rewards}
        setRewards={setRewards}
      />
    </div>
  );
}
