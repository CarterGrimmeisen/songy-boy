import { MessageEmbed } from 'discord.js'

export const simpleActionEmbed = (message: string, thumbnail?: string) =>
    new MessageEmbed({
        description: message,
        author: {
            name: 'Songy Boy',
            iconURL: 'https://cdn.discordapp.com/attachments/889316828625641512/889316862737924116/3dgifmaker34035.gif',
        },
        thumbnail: thumbnail ? { url: thumbnail, height: 80 } : undefined,
    })
