import { useState } from "react";
import { Edit2, Save, X } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@shared/schema";

export function ProfileView() {
  const { toast } = useToast();
  const [user, setUser] = useLocalStorage<User>("user", {} as User);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNickname, setEditedNickname] = useState(user.nickname || "Hero");

  const handleSaveNickname = () => {
    if (editedNickname.trim() === "") {
      toast({
        title: "Invalid Nickname",
        description: "Nickname cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setUser(prev => ({
      ...prev,
      nickname: editedNickname.trim(),
    }));

    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your nickname has been updated successfully.",
    });
  };

  const handleCancelEdit = () => {
    setEditedNickname(user.nickname || "Hero");
    setIsEditing(false);
  };

  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const userLevel = Math.floor((user.xp || 0) / 1000) + 1;
  const xpToNextLevel = 1000 - ((user.xp || 0) % 1000);
  const levelProgress = ((user.xp || 0) % 1000) / 1000 * 100;

  return (
    <div className="profile-view">
      <h3 className="text-lg font-semibold text-foreground mb-6">Profile Settings</h3>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl p-6 shadow-sm mb-8">
        <div className="flex items-center space-x-6">
          {/* Avatar */}
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center">
            <span className="text-3xl text-white font-bold">
              {(user.nickname || "Hero").charAt(0).toUpperCase()}
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={editedNickname}
                    onChange={(e) => setEditedNickname(e.target.value)}
                    className="max-w-xs"
                    maxLength={20}
                  />
                  <Button size="sm" onClick={handleSaveNickname}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold text-slate-800">{user.nickname || "Hero"}</h2>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
              <span>Level {userLevel}</span>
              <span>•</span>
              <span>{xpToNextLevel} XP to next level</span>
            </div>

            {/* Level Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-primary-dark h-2 rounded-full transition-all duration-300"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold text-primary mb-2">{user.totalTasksCompleted || 0}</div>
          <p className="text-sm text-slate-600">Tasks Completed</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold text-accent mb-2">{(user.totalCoinsEarned || 0).toLocaleString()}</div>
          <p className="text-sm text-slate-600">Coins Earned</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold text-red-500 mb-2">{user.streak || 0}</div>
          <p className="text-sm text-slate-600">Current Streak</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <div className="text-3xl font-bold text-purple mb-2">{(user.xp || 0).toLocaleString()}</div>
          <p className="text-sm text-slate-600">Total XP</p>
        </div>
      </div>

      {/* Account Management */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h4 className="font-semibold text-slate-800 mb-4">Account Management</h4>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-slate-600">User ID</Label>
            <p className="text-sm font-mono text-slate-800 bg-slate-50 p-2 rounded mt-1">
              {user.createdAt ? user.createdAt.split('T')[0] : "N/A"}
            </p>
          </div>
          
          <div>
            <Label className="text-sm text-slate-600">Account Created</Label>
            <p className="text-sm text-slate-800 mt-1">
              {user.createdAt 
                ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : "Unknown"
              }
            </p>
          </div>

          <div className="pt-4 border-t">
            <Button 
              variant="destructive" 
              onClick={handleClearAllData}
              className="w-full"
            >
              Clear All Data
            </Button>
            <p className="text-xs text-slate-500 mt-2 text-center">
              This will permanently delete all quests, rewards, and progress data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
