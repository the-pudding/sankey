export default function generateSankeyData({
	data,
	correct,
	guess = '',
	total = 1
}) {
	correct = ` ${correct}`;
	guess = ` ${guess}`;

	const max = d3.max(data, d => d.name.length) + 1;
	const min = 1;

	const depthData = d3.range(min, max).map(index => {
		const temp = data
			.filter(d => d.name.length >= index)
			.map(d => ({
				...d,
				temp: d.name.substring(0, index),
				depthCount: d.name === d.name.substring(0, index) ? d.countScaled : 0
			}));

		const nested = d3
			.nest()
			.key(d => d.temp)
			.entries(temp);

		return nested;
	});

	// console.log({ depthData });

	const flatDepthData = [].concat(...depthData).map(d => ({
		...d,
		char: d.key.charAt(d.key.length - 1),
		correct: d.key === correct.substring(0, d.key.length),
		guess: d.key === guess.substring(0, d.key.length),
		count: d3.sum(d.values, v => v.count),
		percent: d3.sum(d.values, v => v.count) / total
	}));

	const stratify = d3
		.stratify()
		.id(d => d.key)
		.parentId(d => d.key.substring(0, d.key.length - 1));

	const root = stratify(flatDepthData).sum(d =>
		d3.sum(d.values, v => v.depthCount)
	);

	return root;
}
