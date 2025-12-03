const axios = require("axios");

// Your webhooks
const WEBHOOKS = {
  firstBlood: "https://discord.com/api/webhooks/1445795721881325731/b5V3RQbdLB0ZfNV_O3ivkNKTCDTOUcwB40J1Qeoqly-k-SDkXFTVLFyVhzF4cxGIS82h",
  challenge: "https://discord.com/api/webhooks/1445795960583225550/aM2M6IjDiRVtuyDDdfK4-i-otNmcE5ROpgPcy4AVO3F1YI5GscUWDiVGhUwXWpQGyI_c"
};

async function sendDiscordEmbed(webhook, embed) {
  try {
    await axios.post(webhook, { embeds: [embed] });
  } catch (err) {
    console.error("Discord Error:", err.response?.data || err.message);
  }
}

module.exports = {
  // 🔥 FIRST BLOOD
  sendFirstBlood(solverUsername, challengeTitle) {
    const embed = {
      title: "🩸 FIRST BLOOD!",
      description: `**${solverUsername}** just achieved **FIRST BLOOD** on **${challengeTitle}**!`,
      color: 0xFF0000,
      thumbnail: { url: "https://i.imgur.com/2yaf2zK.png" },
      footer: { text: "Netanix CTF — First Blood Event" },
      timestamp: new Date().toISOString()
    };

    return sendDiscordEmbed(WEBHOOKS.firstBlood, embed);
  },

  // 🧩 NEW CHALLENGE — (No creator name)
  sendNewChallenge(challengeTitle) {
    const embed = {
      title: "🧩 New Challenge Released!",
      description: `A new challenge is now live: **${challengeTitle}**`,
      color: 0x3498DB,
      thumbnail: { url: "https://i.imgur.com/zfQxQDj.png" },
      footer: { text: "Netanix CTF — Challenge Update" },
      timestamp: new Date().toISOString()
    };

    return sendDiscordEmbed(WEBHOOKS.challenge, embed);
  },
};
