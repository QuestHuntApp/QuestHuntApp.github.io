import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { insertRewardSchema, type InsertReward, type Reward } from "@shared/schema";
import { nanoid } from "nanoid";

interface CreateRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingReward?: Reward | null;
  rewards: Reward[];
  setRewards: (rewards: Reward[]) => void;
}

export function CreateRewardModal({ isOpen, onClose, editingReward, rewards, setRewards }: CreateRewardModalProps) {
  const { toast } = useToast();

  const form = useForm<InsertReward>({
    resolver: zodResolver(insertRewardSchema),
    defaultValues: {
      title: editingReward?.title || "",
      description: editingReward?.description || "",
      cost: editingReward?.cost || 100,
      emoji: editingReward?.emoji || "🎁",
      availability: editingReward?.availability || "onetime",
      limitPerDay: editingReward?.limitPerDay || 1,
      limitPeriod: editingReward?.limitPeriod || "day",
      timerMinutes: editingReward?.timerMinutes || undefined,
      customDays: editingReward?.customDays || [],
    },
  });

  const availability = form.watch("availability");

  const emojiOptions = ["🎁", "🏆", "🍕", "🎮", "📺", "☕", "🍫", "🎬", "🎵", "📚", "🛍️", "💊", "🎯", "🎪", "🎨"];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const handleDeleteReward = () => {
    if (editingReward && window.confirm("Are you sure you want to delete this reward?")) {
      setRewards(prev => prev.filter(r => r.id !== editingReward.id));
      toast({
        title: "Reward Deleted",
        description: "The reward has been removed from your collection.",
      });
      handleClose();
    }
  };

  const onSubmit = (data: InsertReward) => {
    const rewardData = {
      ...data,
      customDays: data.availability === "custom" ? data.customDays : undefined,
    };

    if (editingReward) {
      // Update existing reward
      const updatedRewards = rewards.map(reward => 
        reward.id === editingReward.id 
          ? { ...reward, ...rewardData }
          : reward
      );
      setRewards(updatedRewards);
      toast({
        title: "Reward Updated",
        description: "Your reward has been successfully updated.",
      });
    } else {
      // Create new reward
      const newReward: Reward = {
        ...rewardData,
        id: nanoid(),
        purchased: false,
        purchaseCount: 0,
        isOnCooldown: false,
        createdAt: new Date().toISOString(),
      };
      const updatedRewards = [...rewards, newReward];
      setRewards(updatedRewards);
      toast({
        title: "Reward Created",
        description: "Your new reward has been added to your collection.",
      });
    }
    
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto mx-3">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {editingReward ? "Edit Reward" : "Create New Reward"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emoji</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select emoji" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {emojiOptions.map((emoji) => (
                        <SelectItem key={emoji} value={emoji}>
                          <span className="text-xl">{emoji}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reward Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter reward title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your reward..." 
                      className="h-20 resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost (Coins)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="10000" 
                        placeholder="100" 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timerMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timer (Minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="No time limit" 
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Availability</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="onetime">One-time</SelectItem>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                      <SelectItem value="everyday">Everyday</SelectItem>
                      <SelectItem value="weekdays">Weekdays</SelectItem>
                      <SelectItem value="weekends">Weekends</SelectItem>
                      <SelectItem value="every_other_day">Every Other Day</SelectItem>
                      <SelectItem value="every_other_week">Every Other Week</SelectItem>
                      <SelectItem value="custom">Custom Days</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {availability === "custom" && (
              <FormField
                control={form.control}
                name="customDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Days</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {dayNames.map((day, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox
                            id={`reward-day-${index}`}
                            checked={field.value?.includes(index) || false}
                            onCheckedChange={(checked) => {
                              const currentDays = field.value || [];
                              if (checked) {
                                field.onChange([...currentDays, index]);
                              } else {
                                field.onChange(currentDays.filter(d => d !== index));
                              }
                            }}
                          />
                          <label htmlFor={`reward-day-${index}`} className="text-sm">{day}</label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Limit Per Day/Period Options */}
            {(availability === "unlimited" || availability === "everyday" || availability === "weekdays" || availability === "weekends" || availability === "custom") && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="limitPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limit Per Period</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="100" 
                          placeholder="1" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="limitPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="day">Per Day</SelectItem>
                          <SelectItem value="week">Per Week</SelectItem>
                          <SelectItem value="month">Per Month</SelectItem>
                          <SelectItem value="no_limit">No Limit</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-between space-x-4 pt-4">
              <div>
                {editingReward && (
                  <Button type="button" variant="destructive" onClick={handleDeleteReward}>
                    Delete Reward
                  </Button>
                )}
              </div>
              <div className="flex space-x-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-accent to-yellow-500">
                  {editingReward ? "Update Reward" : "Create Reward"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
