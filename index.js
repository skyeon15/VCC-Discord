const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');
const { discord } = require('./config.json');

// 새로운 클라이언트 생성
const client = require('./client.js')

// 명령어 폴더 불러오기
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// 클라이언트 준비시 첫 실행
client.once('ready', () => {
	console.log('VCC 에케봇 준비 완료!');
	client.user.setActivity({
		name: discord.playing,
		type: 'PLAYING'
	})

	// // 업타임
	// setInterval(function () {
	// 	if (client.user.presence.status === 'online') {
	// 		axios.get(`http://10.15.0.1:3001/api/push/${discord.status}?status=up&msg=OK&ping=`)
	// 		.catch((error)=>{
	// 			console.log(error?.stack)
	// 		})
	// 	}
	// }, 60000); // 60초마다 실행
})

// 명령어 수신
client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	// console.log(`[${new Date().toISOString().slice(0, 19).replace('T', ' ')}] ${interaction.user.username}(${interaction.guild.name}): /${interaction.commandName} ${JSON.stringify(interaction.options.data[0])}`)

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
	}
})

// 토큰 로그인
client.login(discord.token)