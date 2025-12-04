const axios = require("axios");

// Your webhooks
const WEBHOOKS = {
  firstBlood: "https://discord.com/api/webhooks/1445795721881325731/b5V3RQbdLB0ZfNV_O3ivkNKTCDTOUcwB40J1Qeoqly-k-SDkXFTVLFyVhzF4cxGIS82h",
  challenge: "https://discord.com/api/webhooks/1445795960583225550/aM2M6IjDiRVtuyDDdfK4-i-otNmcE5ROpgPcy4AVO3F1YI5GscUWDiVGhUwXWpQGyI_c"
};

/**
 * Generates First Blood HTML with blood dripping effects
 */
function generateFirstBloodHTML(solverUsername, challengeTitle) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>First Blood</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@700&family=Roboto:wght@400;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            width: 600px;
            height: 700px;
            background: linear-gradient(135deg, #1a0000 0%, #330000 50%, #1a0000 100%);
            font-family: 'Roboto', sans-serif;
            position: relative;
            overflow: hidden;
        }
        
        body::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(220, 20, 60, 0.1) 0%, transparent 70%);
            animation: pulse 3s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
        
        .content {
            position: relative;
            z-index: 2;
            padding: 50px 40px;
        }
        
        .first-blood-container {
            text-align: center;
            margin-bottom: 40px;
            position: relative;
        }
        
        .first-blood-text {
            font-family: 'Bebas Neue', cursive;
            font-size: 80px;
            font-weight: 900;
            color: #ff0000;
            letter-spacing: 12px;
            text-shadow: 0 0 20px rgba(255, 0, 0, 0.8), 0 0 40px rgba(255, 0, 0, 0.6), 0 0 60px rgba(255, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.8);
            position: relative;
            display: inline-block;
            animation: glow 2s ease-in-out infinite;
        }
        
        @keyframes glow {
            0%, 100% { text-shadow: 0 0 20px rgba(255, 0, 0, 0.8), 0 0 40px rgba(255, 0, 0, 0.6), 0 0 60px rgba(255, 0, 0, 0.4), 0 5px 10px rgba(0, 0, 0, 0.8); }
            50% { text-shadow: 0 0 30px rgba(255, 0, 0, 1), 0 0 60px rgba(255, 0, 0, 0.8), 0 0 90px rgba(255, 0, 0, 0.6), 0 5px 10px rgba(0, 0, 0, 0.8); }
        }
        
        .blood-drips {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            height: 80px;
            overflow: visible;
        }
        
        .drip {
            position: absolute;
            width: 6px;
            background: linear-gradient(to bottom, #ff0000 0%, #8b0000 50%, transparent 100%);
            border-radius: 0 0 50% 50%;
            animation: dripping 3s ease-in-out infinite;
            filter: blur(0.5px);
        }
        
        .drip::before {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 12px;
            height: 12px;
            background: radial-gradient(circle, #ff0000 0%, #8b0000 70%, transparent 100%);
            border-radius: 50%;
            animation: droplet 3s ease-in-out infinite;
        }
        
        @keyframes dripping {
            0% { height: 0; opacity: 0; }
            20% { height: 40px; opacity: 1; }
            80% { height: 50px; opacity: 0.8; }
            100% { height: 50px; opacity: 0; }
        }
        
        @keyframes droplet {
            0%, 20% { opacity: 0; transform: translateX(-50%) translateY(0); }
            40% { opacity: 1; transform: translateX(-50%) translateY(10px); }
            100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
        }
        
        .drip:nth-child(1) { left: 15%; animation-delay: 0s; }
        .drip:nth-child(2) { left: 28%; animation-delay: 0.5s; }
        .drip:nth-child(3) { left: 42%; animation-delay: 0.2s; }
        .drip:nth-child(4) { left: 58%; animation-delay: 0.7s; }
        .drip:nth-child(5) { left: 72%; animation-delay: 0.3s; }
        .drip:nth-child(6) { left: 85%; animation-delay: 0.9s; }
        
        .blood-pool {
            position: absolute;
            bottom: -10px;
            left: 0;
            right: 0;
            height: 15px;
            background: radial-gradient(ellipse at center, rgba(139, 0, 0, 0.8) 0%, transparent 70%);
            filter: blur(4px);
            animation: poolSpread 3s ease-in-out infinite;
        }
        
        @keyframes poolSpread {
            0% { transform: scaleX(0.5); opacity: 0; }
            50% { transform: scaleX(1); opacity: 1; }
            100% { transform: scaleX(1.1); opacity: 0.6; }
        }
        
        .trophy-icon {
            font-size: 60px;
            margin-bottom: 20px;
            display: inline-block;
            animation: bounce 2s ease-in-out infinite;
            filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.6));
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .solver-name {
            font-family: 'Oswald', sans-serif;
            font-size: 48px;
            font-weight: 700;
            color: #ffffff;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.5), 0 3px 15px rgba(0, 0, 0, 0.8);
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        
        .challenge-info {
            background: rgba(0, 0, 0, 0.5);
            padding: 25px;
            border-radius: 15px;
            border: 1px solid rgba(220, 20, 60, 0.3);
            margin-bottom: 30px;
            backdrop-filter: blur(10px);
        }
        
        .challenge-label {
            font-size: 14px;
            color: #ff6b6b;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .challenge-name {
            font-family: 'Oswald', sans-serif;
            font-size: 32px;
            color: #ffffff;
            font-weight: 700;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
            line-height: 1.3;
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 30px;
        }
        
        .detail-box {
            background: rgba(0, 0, 0, 0.4);
            padding: 20px 15px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid rgba(220, 20, 60, 0.2);
        }
        
        .detail-label {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .detail-value {
            font-size: 18px;
            color: #ffffff;
            font-weight: 700;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
        }
        
        .tagline {
            text-align: center;
            font-size: 16px;
            color: #ff6b6b;
            font-style: italic;
            margin-top: 20px;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(220, 20, 60, 0.2);
        }
        
        .footer-text {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 3px;
            font-weight: 600;
        }
        
        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(255, 0, 0, 0.6);
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(-100px) translateX(20px); opacity: 0; }
        }
        
        .particle:nth-child(1) { top: 20%; left: 10%; animation-delay: 0s; }
        .particle:nth-child(2) { top: 40%; left: 30%; animation-delay: 1s; }
        .particle:nth-child(3) { top: 60%; left: 50%; animation-delay: 2s; }
        .particle:nth-child(4) { top: 30%; left: 70%; animation-delay: 1.5s; }
        .particle:nth-child(5) { top: 80%; left: 90%; animation-delay: 0.5s; }
    </style>
</head>
<body>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    
    <div class="content">
        <div class="first-blood-container">
            <div class="first-blood-text">FIRST BLOOD</div>
            <div class="blood-drips">
                <div class="drip"></div>
                <div class="drip"></div>
                <div class="drip"></div>
                <div class="drip"></div>
                <div class="drip"></div>
                <div class="drip"></div>
            </div>
            <div class="blood-pool"></div>
        </div>
        
        <div style="text-align: center;">
            <div class="trophy-icon">🏆</div>
            <div class="solver-name">${solverUsername}</div>
        </div>
        
        <div class="challenge-info">
            <div class="challenge-label">⚔️ Conquered</div>
            <div class="challenge-name">${challengeTitle}</div>
        </div>
        
        <div class="tagline">
            "The first warrior to draw blood in this challenge!"
        </div>
        
        <div class="details-grid">
            <div class="detail-box">
                <div class="detail-label">⚔️ Achievement</div>
                <div class="detail-value">First Blood</div>
            </div>
            <div class="detail-box">
                <div class="detail-label">🎯 Challenge</div>
                <div class="detail-value">${challengeTitle.length > 15 ? challengeTitle.substring(0, 15) + "..." : challengeTitle}</div>
            </div>
            <div class="detail-box">
                <div class="detail-label">👤 Solver</div>
                <div class="detail-value">${solverUsername.length > 12 ? solverUsername.substring(0, 12) + "..." : solverUsername}</div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">🔥 NETANIX CTF • FIRST BLOOD EVENT</div>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Generates New Challenge HTML with energy effects
 */
function generateNewChallengeHTML(challengeTitle, category = "General", difficulty = "Medium") {
  const difficultyConfig = {
    Easy: { color: "#2ecc71", emoji: "🟢" },
    Medium: { color: "#f39c12", emoji: "🟡" },
    Hard: { color: "#e74c3c", emoji: "🔴" }
  };

  const config = difficultyConfig[difficulty] || difficultyConfig.Medium;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Challenge</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@700&family=Roboto:wght@400;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            width: 600px;
            height: 700px;
            background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
            font-family: 'Roboto', sans-serif;
            position: relative;
            overflow: hidden;
        }
        
        body::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(52, 152, 219, 0.15) 0%, transparent 70%);
            animation: pulse 4s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.5; }
            50% { transform: scale(1.1) rotate(180deg); opacity: 0.8; }
        }
        
        .content {
            position: relative;
            z-index: 2;
            padding: 50px 40px;
        }
        
        .badge-container {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .new-badge {
            display: inline-block;
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            padding: 12px 30px;
            border-radius: 30px;
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 4px;
            text-transform: uppercase;
            box-shadow: 0 6px 25px rgba(52, 152, 219, 0.5);
            animation: badgePulse 2s ease-in-out infinite;
            border: 2px solid rgba(255, 255, 255, 0.3);
        }
        
        @keyframes badgePulse {
            0%, 100% { transform: scale(1); box-shadow: 0 6px 25px rgba(52, 152, 219, 0.5); }
            50% { transform: scale(1.05); box-shadow: 0 8px 35px rgba(52, 152, 219, 0.7); }
        }
        
        .challenge-icon {
            font-size: 80px;
            margin: 30px 0;
            display: inline-block;
            animation: iconFloat 3s ease-in-out infinite;
            filter: drop-shadow(0 0 30px rgba(52, 152, 219, 0.6));
        }
        
        @keyframes iconFloat {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-15px) rotate(-5deg); }
            75% { transform: translateY(-10px) rotate(5deg); }
        }
        
        .challenge-title-container {
            text-align: center;
            margin: 40px 0;
            position: relative;
        }
        
        .challenge-title {
            font-family: 'Bebas Neue', cursive;
            font-size: 56px;
            font-weight: 900;
            color: #ffffff;
            letter-spacing: 6px;
            text-shadow: 0 0 20px rgba(52, 152, 219, 0.8), 0 0 40px rgba(52, 152, 219, 0.5), 0 5px 15px rgba(0, 0, 0, 0.8);
            position: relative;
            display: inline-block;
            animation: titleGlow 3s ease-in-out infinite;
            line-height: 1.2;
            text-transform: uppercase;
        }
        
        @keyframes titleGlow {
            0%, 100% { text-shadow: 0 0 20px rgba(52, 152, 219, 0.8), 0 0 40px rgba(52, 152, 219, 0.5), 0 5px 15px rgba(0, 0, 0, 0.8); }
            50% { text-shadow: 0 0 30px rgba(52, 152, 219, 1), 0 0 60px rgba(52, 152, 219, 0.8), 0 5px 15px rgba(0, 0, 0, 0.8); }
        }
        
        .energy-waves {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 120%;
            height: 120%;
            pointer-events: none;
        }
        
        .wave {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
            border: 2px solid rgba(52, 152, 219, 0.3);
            border-radius: 50%;
            animation: waveExpand 3s ease-out infinite;
        }
        
        .wave:nth-child(2) { animation-delay: 1s; }
        .wave:nth-child(3) { animation-delay: 2s; }
        
        @keyframes waveExpand {
            0% { width: 0%; height: 0%; opacity: 1; }
            100% { width: 150%; height: 150%; opacity: 0; }
        }
        
        .subtitle {
            font-size: 18px;
            color: #74b9ff;
            text-align: center;
            margin: 20px 0;
            font-weight: 600;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
            letter-spacing: 1px;
        }
        
        .tagline {
            text-align: center;
            font-size: 16px;
            color: #a0d8f1;
            font-style: italic;
            margin: 20px 0;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
        }
        
        .details-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 40px;
        }
        
        .detail-box {
            background: rgba(0, 0, 0, 0.4);
            padding: 25px 15px;
            border-radius: 15px;
            text-align: center;
            border: 2px solid rgba(52, 152, 219, 0.3);
            backdrop-filter: blur(10px);
        }
        
        .detail-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .detail-value {
            font-size: 20px;
            color: #ffffff;
            font-weight: 700;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
        }
        
        .difficulty-value {
            color: ${config.color};
            text-shadow: 0 0 10px ${config.color}80;
        }
        
        .status-live {
            color: #2ecc71;
            text-shadow: 0 0 10px rgba(46, 204, 113, 0.6);
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 25px;
            border-top: 1px solid rgba(52, 152, 219, 0.2);
        }
        
        .footer-text {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 3px;
            font-weight: 600;
        }
        
        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(52, 152, 219, 0.6);
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(52, 152, 219, 0.8);
            animation: particleFloat 8s ease-in-out infinite;
        }
        
        @keyframes particleFloat {
            0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-120px) translateX(40px) scale(0.5); opacity: 0; }
        }
        
        .particle:nth-child(1) { top: 20%; left: 10%; animation-delay: 0s; }
        .particle:nth-child(2) { top: 40%; left: 25%; animation-delay: 2s; }
        .particle:nth-child(3) { top: 60%; left: 40%; animation-delay: 4s; }
        .particle:nth-child(4) { top: 30%; left: 55%; animation-delay: 1s; }
        .particle:nth-child(5) { top: 70%; left: 70%; animation-delay: 3s; }
        .particle:nth-child(6) { top: 50%; left: 85%; animation-delay: 5s; }
        
        .sparkle {
            position: absolute;
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
            animation: sparkle 2s ease-in-out infinite;
        }
        
        @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
        }
        
        .sparkle:nth-child(odd) { animation-delay: 0.5s; }
        .sparkle:nth-child(7) { top: 20%; left: 15%; }
        .sparkle:nth-child(8) { top: 40%; left: 85%; }
        .sparkle:nth-child(9) { top: 60%; left: 10%; }
        .sparkle:nth-child(10) { top: 80%; left: 90%; }
        .sparkle:nth-child(11) { top: 30%; left: 50%; }
        .sparkle:nth-child(12) { top: 70%; left: 60%; }
    </style>
