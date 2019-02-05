import db from './db';
import generateTreeData from './generate-tree-data';
import britneyData from './britney';

const $graphic = d3.select('#graphic');
const $result = $graphic.select('.graphic__result');
const $question = $graphic.select('.graphic__question');
const $figure = $result.select('figure');
const $svg = $figure.select('svg');
const $g = $svg.select('g');
const $nodes = $g.select('.g-nodes');
const $links = $g.select('.g-links');
const $input = $question.select('input');
const $button = $question.select('button');

let width = 0;
let height = 0;

const tutorialData = britneyData.filter(d => d.count > 1000).slice(0, 10);
// const dummy = [
// 	{ name: ' cati', count: 8 },
// 	{ name: ' cet', count: 5 },
// 	{ name: ' catt', count: 9 },
// 	{ name: ' cat', count: 5 }
// ];

// const raw = [
// 	{ name: 'gillenhall', count: 5 },
// 	{ name: 'gylenhal', count: 9 },
// 	{ name: 'gylenhaal', count: 8 },
// 	{ name: 'gylenhall', count: 18 },
// 	{ name: 'gyllenhal', count: 41 },
// 	{ name: 'gyllenhall', count: 41 },
// 	{ name: 'gyllenhaal', count: 29 }
// ];

function resize(maxChars = 0) {
	const margin = { top: 30, right: 30, bottom: 30, left: 30 };
	const widthPerChar = 48;
	const w = widthPerChar * maxChars;
	const h = 480;
	width = w - margin.left - margin.right;
	height = h - margin.top - margin.bottom;

	$svg
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom);
	$g.attr('transform', `translate(${margin.left}, ${margin.top})`);
}

function updateChart({ treeData, versions, guess, reveal }) {
	const maxChars = d3.max(versions, d => d.name.length);
	const guessDepth = guess.length;

	resize(maxChars);

	// declares a tree layout and assigns the size
	const treemap = d3
		.tree()
		.size([height, width])
		.separation((a, b) => 1000);

	const root = d3.hierarchy(treeData, d => d.values);

	console.log({ root });

	root.descendants().forEach(node => {
		node.sort((a, b) => d3.ascending(a.data.key, b.data.key));
	});

	// maps the node data to the tree layout
	const nodes = treemap(root);

	const maxWidth = d3.max(nodes.descendants(), d => d.value);
	const scaleWidth = d3
		.scaleSqrt()
		.domain([1, maxWidth])
		.range([2, 30]);

	// adds the links between the nodes
	const $link = $links
		.selectAll('.link')
		.data(nodes.descendants().slice(1), d => d.data.id)
		.join('path')
		.attr('class', 'link')
		.attr('stroke-width', d => (reveal ? scaleWidth(d.value) : 4))
		.attr('d', d => {
			const x = d.x;
			return `M${d.y},${x}C${(d.y + d.parent.y) / 2},${x} ${(d.y + d.parent.y) /
				2}, ${d.parent.x} ${d.parent.y},${d.parent.x}`;
		})
		.classed('is-hidden', d => d.depth >= guessDepth)
		.classed('is-correct', d => d.data.correct)
		.classed('is-guess', d => d.data.guess);

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
		.classed('is-guess', d => d.data.guess)
		.classed('is-hidden', d => d.depth >= guessDepth);

	$node.selectAll('text').text(d => d.data.key);
}

function handleInputChange(reveal) {
	const val = this.value.toLowerCase();
	const guess = val.length && val.charAt(0) === 'b' ? val : 'b';
	this.value = guess;

	const versions = tutorialData.map(d => ({ ...d }));
	const match = versions.find(d => d.name === guess);
	if (match) match.count += 1;
	else versions.push({ name: guess, count: 1 });
	const [treeData] = generateTreeData({
		data: versions,
		guess,
		correct: 'britney'
	});
	updateChart({ treeData, versions, guess, reveal });
}

function hanldeButtonClick() {
	handleInputChange.call($input.node(), true);
	$nodes.selectAll('.node').classed('is-visible', true);
	$links.selectAll('.link').classed('is-visible', true);
	$input.property('disabled', true);
}

function init() {
	d3.json(
		`https://pudding.cool/2019/02/sankey-data/data.json?version=${Date.now()}`
	)
		.then(console.log)
		.catch(console.error);
	// db.setup();
	// console.log(db.getGuess());
	resize();
	const [treeData] = generateTreeData({
		data: tutorialData,
		correct: 'britney'
	});

	$input.on('keyup', handleInputChange);
	$button.on('click', hanldeButtonClick);
}

export default { init, resize };
