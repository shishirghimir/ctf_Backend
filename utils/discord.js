const axios = require("axios");

// Your webhooks
const WEBHOOKS = {
  firstBlood: "https://discord.com/api/webhooks/1445795721881325731/b5V3RQbdLB0ZfNV_O3ivkNKTCDTOUcwB40J1Qeoqly-k-SDkXFTVLFyVhzF4cxGIS82h",
  challenge: "https://discord.com/api/webhooks/1445795960583225550/aM2M6IjDiRVtuyDDdfK4-i-otNmcE5ROpgPcy4AVO3F1YI5GscUWDiVGhUwXWpQGyI_c"
};

// Random flavor texts
const FIRST_BLOOD_TEXTS = [
  "The hunt begins — who's next?",
  "Lightning fast! ⚡",
  "Absolutely legendary! 🔥",
  "Speed demon! 💨",
  "First strike! 🎯",
  "Elite hacker energy! 💻",
  "Pure domination! 👑",
  "Unstoppable! 🚀"
];

const CHALLENGE_TEXTS = [
  "Can you be the first to solve it?",
  "Time to show your skills! 💪",
  "The race is on! 🏃",
  "Who will crack it first? 🤔",
  "Fresh challenge, fresh glory! ✨",
  "Ready for the hunt? 🎯",
  "Prove your worth! ⚔️",
  "The gauntlet has been thrown! 🔥"
];

/**
 * Get random text from array
 */
function getRandomText(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

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
   * 🔥 FIRST BLOOD — EPIC, BOLD, CLEAN
   */
  async sendFirstBlood(solverUsername, challengeTitle) {
    try {
      const embed = {
        title: `🩸 **FIRST BLOOD CLAIMED!**`,
        description: `## 🏆 **${solverUsername}**\n\n> *Drew the first drop of blood on:*`,
        color: 0xDC143C,
        fields: [
          { name: "🎯 Challenge", value: `# **${challengeTitle}**`, inline: false },
          { name: "\u200B", value: `*${getRandomText(FIRST_BLOOD_TEXTS)}*`, inline: false },
          { name: "⚔️ Achievement", value: "`FIRST BLOOD`", inline: true },
          { name: "👤 Solver", value: `**${solverUsername}**`, inline: true }
        ],
        image: {
          url: "https://i.imgur.com/OBiq3ap.png"
        },
        footer: {
          text: "🔥 NETANIX CTF • First Blood Event",
          icon_url: "https://i.imgur.com/OBiq3ap.png"
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
   * 🩸 BLOOD NOTIFICATION — FIRST BLOOD ONLY
   */
  async sendBloodNotification(solveCount, solverUsername, challengeTitle) {
    try {
      if (solveCount === 1) return await this.sendFirstBlood(solverUsername, challengeTitle);
      return false;
    } catch (err) {
      console.error("Error in sendBloodNotification:", err);
      return false;
    }
  },

  /**
   * 🧩 NEW CHALLENGE — CLEAN STRUCTURE
   */
  async sendNewChallenge(challengeTitle) {
    try {
      console.log(`🎯 Sending New Challenge: ${challengeTitle}`);

      const embed = {
        title: `🔥 **NEW CHALLENGE UNLOCKED!**`,
        description: `## 🎯 **${challengeTitle}**\n\n> *A new challenge has dropped!*`,
        color: 0x3498DB,
        fields: [
          { name: "\u200B", value: `**${getRandomText(CHALLENGE_TEXTS)}**`, inline: false }
        ],
        image: {
          url: "https://imgur.com/0RxJhgJ"
        },
        footer: {
          text: "🧩 NETANIX CTF • New Challenge",
          icon_url: "https://imgur.com/0RxJhgJ"
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
   * 🏅 CHALLENGE SOLVED
   */
  async sendChallengeSolved(solverUsername, challengeTitle, solveCount = null) {
    try {
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
      return await sendDiscordEmbed(WEBHOOKS.challenge, embed);
    } catch (err) {
      console.error("Error in sendChallengeSolved:", err);
      return false;
    }
  }
};
