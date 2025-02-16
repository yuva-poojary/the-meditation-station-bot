/*
 * This command is used to report a conflict in a text channel. If a configured number of members report in a configured amount of time, the bot
 * activates conflict resolution, taking "SEND_MESSAGES" away from everyone for 5 minutes while instructing a breathing exercise, and then
 * proceeding with conflict resolution questions. Used with tasks/conflictstage[2-5].js and tasks/removeconflict.js.
 */
const { Command } = require('klasa');
const moment = require('moment');

module.exports = class extends Command {

    constructor(...args) {
        super(...args, {
            description: 'Use this command inside a private incident channel to report a member for violating the rules',
            usage: '<user:username>',
            usageDelim: ' | ',
            cooldown: 30,
            runIn: [ 'text' ],
            requiredPermissions: [ "MANAGE_ROLES" ],
            requiredSettings: [ "reportMembers", "reportTime", "muteRole", "incidentsCategory", "noSelfModRole" ],
            extendedHelp: 'When multiple people report the same member in a configured amount of time, the member gets muted for the safety of the community until staff investigate.'
        });
    }

    async run (message, [ user ]) {
        // Error if this command was not executed in an incidents channel, and delete the message for user's confidentiality
        if (message.channel.parent && message.channel.parent.id !== message.guild.settings.incidentsCategory) {
            await message.send(`:x: I don't want others knowing you're reporting someone. Please use the !report command in an incidents channel. You can use the command !staff to create one.`);
            return message.delete({ reason: `Use of !report outside an incidents channel. Deleted for confidentiality.` });
        }

        // First, resolve configured settings
        const reports = user.guildSettings(message.guild.id).reports;
        const reportMembers = message.guild.settings.reportMembers || 3;
        const reportTime = moment().add(parseInt(message.guild.settings.reportTime), 'minutes').toDate();
        const muted = message.guild.settings.muteRole;
        const mutedRole = message.guild.roles.resolve(muted);
        const noSelfMod = message.guild.settings.noSelfModRole;
        const noSelfModRole = message.guild.roles.resolve(noSelfMod);
        const guildMember = message.guild.members.resolve(user.id);
        const incidents = message.guild.settings.incidentsCategory;

        // Check if this specific member used the conflict command on the user recently. If not, add an entry.
        if (reports.indexOf(`${message.author.id}`) === -1) {
            // Do not activate the mute if already muted, not in the guild, or not activated by staff and not enough reports made yet
            if (guildMember && guildMember.roles.get(mutedRole.id))
                return message.sendMessage(`:x: Your report was acknowledged, but the member is already muted. Please provide reasoning / evidence why you reported this member.`);

            if (guildMember && guildMember.roles.get(noSelfModRole.id))
                return message.sendMessage(`:x: I could not acknowledge your report because you had abused the report command in the past. You can still tell us here why you're reporting the member.`);

            // By this point, the report is authorized

            // Add a scheduled task to remove this report after configured minutes.
            const reportsadd = await this.client.schedule.create('removereport', reportTime, {
                data: {
                    guild: message.guild.id,
                    reportee: user.id,
                    reporter: message.author.id
                }
            });

            // Add 5 to the guild's raid score
            message.guild.raidScore(5);

            // Add this report into the member's report records
            await user.guildSettings(message.guild.id).update(`reports`, `${message.author.id}`, { action: 'add' });

            if ((reports.length + 1) < reportMembers)
                return message.sendMessage(`:white_check_mark: Your report was acknowledged. Not enough reports have been made yet for an auto-mute. Please explain why you reported the user here with evidence. Staff may revoke your !report privileges if you do not do so.`);

            // Create a proper response message
            var response = `:mute: **__You have been muted due to multiple reports by other members__** :mute: 

${reportMembers} members have reported you for misconduct within the last ${reportTime} minutes. This does **not** guarantee you are in trouble, and this mute does not constitute discipline on your account; staff will investigate and determine what to do. Please be patient.`;

            var overwrites = [ {
                id: user.id,
                allow: [
                    "ADD_REACTIONS",
                    "VIEW_CHANNEL",
                    "SEND_MESSAGES",
                    "EMBED_LINKS",
                    "ATTACH_FILES",
                    "READ_MESSAGE_HISTORY"
                ],
                type: 'member'
            },
            {
                id: message.channel.guild.roles.everyone,
                deny: [
                    "VIEW_CHANNEL",
                ],
                type: 'role'
            } ];

            if (message.guild.settings.modRole) {
                overwrites.push({
                    id: message.guild.settings.modRole,
                    allow: [
                        "ADD_REACTIONS",
                        "VIEW_CHANNEL",
                        "SEND_MESSAGES",
                        "MANAGE_MESSAGES",
                        "MENTION_EVERYONE",
                        "MANAGE_ROLES",
                        "EMBED_LINKS",
                        "ATTACH_FILES",
                        "READ_MESSAGE_HISTORY"
                    ],
                    type: 'role'
                });
            }

            const muted = message.guild.settings.muteRole;
            const mutedRole = message.guild.roles.resolve(muted);

            if (mutedRole && guildMember) {
                guildMember.roles.add(mutedRole, `Mute via several !report s`);
            }

            var channel = await message.guild.channels.create(`reported_${Date.now().toString(36) + (this.client.shard ? this.client.shard.id.toString(36) : '') + String.fromCharCode((1 % 26) + 97)}`, {
                type: 'text',
                topic: `Private staff channel initiated by the bot due to multiple member reports`,
                parent: message.guild.settings.incidentsCategory,
                permissionOverwrites: overwrites,
                rateLimitPerUser: 15,
                reason: `!report initiated by multiple member reports`
            });
    
            await channel.send(response);

            return message.send(`:mute: Your report was acknowledged. Other members reported this user, therefore I muted them. Please explain why you reported the user here with evidence. Staff may revoke your !report privileges if you do not do so.`);
        } else {
            return message.send(`:x: It looks like you already reported this user recently, so I could not acknowledge your report. Feel free to provide any / additional information and evidence of their misconduct in this channel.`);
        }

    }

};



