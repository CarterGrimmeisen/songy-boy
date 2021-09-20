import { ButtonInteraction, MessageButton } from 'discord.js'
import { ButtonComponent, Discord } from 'discordx'

@Discord()
export class MediaControls {
    @ButtonComponent('stop_button')
    async stopButton(interaction: ButtonInteraction) {
        interaction.reply('Stopping')
    }
}

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
