-- Drop tables if they exist to ensure clean setup
DROP TABLE IF EXISTS audio_files;
DROP TABLE IF EXISTS radios;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('system_admin', 'radio_admin', 'listener') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create radios table
CREATE TABLE IF NOT EXISTS radios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  admin_id INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create audio_files table
CREATE TABLE IF NOT EXISTS audio_files (
  id INT PRIMARY KEY AUTO_INCREMENT,
  radio_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  type ENUM('music', 'spot') NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (radio_id) REFERENCES radios(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, role)
VALUES ('admin', 'admin@virtualradio.com', '$2a$10$ij4nqsKLNi0UtZ1QIw1uFuQf3FhbNKUAKYAzVLLqd1T5xNb2oByte', 'system_admin'); 