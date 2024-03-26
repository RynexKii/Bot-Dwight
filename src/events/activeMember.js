const { QuickDB } = require("quick.db");
const { join } = require("path");
const client = require("../../index.js");
const { EmbedBuilder } = require("discord.js");
const { activeMemberRoleId, guildId, activeMemberLogChannel } = require("../../config.json");

const rootdir = process.cwd(); // Pega a pasta atual do arquivo principal que ta sendo executado

// Criando 2 tabelas para salvar os pontos em memberBloods e salvar o tempo do cargo Membro Ativo em activeMemberDuration
const database = {
  activeMember: new QuickDB({ table: "memberBloods", filePath: join(rootdir, "database/activeMember.sqlite") }),
  activeMember: new QuickDB({ table: "activeMemberDuration", filePath: join(rootdir, "database/activeMember.sqlite") }),
};

// Variável criada para armazenar o ID do setInterval
let intervalID;

// Função feita para gerar um número inteiro dentre um mínimo e máximo
function getRandomNumber(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}

// Sempre que o bot for iniciado ele vai verificar se o membro registrado na database (timestamp) esta ainda conectando em um canal de voz
client.on("ready", async (interaction) => {
  const allMembersGuild = [];

  const guild = await interaction.guilds.cache.get(guildId);

  const res = await guild.members.fetch();
  res.forEach((member) => {
    allMembersGuild.push(member.user.id);
  });

  for (let index = 0; index < allMembersGuild.length; index++) {
    const membersId = allMembersGuild[index];

    const getMemberVoice = (await guild.members.fetch(membersId)).voice.channelId;

    const memberHasConnected = guild.channels.cache.has(getMemberVoice);

    // Função para adicionar os Bloods no usuário
    async function addBloodsDatabase() {
      await (await database.activeMember.tableAsync("memberBloods")).add(`${membersId}.bloods`, getRandomNumber(1, 2));
    }

    if (memberHasConnected === true) {
      intervalID = setInterval(() => {
        addBloodsDatabase();
      }, 60 * 1000);
    }
  }
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
  await (await database.activeMember.tableAsync("memberBloods")).add(`${userId}.bloods`, getRandomNumber(1, 2));
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  // Pegando o ID do usuário
  const userId = oldState.member.id;

  // Pegando os ID's dos canais que esta registrado na database
  const getChannelsId = await (await database.activeMember.tableAsync("channelsID")).get("allChannels");

  // Função para adicionar os Bloods no usuário
  async function addBloodsDatabase() {
    await (await database.activeMember.tableAsync("memberBloods")).add(`${userId}.bloods`, getRandomNumber(1, 2));
  }

  // Função que adiciona um setInterval de 60 segundos na função addBloodsDatabase()
  function addIntervalBloods() {
    intervalID = setInterval(() => {
      addBloodsDatabase();
    }, 60 * 1000);
  }

  // Caso o usuário for um bot ele simplesmente não adiciona pontos parando aqui a execução
  if (oldState.member.user.bot) return;

  // Verifica se o getChannelsId não esta vazio
  if (getChannelsId) {
    if (getChannelsId.includes(newState.channelId)) {
      clearInterval(intervalID);
      return;
    }

    if (getChannelsId.includes(oldState.channelId)) {
      addIntervalBloods();
    }
  }

  // Caso o canal antigo seja null ele chama a função addVoiceTimestamp()
  // oldState entrar > null / sair > id
  if (oldState.channelId === null) {
    addIntervalBloods();
  } // Entrou no canal

  // Caso o canal novo seja null ele chama a função addVoiceBloods()
  // newState entrar > id / sair > null
  if (newState.channelId === null) {
    clearInterval(intervalID);
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

client.on("ready", async () => {
  // Criado um Array vazio para armazenar o novo Array que será criado
  let newArrayMembers = [];

  // Criado um Array para armazenar a posição de cada usuário
  let rankPosition = 0;

  async function setMembers() {
    // Pegando todos os usuários que possui Bloods na database
    const allMembersDB = await (await database.activeMember.tableAsync("memberBloods")).all();

    // Chamando as 2 variáveis novamente para limpar elas
    newArrayMembers = [];
    rankPosition = 0;

    // Fazendo um for para passar pelo Array allMembersDB e criar um novo Array com as informações e armazenando no newArrayMembers
    for (let index = 0; index < allMembersDB.length; index++) {
      const element = allMembersDB[index];

      if (element.value.bloods > 0) {
        newArrayMembers.push({ userID: element.id, userBloods: element.value.bloods, userRank: 0 });
        newArrayMembers.sort((a, b) => b.userBloods - a.userBloods);
      }
    }

    // Percorendo o novo Array criado para poder adicionar a variável de rankPosition que servirá para adicionar os números para cada usuário em ordem
    newArrayMembers.forEach((element) => {
      element.userRank = rankPosition += 1;
    });

    // Por fim adicionando o newArrayMembers com todos os novos dados em uma nova tabela na database chamada memberBloodsRanks
    await (await database.activeMember.tableAsync("memberBloodsRanks")).set(guildId, newArrayMembers);
  }

  // Chamando a função assim que iniciar o bot
  setMembers();

  // Depois chamando a função em um loop de 5 minutos para ser atualizado a cada 5 minutos
  setInterval(() => {
    setMembers();
  }, 300 * 1000);
});
