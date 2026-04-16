import "dotenv/config";
import prisma from "../lib/prisma";

async function main() {
  const initialAdminId = process.env.INITIAL_ADMIN_ID;

  if (!initialAdminId) {
    console.error("ERROR: INITIAL_ADMIN_ID env var is required");
    console.error("Set it in .env or run with: INITIAL_ADMIN_ID=xxx tsx prisma/assign-tokos.ts");
    process.exit(1);
  }

  const admin = await prisma.user.findUnique({
    where: { id: initialAdminId },
    select: { id: true, role: true },
  });

  if (!admin) {
    console.error(`ERROR: Admin user with id "${initialAdminId}" not found`);
    process.exit(1);
  }

  if (admin.role !== "admin") {
    console.error(`ERROR: User "${initialAdminId}" is not an admin (role: ${admin.role})`);
    process.exit(1);
  }

  const allTokos = await prisma.toko.findMany({
    select: { id: true, name: true },
  });

  if (allTokos.length === 0) {
    console.log("No tokos found to assign");
    return;
  }

  console.log(`Found ${allTokos.length} tokos to assign to admin ${initialAdminId}`);

  const existingAssignments = await prisma.userToko.findMany({
    where: { userId: initialAdminId },
    select: { tokoId: true },
  });

  const assignedTokoIds = new Set(existingAssignments.map((a) => a.tokoId));
  const tokosToAssign = allTokos.filter((t) => !assignedTokoIds.has(t.id));

  if (tokosToAssign.length === 0) {
    console.log("Admin already has access to all tokos");
    return;
  }

  await prisma.userToko.createMany({
    data: tokosToAssign.map((toko) => ({
      userId: initialAdminId,
      tokoId: toko.id,
      role: "owner",
    })),
    skipDuplicates: true,
  });

  console.log(`Assigned ${tokosToAssign.length} tokos to admin ${initialAdminId}:`);
  tokosToAssign.forEach((t) => console.log(`  - ${t.name} (${t.id})`));

  const subscription = await prisma.subscription.findUnique({
    where: { userId: initialAdminId },
  });

  if (!subscription) {
    await prisma.subscription.create({
      data: {
        userId: initialAdminId,
        plan: "free",
      },
    });
    console.log(`Created free subscription for admin ${initialAdminId}`);
  }

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });