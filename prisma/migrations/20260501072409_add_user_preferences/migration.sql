-- CreateTable
CREATE TABLE "UserPreferences" (
    "userId" TEXT NOT NULL,
    "defaultVolume" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "crossfadeSeconds" INTEGER NOT NULL DEFAULT 0,
    "audioQuality" TEXT NOT NULL DEFAULT 'auto',
    "autoPlayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailNewPlaylists" BOOLEAN NOT NULL DEFAULT true,
    "emailWeekly" BOOLEAN NOT NULL DEFAULT true,
    "profilePublic" BOOLEAN NOT NULL DEFAULT true,
    "showActivity" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
