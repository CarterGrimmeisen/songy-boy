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
