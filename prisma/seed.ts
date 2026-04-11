import "dotenv/config";
import prisma from "../lib/prisma";
import { hashPassword } from "@better-auth/utils/password";

async function main() {
  // Clear existing users
  await prisma.account.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.verification.deleteMany({});
  await prisma.user.deleteMany({});

  // Seed users with different roles
  const users = [
    {
      id: "admin-001",
      name: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      role: "admin" as const,
    },
    {
      id: "staff-001",
      name: "Staff User",
      email: "staff@example.com",
      password: "staff123",
      role: "staff" as const,
    },
    {
      id: "technician-001",
      name: "Technician User",
      email: "technician@example.com",
      password: "technician123",
      role: "technician" as const,
    },
  ];

  for (const user of users) {
    const hashedPassword = await hashPassword(user.password);

    // Create user
    const createdUser = await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        emailVerified: true,
      },
    });

    // Create account for better-auth
    await prisma.account.create({
      data: {
        id: `${user.id}-account`,
        accountId: user.id,
        providerId: "credential",
        userId: createdUser.id,
        password: hashedPassword,
      },
    });

    console.log(`Created ${user.role}: ${user.email} (password: ${user.password})`);
  }

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });