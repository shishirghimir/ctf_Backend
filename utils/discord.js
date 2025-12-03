const axios = require("axios");
const puppeteer = require("puppeteer");

// Your webhooks
const WEBHOOKS = {
  firstBlood: "https://discord.com/api/webhooks/1445795721881325731/b5V3RQbdLB0ZfNV_O3ivkNKTCDTOUcwB40J1Qeoqly-k-SDkXFTVLFyVhzF4cxGIS82h",
  challenge: "https://discord.com/api/webhooks/1445795960583225550/aM2M6IjDiRVtuyDDdfK4-i-otNmcE5ROpgPcy4AVO3F1YI5GscUWDiVGhUwXWpQGyI_c"
};

/**
 * Generates First Blood HTML card
 */
function generateFirstBloodHTML(solverUsername, challengeTitle) {
  return `
<!DOCTYPE html>
<html>
<head>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            width: 500px;
            height: 280px;
            background: linear-gradient(135deg, #1a0000 0%, #330000 50%, #1a0000 100%);
            position: relative;
            overflow: hidden;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .first-blood-title {
            position: absolute;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 56px;
            font-weight: 900;
            color: #ff0000;
            text-shadow: 0 0 20px rgba(255, 0, 0, 0.8), 0 0 40px rgba(255, 0, 0, 0.6);
            letter-spacing: 6px;
            white-space: nowrap;
        }
        .blood-drip {
            position: absolute;
            width: 4px;
            background: linear-gradient(to bottom, #ff0000 0%, transparent 100%);
        }
        .blood-drip-1 { height: 40px; top: 110px; left: 35%; }
        .blood-drip-2 { height: 50px; top: 110px; left: 50%; }
        .blood-drip-3 { height: 35px; top: 110px; left: 65%; }
        .blood-drip-4 { height: 45px; top: 110px; left: 42%; }
        .blood-drip-5 { height: 38px; top: 110px; left: 58%; }
        .blood-puddle {
            position: absolute;
            top: 110px;
            left: 50%;
            transform: translateX(-50%);
            width: 350px;
            height: 8px;
            background: radial-gradient(ellipse, rgba(255, 0, 0, 0.8) 0%, transparent 70%);
            filter: blur(2px);
        }
        .first-blood-info {
            position: absolute;
            bottom: 50px;
            left: 30px;
            right: 30px;
            text-align: center;
        }
        .solver-name {
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
            margin-bottom: 10px;
        }
        .challenge-solved {
            font-size: 16px;
            color: #ff6b6b;
            font-weight: 500;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
        }
        .challenge-name {
            color: #ffffff;
            font-weight: 700;
        }
        .netanix-badge {
            position: absolute;
            bottom: 20px;
            right: 25px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .particle {
            position: absolute;
            width: 3px;
            height: 3px;
            background: rgba(255, 0, 0, 0.6);
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
        }
        .particle:nth-child(1) { left: 10%; top: 20%; }
        .particle:nth-child(2) { left: 85%; top: 30%; }
        .particle:nth-child(3) { left: 20%; top: 70%; }
        .particle:nth-child(4) { left: 90%; top: 60%; }
        .particle:nth-child(5) { left: 15%; top: 85%; }
    </style>
</head>
<body>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    
    <div class="first-blood-title">FIRST BLOOD</div>
    
    <div class="blood-puddle"></div>
    <div class="blood-drip blood-drip-1"></div>
    <div class="blood-drip blood-drip-2"></div>
    <div class="blood-drip blood-drip-3"></div>
    <div class="blood-drip blood-drip-4"></div>
    <div class="blood-drip blood-drip-5"></div>
    
    <div class="first-blood-info">
        <div class="solver-name">🏆 ${solverUsername}</div>
        <div class="challenge-solved">
            solved <span class="challenge-name">"${challengeTitle}"</span>
        </div>
    </div>
    
    <div class="netanix-badge">NETANIX CTF</div>
</body>
</html>
  `;
}

/**
 * Generates New Challenge HTML card
 */
