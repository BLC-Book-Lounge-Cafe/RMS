-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('pending', 'confirmed', 'cancelled');

-- CreateTable: бронирование книг
CREATE TABLE "book_reservation" (
    "id"         SERIAL NOT NULL,
    "book_id"    INTEGER NOT NULL,
    "name"       VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: бронирование столов
CREATE TABLE "table_reservation" (
    "id"         SERIAL NOT NULL,
    "table_id"   INTEGER NOT NULL,
    "name"       VARCHAR(255) NOT NULL,
    "phone"      VARCHAR(20) NOT NULL,
    "start_at"   TIMESTAMP(3) NOT NULL,
    "end_at"     TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: быстрое бронирование (телефон + имя)
CREATE TABLE "quick_reservation" (
    "id"         SERIAL NOT NULL,
    "name"       VARCHAR(255) NOT NULL,
    "phone"      VARCHAR(20) NOT NULL,
    "status"     "ReservationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "book_reservation_book_id_idx" ON "book_reservation"("book_id");

-- CreateIndex
CREATE INDEX "table_reservation_table_id_idx" ON "table_reservation"("table_id");
CREATE INDEX "table_reservation_start_at_end_at_idx" ON "table_reservation"("start_at", "end_at");

-- CreateIndex
CREATE INDEX "quick_reservation_status_idx" ON "quick_reservation"("status");
CREATE INDEX "quick_reservation_created_at_idx" ON "quick_reservation"("created_at");
