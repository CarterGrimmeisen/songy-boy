import { MessageEmbed } from 'discord.js'

export const simpleActionEmbed = (message: string, thumbnail?: string) =>
    new MessageEmbed({
        title: message,
        thumbnail: thumbnail ? { url: thumbnail, height: 120 } : undefined,
    })
