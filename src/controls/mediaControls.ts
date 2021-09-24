import { MessageButton } from 'discord.js'

export const playButton = new MessageButton({
	customId: 'play_button',
	emoji: '▶️',
	style: 'SUCCESS',
})

export const pauseButton = new MessageButton({
	customId: 'pause_button',
	emoji: '⏸️',
	style: 'PRIMARY',
})

export const stopButton = new MessageButton({
	customId: 'stop_button',
	style: 'DANGER',
	label: 'Stop',
})

export const skipButton = new MessageButton({
	customId: 'skip_button',
	emoji: '⏭️',
	style: 'SECONDARY',
})

export const ffButton = new MessageButton({
	customId: 'ff_button',
	style: 'SECONDARY',
	emoji: '⏩',
})

export const rwButton = new MessageButton({
	customId: 'rw_button',
	style: 'SECONDARY',
	emoji: '⏪',
})
