import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CreateQuestModal } from "./create-quest-modal";
import { QuestCard } from "./quest-card";
import { isQuestAvailableOnDate, getQuestTypeLabel } from "@/lib/quest-utils";
import type { Quest, User } from "@shared/schema";

interface CalendarViewProps {
  user: User;
  setUser: (user: User | ((prev: User) => User)) => void;
}

export function CalendarView({ user, setUser }: CalendarViewProps) {
  const [quests, setQuests] = useLocalStorage<Quest[]>("quests", []);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Get the first day of the month and calculate calendar grid
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

  const calendarDays = [];
  const currentDay = new Date(startDate);
  
  // Generate 42 days (6 weeks) for the calendar grid
  for (let i = 0; i < 42; i++) {
    calendarDays.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  // Get quests for a specific date
  const getQuestsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    return quests.filter(quest => {
      // Check if quest has started by this date
      if (quest.startDate > dateString) {
        return false;
      }
      
      // Check if quest is available on this date (this handles quest type rules)
      if (!isQuestAvailableOnDate(quest, date)) {
        return false;
      }
      
      // Also show completed quests for this date
      if (quest.status === "completed" && quest.completedAt) {
        const completedDate = quest.completedAt.split('T')[0];
        return completedDate === dateString;
      }
      
      return quest.status === "active";
    });
  };

  const selectedDateQuests = selectedDate ? getQuestsForDate(selectedDate) : [];

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date: Date) => {
    return date.getMonth() === currentMonth;
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-foreground">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="text-sm"
          >
            Today
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  const dayQuests = getQuestsForDate(date);
                  const isCurrentMonth = isSameMonth(date);
                  const isTodayDate = isToday(date);
                  const isSelected = selectedDate && isSameDate(date, selectedDate);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleDateClick(date)}
                      className={`
                        relative p-2 h-16 sm:h-20 border rounded-lg transition-all duration-200 hover:bg-muted/50
                        ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                        ${isTodayDate ? 'bg-primary/10 border-primary' : 'border-border'}
                        ${isSelected ? 'bg-primary/20 border-primary' : ''}
                      `}
                    >
                      <div className="text-sm font-medium">{date.getDate()}</div>
                      {dayQuests.length > 0 && (
                        <div className="absolute bottom-1 left-1 right-1">
                          <div className="flex flex-wrap gap-0.5 justify-center">
                            {dayQuests.slice(0, 3).map((quest, questIndex) => {
                              const typeInfo = getQuestTypeLabel(quest);
                              return (
                                <div
                                  key={questIndex}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    quest.status === "completed" 
                                      ? 'bg-green-500' 
                                      : typeInfo?.color === 'bg-orange-100 text-orange-700'
                                        ? 'bg-orange-500'
                                        : typeInfo?.color === 'bg-blue-100 text-blue-700'
                                          ? 'bg-blue-500'
                                          : typeInfo?.color === 'bg-purple-100 text-purple-700'
                                            ? 'bg-purple-500'
                                            : typeInfo?.color === 'bg-green-100 text-green-700'
                                              ? 'bg-green-500'
                                              : 'bg-gray-500'
                                  }`}
                                />
                              );
                            })}
                            {dayQuests.length > 3 && (
                              <div className="text-xs text-muted-foreground">+{dayQuests.length - 3}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Details */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              {selectedDate ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedDateQuests.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateQuests.map(quest => (
                        <QuestCard
                          key={quest.id}
                          quest={quest}
                          onEdit={() => {}}
                          onDelete={() => {}}
                          quests={quests}
                          setQuests={setQuests}
                          user={user}
                          setUser={setUser}
                          hideActions={true}
                          calendarDate={selectedDate}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">📅</div>
                      <p className="text-muted-foreground text-sm">
                        No quests for this date
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-3"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Quest
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🗓️</div>
                  <h3 className="font-semibold mb-2">Select a Date</h3>
                  <p className="text-muted-foreground text-sm">
                    Click on any date to view quests and manage your schedule
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Legend</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm">Daily</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm">Weekends</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Weekly/Other</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateQuestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        editingQuest={null}
        quests={quests}
        setQuests={setQuests}
      />
    </div>
  );
}