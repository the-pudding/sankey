export default function generateSankeyData(treeData) {
	const root = d3.hierarchy(treeData, d => d.values);
	const nodes = root.descendants().map(d => ({
		...d.data,
		values: null
	}));

	const links = root.links().map(d => ({
		source: d.source.data.id,
		target: d.target.data.id,
		value: d.target.data.value
	}));
	return { nodes, links };
}
