-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('IN_STOCK', 'RESERVED', 'SOLD');

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "vin" VARCHAR(17) NOT NULL,
    "make" VARCHAR(50) NOT NULL,
    "model" VARCHAR(50) NOT NULL,
    "year" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "received_date" TIMESTAMP(3) NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'IN_STOCK',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_logs" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "notes" TEXT,
    "created_by_id" VARCHAR(50) DEFAULT 'mgr_demo_101',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "vehicles"("vin");

-- CreateIndex
CREATE INDEX "idx_vehicle_make_model" ON "vehicles"("make", "model");

-- CreateIndex
CREATE INDEX "idx_vehicle_received_date" ON "vehicles"("received_date");

-- CreateIndex
CREATE INDEX "idx_action_vehicle_created" ON "action_logs"("vehicle_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "action_logs" ADD CONSTRAINT "action_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
