"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  getTechnicianTasks,
  type TechnicianTaskItem,
} from "@/actions/dashboard";
import { ServiceTaskCard } from "@/components/technician/service-task-card";

export default function TechnicianTasksPage() {
  const [tasks, setTasks] = useState<TechnicianTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchTasks(silent = false) {
    // silent = true: background re-fetch after optimistic update,
    // do NOT show loading skeleton so cards stay mounted and
    // local optimistic state is not destroyed by unmount.
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      const result = await getTechnicianTasks();
      if (result.success && result.data) {
        setTasks(result.data);
      } else {
        setError(result.error || "Failed to load tasks");
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  // Separate tasks by status
  const activeTasks = tasks.filter((t) => t.status === "received" || t.status === "repairing");
  const completedTasks = tasks.filter((t) => t.status === "done" || t.status === "picked_up");

  // Loading state – only shown on initial load, not on silent refreshes
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse mt-2" />
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">Loading tasks...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Tasks / Servisan</h1>
        <p className="text-muted-foreground">
          Manage your assigned services, update status, and add repair items
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Tasks Tabs */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  No active tasks. Take available services from the dashboard.
                </div>
              </CardContent>
            </Card>
          ) : (
            activeTasks.map((task) => (
              <ServiceTaskCard
                key={task.id}
                task={task}
                variant="active"
                onRefresh={() => fetchTasks(true)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  No completed tasks yet
                </div>
              </CardContent>
            </Card>
          ) : (
            completedTasks.map((task) => (
              <ServiceTaskCard
                key={task.id}
                task={task}
                variant="completed"
                onRefresh={() => fetchTasks(true)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

    </div>
  );
}
