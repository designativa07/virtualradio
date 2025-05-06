-- Recria o usuário com permissões corretas
DROP USER IF EXISTS 'desig938_myradio'@'localhost';
CREATE USER 'desig938_myradio'@'localhost' IDENTIFIED BY 'giNdvTR[l*Tm';

-- Garante que o banco existe
CREATE DATABASE IF NOT EXISTS desig938_myradio;

-- Concede todos os privilégios ao usuário no banco específico
GRANT ALL PRIVILEGES ON desig938_myradio.* TO 'desig938_myradio'@'localhost';

-- Recarrega os privilégios
FLUSH PRIVILEGES;

-- Use o banco de dados
USE desig938_myradio;

-- Cria as tabelas básicas se não existirem
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'system_admin', 'radio_admin', 'listener') NOT NULL DEFAULT 'listener',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS radios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    admin_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audio_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    radio_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(20),
    duration INT,
    type ENUM('music', 'spot') NOT NULL,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (radio_id) REFERENCES radios(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Limpa dados existentes
TRUNCATE TABLE audio_files;
TRUNCATE TABLE radios;
DELETE FROM users;

-- Insere um usuário administrador com ID fixo
ALTER TABLE users AUTO_INCREMENT = 1;
INSERT INTO users (id, username, email, password, role, created_at) 
VALUES (1, 'Admin', 'admin@virtualradio.com', SHA2('admin123', 256), 'admin', NOW());