import { prisma } from "@/lib/prisma";
import { VehicleStatus } from "@/../generated/prisma/browser";

// Helper to generate dates relative to today
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clean existing tables
  await prisma.actionLog.deleteMany();
  await prisma.vehicle.deleteMany();

  // 1. Seed Fresh Vehicles (<= 90 days in stock)
  const freshVehicles = [
    {
      vin: "1HGCR2F83HA000101",
      make: "Honda",
      model: "Accord",
      year: 2024,
      price: 28500.0,
      receivedDate: daysAgo(15),
      status: VehicleStatus.IN_STOCK,
    },
    {
      vin: "4T1B11HK5JU000102",
      make: "Toyota",
      model: "Camry",
      year: 2024,
      price: 27200.0,
      receivedDate: daysAgo(42),
      status: VehicleStatus.IN_STOCK,
    },
    {
      vin: "1FA6P8CF0R5000103",
      make: "Ford",
      model: "Mustang",
      year: 2023,
      price: 36400.0,
      receivedDate: daysAgo(75),
      status: VehicleStatus.IN_STOCK,
    },
  ];

  for (const v of freshVehicles) {
    await prisma.vehicle.create({ data: v });
  }

  // 2. Seed Aging Vehicles (> 90 days in stock) with Action History
  const agingVehicle1 = await prisma.vehicle.create({
    data: {
      vin: "WAUZZZ8K9FA000201",
      make: "Audi",
      model: "A4",
      year: 2022,
      price: 34000.0,
      receivedDate: daysAgo(115), // ~115 days aging
      status: VehicleStatus.IN_STOCK,
      actionLogs: {
        create: [
          {
            action: "Price Reduction Planned",
            notes: "Discounted asking price by $1,500 due to slow foot traffic.",
            createdById: "mgr_demo_101",
            createdAt: daysAgo(20),
          },
          {
            action: "Moved to Display Front",
            notes: "Repositioned vehicle near main showroom entrance.",
            createdById: "mgr_demo_101",
            createdAt: daysAgo(5),
          },
        ],
      },
    },
  });

  const agingVehicle2 = await prisma.vehicle.create({
    data: {
      vin: "5YJ3E1EA7JF000202",
      make: "Tesla",
      model: "Model 3",
      year: 2022,
      price: 31500.0,
      receivedDate: daysAgo(140), // ~140 days aging
      status: VehicleStatus.IN_STOCK,
      actionLogs: {
        create: [
          {
            action: "Send to Wholesale Auction",
            notes: "Vehicle reached 140 days limit; scheduled for Tuesday auction.",
            createdById: "mgr_smith_402",
            createdAt: daysAgo(2),
          },
        ],
      },
    },
  });

  const agingVehicle3 = await prisma.vehicle.create({
    data: {
      vin: "JN1AZ4EH4DM000203",
      make: "Nissan",
      model: "Altima",
      year: 2021,
      price: 19800.0,
      receivedDate: daysAgo(98), // ~98 days aging
      status: VehicleStatus.IN_STOCK,
    },
  });

  console.log("✅ Seeding complete!");
  console.log(`Created 3 fresh vehicles and 3 aging vehicles:`);
  console.log(` - Audi A4 ID: ${agingVehicle1.id}`);
  console.log(` - Tesla Model 3 ID: ${agingVehicle2.id}`);
  console.log(` - Nissan Altima ID: ${agingVehicle3.id}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
