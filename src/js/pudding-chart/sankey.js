// https://bl.ocks.org/timelyportfolio/a6f2f931935025b0476ea6180d348c59

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
		const MIN_FONT_SIZE = 14;
		const MARGIN = MIN_FONT_SIZE;
		const MAX_CHARS = 'Antetokounmpo'.length + 2;

		const scaleFont = d3.scaleLinear();
		const scaleColor = d3.scaleSequential().interpolator(d3.interpolateWarm);

		const $sel = d3.select(el);
		let data = $sel.datum();

		let width = 0;
		let height = 0;
		let linkWidth = 0;
		let nameWidth = 0;
		let maxFontSize = 0;

		let guessDepth = 0;
		let shouldReveal = false;
		let shouldTutorial = false;
		let correctName = '';

		// dom elements
		let $svg = null;
		let $links = null;
		let $nodes = null;
		let $letters = null;

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
					d.node.y0 * nameWidth + DEFAULT_WIDTH,
					d.node.x0 * height +
						((d.node.x1 - d.node.x0) * height - d.node.h) / 2 +
						d[0][0] * d.node.h
				],
				[
					d.child.y0 * nameWidth,
					d.child.x0 * height +
						((d.child.x1 - d.child.x0) * height - d.child.h) / 2
				],
				[
					d.child.y0 * nameWidth,
					d.child.x0 * height +
						((d.child.x1 - d.child.x0) * height - d.child.h) / 2 +
						d.child.h
				],
				[
					d.node.y0 * nameWidth + DEFAULT_WIDTH,
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

				// setup viz group
				$links = $g.append('g').attr('class', 'g-links');
				$nodes = $g.append('g').attr('class', 'g-nodes');
				$letters = $g.append('g').attr('class', 'g-letters');
			},
			// on resize, update new dimensions
			resize() {
				const w = $sel.node().offsetWidth;
				// TODO do height minus elements (input + buttons)
				const h = Math.min(window.innerHeight * 0.75, 480);

				linkWidth = Math.floor((w - MARGIN * 2) / MAX_CHARS);

				maxFontSize = Math.max(
					MIN_FONT_SIZE * 1.25,
					Math.floor(linkWidth * 0.67)
				);

				width = w - MARGIN * 2;
				height = h - MARGIN * 2;
				const lenCorrect = correctName.length - 1;
				const lenGuess = guessDepth + 1;

				// nameWidth represents how many chars we want to show on screen
				// it should be at minium the correct answer
				const lenMax = d3.max(data.data.values, d => d.name.length) - 1;
				const count = Math.max(...[lenCorrect, lenGuess, lenMax]);

				nameWidth = linkWidth * (count + 1); // +1 for the empty space at start
				const offsetWidth = linkWidth * count;

				$svg.attr('width', width + MARGIN).attr('height', height + MARGIN * 2);

				// center
				const offsetX = (width - offsetWidth) / 2 + linkWidth / 2;

				$svg
					.select('g')
					.attr('transform', `translate(${MARGIN + offsetX}, ${MARGIN})`);

				return Chart;
			},

			render() {
				const h = height * 0.67;
				const w = DEFAULT_WIDTH;

				scaleFont
					.domain(d3.extent(data.descendants(), d => d.value))
					.range([MIN_FONT_SIZE, maxFontSize]);
				d3
					.treemap()
					.size([w, h])
					.tile(d3.treemapSlice)(data);

				data.each(d => {
					d.h = d.y1 - d.y0;
					d.w = d.x1 - d.x0;
				});

				d3.partition()(data);

				$svg.classed('show-result', shouldReveal);

				const enterNode = sel => {
					const $el = sel.append('g').attr('class', 'node');
					$el.append('rect').attr('width', w);
					return $el;
				};

				const desc = data.descendants();

				const $node = $nodes
					.selectAll('g.node')
					.data(desc, d => d.data.id)
					.join(enterNode)
					.attr(
						'transform',
						d => `translate(${d.y0 * nameWidth}, ${d.x0 * height})`
					)
					.classed('is-guess', d => d.data.guess)
					.classed('is-correct', d => d.data.correct)
					.classed('is-visible', d => d.depth <= guessDepth);

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
					return false;
				});

				$links
					.selectAll('.link')
					.data(stackData, d => d.child.id)
					.join('path')
					.attr('class', 'link')
					.style('fill', d => scaleColor(d.child.depth))
					.classed('is-guess', d => d.child.data.guess)
					.classed('is-correct', d => d.child.data.correct)
					.classed('is-visible', d => d.node.depth <= guessDepth)
					.attr('d', customLine);

				const createText = ($el, { name, mod }) => {
					$el
						.append('text')
						.attr('alignment-baseline', 'middle')
						.attr('text-anchor', 'middle')
						.attr('class', `text-${name} text--${mod}`);
				};

				function enterLetter(sel) {
					const $el = sel.append('g').attr('class', 'letter');
					$el.call(createText, { name: 'letter', mod: 'bg' });
					$el.call(createText, { name: 'letter', mod: 'fg' });
					$el.call(createText, { name: 'count', mod: 'bg' });
					$el.call(createText, { name: 'count', mod: 'fg' });
					return $el;
				}

				// console.log(stackData);
				const $letter = $letters
					.selectAll('.letter')
					.data(stackData, d => d.child.id)
					.join(enterLetter)
					.attr('transform', d => `translate(${d.node.y0 * nameWidth}, 0)`)
					.classed('is-guess', d => d.child.data.guess)
					.classed('is-correct', d => d.child.data.correct)
					.classed('is-visible', d => d.node.depth <= guessDepth);

				$letter
					.selectAll('.text-letter')
					.attr('y', d => {
						const tL =
							d.node.x0 * height +
							((d.node.x1 - d.node.x0) * height - d.node.h) / 2 +
							d[0][0] * d.node.h;

						const bL =
							d.node.x0 * height +
							((d.node.x1 - d.node.x0) * height - d.node.h) / 2 +
							d[0][1] * d.node.h;

						const tR =
							d.child.x0 * height +
							((d.child.x1 - d.child.x0) * height - d.child.h) / 2;

						const bR =
							d.child.x0 * height +
							((d.child.x1 - d.child.x0) * height - d.child.h) / 2 +
							d.child.h;

						const midPosChild = (bR - tR) / 2;
						const delta = (tR - tL) / 2;
						return tL + midPosChild + delta;
					})
					.attr('x', linkWidth / 2)
					.style('font-size', d => `${scaleFont(d.child.value)}px`)
					.text(d => d.child.data.char);

				$letter
					.selectAll('.text-count')
					.attr('y', d => {
						const tL =
							d.node.x0 * height +
							((d.node.x1 - d.node.x0) * height - d.node.h) / 2 +
							d[0][0] * d.node.h;

						const bL =
							d.node.x0 * height +
							((d.node.x1 - d.node.x0) * height - d.node.h) / 2 +
							d[0][1] * d.node.h;

						const tR =
							d.child.x0 * height +
							((d.child.x1 - d.child.x0) * height - d.child.h) / 2;

						const bR =
							d.child.x0 * height +
							((d.child.x1 - d.child.x0) * height - d.child.h) / 2 +
							d.child.h;

						const midPosChild = (bR - tR) / 2;
						const delta = (tR - tL) / 2;
						const fs = scaleFont(d.child.value);
						return tL + midPosChild + delta + fs;
					})
					.attr('x', linkWidth / 2)
					// .text(d => d.child.data.count)
					.text(d =>
						d3
							.format('.3s')(d.child.data.count)
							.replace(/\.0*/g, '')
					)
					.classed('is-visible', d => d.child.data.percent >= 0.2);

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
				guessDepth = val - 1;
				Chart.resize();
				return Chart;
			},

			reveal(val) {
				if (!arguments.length) return shouldReveal;
				shouldReveal = val;
				return Chart;
			},

			tutorial(val) {
				if (!arguments.length) return shouldTutorial;
				shouldTutorial = val;
				return Chart;
			},

			correct(val) {
				if (!arguments.length) return correctName;
				correctName = ` ${val}`;
				scaleColor.domain([0, correctName.length]);
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
