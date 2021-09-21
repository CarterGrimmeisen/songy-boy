import { MessageSelectMenu } from 'discord.js'
import { defaultFilters } from 'distube'
import { titleCase } from 'title-case'

export const customFilters = {
    'chorus of 3': 'chorus=0.5:0.9:50|60|40:0.4|0.32|0.3:0.25|0.4|0.3:2|2.3|1.3',
}

export const allFilters = {
    ...defaultFilters,
    ...customFilters,
}

export const filterSelection = new MessageSelectMenu({
    customId: 'filter_list',
    options: Object.keys(defaultFilters).map((each) => ({
        label: titleCase(each),
        value: each,
    })),
})
