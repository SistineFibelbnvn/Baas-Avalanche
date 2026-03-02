/*
  Warnings:

  - You are about to drop the column `heartbeatAt` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `rewardAddress` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `stakeStatus` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the column `subnetId` on the `Validator` table. All the data in the column will be lost.
  - You are about to drop the `Alert` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BenchmarkRun` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Metric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subnet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubnetLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubnetOperation` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[networkId,nodeId]` on the table `Validator` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `networkId` to the `Validator` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BenchmarkRun" DROP CONSTRAINT "BenchmarkRun_validatorId_fkey";

-- DropForeignKey
ALTER TABLE "Metric" DROP CONSTRAINT "Metric_runId_fkey";

-- DropForeignKey
ALTER TABLE "Metric" DROP CONSTRAINT "Metric_validatorId_fkey";

-- DropForeignKey
ALTER TABLE "SubnetLog" DROP CONSTRAINT "SubnetLog_subnetId_fkey";

-- DropForeignKey
ALTER TABLE "SubnetOperation" DROP CONSTRAINT "SubnetOperation_subnetId_fkey";

-- DropForeignKey
ALTER TABLE "Validator" DROP CONSTRAINT "Validator_subnetId_fkey";

-- DropIndex
DROP INDEX "Validator_nodeId_key";

-- AlterTable
ALTER TABLE "Validator" DROP COLUMN "heartbeatAt",
DROP COLUMN "metadata",
DROP COLUMN "name",
DROP COLUMN "rewardAddress",
DROP COLUMN "stakeStatus",
DROP COLUMN "subnetId",
ADD COLUMN     "connected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "networkId" TEXT NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3),
ADD COLUMN     "uptime" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "weight" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "stakeAmount" DROP NOT NULL,
ALTER COLUMN "stakeAmount" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "Alert";

-- DropTable
DROP TABLE "BenchmarkRun";

-- DropTable
DROP TABLE "Metric";

-- DropTable
DROP TABLE "Report";

-- DropTable
DROP TABLE "Subnet";

-- DropTable
DROP TABLE "SubnetLog";

-- DropTable
DROP TABLE "SubnetOperation";

-- DropEnum
DROP TYPE "AlertSeverity";

-- DropEnum
DROP TYPE "AlertStatus";

-- DropEnum
DROP TYPE "BenchmarkStatus";

-- DropEnum
DROP TYPE "LogLevel";

-- DropEnum
DROP TYPE "StakeStatus";

-- DropEnum
DROP TYPE "SubnetOperationStatus";

-- DropEnum
DROP TYPE "SubnetOperationType";

-- DropEnum
DROP TYPE "SubnetStatus";

-- DropEnum
DROP TYPE "TargetNetwork";

-- CreateTable
CREATE TABLE "Network" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "vmType" TEXT NOT NULL DEFAULT 'subnet-evm',
    "network" TEXT NOT NULL DEFAULT 'LOCAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "subnetId" TEXT,
    "blockchainId" TEXT,
    "rpcUrl" TEXT,
    "wsUrl" TEXT,
    "tokenSymbol" TEXT NOT NULL DEFAULT 'TOKEN',
    "tokenSupply" TEXT,
    "gasLimit" INTEGER NOT NULL DEFAULT 20000000,
    "minBaseFee" TEXT NOT NULL DEFAULT '25000000000',
    "targetBlockRate" INTEGER NOT NULL DEFAULT 2,
    "validatorType" TEXT NOT NULL DEFAULT 'poa',
    "validatorManagerOwner" TEXT,
    "ownerAddress" TEXT,
    "vmVersion" TEXT NOT NULL DEFAULT 'latest',
    "enableICM" BOOLEAN NOT NULL DEFAULT true,
    "configMode" TEXT NOT NULL DEFAULT 'test',
    "cliVersion" TEXT,
    "cliOutput" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Network_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "abi" JSONB,
    "bytecode" TEXT,
    "txHash" TEXT,
    "networkId" TEXT NOT NULL,
    "deployedBy" TEXT,
    "deployedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "log" TEXT,
    "error" TEXT,
    "networkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Benchmark" (
    "id" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "targetTps" INTEGER NOT NULL,
    "concurrency" INTEGER NOT NULL,
    "avgTps" DOUBLE PRECISION,
    "maxTps" DOUBLE PRECISION,
    "avgLatency" DOUBLE PRECISION,
    "successRate" DOUBLE PRECISION,
    "totalTx" INTEGER,
    "dataPoints" JSONB,
    "networkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Benchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "nodeHost" TEXT NOT NULL DEFAULT '127.0.0.1',
    "nodePort" INTEGER NOT NULL DEFAULT 9650,
    "nodeProtocol" TEXT NOT NULL DEFAULT 'http',
    "cliPath" TEXT NOT NULL DEFAULT 'avalanche',
    "wslDistro" TEXT DEFAULT 'Ubuntu-22.04',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Network_status_idx" ON "Network"("status");

-- CreateIndex
CREATE INDEX "Network_network_idx" ON "Network"("network");

-- CreateIndex
CREATE INDEX "Contract_networkId_idx" ON "Contract"("networkId");

-- CreateIndex
CREATE INDEX "Contract_address_idx" ON "Contract"("address");

-- CreateIndex
CREATE INDEX "Operation_networkId_idx" ON "Operation"("networkId");

-- CreateIndex
CREATE INDEX "Operation_status_idx" ON "Operation"("status");

-- CreateIndex
CREATE INDEX "Benchmark_networkId_idx" ON "Benchmark"("networkId");

-- CreateIndex
CREATE INDEX "Validator_networkId_idx" ON "Validator"("networkId");

-- CreateIndex
CREATE UNIQUE INDEX "Validator_networkId_nodeId_key" ON "Validator"("networkId", "nodeId");

-- AddForeignKey
ALTER TABLE "Validator" ADD CONSTRAINT "Validator_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "Network"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "Network"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "Network"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Benchmark" ADD CONSTRAINT "Benchmark_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "Network"("id") ON DELETE CASCADE ON UPDATE CASCADE;
