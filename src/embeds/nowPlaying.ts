import { GuildMember, MessageEmbed } from 'discord.js'
import { Queue } from 'distube'

export const nowPlayingEmbed = (member: GuildMember, queue: Queue, status: 'playing' | 'paused' = 'playing') => {
    const song = queue.songs[0]
    return new MessageEmbed({
        title: song.name,
        url: song.url,
        image: { url: song.thumbnail, width: 400 },
        author: {
            name:
                'Songy Boy - ' +
                (status === 'playing' ? 'Now Playing' : 'Paused') +
                (queue.songs.length > 1 ? ` | ${queue.songs.length - 1} more in queue` : ''),
            iconURL: 'https://cdn.discordapp.com/attachments/889316828625641512/889316862737924116/3dgifmaker34035.gif',
        },
        footer: {
            text: `Requested by ${member.user.tag}`,
            iconURL: member.user.displayAvatarURL({ dynamic: true }),
        },
    })
}
