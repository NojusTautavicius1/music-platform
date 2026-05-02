-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "acousticness" DOUBLE PRECISION,
ADD COLUMN     "analyzedAt" TIMESTAMP(3),
ADD COLUMN     "bpm" DOUBLE PRECISION,
ADD COLUMN     "danceability" DOUBLE PRECISION,
ADD COLUMN     "energy" DOUBLE PRECISION,
ADD COLUMN     "instrumentalness" DOUBLE PRECISION,
ADD COLUMN     "key" TEXT,
ADD COLUMN     "loudness" DOUBLE PRECISION,
ADD COLUMN     "mood" TEXT,
ADD COLUMN     "valence" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Song_mood_idx" ON "Song"("mood");

-- CreateIndex
CREATE INDEX "Song_bpm_idx" ON "Song"("bpm");
