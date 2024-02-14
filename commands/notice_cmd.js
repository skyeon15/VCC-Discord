const { SlashCommandBuilder } = require('@discordjs/builders');
const { scheduleJob } = require('node-schedule');
const client = require('../client');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('공지')
    .setDescription('공지를 써요.')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('어떤 것을 공지할까요?')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('mentions')
        .setDescription('멘션할 사용자들 또는 역할을 입력하세요. 예: <@123456789012345678> <@&876543210987654321>')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('time')
        .setDescription('언제 공지할까요? (YYYY-MM-DD HH:MM 형식, 선택사항)')
        .setRequired(false)
    )
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('메시지를 보낼 채널을 선택하세요. (선택사항)')
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true }) // 답변 대기

    const message = interaction.options.getString('message');
    const timeString = interaction.options.getString('time');
    const mentionsString = interaction.options.getString('mentions');
    const channelOption = interaction.options.getChannel('channel');

    // 시간 형식 검증
    if (timeString && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(timeString)) {
      await interaction.editReply({ content: '시간 형식이 올바르지 않습니다. YYYY-MM-DD HH:MM 형식을 사용해주세요.', ephemeral: true });
      return;
    }

    const scheduleTime = timeString ? new Date(timeString) : new Date();
    if (timeString && isNaN(scheduleTime.getTime())) {
      await interaction.editReply({ content: '유효하지 않은 날짜입니다. 시간을 올바르게 입력해주세요.', ephemeral: true });
      return;
    }

    // 멘션 문자열에서 사용자와 역할 ID 추출
    const userMentions = mentionsString.match(/<@!?(\d+)>/g) || [];
    const roleMentions = mentionsString.match(/<@&(\d+)>/g) || [];
    const userIds = new Set(userMentions.map(mention => mention.replace(/<@!?(\d+)>/, '$1')));

    // 역할에 속한 사용자 ID 추출
    for (const roleMention of roleMentions) {
      const roleId = roleMention.replace(/<@&(\d+)>/, '$1');
      const role = await interaction.guild.roles.fetch(roleId).catch(console.error);
      if (role) {
        role.members.forEach(member => userIds.add(member.id));
      }
    }

    if (channelOption) {
      // 채널이 지정된 경우, 채널에 즉시 메시지 전송
      await channelOption.send(message);
      await interaction.editReply({ content: `메시지를 ${channelOption.name} 채널에 전송했어요.`, ephemeral: true });
    }
    if (timeString && scheduleTime > new Date()) {
      // 예약 전송 로직
      scheduleJob(scheduleTime, function() {
        userIds.forEach(userId => {
          sendDirectMessage(userId, message).catch(console.error);
        });
      });
      if(channelOption){
        await interaction.editReply(`공지를 ${channelOption.name} 채널에 전송한 후 ${timeString}에 예약했어요: "${message}"`);
      }else{
        await interaction.editReply(`공지를 ${timeString}에 예약했어요: "${message}"`);
      }
    } else {
      // 시간이 지정되지 않았거나 과거인 경우, 멘션된 사용자들에게 즉시 DM 전송
      userIds.forEach(userId => {
        sendDirectMessage(userId, message).catch(console.error);
      });
      await interaction.editReply(`공지를 즉시 모든 이용자에게 전송했어요: "${message}"`);
    }
  }
}

// 사용자 ID를 사용하여 DM을 보내는 함수
async function sendDirectMessage(userId, message) {
  try {
    const user = await client.users.fetch(userId);
    await user.send(message);
    console.log(`DM 전송 선공: ${user.tag}`);
  } catch (error) {
    console.error(`DM 전송 실패: ${error}`);
  }
}