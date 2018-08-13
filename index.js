const { Client } = require('klasa');

new Client({
    clientOptions: {
        fetchAllMembers: false
    },
    prefix: '!',
    cmdEditing: true,
    typing: true,
    cmdPrompt: true,
    promptTime: 60000,
    readyMessage: (client) => `${client.user.tag}, Ready to serve ${client.guilds.size} guilds and ${client.users.size} users`
}).login(process.env.BOT_TOKEN);