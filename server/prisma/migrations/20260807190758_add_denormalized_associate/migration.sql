/*
  Warnings:

  - You are about to alter the column `formType` on the `Submission` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `VarChar(191)`.

*/
-- DropForeignKey
ALTER TABLE `Submission` DROP FOREIGN KEY `Submission_associateId_fkey`;

-- AlterTable
ALTER TABLE `Submission` ADD COLUMN `associateEmployeeId` VARCHAR(191) NOT NULL DEFAULT 'UNKNOWN-ID',
    ADD COLUMN `associateName` VARCHAR(191) NOT NULL DEFAULT 'Unknown Associate',
    MODIFY `associateId` VARCHAR(191) NULL,
    MODIFY `formType` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_associateId_fkey` FOREIGN KEY (`associateId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
