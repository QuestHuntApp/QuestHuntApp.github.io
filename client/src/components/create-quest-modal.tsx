import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { insertQuestSchema, type InsertQuest, type Quest, type Subquest } from "@shared/schema";
import { nanoid } from "nanoid";

interface CreateQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingQuest?: Quest | null;
  quests: Quest[];
  setQuests: (quests: Quest[]) => void;
}

export function CreateQuestModal({ isOpen, onClose, editingQuest, quests, setQuests }: CreateQuestModalProps) {
  const { toast } = useToast();
  const [subquests, setSubquests] = useState<Subquest[]>([]);
  const [newSubquestTitle, setNewSubquestTitle] = useState("");

  const today = new Date().toISOString().split('T')[0];
  const defaultDueTime = "23:59";

  const form = useForm<InsertQuest>({
    resolver: zodResolver(insertQuestSchema),
    defaultValues: {
      title: editingQuest?.title || "",
      description: editingQuest?.description || "",
      type: editingQuest?.type || "once",
      priority: editingQuest?.priority || "medium",
      coinReward: editingQuest?.coinReward || 50,
      targetCount: editingQuest?.targetCount || 1,
      startDate: editingQuest?.startDate || today,
      dueTime: editingQuest?.dueTime || defaultDueTime,
      customDays: editingQuest?.customDays || [],
      subquests: editingQuest?.subquests || [],
    },
  });

  const questType = form.watch("type");

  const addSubquest = () => {
    if (newSubquestTitle.trim()) {
      const newSubquest: Subquest = {
        id: nanoid(),
        title: newSubquestTitle.trim(),
        completed: false,
      };
      setSubquests([...subquests, newSubquest]);
      setNewSubquestTitle("");
    }
  };

  const removeSubquest = (id: string) => {
    setSubquests(subquests.filter(sq => sq.id !== id));
  };

  const onSubmit = (data: InsertQuest) => {
    const questData = {
      ...data,
      subquests,
      targetCount: data.type === "count" ? data.targetCount : undefined,
      customDays: data.type === "custom" ? data.customDays : undefined,
    };

    if (editingQuest) {
      // Update existing quest
      const updatedQuests = quests.map(quest => 
        quest.id === editingQuest.id 
          ? { ...quest, ...questData }
          : quest
      );
      setQuests(updatedQuests);
      toast({
        title: "Quest Updated",
        description: "Your quest has been successfully updated.",
      });
    } else {
      // Create new quest
      const newQuest: Quest = {
        ...questData,
        id: nanoid(),
        status: "active",
        currentCount: 0,
        createdAt: new Date().toISOString(),
        pointsDeducted: false,
      };
      const updatedQuests = [...quests, newQuest];
      setQuests(updatedQuests);
      toast({
        title: "Quest Created",
        description: "Your new quest has been added to your list.",
      });
    }
    
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    setSubquests([]);
    setNewSubquestTitle("");
    onClose();
  };

  // Reset subquests when modal opens/closes or editing quest changes
  useEffect(() => {
    if (isOpen) {
      // Only set subquests if editing an existing quest
      setSubquests(editingQuest?.subquests || []);
      // Reset form values when editing quest changes
      form.reset({
        title: editingQuest?.title || "",
        description: editingQuest?.description || "",
        type: editingQuest?.type || "once",
        priority: editingQuest?.priority || "medium",
        coinReward: editingQuest?.coinReward || 50,
        targetCount: editingQuest?.targetCount || 1,
        startDate: today,
        dueTime: editingQuest?.dueTime || defaultDueTime,
        customDays: editingQuest?.customDays || [],
        subquests: editingQuest?.subquests || [],
      });
    } else {
      // Clear subquests when modal closes
      setSubquests([]);
    }
  }, [isOpen, editingQuest, form, today, defaultDueTime]);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto mx-3">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {editingQuest ? "Edit Quest" : "Create New Quest"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quest Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your quest title..." {...field} />
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
                      placeholder="Describe your quest..." 
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quest Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quest type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="once">One-time</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="weekends">Weekends</SelectItem>
                        <SelectItem value="weekdays">Weekdays</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="custom">Custom Days</SelectItem>
                        <SelectItem value="count">Count-based</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {questType === "custom" && (
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
                            id={`day-${index}`}
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
                          <label htmlFor={`day-${index}`} className="text-sm">{day}</label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="coinReward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coin Reward</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="1000" 
                        placeholder="50" 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {questType === "count" && (
                <FormField
                  control={form.control}
                  name="targetCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Count</FormLabel>
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
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Subquests Section */}
            <div className="space-y-3">
              <FormLabel>Subquests (Optional)</FormLabel>
              {subquests.length > 0 && (
                <div className="space-y-2">
                  {subquests.map((subquest) => (
                    <div key={subquest.id} className="flex items-center justify-between bg-muted p-2 rounded-lg">
                      <span className="text-sm">{subquest.title}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSubquest(subquest.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a subquest..."
                  value={newSubquestTitle}
                  onChange={(e) => setNewSubquestTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubquest())}
                />
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={(e) => {
                    e.preventDefault();
                    addSubquest();
                  }}
                  disabled={!newSubquestTitle.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-primary-dark">
                {editingQuest ? "Update Quest" : "Create Quest"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
