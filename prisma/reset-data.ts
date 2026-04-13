import "dotenv/config";
import prisma from "../lib/prisma";

async function main() {
  console.log("Starting data reset (preserving users, toko, and brands)...");

  // Delete in order to respect foreign key constraints
  
  // 1. Delete notification logs (depends on service)
  await prisma.notificationLog.deleteMany({});
  console.log("✓ Cleared notification_logs");

  // 2. Delete service logs (depends on service, user)
  await prisma.serviceLog.deleteMany({});
  console.log("✓ Cleared service_logs");

  // 3. Delete invoices (depends on service)
  await prisma.invoice.deleteMany({});
  console.log("✓ Cleared invoices");

  // 4. Delete service items (depends on service, sparepart)
  await prisma.serviceItem.deleteMany({});
  console.log("✓ Cleared service_items");

  // 5. Delete services (depends on hpCatalog, user)
  await prisma.service.deleteMany({});
  console.log("✓ Cleared services");

  // 6. Delete sparepart compatibilities (depends on sparepart, hpCatalog)
  await prisma.sparepartCompatibility.deleteMany({});
  console.log("✓ Cleared sparepart_compatibility");

  // 7. Delete spareparts (depends on toko)
  await prisma.sparepart.deleteMany({});
  console.log("✓ Cleared spareparts");

  // 8. Delete service pricelists (depends on toko)
  await prisma.servicePricelist.deleteMany({});
  console.log("✓ Cleared service_pricelists");

  // Note: We preserve the following:
  // - users (and related accounts, sessions)
  // - toko
  // - brands
  // - hp_catalogs
  // - verifications (auth-related)

  console.log("\n✅ Data reset completed!");
  console.log("Preserved: users, toko, brands");
}

main()
  .catch((e) => {
    console.error("Error during reset:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
