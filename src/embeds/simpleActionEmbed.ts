import { GuildMember, MessageEmbed } from 'discord.js'

export const simpleActionEmbed = (message: string, member: GuildMember, thumbnail?: string) =>
    new MessageEmbed({
        title: message,
        thumbnail: thumbnail ? { url: thumbnail } : undefined,
        footer: {
            text: `${member.user.tag}`,
            iconURL: member.user.displayAvatarURL({ dynamic: true }),
        },
    })
