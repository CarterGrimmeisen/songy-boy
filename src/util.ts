import {
    ButtonInteraction,
    CommandInteraction,
    GuildMember,
    Interaction,
    StageChannel,
    TextChannel,
    VoiceChannel,
} from 'discord.js'

export type HandledInteraction = CommandInteraction | ButtonInteraction

export const getInteractionInfo = async (
    interaction: Interaction,
): Promise<[member: GuildMember, voiceChannel: VoiceChannel | StageChannel | null, textChannel: TextChannel]> => {
    const member = interaction.member as GuildMember
    return [member, member.voice.channel, interaction.channel as TextChannel]
}
