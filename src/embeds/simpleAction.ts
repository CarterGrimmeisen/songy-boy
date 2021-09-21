import { GuildMember, MessageEmbed } from 'discord.js'

type SimpleActionOptions = Partial<{
    thumbnail: string
    member: GuildMember
}>

export const simpleActionEmbed = (message: string, options?: SimpleActionOptions) =>
    new MessageEmbed({
        description: message,
        author: {
            name: 'Songy Boy',
            iconURL: 'https://cdn.discordapp.com/attachments/889316828625641512/889316862737924116/3dgifmaker34035.gif',
        },
        thumbnail: options?.thumbnail ? { url: options!.thumbnail, height: 80 } : undefined,
        footer: options?.member
            ? {
                  iconURL: options!.member.user.displayAvatarURL({ dynamic: true }),
                  text: `${options!.member.displayName}`,
              }
            : undefined,
    })
