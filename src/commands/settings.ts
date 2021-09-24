import { CommandInteraction } from 'discord.js'
import { Discord, Guard, Slash, SlashChoice, SlashOption } from 'discordx'
import { titleCase } from 'title-case'

import { distube, setGuildSettings } from '..'
import { allFilters } from '../controls/filterList'
import { simpleActionEmbed } from '../embeds/simpleAction'
import { hasFiltersGuard, isPlayingGuard } from '../guards/queueState'
import { disappearingMessage, HandledInteraction } from '../util'

@Discord()
export class Settings {
	@Slash('filter', { description: 'Add an audio filter' })
	@Guard(isPlayingGuard)
	async filter(
		@SlashOption('filter', { required: true, description: 'The filter to add' })
		@SlashChoice(Object.fromEntries(Object.entries(allFilters).map(([key]) => [titleCase(key), key])))
		filter: string,
		interaction: CommandInteraction,
	) {
		interaction.deferReply()
		const queue = distube.getQueue(interaction.guildId!)!
		let filters: string[]
		try {
			filters = queue.setFilter(filter)
		} catch (error) {
			return (
				error instanceof Error &&
				interaction.followUp({
					embeds: [simpleActionEmbed(`⛔ ${error.message.replaceAll('You ', 'I ')}`)],
				})
			)
		}

		setGuildSettings(interaction.guildId!, (settings) => {
			settings.filters = filters
		})

		disappearingMessage(
			interaction.followUp({
				embeds: [
					simpleActionEmbed(
						`${titleCase(filter)} filter has been applied` +
							(filters.length > 1 ? `\nCurrent filters are ${filters?.map(titleCase).join(', ')}` : ''),
					),
				],
				fetchReply: true,
			}),
		)
	}

	@Slash('clearfilters', { description: 'Remove an audio filter' })
	@Guard(isPlayingGuard, hasFiltersGuard)
	async clearFilters(interaction: CommandInteraction) {
		interaction.deferReply()
		const queue = distube.getQueue(interaction.guildId!)!
		try {
			queue.setFilter(false)
		} catch (error) {
			return (
				error instanceof Error &&
				interaction.followUp({ embeds: [simpleActionEmbed(`⛔ ${error.message.replaceAll('You ', 'I ')}`)] })
			)
		}

		setGuildSettings(interaction.guildId!, (settings) => {
			settings.filters = []
		})

		disappearingMessage(
			interaction.followUp({
				embeds: [simpleActionEmbed('All filters removed')],
				fetchReply: true,
			}),
		)
	}

	@Slash('volume', { description: 'Change the volume' })
	@Guard(isPlayingGuard)
	async volume(
		@SlashOption('volume')
		volume: number,
		interaction: HandledInteraction,
	) {
		interaction.deferReply()
		if (volume < 0 || volume > 150) {
			return interaction.followUp({ content: 'Volume must be between 0 and 150', ephemeral: true })
		}

		distube.getQueue(interaction.guildId!)!.setVolume(volume)

		setGuildSettings(interaction.guildId!, (settings) => {
			settings.volume = volume
		})

		disappearingMessage(
			interaction.followUp({
				embeds: [simpleActionEmbed(`Volume is now set to **${volume}%**`)],
				fetchReply: true,
			}),
		)
	}
}
