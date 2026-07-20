-- AlterTable
ALTER TABLE "PrintFormat" ADD COLUMN     "blocks" JSONB;

-- AlterTable
ALTER TABLE "SavedReport" ADD COLUMN     "chart" JSONB,
ADD COLUMN     "groupBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "parameters" JSONB,
ADD COLUMN     "sorts" JSONB;
