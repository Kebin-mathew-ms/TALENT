/*
  Warnings:

  - You are about to drop the column `candidateRating` on the `feedback` table. All the data in the column will be lost.
  - You are about to drop the column `interviewerComments` on the `feedback` table. All the data in the column will be lost.
  - You are about to drop the column `overallScore` on the `feedback` table. All the data in the column will be lost.
  - You are about to drop the column `overallGrade` on the `report` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `feedback` DROP COLUMN `candidateRating`,
    DROP COLUMN `interviewerComments`,
    DROP COLUMN `overallScore`,
    ADD COLUMN `assessmentId` INTEGER NULL,
    ADD COLUMN `candidateId` INTEGER NULL,
    ADD COLUMN `codeQuality` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `comments` TEXT NULL,
    ADD COLUMN `communication` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `interviewerId` INTEGER NULL,
    ADD COLUMN `overallPerformance` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `problemSolving` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `technicalKnowledge` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `report` DROP COLUMN `overallGrade`,
    ADD COLUMN `assessmentId` INTEGER NULL,
    ADD COLUMN `candidateId` INTEGER NULL,
    ADD COLUMN `fileName` VARCHAR(191) NULL,
    ADD COLUMN `filePath` VARCHAR(191) NULL,
    ADD COLUMN `overallScore` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
