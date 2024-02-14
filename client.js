const { Client, GatewayIntentBits } = require('discord.js');

// 필요한 인텐트를 명시합니다.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent // 메시지 내용에 접근하기 위해 필요한 경우 추가
    ]
});

module.exports = client;
