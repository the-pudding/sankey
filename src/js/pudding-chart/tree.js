/*
 USAGE (example: line chart)
 1. c+p this template to a new file (line.js)
 2. change puddingChartName to puddingChartLine
 3. in graphic file: import './pudding-chart/line'
 4a. const charts = d3.selectAll('.thing').data(data).puddingChartLine();
 4b. const chart = d3.select('.thing').datum(datum).puddingChartLine();
*/

d3.selection.prototype.puddingChartTree = function init(options) {
	function createChart(el) {
		const $sel = d3.select(el);
		let data = $sel.datum();
		// dimension stuff
		let width = 0;
		let height = 0;
		const marginTop = 32;
		const marginBottom = 32;
		const marginLeft = 32;
		const marginRight = 32;

		let fontSize = 0;
		let charW = 0;
		let charH = 0;
		let maxChars = 0;
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

		const Chart = {
			// called once at start
			init() {
				$svg = $sel.append('svg').attr('class', 'pudding-chart');
				const $g = $svg.append('g');

				// offset chart for margins
				$g.attr('transform', `translate(${marginLeft}, ${marginTop})`);

				// setup viz group
				$links = $g.append('g').attr('class', 'g-links');
				$nodes = $g.append('g').attr('class', 'g-nodes');
			},
			// on resize, update new dimensions
			resize() {
				const { treeW, treeH } = getTreeSize();

				const w = $sel.node().offsetWidth - marginLeft - marginTop;
				const h = window.innerHeight * 0.67 - marginTop - marginBottom;

				const ratio = w < 600 ? 1.5 : 2;

				const maxW = Math.floor(w / treeW);
				const maxH = Math.floor(h / treeH);
				const smaller = Math.min(maxW, maxH);

				fontSize = Math.floor(smaller / ratio);
				charW = fontSize * ratio;
				charH = fontSize * ratio;

				width = charW * treeW;
				height = charH * treeH;

				$svg
					.attr('width', width + marginLeft + marginRight)
					.attr('height', height + marginTop + marginBottom);

				return Chart;
			},

			render() {
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
					.x(d => d.y)
					.y(d => d.x);

				scaleWidth.domain([1, maxWidth]).range([2, 30]);

				$links
					.selectAll('.link')
					.data(nodes.links(), d => d.source.data.id)
					.join('path')
					.attr('class', 'link')
					.attr('stroke-width', d =>
						shouldReveal ? scaleWidth(d.target.value) : 4
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
					.style('font-size', fontSize)
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

			chars(val) {
				if (!arguments.length) return maxChars;
				maxChars = val;
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
