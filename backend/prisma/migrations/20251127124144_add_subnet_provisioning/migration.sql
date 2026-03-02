-- CreateEnum
CREATE TYPE "SubnetStatus" AS ENUM ('DRAFT', 'CREATING', 'DEPLOYING', 'RUNNING', 'FAILED');

-- CreateEnum
CREATE TYPE "TargetNetwork" AS ENUM ('LOCAL', 'DEVNET', 'TESTNET', 'MAINNET');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateEnum
CREATE TYPE "SubnetOperationType" AS ENUM ('CREATE', 'DEPLOY', 'DESTROY');

-- CreateEnum
CREATE TYPE "SubnetOperationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Validator" ADD COLUMN     "subnetId" TEXT;

-- CreateTable
CREATE TABLE "Subnet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vmType" TEXT NOT NULL,
    "status" "SubnetStatus" NOT NULL DEFAULT 'DRAFT',
    "network" "TargetNetwork" NOT NULL DEFAULT 'LOCAL',
    "config" JSONB NOT NULL,
    "subnetId" TEXT,
    "chainId" TEXT,
    "rpcUrl" TEXT,
    "cliVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subnet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubnetLog" (
    "id" TEXT NOT NULL,
    "subnetId" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubnetLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubnetOperation" (
    "id" TEXT NOT NULL,
    "subnetId" TEXT NOT NULL,
    "type" "SubnetOperationType" NOT NULL,
    "status" "SubnetOperationStatus" NOT NULL DEFAULT 'PENDING',
    "log" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SubnetOperation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Validator" ADD CONSTRAINT "Validator_subnetId_fkey" FOREIGN KEY ("subnetId") REFERENCES "Subnet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubnetLog" ADD CONSTRAINT "SubnetLog_subnetId_fkey" FOREIGN KEY ("subnetId") REFERENCES "Subnet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubnetOperation" ADD CONSTRAINT "SubnetOperation_subnetId_fkey" FOREIGN KEY ("subnetId") REFERENCES "Subnet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
