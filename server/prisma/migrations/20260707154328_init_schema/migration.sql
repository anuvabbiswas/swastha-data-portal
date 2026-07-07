-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'MARKETING', 'COMMUNITY') NOT NULL,
    `status` ENUM('ACTIVE', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_employeeId_key`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FieldDefinition` (
    `id` VARCHAR(191) NOT NULL,
    `formType` ENUM('MARKETING', 'COMMUNITY') NOT NULL,
    `fieldLabel` VARCHAR(191) NOT NULL,
    `inputType` ENUM('TEXT', 'NUMBER', 'DATE', 'DROPDOWN', 'MULTI_SELECT', 'YES_NO') NOT NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT false,
    `options` JSON NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Submission` (
    `id` VARCHAR(191) NOT NULL,
    `associateId` VARCHAR(191) NOT NULL,
    `formType` ENUM('MARKETING', 'COMMUNITY') NOT NULL,
    `submissionData` JSON NOT NULL,
    `schemaSnapshot` JSON NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Submission` ADD CONSTRAINT `Submission_associateId_fkey` FOREIGN KEY (`associateId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
