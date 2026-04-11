"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/get-session";

// Types
export type Sparepart = {
  id: string;
  name: string;
  defaultPrice: number;
  isUniversal: boolean;
  tokoId: string;
};

export type ServicePricelist = {
  id: string;
  title: string;
  defaultPrice: number;
  tokoId: string;
};

export type SparepartWithCompatibilities = Sparepart & {
  compatibilities: Array<{
    hpCatalogId: string;
    hpCatalog: {
      id: string;
      modelName: string;
      brand: {
        name: string;
      };
    };
  }>;
};

// Validation schemas
const createSparepartSchema = z.object({
  name: z.string().min(1, "Name is required"),
  defaultPrice: z.number().int().min(0, "Price must be 0 or greater"),
  isUniversal: z.boolean().optional(),
  tokoId: z.string(),
});

const updateSparepartSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required").optional(),
  defaultPrice: z.number().int().min(0, "Price must be 0 or greater").optional(),
  isUniversal: z.boolean().optional(),
});

const createServicePricelistSchema = z.object({
  title: z.string().min(1, "Title is required"),
  defaultPrice: z.number().int().min(0, "Price must be 0 or greater"),
  tokoId: z.string(),
});

const updateServicePricelistSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required").optional(),
  defaultPrice: z.number().int().min(0, "Price must be 0 or greater").optional(),
});

// =====================
// SPAREPART ACTIONS
// =====================

// Get all spareparts for a toko
export async function getSpareparts(tokoId: string): Promise<{
  success: boolean;
  data?: SparepartWithCompatibilities[];
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Check authorization
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { tokoId: true, role: true },
    });

    if (!user || (user.role !== "admin" && user.tokoId !== tokoId)) {
      return { success: false, error: "You don't have permission to view this data" };
    }

    const spareparts = await prisma.sparepart.findMany({
      where: { tokoId },
      include: {
        compatibilities: {
          include: {
            hpCatalog: {
              include: {
                brand: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return { success: true, data: spareparts };
  } catch (error) {
    console.error("Error fetching spareparts:", error);
    return { success: false, error: "Failed to fetch spareparts" };
  }
}

// Create a new sparepart
export async function createSparepart(data: z.infer<typeof createSparepartSchema>): Promise<{
  success: boolean;
  data?: Sparepart;
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Check authorization
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { tokoId: true, role: true },
    });

    if (!user || (user.role !== "admin" && user.tokoId !== data.tokoId)) {
      return { success: false, error: "You don't have permission to create spareparts" };
    }

    const validatedData = createSparepartSchema.parse(data);

    // Check if sparepart with same name already exists in this toko
    const existing = await prisma.sparepart.findFirst({
      where: { tokoId: validatedData.tokoId, name: validatedData.name },
    });

    if (existing) {
      return { success: false, error: "Sparepart with this name already exists" };
    }

    const sparepart = await prisma.sparepart.create({
      data: {
        name: validatedData.name,
        defaultPrice: validatedData.defaultPrice,
        isUniversal: validatedData.isUniversal ?? false,
        tokoId: validatedData.tokoId,
      },
    });

    revalidatePath("/dashboard/admin/gudang");
    return { success: true, data: sparepart };
  } catch (error) {
    console.error("Error creating sparepart:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to create sparepart" };
  }
}

// Update a sparepart
export async function updateSparepart(data: z.infer<typeof updateSparepartSchema>): Promise<{
  success: boolean;
  data?: Sparepart;
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = updateSparepartSchema.parse(data);

    // Get the sparepart and check authorization
    const sparepart = await prisma.sparepart.findUnique({
      where: { id: validatedData.id },
      select: { tokoId: true },
    });

    if (!sparepart) {
      return { success: false, error: "Sparepart not found" };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { tokoId: true, role: true },
    });

    if (!user || (user.role !== "admin" && user.tokoId !== sparepart.tokoId)) {
      return { success: false, error: "You don't have permission to update this sparepart" };
    }

    // If name is being updated, check for duplicates
    if (validatedData.name) {
      const existing = await prisma.sparepart.findFirst({
        where: {
          tokoId: sparepart.tokoId,
          name: validatedData.name,
          id: { not: validatedData.id },
        },
      });

      if (existing) {
        return { success: false, error: "Sparepart with this name already exists" };
      }
    }

    const updatedSparepart = await prisma.sparepart.update({
      where: { id: validatedData.id },
      data: {
        name: validatedData.name,
        defaultPrice: validatedData.defaultPrice,
        isUniversal: validatedData.isUniversal,
      },
    });

    revalidatePath("/dashboard/admin/gudang");
    return { success: true, data: updatedSparepart };
  } catch (error) {
    console.error("Error updating sparepart:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to update sparepart" };
  }
}

