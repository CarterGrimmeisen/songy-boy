import { MessageButton } from 'discord.js'

export const playButton = new MessageButton({
	customId: 'play_button',
	emoji: '▶️',
	style: 'SUCCESS',
	label: 'Play',
})

export const pauseButton = new MessageButton({
	customId: 'pause_button',
	emoji: '⏸️',
	style: 'PRIMARY',
	label: 'Pause',
})

export const stopButton = new MessageButton({
	customId: 'stop_button',
	emoji: '⏹️',
	style: 'DANGER',
	label: 'Stop',
})

export const skipButton = new MessageButton({
	customId: 'skip_button',
	emoji: '⏭️',
	style: 'SECONDARY',
	label: 'Skip',
})

export const autoPlayOnButton = new MessageButton({
	customId: 'autoplay_button',
	style: 'SUCCESS',
	label: '☑️ Autoplay: Enabled',
})

export const autoPlayOffButton = new MessageButton({
	customId: 'autoplay_button',
	style: 'DANGER',
	label: '🟦 Autoplay: Disabled',
})
