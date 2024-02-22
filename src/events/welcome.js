const { EmbedBuilder } = require("discord.js");
const client = require("../../index.js");

// prettier-ignore
client.on("guildMemberAdd", (joinUser) => {
  const channelWelcome = client.channels.cache.get("1113655091090694234");
  const logWelcome = client.channels.cache.get("1114743489314439270");
  const embedWelcome = new EmbedBuilder().setColor("2b2d31")
    .setDescription(`### <:Feng:1122367321298706452> Seja bem-vindo(a) à nossa comunidade, <@${joinUser.id}> Sinta-se a vontade para interagir
		↪ Leia as regras em
		↪ Escolha o seu cargo em`);

  if (!joinUser.user.bot) {
    channelWelcome.send({ embeds: [embedWelcome] });
    logWelcome.send({ embeds: [embedWelcome] });
  }
});
