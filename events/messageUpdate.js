const {Event} = require('klasa');
const {MessageEmbed} = require('discord.js');
var jsdiff = require('diff');
const moment = require("moment");

module.exports = class extends Event {

    async run(old, message) {
        // First, update spam score if new score is bigger than old score. Do NOT update if new score is less than old score; we don't want to lower it.
        if (typeof message.member !== 'undefined')
        {
            var oldscore = old.spamScore;
            var newscore = message.spamScore;
            if (newscore > oldscore)
            {
                var diff = newscore - oldscore;
                message.member.spamScore(diff, message);
            }
        }

        // Update XP/Yang
        if (typeof message.member !== 'undefined')
        {
            var xp1 = old.xp;
            var xp2 = message.xp;
            if (xp2 - xp1 !== 0)
                message.member.xp(xp2 - xp1, message);
        }

        if (this.client.ready && old.content !== message.content)
            this.client.monitors.run(message);

        // Skip the bot
        if (message.author.id === this.client.user.id)
            return;

        // Get the configured modLog channel.
        const modLog = message.guild.settings.get('modLogChannel');

        // End if there is no configured channel
        if (!modLog)
            return;

        var display = new MessageEmbed()
                .setTitle(`Old Message`)
                .setDescription(`${old.cleanContent}`)
                .setAuthor(message.author.tag, message.author.displayAvatarURL())
                .setFooter(`Message created **${message.createdAt}** in channel **${message.channel.name}**`);

        const _channel = this.client.channels.get(modLog);

        // First, determine any attachment changes
        var oldAttachments = [];
        var newAttachments = [];

        old.attachments.array().forEach(function (attachment) {
            oldAttachments.push(attachment.url);
        });

        message.attachments.array().forEach(function (attachment) {
            newAttachments.push(attachment.url);
        });

        oldAttachments.forEach(function (attachment) {
            if (newAttachments.indexOf(attachment) === -1)
                display.addField(`Attachment removed`, attachment);
        });

        newAttachments.forEach(function (attachment) {
            if (oldAttachments.indexOf(attachment) === -1)
                display.addField(`Attachment added`, attachment);
        });

        // Next, determine embed changes

        var oldEmbeds = [];
        var newEmbeds = [];

        old.embeds.forEach(function (embed) {
            oldEmbeds.push(JSON.stringify(embed));
        });

        message.embeds.forEach(function (embed) {
            newEmbeds.push(JSON.stringify(embed));
        });

        oldEmbeds.forEach(function (embed) {
            if (newEmbeds.indexOf(embed) === -1)
                display.addField(`Embed removed`, embed);
        });

        newEmbeds.forEach(function (embed) {
            if (oldEmbeds.indexOf(embed) === -1)
                display.addField(`Embed added`, embed);
        });

        // Get the differences between old and new content
        var diff = jsdiff.diffWordsWithSpace(old.cleanContent, message.cleanContent);
        diff.forEach(function (part) {
            if (part.added) {
                display.addField(`Part added`, part.value);
            } else if (part.removed) {
                display.addField(`Part removed`, part.value);
            }
        });

        // send a log to the channel
        _channel.sendEmbed(display, `:pencil: Message ${message.id} was edited.`);



    }

};


