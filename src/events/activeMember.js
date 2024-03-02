const { QuickDB } = require("quick.db");
const { join } = require("path");
const client = require("../../index.js");

const rootdir = process.cwd(); // Pega a pasta atual do arquivo principal que ta sendo executado

// Cria uma tabela para salvar os pontos em memberPoints
const database = {
  activeMember: new QuickDB({ table: "memberPoints", filePath: join(rootdir, "database/activeMember.sqlite") }),
};

// Função feita para gerar um número inteiro dentre um mínimo e máximo
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

// Cada mensagem enviada no servidor ele salva no banco de dados os pontos de acordo com os números passados
client.on("messageCreate", async (messageEvent) => {
  
  // Pegando o ID do usuário
  const userId = messageEvent.author.id;

  // Pega os canais da database
  const getChannelsId = await (await database.activeMember.tableAsync('channelsID')).get('channels');

  // Caso o usuário for um bot ele simplesmente não adiciona pontos parando aqui a execução
  if (messageEvent.author.bot) return;
  
  // Verifica se o getChannelsId não é null e também verifica se o Id do canal esta incluso no getChannelsId
  if (getChannelsId && getChannelsId.includes(messageEvent.channelId)) return;

  // Pegando o que foi armazenado na database e passando na variável
  const getActiveMember = await (await database.activeMember.tableAsync('memberPoints')).get(userId);

  // Caso a variável getActiveMember não exista valor algum ainda ele set o valor como points: 0
  if (!getActiveMember) {
    await (await database.activeMember.tableAsync('memberPoints')).set(userId, {
      points: 0,
    });
  }

  // Por fim ele adiciona pontos passando a função getRandomNumber()
  await (await database.activeMember.tableAsync('memberPoints')).add(`${userId}.points`, getRandomNumber(1, 5));
});