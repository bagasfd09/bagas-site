/*
  Warnings:

  - You are about to drop the column `icon` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `stars` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "icon",
DROP COLUMN "stars",
DROP COLUMN "url",
ADD COLUMN     "githubCreatedAt" TIMESTAMP(3),
ADD COLUMN     "githubForks" INTEGER,
ADD COLUMN     "githubLanguage" TEXT,
ADD COLUMN     "githubStars" INTEGER,
ADD COLUMN     "githubSyncedAt" TIMESTAMP(3),
ADD COLUMN     "githubUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "SiteSettings" ALTER COLUMN "sidebarBio" SET DEFAULT 'I''m Bagas, software developer and open-source enthusiast from Indonesia. This is my corner of the universe. 🚀';

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "url" TEXT,
    "category" TEXT NOT NULL DEFAULT 'language',
    "level" TEXT NOT NULL DEFAULT 'intermediate',
    "yearsOfExp" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Unknown',
    "countryCode" TEXT NOT NULL DEFAULT 'XX',
    "referrer" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "Skill"("category");

-- CreateIndex
CREATE INDEX "Skill_sortOrder_idx" ON "Skill"("sortOrder");

-- CreateIndex
CREATE INDEX "Skill_featured_idx" ON "Skill"("featured");

-- CreateIndex
CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");

-- CreateIndex
CREATE INDEX "PageView_ipHash_createdAt_idx" ON "PageView"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "PageView_country_idx" ON "PageView"("country");

-- CreateIndex
CREATE INDEX "PageView_path_idx" ON "PageView"("path");

-- CreateIndex
CREATE INDEX "Project_sortOrder_idx" ON "Project"("sortOrder");

-- CreateIndex
CREATE INDEX "Project_featured_idx" ON "Project"("featured");
