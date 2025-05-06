-- Configuração inicial do banco de dados
-- Use este script no phpMyAdmin ou outro cliente MySQL

-- Certifique-se de que estamos usando o banco certo
CREATE DATABASE IF NOT EXISTS virtualradio;
USE virtualradio;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'system_admin', 'radio_admin', 'listener') NOT NULL DEFAULT 'listener',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de rádios
CREATE TABLE IF NOT EXISTS radios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    admin_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de arquivos de áudio
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

-- Criar usuário administrador
INSERT INTO users (username, email, password, role, created_at) 
VALUES ('Admin', 'admin@virtualradio.com', SHA2('admin123', 256), 'admin', NOW())
ON DUPLICATE KEY UPDATE 
username = 'Admin',
password = SHA2('admin123', 256),
role = 'admin'; 