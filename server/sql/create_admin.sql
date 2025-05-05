-- Script para criar o usuário administrador
INSERT INTO users (username, email, password, role, created_at) 
VALUES ('Admin', 'admin@virtualradio.com', SHA2('admin123', 256), 'admin', NOW())
ON DUPLICATE KEY UPDATE 
username = 'Admin',
password = SHA2('admin123', 256),
role = 'admin'; 