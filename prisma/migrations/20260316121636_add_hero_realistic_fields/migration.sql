-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "heroRealisticPills" TEXT NOT NULL DEFAULT 'Next.js,TypeScript,React,Node.js',
ADD COLUMN     "heroRealisticQuote" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "heroRealisticStat" TEXT NOT NULL DEFAULT '3+ Years',
ADD COLUMN     "heroRealisticStatLabel" TEXT NOT NULL DEFAULT 'in Software Development Experience';
