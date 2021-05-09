CREATE TABLE IF NOT EXISTS `{{table_name}}` (
    `id` CHAR(20) NOT NULL,
    `host` VARCHAR(255) NOT NULL,
    `score` DECIMAL(20, 10) NOT NULL,
    `maxScore` INTEGER NOT NULL,
    `percent` DECIMAL(20,10) NOT NULL,
    `isBot` BOOLEAN NOT NULL,
    PRIMARY KEY (`id`)
);