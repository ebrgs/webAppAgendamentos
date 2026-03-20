/*
  Warnings:

  - You are about to drop the column `articipantsEmails` on the `bookings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "articipantsEmails",
ADD COLUMN     "participantsEmails" TEXT;
