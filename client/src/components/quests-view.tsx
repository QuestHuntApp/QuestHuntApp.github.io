import { useState } from "react";
import { Plus } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { QuestCard } from "./quest-card";
import { CreateQuestModal } from "./create-quest-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isQuestAvailableToday } from "@/lib/quest-utils";
import type { Quest, User } from "@shared/schema";

type QuestFilter = "all" | "today" | "completed" | "overdue" | "upcoming";

interface QuestsViewProps {
  user: User;
  setUser: (user: User | ((prev: User) => User)) => void;
}

export function QuestsView({ user, setUser }: QuestsViewProps) {
  const { toast } = useToast();
  const [quests, setQuests] = useLocalStorage<Quest[]>("quests", []);
  const [filter, setFilter] = useState<QuestFilter>("today");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);

  const getFilteredQuests = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const filtered = quests.filter(quest => {
      // Apply the selected filter
      if (filter === "all") {
        // Show all quests regardless of availability
        return true;
      }
      
      if (filter === "today") {
        // Show quests available today (active) OR completed today
        if (quest.status === "active" && isQuestAvailableToday(quest)) {
          return true;
        }
        if (quest.status === "completed" && quest.completedAt) {
          const completedDate = quest.completedAt.split('T')[0];
          return completedDate === today;
        }
        return false;
      }
      
      if (filter === "completed") {
        return quest.status === "completed";
      }
      
      if (filter === "overdue") {
        return quest.status === "overdue";
      }
      
      if (filter === "upcoming") {
        // Show quests that are active but NOT available today (future dates or wrong day-of-week)
        return quest.status === "active" && !isQuestAvailableToday(quest);
      }
      
      return true;
    });

    // Sort incomplete quests above completed quests for certain filters
    if (filter === "today" || filter === "all" || filter === "overdue") {
      return filtered.sort((a, b) => {
        // Incomplete quests (active, overdue) come first
        const aIncomplete = a.status === "active" || a.status === "overdue";
        const bIncomplete = b.status === "active" || b.status === "overdue";
        
        if (aIncomplete && !bIncomplete) return -1;
        if (!aIncomplete && bIncomplete) return 1;
        return 0; // Keep original order within same status group
      });
    }

    return filtered;
  };

  const handleDeleteQuest = (questId: string) => {
    setQuests(prev => prev.filter(q => q.id !== questId));
    toast({
      title: "Quest Deleted",
      description: "The quest has been removed from your list.",
    });
  };

  const handleEditQuest = (quest: Quest) => {
    setEditingQuest(quest);
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingQuest(null);
  };

  const filteredQuests = getFilteredQuests();

  return (
    <div className="quests-view">
      {/* Quest Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h3 className="text-lg font-semibold text-foreground">Your Quests</h3>
        <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-3">
          <Select value={filter} onValueChange={(value: QuestFilter) => setFilter(value)}>
            <SelectTrigger className="w-full xs:w-[160px] sm:w-[180px]">
              <SelectValue placeholder="Filter quests" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quests</SelectItem>
              <SelectItem value="today">Today's Quests</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg w-full xs:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="xs:inline">New Quest</span>
          </Button>
        </div>
      </div>

      {/* Quest List */}
      <div className="space-y-3">
        {filteredQuests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No quests found</h3>
            <p className="text-muted-foreground mb-6">
              {filter === "all" 
                ? "Start your adventure by creating your first quest!" 
                : `No ${filter} quests at the moment.`}
            </p>
            {filter === "all" && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-primary to-primary-dark"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Quest
              </Button>
            )}
          </div>
        ) : (
          filteredQuests.map(quest => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onEdit={handleEditQuest}
              onDelete={handleDeleteQuest}
              quests={quests}
              setQuests={setQuests}
              user={user}
              setUser={setUser}
            />
          ))
        )}
      </div>

      <CreateQuestModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        editingQuest={editingQuest}
        quests={quests}
        setQuests={setQuests}
      />
    </div>
  );
}
