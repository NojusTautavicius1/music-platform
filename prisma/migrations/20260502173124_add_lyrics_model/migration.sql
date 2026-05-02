-- CreateTable
CREATE TABLE "Lyrics" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "plainText" TEXT,
    "syncedJson" JSONB,
    "language" TEXT,
    "source" TEXT NOT NULL DEFAULT 'lrclib',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lyrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lyrics_songId_key" ON "Lyrics"("songId");

-- AddForeignKey
ALTER TABLE "Lyrics" ADD CONSTRAINT "Lyrics_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
