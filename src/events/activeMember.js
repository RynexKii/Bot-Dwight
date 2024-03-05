const { QuickDB } = require("quick.db");
const { join } = require("path");
const client = require("../../index.js");

const rootdir = process.cwd(); // Pega a pasta atual do arquivo principal que ta sendo executado

// Criando 2 tabelas para salvar os pontos em memberPoints e salvar o tempo em Unix no memberTimestamp
const database = {
  activeMember: new QuickDB({ table: "memberPoints", filePath: join(rootdir, "database/activeMember.sqlite") }),
  activeMember: new QuickDB({ table: "memberTimestamp", filePath: join(rootdir, "database/activeMember.sqlite") }),
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
  await (await database.activeMember.tableAsync("memberPoints")).add(`${userId}.points`, getRandomNumber(1, 5));
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

  // Função uasada para armazenar os pontos em points na database e no final deleta o memberTimestamp do usuário
  async function addVoicePoints() {
    if (getTimestamp !== null) {
      let getMinutesConnected = Math.round((timestamp - getTimestamp.joinTimestamp) / 1000 / 60);

      await (await database.activeMember.tableAsync("memberPoints")).add(`${userId}.points`, getMinutesConnected * getRandomNumber(1, 5));
    }

    await (await database.activeMember.tableAsync("memberTimestamp")).delete(userId);
  }

  // Caso o usuário for um bot ele simplesmente não adiciona pontos parando aqui a execução
  if (oldState.member.user.bot) return;

  // Verifica se o getChannelsId não esta vazio
  if (getChannelsId) {
    if (getChannelsId.includes(newState.channelId)) {
      addVoicePoints();
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

  // Caso o canal novo seja null ele chama a função addVoicePoints()
  // newState entrar > id / sair > null
  if (newState.channelId === null) {
    addVoicePoints();
  } // Saiu do canal
});
