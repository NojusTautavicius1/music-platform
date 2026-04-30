-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Playlist_userId_sortOrder_idx" ON "Playlist"("userId", "sortOrder");
