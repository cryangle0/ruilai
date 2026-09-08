CREATE DATABASE IF NOT EXISTS ruilai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL ON ruilai.* TO 'miniapps'@'localhost';
FLUSH PRIVILEGES;
SHOW DATABASES LIKE 'ruilai';
