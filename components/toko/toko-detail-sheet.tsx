"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTokoById } from "@/actions/toko";
import { AddUserForm } from "@/components/add-user-form";
import { UserList } from "@/components/user-list";
import { RiStore2Line, RiTeamLine, RiToolsLine, RiLoader4Line } from "@remixicon/react";
import type { Toko } from "@/actions/toko";

interface TokoDetailSheetProps {
  tokoId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TokoDetailSheet({ tokoId, open, onOpenChange }: TokoDetailSheetProps) {
  const [toko, setToko] = useState<Toko | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchToko() {
      if (tokoId && open) {
        setIsLoading(true);
        const result = await getTokoById(tokoId);
        if (result.success && result.data) {
          setToko(result.data);
        }
        setIsLoading(false);
      }
    }
    fetchToko();
  }, [tokoId, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto px-4" showCloseButton={false}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RiLoader4Line className="w-6 h-6 animate-spin" />
          </div>
        ) : toko ? (
          <>
            <SheetHeader className="p-4">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <RiStore2Line className="w-5 h-5" />
                {toko.name}
              </SheetTitle>
              <SheetDescription className="text-sm">
                Manage staff and technicians for this toko
              </SheetDescription>
            </SheetHeader>
        
              <Tabs defaultValue="staff" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="staff" className="flex items-center">
                    <RiTeamLine className="w-4 h-4" />
                    Staff
                  </TabsTrigger>
                  <TabsTrigger value="technician" className="flex items-center ">
                    <RiToolsLine className="w-4 h-4" />
                    Technicians
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="staff" className="mt-2 space-y-2">
                  <AddUserForm tokoId={toko.id} role="staff" />
                  <UserList tokoId={toko.id} role="staff" />
                </TabsContent>
                <TabsContent value="technician" className="mt-4 space-y-4">
                  <AddUserForm tokoId={toko.id} role="technician" />
                  <UserList tokoId={toko.id} role="technician" />
                </TabsContent>
              </Tabs>
           
          </>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No toko selected
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}