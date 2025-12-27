const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use MySQL for production-ready setup
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: process.env.DEBUG_SQL === 'true' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    timezone: '+05:45', // Nepal timezone
  }
);

// ✅ Test DB connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Connected to MySQL database: ${process.env.DB_NAME} at ${process.env.DB_HOST}`);
    
    // Manual table creation to avoid index issues
    console.log('🔄 Creating database tables manually...');
    
    // Create tables without automatic sync to avoid index conflicts
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        fullName VARCHAR(100),
        education VARCHAR(100),
        profession VARCHAR(100),
        contactNumber VARCHAR(20),
        isAdmin BOOLEAN DEFAULT FALSE,
        resetOtp VARCHAR(10),
        otpExpires DATETIME,
        lastLogin DATETIME,
        loginCount INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_isAdmin (isAdmin)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Challenges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        hint TEXT,
        points INT NOT NULL DEFAULT 100,
        filePath VARCHAR(500),
        driveLink VARCHAR(500),
        flagHash VARCHAR(64) NOT NULL,
        categoryId INT,
        solveCount INT DEFAULT 0,
        firstSolverId INT,
        firstSolvedAt DATETIME,
        difficulty ENUM('Easy', 'Medium', 'Hard', 'Expert') DEFAULT 'Medium',
        isActive BOOLEAN DEFAULT TRUE,
        maxAttempts INT DEFAULT NULL,
        isTeamChallenge BOOLEAN DEFAULT FALSE,
        tournamentOnly BOOLEAN DEFAULT FALSE,
        hint2 TEXT,
        maxHints INT DEFAULT 2,
        hintPenalty INT DEFAULT 50,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (categoryId) REFERENCES Categories(id) ON DELETE CASCADE,
        FOREIGN KEY (firstSolverId) REFERENCES Users(id) ON DELETE SET NULL,
        INDEX idx_categoryId (categoryId),
        INDEX idx_points (points),
        INDEX idx_solveCount (solveCount),
        INDEX idx_firstSolverId (firstSolverId),
        INDEX idx_difficulty (difficulty),
        INDEX idx_isActive (isActive),
        INDEX idx_isTeamChallenge (isTeamChallenge),
        INDEX idx_tournamentOnly (tournamentOnly)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        correct BOOLEAN DEFAULT FALSE,
        pointsAwarded INT DEFAULT 0,
        userId INT,
        challengeId INT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (challengeId) REFERENCES Challenges(id) ON DELETE CASCADE,
        INDEX idx_userId (userId),
        INDEX idx_challengeId (challengeId),
        INDEX idx_correct (correct),
        INDEX idx_user_challenge (userId, challengeId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        challengeId INT NOT NULL,
        attemptCount INT DEFAULT 1,
        lastAttemptAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        blockedUntil DATETIME NULL,
        ipAddress VARCHAR(100),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (challengeId) REFERENCES Challenges(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_challenge (userId, challengeId),
        INDEX idx_blockedUntil (blockedUntil),
        INDEX idx_ipAddress (ipAddress),
        INDEX idx_lastAttemptAt (lastAttemptAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Notifications table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        type ENUM('first_blood', 'challenge_created', 'login', 'achievement') NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        data JSON NULL,
        isRead BOOLEAN DEFAULT FALSE,
        isGlobal BOOLEAN DEFAULT FALSE,
        expiresAt DATETIME NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId),
        INDEX idx_type (type),
        INDEX idx_isRead (isRead),
        INDEX idx_isGlobal (isGlobal),
        INDEX idx_createdAt (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Teams table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Teams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        teamCode VARCHAR(10) NOT NULL UNIQUE,
        description TEXT,
        captainId INT NOT NULL,
        maxMembers INT DEFAULT 5,
        currentMembers INT DEFAULT 1,
        totalPoints INT DEFAULT 0,
        teamRank INT,
        isActive BOOLEAN DEFAULT TRUE,
        joinLink VARCHAR(255),
        tournamentMode BOOLEAN DEFAULT FALSE,
        hintsUsed INT DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (captainId) REFERENCES Users(id),
        INDEX idx_name (name),
        INDEX idx_teamCode (teamCode),
        INDEX idx_captainId (captainId),
        INDEX idx_totalPoints (totalPoints),
        INDEX idx_teamRank (teamRank),
        INDEX idx_isActive (isActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // TeamMembers table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS TeamMembers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teamId INT NOT NULL,
        userId INT NOT NULL,
        role ENUM('captain', 'member') DEFAULT 'member',
        joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        isActive BOOLEAN DEFAULT TRUE,
        contributionPoints INT DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (teamId) REFERENCES Teams(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_team_user (teamId, userId),
        INDEX idx_teamId (teamId),
        INDEX idx_userId (userId),
        INDEX idx_role (role),
        INDEX idx_isActive (isActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // TeamScores table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS TeamScores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teamId INT NOT NULL,
        challengeId INT NOT NULL,
        solvedBy INT NOT NULL,
        points INT NOT NULL,
        hintsUsed INT DEFAULT 0,
        pointsDeducted INT DEFAULT 0,
        finalPoints INT NOT NULL,
        solvedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        tournamentMode BOOLEAN DEFAULT FALSE,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (teamId) REFERENCES Teams(id) ON DELETE CASCADE,
        FOREIGN KEY (challengeId) REFERENCES Challenges(id) ON DELETE CASCADE,
        FOREIGN KEY (solvedBy) REFERENCES Users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_team_challenge (teamId, challengeId),
        INDEX idx_teamId (teamId),
        INDEX idx_challengeId (challengeId),
        INDEX idx_solvedBy (solvedBy),
        INDEX idx_points (points),
        INDEX idx_solvedAt (solvedAt),
        INDEX idx_tournamentMode (tournamentMode)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // RegistrationChallenges table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS RegistrationChallenges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        hint TEXT,
        flagHash VARCHAR(64) NOT NULL,
        difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Easy',
        isActive BOOLEAN DEFAULT TRUE,
        solveCount INT DEFAULT 0,
        maxAttempts INT DEFAULT 5,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_isActive (isActive),
        INDEX idx_difficulty (difficulty),
        INDEX idx_solveCount (solveCount)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Update Users table to add team-related fields (one by one to handle existing columns)
    const userColumns = [
      'ALTER TABLE Users ADD COLUMN teamId INT',
      'ALTER TABLE Users ADD COLUMN hasCompletedRegistrationChallenge BOOLEAN DEFAULT FALSE',
      'ALTER TABLE Users ADD COLUMN registrationChallengeCompletedAt DATETIME',
      'ALTER TABLE Users ADD COLUMN totalPoints INT DEFAULT 0',
      'ALTER TABLE Users ADD COLUMN userRank INT',
      'ALTER TABLE Users ADD COLUMN isActive BOOLEAN DEFAULT TRUE',
      'ALTER TABLE Users ADD COLUMN bio TEXT',
      'ALTER TABLE Users ADD COLUMN country VARCHAR(100)',
      'ALTER TABLE Users ADD COLUMN website VARCHAR(255)',
      'ALTER TABLE Users ADD COLUMN githubUsername VARCHAR(100)',
      'ALTER TABLE Users ADD COLUMN twitterUsername VARCHAR(100)'
    ];

    for (const columnQuery of userColumns) {
      try {
        await sequelize.query(columnQuery);
      } catch (error) {
        // Ignore errors for columns that already exist
        if (!error.message.includes('Duplicate column name')) {
          console.log(`Column might already exist: ${error.message}`);
        }
      }
    }

    // Add foreign key constraint for teamId if it doesn't exist
    await sequelize.query(`
      ALTER TABLE Users 
      ADD CONSTRAINT fk_users_teamId 
      FOREIGN KEY (teamId) REFERENCES Teams(id) 
      ON DELETE SET NULL;
    `).catch(() => {
      // Ignore error if constraint already exists
      console.log('Foreign key constraint already exists or cannot be added');
    });

    // Update Challenges table to add team-related fields (one by one to handle existing columns)
    const challengeColumns = [
      'ALTER TABLE Challenges ADD COLUMN driveLink VARCHAR(500)',
      'ALTER TABLE Challenges ADD COLUMN solveCount INT DEFAULT 0',
      'ALTER TABLE Challenges ADD COLUMN firstSolverId INT',
      'ALTER TABLE Challenges ADD COLUMN firstSolvedAt DATETIME',
      'ALTER TABLE Challenges ADD COLUMN difficulty ENUM("Easy", "Medium", "Hard", "Expert") DEFAULT "Medium"',
      'ALTER TABLE Challenges ADD COLUMN isActive BOOLEAN DEFAULT TRUE',
      'ALTER TABLE Challenges ADD COLUMN maxAttempts INT DEFAULT NULL',
      'ALTER TABLE Challenges ADD COLUMN isTeamChallenge BOOLEAN DEFAULT FALSE',
      'ALTER TABLE Challenges ADD COLUMN tournamentOnly BOOLEAN DEFAULT FALSE',
      'ALTER TABLE Challenges ADD COLUMN showInSolo BOOLEAN DEFAULT TRUE',
      'ALTER TABLE Challenges ADD COLUMN hint2 TEXT',
      'ALTER TABLE Challenges ADD COLUMN maxHints INT DEFAULT 2',
      'ALTER TABLE Challenges ADD COLUMN hintPenalty INT DEFAULT 50'
    ];

    for (const columnQuery of challengeColumns) {
      try {
        await sequelize.query(columnQuery);
      } catch (error) {
        // Ignore errors for columns that already exist
        if (!error.message.includes('Duplicate column name')) {
          console.log(`Challenge column might already exist: ${error.message}`);
        }
      }
    }

    // Add foreign key constraint for firstSolverId if it doesn't exist
    await sequelize.query(`
      ALTER TABLE Challenges 
      ADD CONSTRAINT fk_challenges_firstSolverId 
      FOREIGN KEY (firstSolverId) REFERENCES Users(id) 
      ON DELETE SET NULL;
    `).catch(() => {
      // Ignore error if constraint already exists
      console.log('Challenge foreign key constraint already exists or cannot be added');
    });

    // Tournaments table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Tournaments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL DEFAULT 'CTF Tournament',
        description TEXT,
        isActive BOOLEAN DEFAULT FALSE,
        startTime DATETIME,
        endTime DATETIME,
        duration INT,
        autoStart BOOLEAN DEFAULT FALSE,
        autoEnd BOOLEAN DEFAULT FALSE,
        maxTeams INT,
        allowLateJoin BOOLEAN DEFAULT TRUE,
        createdBy INT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES Users(id) ON DELETE CASCADE,
        INDEX idx_isActive (isActive),
        INDEX idx_startTime (startTime),
        INDEX idx_endTime (endTime),
        INDEX idx_createdBy (createdBy)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // TeamHints table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS TeamHints (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teamId INT NOT NULL,
        challengeId INT NOT NULL,
        hintNumber INT NOT NULL,
        pointsDeducted INT NOT NULL DEFAULT 50,
        unlockedBy INT NOT NULL,
        unlockedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (teamId) REFERENCES Teams(id) ON DELETE CASCADE,
        FOREIGN KEY (challengeId) REFERENCES Challenges(id) ON DELETE CASCADE,
        FOREIGN KEY (unlockedBy) REFERENCES Users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_team_challenge_hint (teamId, challengeId, hintNumber),
        INDEX idx_teamId (teamId),
        INDEX idx_challengeId (challengeId),
        INDEX idx_unlockedBy (unlockedBy),
        CHECK (hintNumber >= 1 AND hintNumber <= 2)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // UserHints table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS UserHints (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        challengeId INT NOT NULL,
        hintNumber INT NOT NULL,
        pointsDeducted INT NOT NULL DEFAULT 50,
        unlockedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (challengeId) REFERENCES Challenges(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_challenge_hint (userId, challengeId, hintNumber),
        INDEX idx_userId (userId),
        INDEX idx_challengeId (challengeId),
        CHECK (hintNumber >= 1 AND hintNumber <= 2)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

module.exports = { sequelize, connectDB };
