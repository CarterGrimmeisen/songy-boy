import { CommandInteraction } from 'discord.js'
import { Discord, Slash } from 'discordx'

import { distube } from '..'

const chunk = <T>(array: T[], chunk_size: number) =>
	Array(Math.ceil(array.length / chunk_size))
		.fill(null)
		.map((_, index) => index * chunk_size)
		.map((begin) => array.slice(begin, begin + chunk_size))

@Discord()
export class Status {
	@Slash('ping', { description: 'Ping the bot' })
	async ping(interaction: CommandInteraction) {
		interaction.reply({ content: 'Pong!', ephemeral: true })
	}

	@Slash('queue', { description: 'Show the current queue' })
	async queue(interaction: CommandInteraction) {
		const queue = distube.getQueue(interaction.guildId!)!

		interaction.reply({
			embeds: [
				{
					title: 'Next 10 Songs',
					fields: queue.songs.slice(1, 11).map((song) => ({
						name: song.name!,
						value: song.formattedDuration!,
					})),
				},
			],
			ephemeral: true,
		})
	}
}
