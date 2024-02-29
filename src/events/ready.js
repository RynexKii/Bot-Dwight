const { ActivityType, Guild } = require("discord.js");
const { guildId } = require("../../config.json");
const client = require("../../index.js");

client.on("ready", (event) => {

  // Deixando o bot no status de ocupado
  client.user.setStatus('dnd')

  // Pegando o total de membros no servidor e exibindo no status do bot com um daley de 30 segundos para atualizar
  setInterval(() => {
    const totalMember = client.guilds.cache.get(guildId).memberCount
    
    client.user.setActivity({
      name: `${totalMember} membros em nossa comunidade`,
      type: ActivityType.Playing,
    })
  }, 1000 * 30)

  // Apenas um log no console para saber se o bot esta online
  console.log(`✅ ${event.user.username} esta online!`);
});