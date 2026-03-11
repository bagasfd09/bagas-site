-- AlterTable
ALTER TABLE "MascotSettings" ADD COLUMN     "mascotType" TEXT NOT NULL DEFAULT 'clawd',
ADD COLUMN     "moveSpeed" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "primaryColor" TEXT NOT NULL DEFAULT '#e8735a',
ADD COLUMN     "scale" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "showOn" TEXT[] DEFAULT ARRAY['dashboard', 'all']::TEXT[];