</head>
<body>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    <div class="sparkle"></div>
    
    <div class="content">
        <div class="badge-container">
            <div class="new-badge">🆕 NEW CHALLENGE</div>
        </div>
        
        <div style="text-align: center;">
            <div class="challenge-icon">🎯</div>
        </div>
        
        <div class="challenge-title-container">
            <div class="energy-waves">
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
            </div>
            <div class="challenge-title">${challengeTitle}</div>
        </div>
        
        <div class="subtitle">
            A new challenge awaits! Can you solve it?
        </div>
        
        <div class="tagline">
            "Get ready to test your skills!"
        </div>
        
        <div class="details-grid">
            <div class="detail-box">
                <div class="detail-label">📂 Category</div>
                <div class="detail-value">${category}</div>
            </div>
            <div class="detail-box">
                <div class="detail-label">⚡ Difficulty</div>
                <div class="detail-value difficulty-value">${config.emoji} ${difficulty}</div>
            </div>
            <div class="detail-box">
                <div class="detail-label">📊 Status</div>
                <div class="detail-value status-live">🟢 LIVE NOW</div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">🧩 NETANIX CTF • NEW CHALLENGE</div>
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Sends Discord message with HTML content as attachment
 */
async function sendDiscordWithHTML(webhook, html, filename) {
  try {
    const FormData = require('form-data');
    const form = new FormData();
    
    // Create HTML file buffer
    const htmlBuffer = Buffer.from(html, 'utf-8');
    
    form.append('file', htmlBuffer, {
      filename: filename,
      contentType: 'text/html'
    });
    
    await axios.post(webhook, form, {
      headers: form.getHeaders()
    });
    
    console.log(`✅ Discord notification sent successfully: ${filename}`);
    return true;
  } catch (err) {
    console.error("❌ Discord Error:", err.response?.data || err.message);
    return false;
  }
}

