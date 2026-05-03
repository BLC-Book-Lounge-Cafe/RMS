-- AlterTable
ALTER TABLE "book_reservation" ADD COLUMN "reserved_at" DATE NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "book_reservation_book_id_reserved_at_key" ON "book_reservation"("book_id", "reserved_at");