function generateChallengeHTML(challengeTitle, category = "General", difficulty = "Medium") {
  const difficultyColors = {
    Easy: "#2ecc71",
    Medium: "#f39c12",
    Hard: "#e74c3c"
  };

  return `
<!DOCTYPE html>
<html>
<head>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            width: 500px;
            height: 280px;
            background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
            position: relative;
            overflow: hidden;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .challenge-glow {
            position: absolute;
            width: 300px;
            height: 300px;
            top: -100px;
            left: 50%;
            transform: translateX(-50%);
            background: radial-gradient(circle, rgba(52, 152, 219, 0.3) 0%, transparent 70%);
        }
        .challenge-icon {
            position: absolute;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 60px;
        }
        .challenge-header {
            position: absolute;
            top: 110px;
            left: 30px;
            right: 30px;
            text-align: center;
        }
        .new-badge {
            display: inline-block;
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            padding: 6px 20px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
        }
        .challenge-title {
            font-size: 32px;
            font-weight: 800;
            color: #ffffff;
            margin: 15px 0;
            text-shadow: 0 2px 20px rgba(0, 0, 0, 0.8);
        }
        .challenge-details {
            position: absolute;
            bottom: 30px;
            left: 30px;
            right: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .detail-box {
            flex: 1;
            text-align: center;
        }
        .detail-label {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
            font-weight: 600;
        }
        .detail-value {
            font-size: 18px;
            color: #ffffff;
            font-weight: 700;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
        }
        .difficulty {
            color: ${difficultyColors[difficulty] || difficultyColors.Medium};
        }
        .netanix-badge {
            position: absolute;
            bottom: 20px;
            right: 25px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        .particle {
            position: absolute;
            width: 3px;
            height: 3px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
        }
        .particle:nth-child(1) { left: 10%; top: 20%; }
        .particle:nth-child(2) { left: 30%; top: 60%; }
        .particle:nth-child(3) { left: 50%; top: 40%; }
        .particle:nth-child(4) { left: 70%; top: 70%; }
        .particle:nth-child(5) { left: 90%; top: 30%; }
    </style>
</head>
<body>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    
    <div class="challenge-glow"></div>
    
    <div class="challenge-icon">🎯</div>
    
    <div class="challenge-header">
        <div class="new-badge">🆕 NEW CHALLENGE</div>
        <div class="challenge-title">${challengeTitle}</div>
    </div>
    
    <div class="challenge-details">
        <div class="detail-box">
            <div class="detail-label">Category</div>
            <div class="detail-value">${category}</div>
        </div>
        <div class="detail-box">
            <div class="detail-label">Difficulty</div>
            <div class="detail-value difficulty">${difficulty}</div>
        </div>
        <div class="detail-box">
            <div class="detail-label">Status</div>
            <div class="detail-value">LIVE</div>
        </div>
    </div>
    
    <div class="netanix-badge">NETANIX CTF</div>
</body>
</html>
  `;
}

/**
 * Converts HTML to PNG using Puppeteer
 */
async function htmlToImage(html) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 500, height: 280 });
    await page.setContent(html);
    
    const screenshot = await page.screenshot({
      type: 'png',
      omitBackground: false
    });
    
    return screenshot;
  } finally {
    await browser.close();
  }
}

/**
 * Sends Discord message with image attachment
 */
async function sendDiscordWithImage(webhook, imageBuffer, filename) {
  try {
    const FormData = require('form-data');
    const form = new FormData();
    
    form.append('file', imageBuffer, {
      filename: filename,
      contentType: 'image/png'
    });
    
    await axios.post(webhook, form, {
      headers: form.getHeaders()
    });
    
    console.log(`✅ Discord notification sent successfully: ${filename}`);
  } catch (err) {
    console.error("❌ Discord Error:", err.response?.data || err.message);
    throw err;
  }
}

module.exports = {
  /**
   * 🔥 FIRST BLOOD - Sends amazing visual card
   * @param {string} solverUsername - Username of the solver
   * @param {string} challengeTitle - Title of the challenge
   */
  async sendFirstBlood(solverUsername, challengeTitle) {
    try {
      console.log(`🩸 Generating First Blood card for ${solverUsername}...`);
      
      const html = generateFirstBloodHTML(solverUsername, challengeTitle);
      const imageBuffer = await htmlToImage(html);
      
      await sendDiscordWithImage(
        WEBHOOKS.firstBlood,
        imageBuffer,
        'first_blood.png'
      );
    } catch (err) {
      console.error("Error sending First Blood notification:", err);
      throw err;
    }
  },

  /**
   * 🧩 NEW CHALLENGE - Sends amazing visual card
   * @param {string} challengeTitle - Title of the new challenge
   * @param {string} category - Challenge category (optional)
   * @param {string} difficulty - Challenge difficulty: Easy, Medium, or Hard (optional)
   */
  async sendNewChallenge(challengeTitle, category = "General", difficulty = "Medium") {
    try {
      console.log(`🎯 Generating New Challenge card for ${challengeTitle}...`);
      
      const html = generateChallengeHTML(challengeTitle, category, difficulty);
      const imageBuffer = await htmlToImage(html);
      
      await sendDiscordWithImage(
        WEBHOOKS.challenge,
        imageBuffer,
        'new_challenge.png'
      );
    } catch (err) {
      console.error("Error sending New Challenge notification:", err);
      throw err;
    }
  }
};
