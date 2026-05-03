-- DropIndex
DROP INDEX "song_embedding_idx";

-- CreateTable
CREATE TABLE "AgentQuery" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "query" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "agentExplanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentQuery_userId_createdAt_idx" ON "AgentQuery"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AgentQuery" ADD CONSTRAINT "AgentQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
