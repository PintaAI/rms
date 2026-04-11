"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/get-session";

// Types
export type Toko = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
};

// Validation schemas
const createTokoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

const updateTokoSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required").optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

// READ - Get all Toko (filtered by user's toko)
export async function getAllToko(): Promise<{
  success: boolean;
  data?: Toko[];
  error?: string;
}> {
  try {
    const sessionUser = await getUser();
    
    if (!sessionUser) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Fetch the user's tokoId from database
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { tokoId: true, role: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Admin (tokoId is null) can see all toko
    // Staff/technician can only see their own toko
    const tokoList = await prisma.toko.findMany({
      where: user.tokoId ? { id: user.tokoId } : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: tokoList,
    };
  } catch (error) {
    console.error("Error fetching toko:", error);
    return {
      success: false,
      error: "Failed to fetch toko data",
    };
  }
}

// READ - Get Toko by ID
export async function getTokoById(id: string): Promise<{
  success: boolean;
  data?: Toko;
  error?: string;
}> {
  try {
    const toko = await prisma.toko.findUnique({
      where: { id },
    });

    if (!toko) {
      return {
        success: false,
        error: "Toko not found",
      };
    }

    return {
      success: true,
      data: toko,
    };
  } catch (error) {
    console.error("Error fetching toko:", error);
    return {
      success: false,
      error: "Failed to fetch toko data",
    };
  }
}

// CREATE - Create new Toko
export async function createToko(
  data: z.infer<typeof createTokoSchema>
): Promise<{
  success: boolean;
  data?: Toko;
  error?: string;
}> {
  try {
    const validatedData = createTokoSchema.parse(data);

    const toko = await prisma.toko.create({
      data: {
        name: validatedData.name,
        address: validatedData.address || null,
        phone: validatedData.phone || null,
        status: validatedData.status || "active",
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: toko,
    };
  } catch (error) {
    console.error("Error creating toko:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }
    return {
      success: false,
      error: "Failed to create toko",
    };
  }
}

// UPDATE - Update Toko
export async function updateToko(
  data: z.infer<typeof updateTokoSchema>
): Promise<{
  success: boolean;
  data?: Toko;
  error?: string;
}> {
  try {
    const validatedData = updateTokoSchema.parse(data);
    const { id, ...updateData } = validatedData;

    // Check if toko exists
    const existingToko = await prisma.toko.findUnique({
      where: { id },
    });

    if (!existingToko) {
      return {
        success: false,
        error: "Toko not found",
      };
    }

    const toko = await prisma.toko.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: toko,
    };
  } catch (error) {
    console.error("Error updating toko:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }
    return {
      success: false,
      error: "Failed to update toko",
    };
  }
}

// DELETE - Delete Toko
export async function deleteToko(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Check if toko exists
    const existingToko = await prisma.toko.findUnique({
      where: { id },
    });

    if (!existingToko) {
      return {
        success: false,
        error: "Toko not found",
      };
    }

    await prisma.toko.delete({
      where: { id },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting toko:", error);
    return {
      success: false,
      error: "Failed to delete toko",
    };
  }
}