module.exports = {
  /**
   * 🔥 FIRST BLOOD - Sends amazing HTML card with blood dripping
   * @param {string} solverUsername - Username of the solver
   * @param {string} challengeTitle - Title of the challenge
   */
  async sendFirstBlood(solverUsername, challengeTitle) {
    try {
      console.log(`🩸 Sending First Blood notification for ${solverUsername}...`);
      
      const html = generateFirstBloodHTML(solverUsername, challengeTitle);
      
      return await sendDiscordWithHTML(
        WEBHOOKS.firstBlood,
        html,
        'first_blood.html'
      );
    } catch (err) {
      console.error("Error in sendFirstBlood:", err);
      return false;
    }
  },

  /**
   * 🧩 NEW CHALLENGE - Sends amazing HTML card with energy effects
   * @param {string} challengeTitle - Title of the new challenge
   * @param {string} category - Challenge category (optional, default: "General")
   * @param {string} difficulty - Challenge difficulty: Easy, Medium, or Hard (optional, default: "Medium")
   */
  async sendNewChallenge(challengeTitle, category = "General", difficulty = "Medium") {
    try {
      console.log(`🎯 Sending New Challenge notification for ${challengeTitle}...`);
      
      const html = generateNewChallengeHTML(challengeTitle, category, difficulty);
      
      return await sendDiscordWithHTML(
        WEBHOOKS.challenge,
        html,
        'new_challenge.html'
      );
    } catch (err) {
      console.error("Error in sendNewChallenge:", err);
      return false;
    }
  },

  /**
   * 🏅 CHALLENGE SOLVED - Sends solve notification (bonus feature)
   * @param {string} solverUsername - Username of the solver
   * @param {string} challengeTitle - Title of the challenge
   * @param {number} solveCount - Number of solves (optional)
   */
  async sendChallengeSolved(solverUsername, challengeTitle, solveCount = null) {
    try {
      console.log(`✅ Sending Challenge Solved notification for ${solverUsername}...`);
      
      const embed = {
        title: "✅ Challenge Solved",
        description: `**${solverUsername}** just solved **${challengeTitle}**! 🎉`,
        color: 0x00D166,
        fields: solveCount ? [
          {
            name: "🔢 Total Solves",
            value: `${solveCount} solver${solveCount !== 1 ? 's' : ''}`,
            inline: true
          }
        ] : [],
        footer: {
          text: "NETANIX CTF"
        },
        timestamp: new Date().toISOString()
      };

      await axios.post(WEBHOOKS.challenge, { embeds: [embed] });
      console.log("✅ Discord notification sent successfully");
      return true;
    } catch (err) {
      console.error("Error in sendChallengeSolved:", err);
      return false;
    }
  }
};
