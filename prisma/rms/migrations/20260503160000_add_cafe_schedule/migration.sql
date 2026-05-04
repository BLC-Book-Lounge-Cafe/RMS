-- CreateTable: расписание работы кафе (open/close + длительность слота)
CREATE TABLE "cafe_schedule" (
    "id"                    SERIAL NOT NULL,
    "open_time"             TIME(0) NOT NULL,
    "close_time"            TIME(0) NOT NULL,
    "slot_duration_minutes" INTEGER NOT NULL,
    "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cafe_schedule_pkey" PRIMARY KEY ("id")
);

-- Дефолтная запись: кафе работает с 09:00 до 22:00, шаг 60 минут
INSERT INTO "cafe_schedule" ("open_time", "close_time", "slot_duration_minutes", "updated_at")
VALUES ('09:00:00', '22:00:00', 60, CURRENT_TIMESTAMP);
