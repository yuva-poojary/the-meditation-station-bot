const { Event } = require('klasa');
const { MessageEmbed } = require("discord.js");

module.exports = class extends Event {

    async run (message) {
        if (!message.member)
            return null;

        if (!message.author.bot) {
            // Remove all good rep earned from reactions, if any.
            console.log(`Rep remove all`);
            var removeRep = false;
            message.reactions
                .each((reaction) => {
                    if (reaction.me)
                        removeRep = true;
                });

            if (removeRep) {
                console.log(`Remove all rep`);
                const noRep = reaction.message.guild.settings.noRep
                const noRepRole = reaction.message.guild.roles.resolve(noRep)
                message.reactions
                    .filter((reaction) => reaction.emoji.id === reaction.message.guild.settings.repEmoji && !reaction.me && reaction.message.author.id !== message.author.id && (!noRepRole || !reaction.message.member.roles.get(noRepRole.id)))
                    .each((reaction) => {
                        console.log(`A rep removed`);
                        message.member.settings.update('goodRep', message.member.settings.goodRep - 1);
                    });
            }
        }

        // Remove all starboard
        const msg = message;
        const { guild } = msg;
        if (guild && guild.settings.starboardChannel) {

            const starChannel = msg.guild.channels.get(msg.guild.settings.starboardChannel);
            if (starChannel && starChannel.postable && starChannel.embedable && !msg.channel.nsfw) {

                const fetch = await starChannel.messages.fetch({ limit: 100 });
                const starMsg = fetch.find(m => m.embeds.length && m.embeds[ 0 ].footer && m.embeds[ 0 ].footer.text.startsWith("â­") && m.embeds[ 0 ].footer.text.endsWith(msg.id));
                if (starMsg) {
                    const oldMsg = await starChannel.messages.fetch(starMsg.id).catch(() => null);
                    await oldMsg.delete();
                }
            }
        }
    }
};