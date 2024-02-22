const client = require("../../index.js");

client.on("ready", (event) => {
  console.log(`${event.user.username} esta online!`);
});
