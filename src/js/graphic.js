const $graphic = d3.select('#graphic');
const $result = $graphic.select('.graphic__result');
const $figure = $result.select('figure');
const $svg = $figure.select('svg');
const $g = $svg.select('g');
const $nodes = $g.select('.g-nodes');
const $links = $g.select('.g-links');
const $input = $graphic.select('input');

let width = 0;
let height = 0;

const dummy = [
	{ name: ' cati', count: 8 },
	{ name: ' cet', count: 5 },
	{ name: ' catt', count: 9 },
	{ name: ' cat', count: 5 }
];

const raw = [
	{ name: 'gillenhall', count: 5 },
	{ name: 'gylenhal', count: 9 },
	{ name: 'gylenhaal', count: 8 },
	{ name: 'gylenhall', count: 18 },
	{ name: 'gyllenhal', count: 41 },
	{ name: 'gyllenhall', count: 41 },
	{ name: 'gyllenhaal', count: 29 }
];

// recursion!
function toTreeData({ data, user, correct, index = 0 }) {
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
			id: `${index}-${d.key}`,
			index,
			correct: d.values.map(v => v.name).includes(correct),
			user: d.values.map(v => v.name).includes(user),
			value: d3.sum(d.values, v => v.count),
			values: toTreeData({ data: d.values, user, correct, index: index + 1 })
		}));

	return nested.length ? nested : null;
}

function resize(maxChars = 0) {
	const margin = { top: 30, right: 30, bottom: 30, left: 30 };
	const widthPerChar = 48;
	const w = widthPerChar * maxChars;
	const h = 320;
	width = w - margin.left - margin.right;
	height = h - margin.top - margin.bottom;

	$svg
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom);
	$g.attr('transform', `translate(${margin.left}, ${margin.top})`);
}

function updateChart({ treeData, spellings, user }) {
	const maxChars = d3.max(spellings, d => d.name.length);
	const userDepth = user.length;

	resize(maxChars);

	// declares a tree layout and assigns the size
	const treemap = d3.tree().size([height, width]);
	const root = d3.hierarchy(treeData, d => d.values);

	root.descendants().forEach(node => {
		node.sort((a, b) => d3.descending(a.data.correct, b.data.correct));
	});

	// maps the node data to the tree layout
	const nodes = treemap(root);

	const maxWidth = d3.max(nodes.descendants(), d => d.value);
	const scaleWidth = d3
		.scaleLinear()
		.domain([0, maxWidth])
		.range([2, 30]);

	// adds the links between the nodes
	const $link = $links
		.selectAll('.link')
		.data(nodes.descendants().slice(1), d => d.data.id)
		.join('path')
		.attr('class', 'link')
		// .attr('stroke-width', d => scaleWidth(d.value))
		.attr('stroke-width', d => 4)
		// .attr('stroke-opacity', d => scaleOpacity(d.data.count))
		.attr('d', d => {
			const x = d.x;
			return `M${d.y},${x}C${(d.y + d.parent.y) / 2},${x} ${(d.y + d.parent.y) /
				2}, ${d.parent.x} ${d.parent.y},${d.parent.x}`;
		})
		.classed('is-hidden', d => d.depth >= userDepth)
		.classed('is-correct', d => d.data.correct)
		.classed('is-user', d => d.data.user);

	// adds each node as a group

	const enterNode = sel => {
		const $n = sel
			.append('g')
			.attr('class', d => `node node--${d.values ? 'internal' : 'leaf'}`);
		$n.append('text')
			.classed('text--bg', true)
			.attr('alignment-baseline', 'middle');
		$n.append('text')
			.classed('text--fg', true)
			.attr('alignment-baseline', 'middle');
		return $n;
	};

	const $node = $nodes
		.selectAll('.node')
		.data(nodes.descendants(), d => d.data.id)
		.join(enterNode)
		.attr('transform', d => `translate(${d.y}, ${d.x})`)
		.classed('is-correct', d => d.data.correct)
		.classed('is-user', d => d.data.user)
		.classed('is-hidden', d => d.depth >= userDepth);

	$node.selectAll('text').text(d => d.data.key);
}

function handleInputChange() {
	const name = this.value.toLowerCase();
	if (name.length) {
		const clone = raw.map(d => ({ ...d }));
		const match = clone.find(d => d.name === name);
		if (match) match.count += 1;
		else clone.push({ name, count: 1 });
		const [treeData] = toTreeData({
			data: clone,
			user: name,
			correct: 'gyllenhaal'
		});
		updateChart({ treeData, spellings: clone, user: name });
	} else {
		this.value = 'g';
		const [treeData] = toTreeData({
			data: raw,
			user: name,
			correct: 'gyllenhaal'
		});
		updateChart({ treeData, spellings: raw, user: name });
	}
}

function init() {
	resize();
	const [treeData] = toTreeData({ data: raw, correct: 'gyllenhaal' });
	updateChart({ treeData, spellings: raw, user: 'Gyllenhaal' });
	$input.on('keyup', handleInputChange);
}

export default { init, resize };
