import { defaultFilters } from 'distube'

export const customFilters = {
	'chorus of 3': 'chorus=0.5:0.9:50|60|40:0.4|0.32|0.3:0.25|0.4|0.3:2|2.3|1.3',
	earrape: 'bass=g=50',
	pulsator: 'apulsator=hz=1',
}

const excludedFilters = ['reverse']

export const allFilters = {
	...Object.fromEntries(Object.entries(defaultFilters).filter(([key]) => !excludedFilters.includes(key))),
	...customFilters,
}