// Delete a sparepart
export async function deleteSparepart(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the sparepart and check authorization
    const sparepart = await prisma.sparepart.findUnique({
      where: { id },
      select: { tokoId: true },
    });

    if (!sparepart) {
      return { success: false, error: "Sparepart not found" };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { tokoId: true, role: true },
    });

    if (!user || (user.role !== "admin" && user.tokoId !== sparepart.tokoId)) {
      return { success: false, error: "You don't have permission to delete this sparepart" };
    }

    // Check if sparepart is used in any service items
    const usedInServices = await prisma.serviceItem.findFirst({
      where: { referenceId: id },
    });

    if (usedInServices) {
      return { success: false, error: "Cannot delete sparepart that is used in services" };
    }

    await prisma.sparepart.delete({ where: { id } });

    revalidatePath("/dashboard/admin/gudang");
    return { success: true };
  } catch (error) {
    console.error("Error deleting sparepart:", error);
    return { success: false, error: "Failed to delete sparepart" };
  }
}

// =====================
// SERVICE PRICELIST ACTIONS
// =====================

// Get all service pricelists for a toko
export async function getServicePricelists(tokoId: string): Promise<{
  success: boolean;
  data?: ServicePricelist[];
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Check authorization
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { tokoId: true, role: true },
    });

    if (!user || (user.role !== "admin" && user.tokoId !== tokoId)) {
      return { success: false, error: "You don't have permission to view this data" };
    }

    const pricelists = await prisma.servicePricelist.findMany({
      where: { tokoId },
      orderBy: { title: "asc" },
    });

    return { success: true, data: pricelists };
  } catch (error) {
    console.error("Error fetching service pricelists:", error);
    return { success: false, error: "Failed to fetch service pricelists" };
  }
}

// Create a new service pricelist
export async function createServicePricelist(data: z.infer<typeof createServicePricelistSchema>): Promise<{
  success: boolean;
  data?: ServicePricelist;
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Check authorization
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { tokoId: true, role: true },
    });

    if (!user || (user.role !== "admin" && user.tokoId !== data.tokoId)) {
      return { success: false, error: "You don't have permission to create service pricelists" };
    }

    const validatedData = createServicePricelistSchema.parse(data);

    // Check if pricelist with same title already exists in this toko
    const existing = await prisma.servicePricelist.findFirst({
      where: { tokoId: validatedData.tokoId, title: validatedData.title },
    });

    if (existing) {
      return { success: false, error: "Service pricelist with this title already exists" };
    }

    const pricelist = await prisma.servicePricelist.create({
      data: {
        title: validatedData.title,
        defaultPrice: validatedData.defaultPrice,
        tokoId: validatedData.tokoId,
      },
    });

    revalidatePath("/dashboard/admin/gudang");
    return { success: true, data: pricelist };
  } catch (error) {
    console.error("Error creating service pricelist:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to create service pricelist" };
  }
}

// Update a service pricelist
export async function updateServicePricelist(data: z.infer<typeof updateServicePricelistSchema>): Promise<{
  success: boolean;
  data?: ServicePricelist;
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    const validatedData = updateServicePricelistSchema.parse(data);

    // Get the pricelist and check authorization
    const pricelist = await prisma.servicePricelist.findUnique({
      where: { id: validatedData.id },
      select: { tokoId: true },
    });

    if (!pricelist) {
      return { success: false, error: "Service pricelist not found" };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { tokoId: true, role: true },
    });

    if (!user || (user.role !== "admin" && user.tokoId !== pricelist.tokoId)) {
      return { success: false, error: "You don't have permission to update this service pricelist" };
    }

    // If title is being updated, check for duplicates
    if (validatedData.title) {
      const existing = await prisma.servicePricelist.findFirst({
        where: {
          tokoId: pricelist.tokoId,
          title: validatedData.title,
          id: { not: validatedData.id },
        },
      });

      if (existing) {
        return { success: false, error: "Service pricelist with this title already exists" };
      }
    }

    const updatedPricelist = await prisma.servicePricelist.update({
      where: { id: validatedData.id },
      data: {
        title: validatedData.title,
        defaultPrice: validatedData.defaultPrice,
      },
    });

    revalidatePath("/dashboard/admin/gudang");
    return { success: true, data: updatedPricelist };
  } catch (error) {
    console.error("Error updating service pricelist:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to update service pricelist" };
  }
}

// Delete a service pricelist
export async function deleteServicePricelist(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const sessionUser = await getUser();

    if (!sessionUser) {
      return { success: false, error: "Unauthorized" };
    }

    // Get the pricelist and check authorization
    const pricelist = await prisma.servicePricelist.findUnique({
      where: { id },
      select: { tokoId: true },
    });

    if (!pricelist) {
      return { success: false, error: "Service pricelist not found" };
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { tokoId: true, role: true },
    });

    if (!user || (user.role !== "admin" && user.tokoId !== pricelist.tokoId)) {
      return { success: false, error: "You don't have permission to delete this service pricelist" };
    }

    await prisma.servicePricelist.delete({ where: { id } });

    revalidatePath("/dashboard/admin/gudang");
    return { success: true };
  } catch (error) {
    console.error("Error deleting service pricelist:", error);
    return { success: false, error: "Failed to delete service pricelist" };
  }
}