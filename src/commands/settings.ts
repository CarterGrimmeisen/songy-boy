import { ButtonInteraction, CommandInteraction } from 'discord.js'
import { ButtonComponent, Discord, Guard, Slash, SlashChoice, SlashOption } from 'discordx'
import { titleCase } from 'title-case'

import { distube, setGuildSettings } from '..'
import { allFilters } from '../controls/filterList'
import { simpleActionMessage } from '../embeds/simpleAction'
import { hasFiltersGuard, hasQueueGuard } from '../guards/queueState'
import { disappearingMessage, HandledInteraction, interactionWrapper } from '../util'

@Discord()
export class Settings {
	@Slash('filter', { description: 'Add an audio filter' })
	@Guard(hasQueueGuard)
	async filter(
		@SlashOption('filter', { required: true, description: 'The filter to add' })
		@SlashChoice(Object.fromEntries(Object.entries(allFilters).map(([key]) => [titleCase(key), key])))
		filter: string,
		interaction: CommandInteraction,
	) {
		const replyPromise = interaction.reply('Applying filter...')
		const queue = distube.getQueue(interaction.guildId!)!
		let filters: string[]
		try {
			filters = queue.setFilter(filter)
		} catch (error) {
			disappearingMessage(interaction.fetchReply(), 0)
			return error instanceof Error && interaction.followUp(simpleActionMessage(`⛔ ${error.message}`))
		}

		setGuildSettings(interaction.guildId!, (settings) => {
			settings.filters = filters
		})

		await replyPromise
		disappearingMessage(
			interaction.editReply(
				simpleActionMessage(
					`${titleCase(filter)} filter has been applied` +
						(filters.length > 1 ? `\nCurrent filters are ${filters?.map(titleCase).join(', ')}` : ''),
				),
			),
		)
	}

	@Slash('clearfilters', { description: 'Remove an audio filter' })
	@Guard(hasQueueGuard, hasFiltersGuard)
	async clearFilters(interaction: CommandInteraction) {
		return interactionWrapper(interaction, 'Clearing filters...', 'All filters removed', async () => {
			const queue = distube.getQueue(interaction.guildId!)!
			try {
				queue.setFilter(false)
			} catch (error) {
				disappearingMessage(interaction.fetchReply(), 0)
				return (
					error instanceof Error &&
					interaction.followUp(simpleActionMessage(`⛔ ${error.message.replaceAll('You ', 'I ')}`))
				)
			}

			setGuildSettings(interaction.guildId!, (settings) => {
				settings.filters = []
			})
		})
	}

	@Slash('volume', { description: 'Change the volume' })
	@Guard(hasQueueGuard)
	async volume(
		@SlashOption('volume')
		volume: number,
		interaction: HandledInteraction,
	) {
		const replyPromise = interaction.reply('Setting volume...')
		if (volume < 0 || volume > 150) {
			disappearingMessage(interaction.fetchReply(), 0)
			return interaction.followUp({ content: 'Volume must be between 0 and 150', ephemeral: true })
		}

		distube.getQueue(interaction.guildId!)!.setVolume(volume)

		setGuildSettings(interaction.guildId!, (settings) => {
			settings.volume = volume
		})

		await replyPromise
		disappearingMessage(interaction.editReply(simpleActionMessage(`Volume is now set to **${volume}%**`)))
	}

	@ButtonComponent('volume_up_button')
	@Guard(hasQueueGuard)
	async volumeUp(interaction: ButtonInteraction) {
		const volume = distube.getQueue(interaction.guildId!)!.volume
		const newVolume = volume < 140 ? Math.floor(volume + 10) : 150
		this.volume(newVolume, interaction)
	}

	@ButtonComponent('volume_down_button')
	@Guard(hasQueueGuard)
	async volumeDown(interaction: ButtonInteraction) {
		const volume = distube.getQueue(interaction.guildId!)!.volume
		const newVolume = volume > 10 ? Math.floor(volume - 10) : 0
		this.volume(newVolume, interaction)
	}
}
