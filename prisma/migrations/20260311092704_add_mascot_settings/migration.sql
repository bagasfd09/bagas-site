-- CreateTable
CREATE TABLE "MascotSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "displayName" TEXT NOT NULL DEFAULT 'Claw''d',
    "greeting" TEXT NOT NULL DEFAULT 'Hey! I''m Claw''d. What''s up?',
    "systemPrompt" TEXT NOT NULL DEFAULT 'You are Claw''d, a cheerful pixel crab assistant. You help the commander manage their site with enthusiasm and crab puns.',
    "gatewayUrl" TEXT NOT NULL DEFAULT 'http://localhost:18789',
    "authToken" TEXT NOT NULL DEFAULT '',
    "agentId" TEXT NOT NULL DEFAULT 'main',
    "weightIdle" INTEGER NOT NULL DEFAULT 10,
    "weightWalking" INTEGER NOT NULL DEFAULT 18,
    "weightCoding" INTEGER NOT NULL DEFAULT 20,
    "weightWriting" INTEGER NOT NULL DEFAULT 12,
    "weightKarate" INTEGER NOT NULL DEFAULT 12,
    "weightPhone" INTEGER NOT NULL DEFAULT 10,
    "weightPresenting" INTEGER NOT NULL DEFAULT 6,
    "weightCoffee" INTEGER NOT NULL DEFAULT 6,
    "weightCalling" INTEGER NOT NULL DEFAULT 6,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MascotSettings_pkey" PRIMARY KEY ("id")
);
