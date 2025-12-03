const axios = require("axios");

// Your webhooks
const WEBHOOKS = {
  firstBlood: "https://discord.com/api/webhooks/1445795721881325731/b5V3RQbdLB0ZfNV_O3ivkNKTCDTOUcwB40J1Qeoqly-k-SDkXFTVLFyVhzF4cxGIS82h",
  challenge: "https://discord.com/api/webhooks/1445795960583225550/aM2M6IjDiRVtuyDDdfK4-i-otNmcE5ROpgPcy4AVO3F1YI5GscUWDiVGhUwXWpQGyI_c"
};

/**
 * Sends Discord embed message
 */
async function sendDiscordEmbed(webhook, embed) {
  try {
    await axios.post(webhook, { embeds: [embed] });
    console.log("✅ Discord notification sent successfully");
    return true;
  } catch (err) {
    console.error("❌ Discord Error:", err.response?.data || err.message);
    return false;
  }
}

module.exports = {
  /**
   * 🔥 FIRST BLOOD - Sends dramatic announcement
   * @param {string} solverUsername - Username of the solver
   * @param {string} challengeTitle - Title of the challenge
   */
  async sendFirstBlood(solverUsername, challengeTitle) {
    try {
      console.log(`🩸 Sending First Blood notification for ${solverUsername}...`);
      
      const embed = {
        title: "🩸 FIRST BLOOD",
        description: `### 🏆 ${solverUsername}\n\n**Conquered:** \`${challengeTitle}\`\n\n*The first warrior to draw blood in this challenge!*`,
        color: 0xDC143C, // Crimson red
        fields: [
          {
            name: "⚔️ Achievement",
            value: "First Blood",
            inline: true
          },
          {
            name: "🎯 Challenge",
            value: challengeTitle.length > 30 ? challengeTitle.substring(0, 30) + "..." : challengeTitle,
            inline: true
          },
          {
            name: "👤 Solver",
            value: solverUsername,
            inline: true
          }
        ],
        footer: {
          text: "🔥 NETANIX CTF • First Blood Event"
        },
        timestamp: new Date().toISOString()
      };

      return await sendDiscordEmbed(WEBHOOKS.firstBlood, embed);
    } catch (err) {
      console.error("Error in sendFirstBlood:", err);
      return false;
    }
  },

  /**
   * 🧩 NEW CHALLENGE - Sends beautiful challenge announcement
   * @param {string} challengeTitle - Title of the new challenge
   * @param {string} category - Challenge category (optional, default: "General")
   * @param {string} difficulty - Challenge difficulty: Easy, Medium, or Hard (optional, default: "Medium")
   */
  async sendNewChallenge(challengeTitle, category = "General", difficulty = "Medium") {
    try {
      console.log(`🎯 Sending New Challenge notification for ${challengeTitle}...`);
      
      // Difficulty colors and emojis
      const difficultyConfig = {
        Easy: { color: 0x2ECC71, emoji: "🟢" },
        Medium: { color: 0xF39C12, emoji: "🟡" },
        Hard: { color: 0xE74C3C, emoji: "🔴" }
      };

      const config = difficultyConfig[difficulty] || difficultyConfig.Medium;

      const embed = {
        title: "🆕 NEW CHALLENGE RELEASED",
        description: `## 🎯 ${challengeTitle}\n\nA new challenge awaits! Can you solve it?\n\n*Get ready to test your skills!*`,
        color: 0x3498DB, // Bright blue
        fields: [
          {
            name: "📂 Category",
            value: `\`${category}\``,
            inline: true
          },
          {
            name: "⚡ Difficulty",
            value: `${config.emoji} **${difficulty}**`,
            inline: true
          },
          {
            name: "📊 Status",
            value: "🟢 **LIVE NOW**",
            inline: true
          }
        ],
        footer: {
          text: "🧩 NETANIX CTF • New Challenge"
        },
        timestamp: new Date().toISOString()
      };

      return await sendDiscordEmbed(WEBHOOKS.challenge, embed);
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
        color: 0x00D166, // Green
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

      return await sendDiscordEmbed(WEBHOOKS.challenge, embed);
    } catch (err) {
      console.error("Error in sendChallengeSolved:", err);
      return false;
    }
  }
};
