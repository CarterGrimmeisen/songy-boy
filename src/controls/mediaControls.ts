import { MessageActionRow, MessageButton } from 'discord.js'
import { Queue, RepeatMode } from 'distube'

export const playButton = () =>
	new MessageButton({
		customId: 'play_button',
		emoji: '▶️',
		style: 'SECONDARY',
	})

export const pauseButton = () =>
	new MessageButton({
		customId: 'pause_button',
		emoji: '⏸️',
		style: 'SECONDARY',
	})

export const stopButton = () =>
	new MessageButton({
		customId: 'stop_button',
		style: 'DANGER',
		emoji: '⏹️',
	})

export const skipButton = () =>
	new MessageButton({
		customId: 'skip_button',
		emoji: '⏭️',
		style: 'SECONDARY',
	})

export const ffButton = () =>
	new MessageButton({
		customId: 'ff_button',
		style: 'SECONDARY',
		emoji: '⏩',
		label: '+10s',
	})

export const rwButton = () =>
	new MessageButton({
		customId: 'rw_button',
		style: 'SECONDARY',
		emoji: '⏪',
		label: '-10s',
	})

export const moreButton = () =>
	new MessageButton({
		customId: 'more_button',
		style: 'SECONDARY',
		emoji: '🔽',
		label: 'More',
	})

export const lessButton = () =>
	new MessageButton({
		customId: 'less_button',
		style: 'SECONDARY',
		emoji: '🔼',
		label: 'Less',
	})

export const repeatNoneToQueueButton = () =>
	new MessageButton({
		customId: 'repeat_none_to_queue_button',
		style: 'SECONDARY',
		emoji: '🟦',
		label: 'Repeat None',
	})

export const repeatQueueToOneButton = () =>
	new MessageButton({
		customId: 'repeat_queue_to_one_button',
		style: 'SUCCESS',
		emoji: '🔁',
		label: 'Repeat Queue',
	})

export const repeatOneToNoneButton = () =>
	new MessageButton({
		customId: 'repeat_one_to_none_button',
		style: 'SUCCESS',
		emoji: '🔂',
		label: 'Repeat One',
	})

export const autoplayOnButton = () =>
	new MessageButton({
		customId: 'autoplay_button',
		style: 'SUCCESS',
		emoji: '☑️',
		label: 'Autoplay On',
	})

export const autoplayOffButton = () =>
	new MessageButton({
		customId: 'autoplay_button',
		style: 'SECONDARY',
		emoji: '🟦',
		label: 'Autoplay Off',
	})

export const volumeDownButton = () =>
	new MessageButton({
		customId: 'volume_down_button',
		style: 'SECONDARY',
		emoji: '🔉',
		label: '-10%',
	})

export const volumeUpButton = () =>
	new MessageButton({
		customId: 'volume_up_button',
		style: 'SECONDARY',
		emoji: '🔊',
		label: '+10%',
	})

export const getMediaButtonList = (queue: Queue, moreSettingsOpen = false, disableMore = false) => {
	const settingsButton = moreSettingsOpen ? lessButton() : moreButton()
	settingsButton.setDisabled(disableMore)
	return [
		new MessageActionRow({
			components: [stopButton(), queue.playing ? pauseButton() : playButton(), skipButton(), settingsButton],
		}),
	]
}

const getRepeatButton = (queue: Queue) =>
	queue.repeatMode === RepeatMode.DISABLED
		? repeatNoneToQueueButton()
		: queue.repeatMode === RepeatMode.QUEUE
		? repeatQueueToOneButton()
		: repeatOneToNoneButton()

export const getMoreButtonList = (queue: Queue) => {
	return [
		new MessageActionRow({
			components: [getRepeatButton(queue), rwButton(), ffButton()],
		}),
		new MessageActionRow({
			components: [
				queue.autoplay ? autoplayOnButton() : autoplayOffButton(),
				volumeDownButton(),
				volumeUpButton(),
			],
		}),
	]
}
