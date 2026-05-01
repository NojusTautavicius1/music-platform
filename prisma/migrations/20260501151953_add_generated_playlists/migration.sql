-- CreateTable
CREATE TABLE "GeneratedPlaylist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverUrl" TEXT,
    "gradientFrom" TEXT NOT NULL,
    "gradientTo" TEXT NOT NULL,
    "songIds" TEXT[],
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedPlaylist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedPlaylist_userId_generatedAt_idx" ON "GeneratedPlaylist"("userId", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedPlaylist_userId_kind_key" ON "GeneratedPlaylist"("userId", "kind");

-- AddForeignKey
ALTER TABLE "GeneratedPlaylist" ADD CONSTRAINT "GeneratedPlaylist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
