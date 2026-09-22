/*
  Warnings:

  - You are about to drop the column `codeQualityScore` on the `aievaluation` table. All the data in the column will be lost.
  - You are about to drop the column `correctnessScore` on the `aievaluation` table. All the data in the column will be lost.
  - You are about to drop the column `feedbackText` on the `aievaluation` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `aievaluation` table. All the data in the column will be lost.
  - You are about to drop the column `exitCode` on the `codeexecution` table. All the data in the column will be lost.
  - You are about to drop the column `passedTests` on the `codeexecution` table. All the data in the column will be lost.
  - You are about to drop the column `stderr` on the `codeexecution` table. All the data in the column will be lost.
  - You are about to drop the column `stdout` on the `codeexecution` table. All the data in the column will be lost.
  - You are about to drop the column `totalTests` on the `codeexecution` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `AIEvaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `aievaluation` DROP COLUMN `codeQualityScore`,
    DROP COLUMN `correctnessScore`,
    DROP COLUMN `feedbackText`,
    DROP COLUMN `score`,
    ADD COLUMN `assessmentId` INTEGER NULL,
    ADD COLUMN `candidateId` INTEGER NULL,
    ADD COLUMN `codeQuality` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `correctness` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `efficiency` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `feedback` TEXT NULL,
    ADD COLUMN `overallScore` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `problemSolving` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `codeexecution` DROP COLUMN `exitCode`,
    DROP COLUMN `passedTests`,
    DROP COLUMN `stderr`,
    DROP COLUMN `stdout`,
    DROP COLUMN `totalTests`,
    ADD COLUMN `candidateId` INTEGER NULL,
    ADD COLUMN `error` TEXT NULL,
    ADD COLUMN `executionTime` DOUBLE NULL,
    ADD COLUMN `language` VARCHAR(191) NOT NULL DEFAULT 'javascript',
    ADD COLUMN `output` TEXT NULL,
    ADD COLUMN `questionId` INTEGER NULL,
    ADD COLUMN `sessionId` INTEGER NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'SUCCESS',
    MODIFY `submissionId` INTEGER NULL;

-- AlterTable
ALTER TABLE `proctoringincident` ADD COLUMN `assessmentId` INTEGER NULL,
    ADD COLUMN `candidateId` INTEGER NULL,
    ADD COLUMN `warningNumber` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `submission` ADD COLUMN `assessmentId` INTEGER NULL,
    ADD COLUMN `candidateId` INTEGER NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'SUBMITTED';
