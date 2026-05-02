-- AlterTable
ALTER TABLE "Lyrics" ADD COLUMN     "analyzedAt" TIMESTAMP(3),
ADD COLUMN     "keyPhrases" TEXT[],
ADD COLUMN     "mood" TEXT,
ADD COLUMN     "sentiment" DOUBLE PRECISION,
ADD COLUMN     "themes" TEXT[];
