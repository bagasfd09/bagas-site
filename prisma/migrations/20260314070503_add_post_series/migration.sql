-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "series" TEXT,
ADD COLUMN     "seriesOrder" INTEGER DEFAULT 0;
