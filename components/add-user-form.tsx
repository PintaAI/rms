"use client";

import { useState } from "react";
import { addUserToToko, searchUserByEmail, assignUserToToko } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RiUserAddLine, RiLoader4Line, RiSearchLine } from "@remixicon/react";

interface AddUserFormProps {
  tokoId: string;
  role: "staff" | "technician";
}

export function AddUserForm({ tokoId, role }: AddUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Search state
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    tokoIds: string[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const result = await addUserToToko({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: role,
      tokoId: tokoId,
    });

    setIsLoading(false);

    if (result.success) {
      setSuccess(true);
      // Reset form
      const form = document.getElementById(`add-${role}-form`) as HTMLFormElement;
      form?.reset();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || `Failed to add ${role}`);
    }
  }

  async function handleSearch() {
    if (!searchEmail.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);

    const result = await searchUserByEmail(searchEmail.trim());

    setIsSearching(false);

    if (result.success && result.data) {
      setSearchResult(result.data);
    } else {
      setSearchError(result.error || "User not found");
    }
  }

  async function handleAssign() {
    if (!searchResult) return;

    setIsAssigning(true);
    setSearchError(null);

    const result = await assignUserToToko({
      userId: searchResult.id,
      tokoId: tokoId,
      role: role,
    });

    setIsAssigning(false);

    if (result.success) {
      setSuccess(true);
      setSearchResult(null);
      setSearchEmail("");
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setSearchError(result.error || "Failed to assign user");
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-medium flex items-center gap-2">
        <RiUserAddLine className="w-4 h-4" />
        Add {role === "staff" ? "Staff" : "Technician"}
      </h3>

      {/* Search existing user section */}
      <div className="space-y-2 pb-4 border-b">
        <Label className="text-sm text-muted-foreground">Search existing user by email</Label>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter email to search"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            disabled={isSearching}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleSearch}
            disabled={isSearching || !searchEmail.trim()}
          >
            {isSearching ? (
              <RiLoader4Line className="w-4 h-4 animate-spin" />
            ) : (
              <RiSearchLine className="w-4 h-4" />
            )}
          </Button>
        </div>

        {searchError && (
          <div className="text-sm text-destructive">{searchError}</div>
        )}

        {searchResult && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <div className="font-medium">{searchResult.name}</div>
              <div className="text-sm text-muted-foreground">{searchResult.email}</div>
              {searchResult.tokoIds.length > 0 ? (
                <div className="text-xs text-amber-600">Already assigned to a toko</div>
              ) : (
                <div className="text-xs text-green-600">Available to assign</div>
              )}
            </div>
            {searchResult.tokoIds.length === 0 && (
              <Button
                size="sm"
                onClick={handleAssign}
                disabled={isAssigning}
              >
                {isAssigning ? (
                  <RiLoader4Line className="w-4 h-4 animate-spin" />
                ) : (
                  "Assign"
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create new user form */}
      <div className="text-sm text-muted-foreground">Or create a new user</div>
      <form id={`add-${role}-form`} action={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor={`${role}-name`}>Name</Label>
          <Input
            id={`${role}-name`}
            name="name"
            placeholder="Enter name"
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${role}-email`}>Email</Label>
          <Input
            id={`${role}-email`}
            name="email"
            type="email"
            placeholder="Enter email"
            required
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${role}-password`}>Password</Label>
          <Input
            id={`${role}-password`}
            name="password"
            type="password"
            placeholder="Enter password"
            required
            disabled={isLoading}
          />
        </div>
        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}
        {success && (
          <div className="text-sm text-green-600">
            {role === "staff" ? "Staff" : "Technician"} added successfully!
          </div>
        )}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <RiLoader4Line className="w-4 h-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            `Add ${role === "staff" ? "Staff" : "Technician"}`
          )}
        </Button>
      </form>
    </div>
  );
}