const { QuickDB } = require("quick.db");
const { join } = require("path");
const client = require("../../index.js");
const { EmbedBuilder } = require("discord.js");
const { activeMemberRoleId, guildId, activeMemberLogChannel } = require("../../config.json");

const rootdir = process.cwd(); // Pega a pasta atual do arquivo principal que ta sendo executado

// Criando 2 tabelas para salvar os pontos em memberBloods e salvar o tempo em Unix no memberTimestamp
const database = {
  activeMember: new QuickDB({ table: "memberBloods", filePath: join(rootdir, "database/activeMember.sqlite") }),
  activeMember: new QuickDB({ table: "memberTimestamp", filePath: join(rootdir, "database/activeMember.sqlite") }),
  activeMember: new QuickDB({ table: "activeMemberDuration", filePath: join(rootdir, "database/activeMember.sqlite") }),
};

// Função feita para gerar um número inteiro dentre um mínimo e máximo
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

// Limpa a tabela memberTimestamp toda a vez que o bot é iniciado (Caso o bot desligue do nada ele reseta o tempo de todos)
client.on("ready", async () => {
  await (await database.activeMember.tableAsync("memberTimestamp")).deleteAll();
});

// Cada mensagem enviada no servidor ele salva no banco de dados os pontos de acordo com os números passados
client.on("messageCreate", async (messageEvent) => {
  // Pegando o ID do usuário
  const userId = messageEvent.author.id;

  // Pega os canais da database
  const getChannelsId = await (await database.activeMember.tableAsync("channelsID")).get("allChannels");

  // Caso o usuário for um bot ele simplesmente não adiciona pontos parando aqui a execução
  if (messageEvent.author.bot) return;

  // Verifica se o getChannelsId não é null e também verifica se o Id do canal esta incluso no getChannelsId
  if (getChannelsId && getChannelsId.includes(messageEvent.channelId)) return;

  // Por fim ele adiciona pontos passando a função getRandomNumber()
  await (await database.activeMember.tableAsync("memberBloods")).add(`${userId}.bloods`, getRandomNumber(1, 3));
});

// Quando um usuário entra em uma sala de voz ele vai chegar o tempo de quando entrou e saiu e vai dar pontos por esse tempo
client.on("voiceStateUpdate", async (oldState, newState) => {
  // Pegando o ID do usuário
  const userId = oldState.member.id;

  // Pegando os ID's dos canais que esta registrado na database
  const getChannelsId = await (await database.activeMember.tableAsync("channelsID")).get("allChannels");

  // Pegando o Timestamp de um usuário
  const getTimestamp = await (await database.activeMember.tableAsync("memberTimestamp")).get(userId);

  // Armazenando o timestamp atual na variável
  const timestamp = +new Date();

  // Função usada para criar a tabela joinTimestamp e armazenar o timestamp nela
  async function addVoiceTimestamp() {
    if (!getTimestamp) {
      await (
        await database.activeMember.tableAsync("memberTimestamp")
      ).set(userId, {
        joinTimestamp: 0,
      });
    }

    await (await database.activeMember.tableAsync("memberTimestamp")).add(`${userId}.joinTimestamp`, timestamp);
  }

  // Função uasada para armazenar os pontos em bloods na database e no final deleta o memberTimestamp do usuário
  async function addVoiceBloods() {
    if (getTimestamp !== null) {
      let getMinutesConnected = Math.round((timestamp - getTimestamp.joinTimestamp) / 1000 / 60);

      await (await database.activeMember.tableAsync("memberBloods")).add(`${userId}.bloods`, getMinutesConnected * getRandomNumber(1, 3));
    }

    await (await database.activeMember.tableAsync("memberTimestamp")).delete(userId);
  }

  // Caso o usuário for um bot ele simplesmente não adiciona pontos parando aqui a execução
  if (oldState.member.user.bot) return;

  // Verifica se o getChannelsId não esta vazio
  if (getChannelsId) {
    if (getChannelsId.includes(newState.channelId)) {
      addVoiceBloods();
      return;
    }

    if (getChannelsId.includes(oldState.channelId)) {
      addVoiceTimestamp();
    }
  }

  // Caso o canal antigo seja null ele chama a função addVoiceTimestamp()
  // oldState entrar > null / sair > id
  if (oldState.channelId === null) {
    addVoiceTimestamp();
  } // Entrou no canal

  // Caso o canal novo seja null ele chama a função addVoiceBloods()
  // newState entrar > id / sair > null
  if (newState.channelId === null) {
    addVoiceBloods();
  } // Saiu do canal
});

// Quando um canal é deletado verifica se o canal existe na database para poder removelo dos Arrays
client.on("channelDelete", async (channel) => {
  // Pega o ID do canal que foi deletado
  const deletedChannel = channel.id;

  // Pega os ID's do Array allChannels
  const getAllChannels = await (await database.activeMember.tableAsync("channelsID")).get("allChannels");

  // Verifica se existe o ID do canal deletado no Array allChannels e caso tenha deleta o canal de todos os Arrays
  if (getAllChannels.includes(deletedChannel)) {
    await (await database.activeMember.tableAsync("channelsID")).pull("allChannels", deletedChannel);
    await (await database.activeMember.tableAsync("channelsID")).pull("textChannels", deletedChannel);
    await (await database.activeMember.tableAsync("channelsID")).pull("voiceChannels", deletedChannel);
  }
});

// Quando o bot ficar on vai rodar uma função que tira quem estiver com o cargo de Membro Ativo expirado
client.on("ready", async () => {
  // Função para remover o cargo de Membro Ativo após 30 dias da compra
  async function removeActiveMember() {
    // Pega os usuário que estão com o cargo (activeMemberRoleId)
    const getMemberRole = (await client.guilds.cache.get(guildId)?.members.fetch())?.filter((m) => m.roles.cache.has(activeMemberRoleId));

    // Pega os ID's dos usuários e retorna um Array com os ID's
    const getMembersID = getMemberRole.map((user) => user.id);

    // Pega o exato momento o dia em timestamp
    const getTimestampToday = Math.round(+new Date() / 1000);

    // Percorre cada usuário passando para uma nova variável cada ID
    for (let index = 0; index < getMembersID.length; index++) {
      // Variável que armazena o ID percorrido
      const memberID = getMembersID[index];

      // Pega o timestamp que esta armazenado na database do usuário
      const getTimestampMember = await (await database.activeMember.tableAsync("activeMemberDuration")).get(`${memberID}.timestampDuration`);

      // Caso o usuário tenha um timestamp na database cai nesse if
      if (getTimestampMember) {
        // Caso o timestamp do dia atual seja menor que o da database do usuário ele cai nesse if
        if (getTimestampMember < getTimestampToday) {
          // Remove o cargo do usuário
          client.guilds.cache.get(guildId).members.cache.get(memberID).roles.remove(activeMemberRoleId);

          // Remove a tabela activeMemberDuration do usuário
          await (await database.activeMember.tableAsync("activeMemberDuration")).delete(memberID);

          // Parte de logs Staff
          const channel = client.channels.cache.get(activeMemberLogChannel);

          const embedLogActiveMember = new EmbedBuilder()
            .setDescription(`### <:remove:1212567045695213629> [Log] O cargo de <@&${activeMemberRoleId}> de <@${memberID}> chegou ao fim.`)
            .setColor("#ff0000");

          channel.send({ embeds: [embedLogActiveMember] });
        }
      }
    }
  }

  // Chama a função a cada 1 minuto
  setInterval(() => {
    removeActiveMember();
  }, 60 * 1000);
});
