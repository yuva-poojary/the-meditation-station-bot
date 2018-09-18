const {Monitor} = require('klasa');

module.exports = class extends Monitor {

    constructor(...args) {
        super(...args, {
            name: 'verifiedRole',
            enabled: true,
            ignoreBots: true,
            ignoreSelf: true,
            ignoreOthers: false,
            ignoreWebhooks: true,
            ignoreEdits: true,
            ignoreBlacklistedUsers: false,
            ignoreBlacklistedGuilds: true
        });
    }

    run(message) {

        const verified = message.guild.settings.get(`verifiedRole`);
        const verifiedRole = message.guild.roles.get(verified);
        if (verifiedRole)
        {
            if (!message.member.roles.get(verifiedRole.id))
                message.member.roles.add(verifiedRole, `Member is verified`);
        }
    }

    async init() {
    }

};

