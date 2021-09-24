import { MessageEmbed } from 'discord.js'
import { Queue } from 'distube'
import { titleCase } from 'title-case'

export const nowPlayingEmbed = (queue: Queue, status: 'playing' | 'paused' = 'playing') => {
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
		fields: [
			{
				name: 'Duration',
				value: `${queue.formattedCurrentTime} / ${song.formattedDuration}`,
				inline: true,
			},
			{
				name: 'Volume',
				value: `${queue.volume}%`,
				inline: true,
			},
			{
				name: `Current Filter${queue.filters.length > 1 ? 's' : ''}`,
				value: queue.filters.length ? queue.filters.map(titleCase).join('\n') : 'None',
				inline: true,
			},
		],
		footer: {
			text:
				song.member === queue.clientMember
					? `Added to the queue by autoplay`
					: `Requested by ${song.member!.user.tag}`,
			iconURL: song.member!.user.displayAvatarURL({ dynamic: true }),
		},
	})
}
