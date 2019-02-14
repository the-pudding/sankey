/*
 USAGE (example: line chart)
 1. c+p this template to a new file (line.js)
 2. change puddingChartName to puddingChartLine
 3. in graphic file: import './pudding-chart/line'
 4a. const charts = d3.selectAll('.thing').data(data).puddingChartLine();
 4b. const chart = d3.select('.thing').datum(datum).puddingChartLine();
*/

d3.selection.prototype.puddingChartSankey = function init() {
	function createChart(el) {
		const DEFAULT_WIDTH = 2;
		const MIN_FONT_SIZE = 12;
		const MAX_FONT_SIZE = 24;
		const MARGIN = MAX_FONT_SIZE * 2;

		const scaleFont = d3.scaleLinear().range([MIN_FONT_SIZE, MAX_FONT_SIZE]);
		const scaleColor = d3.scaleSequential().interpolator(d3.interpolateWarm);

		const $sel = d3.select(el);
		let data = $sel.datum();

		let width = 0;
		let height = 0;

		let guessDepth = 0;
		let shouldReveal = false;
		let correctName = '';

		// dom elements
		let $svg = null;
		let $links = null;
		let $nodes = null;

		// helper functions
		function stack(x) {
			const xobj = {};
			const sum = d3.sum(x.children, d => d.h);
			x.children.forEach(d => (xobj[d.data.char] = d.h / sum));
			return d3.stack().keys(Object.keys(xobj))([xobj]);
		}

		function customPoints(pts) {
			const link = d3
				.linkHorizontal()
				.source(v => v[0])
				.target(v => v[1])
				.x(v => v[0])
				.y(v => v[1]);
			return [
				link([pts[0], pts[1]]),
				`${pts[1]},${pts[2]}`,
				link([pts[2], pts[3]]).slice(1)
			].join('L');
		}

		function customLine(d) {
			return d3.line()([
				[
					d.node.y0 * width + DEFAULT_WIDTH,
					d.node.x0 * height +
						((d.node.x1 - d.node.x0) * height - d.node.h) / 2 +
						d[0][0] * d.node.h
				],
				[
					d.child.y0 * width,
					d.child.x0 * height +
						((d.child.x1 - d.child.x0) * height - d.child.h) / 2
				],
				[
					d.child.y0 * width,
					d.child.x0 * height +
						((d.child.x1 - d.child.x0) * height - d.child.h) / 2 +
						d.child.h
				],
				[
					d.node.y0 * width + DEFAULT_WIDTH,
					d.node.x0 * height +
						((d.node.x1 - d.node.x0) * height - d.node.h) / 2 +
						d[0][1] * d.node.h
				]
			]);
		}

		const Chart = {
			// called once at start
			init() {
				$svg = $sel.append('svg').attr('class', 'pudding-chart');
				const $g = $svg.append('g');

				$svg.select('g').attr('transform', `translate(${MARGIN}, ${MARGIN})`);

				// setup viz group
				$links = $g.append('g').attr('class', 'g-links');
				$nodes = $g.append('g').attr('class', 'g-nodes');
			},
			// on resize, update new dimensions
			resize() {
				const w = $sel.node().offsetWidth;
				const h = window.innerHeight * 0.67;

				width = w - MARGIN * 2;
				height = h - MARGIN * 2;

				$svg
					.attr('width', width + MARGIN * 2)
					.attr('height', height + MARGIN * 2);

				return Chart;
			},

			render() {
				const h = height * 0.67;
				const w = DEFAULT_WIDTH;
				const linkWidth = Math.floor(width / correctName.length);

				d3
					.treemap()
					.size([w, h])
					.tile(d3.treemapSlice)(data);

				data.each(d => {
					d.h = d.y1 - d.y0;
					d.w = d.x1 - d.x0;
				});

				d3.partition()(data);

				scaleFont.domain(d3.extent(data.descendants(), d => d.value));

				const createText = ($n, c) => {
					$n.append('text')
						.text(d => d.data.char)
						.attr('alignment-baseline', 'middle')
						.attr('text-anchor', 'middle')
						.attr('class', `text--${c}`);

					// .style('font-size', d => `${fontScale(d.value)}px`);
				};

				const enterNode = sel => {
					const $n = sel.append('g').attr('class', 'node');

					// $n.attr('class', d => `node node--${d.values ? 'internal' : 'leaf'}`);

					$n.append('rect')
						.attr('width', w)
						.style('fill', d => scaleColor(d.depth - 1));

					$n.call(createText, 'bg');
					$n.call(createText, 'fg');

					return $n;
				};

				const $node = $nodes
					.selectAll('g.node')
					.data(data.descendants(), d => d.data.id)
					.join(enterNode)
					.attr(
						'transform',
						d => `translate(${d.y0 * width}, ${d.x0 * height})`
					)
					.classed('is-correct', d => d.data.correct)
					.classed('is-guess', d => d.data.guess)
					.classed('is-hidden', d => d.depth > guessDepth)
					.classed('is-reveal', shouldReveal);

				$node
					.selectAll('text')
					.attr('y', d => ((d.x1 - d.x0) * height - d.h) / 2 + d.h * 0.5)
					.attr('x', linkWidth / 2);

				$node
					.select('rect')
					.attr('y', d => ((d.x1 - d.x0) * height - d.h) / 2)
					.attr('height', d => d.h);

				// node = d
				const stackData = [];
				$node.each(node => {
					if (!node.children) return false;
					const st = stack(node);

					st.forEach((s, i) => {
						stackData.push({
							...s,
							node,
							child: node.children[i]
						});
					});
				});
				console.log(stackData);
				$links
					.selectAll('.link')
					.data(stackData, d => d.child.id)
					.join('path')
					.attr('class', 'link')
					.style('fill', d => scaleColor(d.child.depth))
					.classed('is-hidden', d => d.node.depth > guessDepth)
					.classed('is-correct', d => d.child.data.correct)
					.classed('is-guess', d => d.child.data.guess)
					.classed('is-reveal', shouldReveal)
					.attr('d', customLine);

				// 	st.forEach((d, i) => {
				// 		const child = node.children[i];
				// 		const $link = $links.append('path').attr('class', 'link');

				// 		// customLine

				// 		$link
				// 			.attr('d', path)
				// 			.style('fill', scaleColor(child.depth))
				// 			.classed('is-hidden', child.depth > guessDepth)
				// 			.classed('is-correct', child.data.correct)
				// 			.classed('is-guess', child.data.guess)
				// 			.classed('is-reveal', shouldReveal);
				// 	});
				// });

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
			},

			correct(val) {
				if (!arguments.length) return correctName;
				correctName = val;
				scaleColor.domain([correctName.length, 0]);
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
