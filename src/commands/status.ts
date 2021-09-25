import { CommandInteraction } from 'discord.js'
import { Discord, Slash } from 'discordx'

import { distube } from '..'

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
					title:
						queue.songs.length > 10
							? 'Next 10 Songs'
							: queue.songs.length > 0
							? `Next ${queue.songs.length} Songs`
							: 'Queue is empty',
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
