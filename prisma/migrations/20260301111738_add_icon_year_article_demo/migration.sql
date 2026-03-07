-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "icon" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "articleUrl" TEXT,
ADD COLUMN     "demoUrl" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "year" INTEGER;
