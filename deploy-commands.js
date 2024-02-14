const fs = require('node:fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { discord } = require('./config.json');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(JSON.parse(JSON.stringify(command.data)));
}

const rest = new REST({ version: '9' }).setToken(discord.token);

(async () => {
    try {
        if (process.argv.includes('-c')) {
            // 개발용 서버 명령어 초기화
            await rest.put(Routes.applicationGuildCommands(discord.clientId, discord.guildId), {
                body: []
            })
            return console.log(`${discord.guildId} 명령어 초기화 성공.`)
        } else if (process.argv.includes('-g')) {
            // 전역 명령어 등록
            await rest.put(Routes.applicationCommands(discord.clientId), {
                body: commands
            })
            return console.log(`전역 명령어 등록 성공.`)
        } else {
            // 개발용 서버 명령어 등록
            await rest.put(Routes.applicationGuildCommands(discord.clientId, discord.guildId), {
                body: commands
            })
            return console.log(`${discord.guildId} 명령어 등록 성공.`)
        }
    } catch (error) {
        console.log(error?.stack)
    } finally {
        process.exit()
    }
})()