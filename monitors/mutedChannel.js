const {Monitor} = require('klasa');

module.exports = class extends Monitor {

    constructor(...args) {
        super(...args, {
            name: 'mutedChannel',
            enabled: true,
            ignoreBots: false,
            ignoreSelf: true,
            ignoreOthers: false,
            ignoreWebhooks: true,
            ignoreEdits: true,
            ignoreBlacklistedUsers: false,
            ignoreBlacklistedGuilds: true
        });
    }

    run(message) {
        // Delete messages sent in channels that have -MUTED at the end of their name (muted channels)
        if (message.channel.name.endsWith("-muted"))
        {
            message.channel.send(`:x: This channel is currently muted. A 25-yang penalty was assessed.`)
                    .then((msg) => {
                        setTimeout(function () {
                            msg.delete();
                        }, 10000);
                    });
            message.delete();
        }
    }

    async init() {
    }

};


