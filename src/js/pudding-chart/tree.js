/*
 USAGE (example: line chart)
 1. c+p this template to a new file (line.js)
 2. change puddingChartName to puddingChartLine
 3. in graphic file: import './pudding-chart/line'
 4a. const charts = d3.selectAll('.thing').data(data).puddingChartLine();
 4b. const chart = d3.select('.thing').datum(datum).puddingChartLine();
*/

d3.selection.prototype.puddingChartTree = function init({ maxDepth }) {
	function createChart(el) {
		const DEFAULT_WIDTH = 4;

		const $sel = d3.select(el);
		let data = $sel.datum();
		// dimension stuff
		let width = 0;
		let height = 0;

		let fontSize = 0;
		let charW = 0;
		let charH = 0;
		let guessDepth = 0;
		let shouldReveal = false;

		// scales
		const scaleWidth = d3.scaleSqrt();

		// dom elements
		let $svg = null;
		let $links = null;
		let $nodes = null;

		// helper functions
		function getTreeSize() {
			const root = d3.hierarchy(data, d => d.values);
			root.count();
			return { treeW: root.height, treeH: root.value };
		}

		function getLinkOffset({ source, target }) {
			// look at all sources children
			// calculate offsets for all children
			let tally = 0;
			const widths = source.children.map(d => {
				const w = shouldReveal ? scaleWidth(d.value) : DEFAULT_WIDTH;
				const off = tally + w / 2;
				tally += w;
				return { id: d.data.id, off, w };
			});
			const match = widths.find(d => d.id === target.data.id);
			return match.off;
		}

		const Chart = {
			// called once at start
			init() {
				$svg = $sel.append('svg').attr('class', 'pudding-chart');
				const $g = $svg.append('g');

				// setup viz group
				$links = $g.append('g').attr('class', 'g-links');
				$nodes = $g.append('g').attr('class', 'g-nodes');
			},
			// on resize, update new dimensions
			resize() {
				const w = $sel.node().offsetWidth;
				const h = window.innerHeight * 0.67;

				const r = w < 600 ? 1.5 : 2;

				fontSize = Math.floor(Math.min(w, h) / maxDepth / r);
				const margin = fontSize * 2;

				charW = fontSize * r;
				charH = fontSize * r;

				const { treeW, treeH } = getTreeSize();

				width = charW * treeW;
				height = charH * treeH;

				$svg
					.attr('width', width + margin * 2)
					.attr('height', height + margin * 2);

				// offset chart for margins
				$svg.select('g').attr('transform', `translate(${margin}, ${margin})`);

				return Chart;
			},

			render(showNode) {
				const treemap = d3
					.tree()
					.size([height, width])
					.separation(() => charH);

				const root = d3.hierarchy(data, d => d.values);

				root.descendants().forEach(node => {
					node.sort((a, b) => d3.ascending(a.data.key, b.data.key));
				});

				const nodes = treemap(root);
				const maxWidth = d3.max(nodes.descendants(), d => d.value);

				const linkPath = d3
					.linkHorizontal()
					.x(d => {
						const extra = d.children ? 0 : fontSize;
						return d.y + extra;
					})
					.y(d => d.x);

				scaleWidth.domain([1, maxWidth]).range([2, 30]);

				$links
					.selectAll('.link')
					.data(nodes.links(), d => d.source.data.id)
					.join('path')
					.attr('class', 'link')
					.attr('stroke-width', d =>
						shouldReveal ? scaleWidth(d.target.value) : DEFAULT_WIDTH
					)
					.attr('d', linkPath)
					.classed('is-hidden', d => d.source.depth > guessDepth)
					.classed('is-correct', d => d.target.data.correct)
					.classed('is-guess', d => d.target.data.guess)
					.classed('is-reveal', shouldReveal);

				const enterNode = sel => {
					const $n = sel
						.append('g')
						.attr('class', d => `node node--${d.values ? 'internal' : 'leaf'}`);
					$n.append('text')
						.classed('text--bg', true)
						.attr('y', fontSize / 4)
						.style('font-size', `${fontSize}px`);
					$n.append('text')
						.classed('text--fg', true)
						.attr('y', fontSize / 4)
						.style('font-size', `${fontSize}px`);
					return $n;
				};

				const $node = $nodes
					.selectAll('.node')
					.data(nodes.descendants(), d => d.data.id)
					.join(enterNode)
					.attr('transform', d => `translate(${d.y}, ${d.x})`)
					.classed('is-correct', d => d.data.correct)
					.classed('is-guess', d => d.data.guess)
					.classed('is-hidden', d => d.depth > guessDepth)
					.classed('is-reveal', shouldReveal);

				$node.selectAll('text').text(d => d.data.key);

				return Chart;
			},
			// get / set data
			data(val) {
				if (!arguments.length) return data;
				data = val;
				$sel.datum(data);
				return Chart;
			},

			guess(val) {
				if (!arguments.length) return guessDepth;
				guessDepth = val;
				return Chart;
			},

			reveal(val) {
				if (!arguments.length) return shouldReveal;
				shouldReveal = val;
				return Chart;
			}
		};
		Chart.init();

		return Chart;
	}

	// create charts
	const charts = this.nodes().map(createChart);
	return charts.length > 1 ? charts : charts.pop();
};
