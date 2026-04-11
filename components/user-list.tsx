"use client";

import { useEffect, useState } from "react";
import { getUsersByToko, removeUserFromToko } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { RiLoader4Line, RiDeleteBinLine, RiUserLine } from "@remixicon/react";
import type { User } from "@/actions/user";

interface UserListProps {
  tokoId: string;
  role: "staff" | "technician";
}

export function UserList({ tokoId, role }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchUsers() {
    setIsLoading(true);
    const result = await getUsersByToko(tokoId);
    if (result.success && result.data) {
      setUsers(role === "staff" ? result.data.staff : result.data.technicians);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, [tokoId, role]);

  async function handleDelete(userId: string) {
    if (!confirm(`Are you sure you want to remove this ${role}?`)) {
      return;
    }
    setDeletingId(userId);
    const result = await removeUserFromToko(userId);
    if (result.success) {
      await fetchUsers();
    }
    setDeletingId(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RiLoader4Line className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8 border rounded-lg">
        <RiUserLine className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No {role}s added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium">
        {role === "staff" ? "Staff" : "Technicians"} ({users.length})
      </h3>
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(user.id)}
              disabled={deletingId === user.id}
              className="text-destructive hover:text-destructive"
            >
              {deletingId === user.id ? (
                <RiLoader4Line className="w-4 h-4 animate-spin" />
              ) : (
                <RiDeleteBinLine className="w-4 h-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}