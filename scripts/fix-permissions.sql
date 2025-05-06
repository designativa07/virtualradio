-- Make sure admin user with ID 1 exists
INSERT INTO users (id, username, email, password, role)
VALUES (1, 'Admin', 'admin@virtualradio.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin')
ON DUPLICATE KEY UPDATE username = 'Admin', email = 'admin@virtualradio.com', role = 'admin';

-- Temporarily disable foreign key checks to clean up data if needed
SET FOREIGN_KEY_CHECKS = 0;

-- Clear the radios table
TRUNCATE TABLE radios;

-- If the audio_files table exists, clear it too since it likely has foreign keys to radios
TRUNCATE TABLE audio_files;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create a sample radio to verify everything works
INSERT INTO radios (name, admin_id, description)
VALUES ('Test Radio', 1, 'This is a test radio created by the fix script');

-- Display the sample radio
SELECT * FROM radios; 