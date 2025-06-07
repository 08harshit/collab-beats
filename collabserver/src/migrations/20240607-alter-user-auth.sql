-- Alter user_auth table to change column types to TEXT
ALTER TABLE user_auth 
ALTER COLUMN "accessToken" TYPE TEXT,
ALTER COLUMN "refreshToken" TYPE TEXT; 