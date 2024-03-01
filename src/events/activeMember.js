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
  const memberID = messageEvent.author.id;

  // Caso o usuário for um bot ele simplesmente não adiciona pontos parando aqui a execução
  if (messageEvent.author.bot) return;

  // Pegando o que foi armazenado na database e passando na variável
  const getActiveMember = await (await database.activeMember.tableAsync('memberPoints')).get(memberID);

  // Caso a variável getActiveMember não exista valor algum ainda ele set o valor como points: 0
  if (!getActiveMember) {
    await (await database.activeMember.tableAsync('memberPoints')).set(memberID, {
      points: 0,
    });
  }

  // Por fim ele adiciona pontos passando a função getRandomNumber()
  await (await database.activeMember.tableAsync('memberPoints')).add(`${memberID}.points`, getRandomNumber(1, 5));
});