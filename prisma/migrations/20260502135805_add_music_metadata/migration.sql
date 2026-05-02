-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "bitrate" INTEGER,
ADD COLUMN     "filePath" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "license" TEXT,
ADD COLUMN     "licenseAttribution" TEXT,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "sampleRate" INTEGER,
ADD COLUMN     "sourceUrl" TEXT;
