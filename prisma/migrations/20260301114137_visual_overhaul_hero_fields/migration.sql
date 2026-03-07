-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "heroImage" TEXT,
ADD COLUMN     "heroIntro" TEXT NOT NULL DEFAULT 'I''m a software developer and open-source enthusiast from Indonesia. I build modern web apps and write about development on this blog.',
ALTER COLUMN "sidebarBio" SET DEFAULT 'I''m Bagas, software developer and open-source enthusiast from Indonesia. This is my digital garden. 🌱';
