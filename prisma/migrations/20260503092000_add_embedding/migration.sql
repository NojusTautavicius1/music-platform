-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable: add embedding column
ALTER TABLE "Song" ADD COLUMN "embedding" vector(1536);
ALTER TABLE "Song" ADD COLUMN "embeddingAt" TIMESTAMP(3);

-- HNSW index for fast cosine similarity search
CREATE INDEX "song_embedding_idx" ON "Song" USING hnsw (embedding vector_cosine_ops);
