export default function generateTreeData({
	data,
	guess,
	correct,
	total = 1,
	index = 0,
	id = ''
}) {
	// goal: values = {key, count, data}

	// get character at new index
	// const chars = data.map(d => d.name.charAt(index));
	// find all unique possible characters
	// const unique = [...new Set(chars)];

	// console.log({ index, unique });
	// if there are some, sankeyData those (filter)

	const withChar = data.map(d => ({ ...d, char: d.name.charAt(index) }));
	const nested = d3
		.nest()
		.key(d => d.char)
		.entries(withChar)
		.filter(d => d.key)
		.map(d => ({
			...d,
			id: d.values[0].name.slice(0, index + 1),
			index,
			correct: d.values.map(v => v.name).includes(correct),
			guess: d.values.map(v => v.name).includes(guess),
			value: d3.sum(d.values, v => v.count),
			percent: d3.sum(d.values, v => v.count) / total,
			values: generateTreeData({
				data: d.values,
				guess,
				correct,
				index: index + 1,
				total
				// id: `${id}-${d.key}`
			})
		}));

	return nested.length ? nested : null;
}
