import "dotenv/config";
import prisma from "../lib/prisma";
import { hashPassword } from "@better-auth/utils/password";

async function main() {
  await prisma.notificationLog.deleteMany({});
  await prisma.serviceLog.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.serviceItem.deleteMany({});
  await prisma.sparepartCompatibility.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.verification.deleteMany({});
  await prisma.userToko.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.sparepart.deleteMany({});
  await prisma.servicePricelist.deleteMany({});
  await prisma.toko.deleteMany({});
  await prisma.user.deleteMany({});

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

    await prisma.account.create({
      data: {
        id: `${user.id}-account`,
        accountId: user.id,
        providerId: "credential",
        userId: createdUser.id,
        password: hashedPassword,
      },
    });

    if (user.role === "admin") {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: "free",
        },
      });
    }

    console.log(`Created ${user.role}: ${user.email} (password: ${user.password})`);
  }

  const toko = await prisma.toko.create({
    data: {
      id: "toko-001",
      name: "Main Store",
      address: "123 Main Street",
      phone: "+1234567890",
      status: "active",
    },
  });

  console.log(`Created toko: ${toko.name}`);

  await prisma.userToko.createMany({
    data: [
      { userId: "admin-001", tokoId: toko.id, role: "owner" },
      { userId: "staff-001", tokoId: toko.id, role: "owner" },
      { userId: "technician-001", tokoId: toko.id, role: "owner" },
    ],
  });

  console.log("Assigned users to toko");

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