"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword } from "@better-auth/utils/password";

// Types
export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff" | "technician";
  tokoId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Validation schemas
const addUserToTokoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["staff", "technician"]),
  tokoId: z.string().min(1, "Toko ID is required"),
});

// Get users by toko ID
export async function getUsersByToko(tokoId: string): Promise<{
  success: boolean;
  data?: { staff: User[]; technicians: User[] };
  error?: string;
}> {
  try {
    const users = await prisma.user.findMany({
      where: { tokoId },
      orderBy: { createdAt: "desc" },
    });

    const staff = users.filter((u) => u.role === "staff");
    const technicians = users.filter((u) => u.role === "technician");

    return {
      success: true,
      data: { staff, technicians },
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: "Failed to fetch users",
    };
  }
}

// Add user to toko (staff or technician)
export async function addUserToToko(
  data: z.infer<typeof addUserToTokoSchema>
): Promise<{
  success: boolean;
  data?: User;
  error?: string;
}> {
  try {
    const validatedData = addUserToTokoSchema.parse(data);

    // Check if toko exists
    const toko = await prisma.toko.findUnique({
      where: { id: validatedData.tokoId },
    });

    if (!toko) {
      return {
        success: false,
        error: "Toko not found",
      };
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Email already registered",
      };
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);
    const userId = crypto.randomUUID();

    // Create user with hashed password
    const user = await prisma.user.create({
      data: {
        id: userId,
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
        tokoId: validatedData.tokoId,
      },
    });

    // Create account for better-auth
    await prisma.account.create({
      data: {
        id: `${userId}-account`,
        accountId: userId,
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("Error adding user:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }
    return {
      success: false,
      error: "Failed to add user",
    };
  }
}

// Search user by email
export async function searchUserByEmail(email: string): Promise<{
  success: boolean;
  data?: { id: string; name: string; email: string; role: string; tokoId: string | null };
  error?: string;
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tokoId: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error("Error searching user:", error);
    return {
      success: false,
      error: "Failed to search user",
    };
  }
}

// Assign existing user to toko
export async function assignUserToToko(data: {
  userId: string;
  tokoId: string;
  role: "staff" | "technician";
}): Promise<{
  success: boolean;
  data?: User;
  error?: string;
}> {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Check if user is already assigned to a toko
    if (user.tokoId) {
      return {
        success: false,
        error: "User is already assigned to a toko",
      };
    }

    // Check if toko exists
    const toko = await prisma.toko.findUnique({
      where: { id: data.tokoId },
    });

    if (!toko) {
      return {
        success: false,
        error: "Toko not found",
      };
    }

    // Update user with toko and role
    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: {
        tokoId: data.tokoId,
        role: data.role,
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error) {
    console.error("Error assigning user:", error);
    return {
      success: false,
      error: "Failed to assign user",
    };
  }
}

// Remove user from toko
export async function removeUserFromToko(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error removing user:", error);
    return {
      success: false,
      error: "Failed to remove user",
    };
  }
}