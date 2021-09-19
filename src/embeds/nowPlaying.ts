import { GuildMember, MessageEmbed } from 'discord.js'
import { Song } from 'distube'

export const nowPlayingEmbed = (member: GuildMember, song: Song) =>
    new MessageEmbed({
        title: 'Now Playing',
        description: `[${song.name} - Uploaded by ${song.uploader.name}](${song.url})`,
        image: { url: song.thumbnail },
        footer: {
            text: `Added by: ${member.user.tag}`,
            iconURL: member.user.displayAvatarURL({ dynamic: true }),
        },
    })
