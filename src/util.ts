import {
	ButtonInteraction,
	CommandInteraction,
	GuildMember,
	Interaction,
	Message,
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

export const disappearingMessage = <T>(messagePromise: Promise<Message | T>, time = 2500) => {
	setTimeout(async () => ((await messagePromise) as Message).delete(), time)
}

export const interactionWrapper = async (
	interaction: HandledInteraction,
	starting: string,
	ending: string,
	callback: () => Promise<unknown>,
	duration = 2500,
) => {
	const replyPromise = interaction.reply(starting)
	await callback()
	await replyPromise
	disappearingMessage(interaction.editReply(ending), duration)
}
