// https://bl.ocks.org/timelyportfolio/a6f2f931935025b0476ea6180d348c59
import * as Annotate from 'd3-svg-annotation';
import C from '../color';

d3.selection.prototype.puddingChartSankey = function init() {
	function createChart(el) {
		const DEFAULT_WIDTH = 2;
		const MIN_FONT_SIZE = 16;
		const OFF_H = 144;
		const MAX_CHARS = 'galifianakis'.length + 2;

		const margin = {
			top: MIN_FONT_SIZE,
			bottom: MIN_FONT_SIZE,
			left: 0,
			right: MIN_FONT_SIZE * 1.5
		};
		const scaleFont = d3.scaleLinear();
		const scaleColorPurple = d3.scaleLinear().range([C.purple, C.purpleLight]);
		const scaleColorBlue = d3.scaleLinear().range([C.blue, C.blueLight]);
		const scaleColorPink = d3.scaleLinear().range([C.pink, C.pinkLight]);

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
		let $labels = null;
		let $annotations = null;

		const anno = {
			key: ' brin',
			text: 'of people type "n" at this point'
		};

		// helper functions
		function stack(x) {
			const xobj = {};
			const sum = d3.sum(x.children, d => d.h);
			x.children.forEach(d => (xobj[d.data.char] = d.h / sum));
			return d3.stack().keys(Object.keys(xobj))([xobj]);
		}

		function formatNumber(x) {
			// const sig = x >= 100000 || x < 1000 ? 3 : 2
			if (x < 1000) return x;
			const sig = x < 10000 ? 2 : 3;
			return d3.format(`.${sig}s`)(x);
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

		function createAnnotation(datum) {
			const $anno = $annotations.append('g').attr('class', 'annotation');

			const typeCurve = Annotate.annotationCustomType(
				Annotate.annotationCalloutElbow,
				{
					className: 'custom',
					// connector: { type: 'curve' },
					note: {
						lineType: 'horizontal',
						align: 'right'
						// orientation: 'leftRight'
					}
				}
			);

			// const percent = d3.format('.0%')(datum.child.data.percent);
			// console.log(datum.child.data);
			const x = datum.node.y0 * nameWidth;
			// const y = datum.child.x0 * height;

			const tL =
				datum.node.x0 * height +
				((datum.node.x1 - datum.node.x0) * height - datum.node.h) / 2 +
				datum[0][0] * datum.node.h;

			const bL =
				datum.node.x0 * height +
				((datum.node.x1 - datum.node.x0) * height - datum.node.h) / 2 +
				datum[0][1] * datum.node.h;

			const y = tL + (bL - tL) / 2;

			const annotationData = [
				{
					note: {
						// title: d.year,
						label: '1% of people type "n" at this point',
						padding: 6,
						wrap: width < 480 ? 80 : 120
						// bgPadding: { top: 8, left: 8, right: 8, bottom: 8 }
					},
					data: { x, y },
					// dx: (12 - +d.month) * flagW + flagW * 1.25,
					dx: -linkWidth / 2,
					// dy: +d.pos * flagH * 2,
					dy: height * 0.1
					// connector: {
					// 	points: 1
					// 	// curve: d3.curveBasis
					// }
				}
			];

			// console.log(datum.child);
			const makeAnnotations = Annotate.annotation()
				.type(typeCurve)
				.notePadding(12)
				.accessors({
					x: d => d.x,
					y: d => d.y
				})
				.annotations(annotationData);

			$anno.call(makeAnnotations);
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
				$labels = $g.append('g').attr('class', 'g-labels');
				$annotations = $g.append('g').attr('class', 'g-annotations');
			},
			// on resize, update new dimensions
			resize() {
				const w = $sel.node().offsetWidth;
				// TODO do height minus elements (input + buttons)
				// const offN = d3.select('.question__nav').node().offsetHeight;
				// const offR = d3.select('.question__response').node().offsetHeight;

				// const h = Math.min(Math.max(window.innerHeight - OFF_H, 420), 540);
				const h = 420;

				linkWidth = Math.floor((w - margin.right - margin.right) / MAX_CHARS);

				maxFontSize = Math.max(
					MIN_FONT_SIZE * 1.25,
					Math.floor(linkWidth * 0.67)
				);

				width = w - margin.left - margin.right;
				height = h - margin.top - margin.bottom;
				const lenCorrect = correctName.length - 1;
				const lenGuess = guessDepth + 1;

				// nameWidth represents how many chars we want to show on screen
				// it should be at minium the correct answer
				const lenMax = d3.max(data.data.values, d => d.name.length) - 1;
				const count = Math.max(...[lenCorrect, lenGuess, lenMax]);

				nameWidth = linkWidth * (count + 1); // +1 for the empty space at start
				const offsetWidth = linkWidth * count;

				$svg
					.attr('width', width + margin.left + margin.right)
					.attr('height', height + margin.top + margin.bottom);

				// center
				const offsetX = (width - offsetWidth) / 2 - margin.right / 2;

				$svg
					.select('g')
					.attr(
						'transform',
						`translate(${margin.left + offsetX}, ${margin.top})`
					);

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

				$svg
					.classed('show-result', shouldReveal)
					.classed('show-tutorial', shouldTutorial);

				const enterNode = sel => {
					const $el = sel.append('g').attr('class', 'node');
					$el
						.append('rect')
						.attr('width', d =>
							shouldTutorial && width > 480 && d.data.key === ' bri'
								? w * 2.5
								: w
						);
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
					.classed('is-visible', d => d.depth <= guessDepth)
					.classed('is-leaf', d => !d.children);

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
					.data((d, i, n) => d3.range(n.length).map(() => ({ ...d })))
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

						const y = tL + midPosChild + delta;

						return y;
					})
					.attr('x', linkWidth / 2)
					.style('font-size', d => `${scaleFont(d.child.value)}px`)
					.text(d => d.child.data.char);

				$letter
					.selectAll('.text-count')
					.data((d, i, n) => d3.range(n.length).map(() => ({ ...d })))
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
					.text(d => formatNumber(d.child.data.count))
					.classed('is-visible', d => d.child.data.percent >= 0.2)
					.style('font-size', width < 480 ? '11px' : '13px');

				function enterLabel(sel) {
					const $el = sel.append('g').attr('class', 'label');
					$el.call(createText, { name: 'name', mod: 'fg' });
					$el.call(createText, { name: 'number', mod: 'fg' });
					return $el;
				}

				const labelData = stackData.filter(d => {
					if (shouldReveal) {
						// check if is correct and children are correct OR no child
						const noChild = !d.child.children;
						const correctContinues = !noChild
							? d.child.children.find(v => v.data.correct)
							: false;
						return (
							(noChild || (d.child.data.correct && !correctContinues)) &&
							(d.child.data.guess || d.child.data.correct)
						);
					}

					if (!shouldTutorial)
						return d.child.data.guess && d.child.depth === guessDepth + 1;
					return false;
				});

				const $label = $labels
					.selectAll('.label')
					.data(labelData, d => d.child.id)
					.join(enterLabel)
					.attr('class', 'label')
					.attr('transform', d => {
						const tR =
							d.child.x0 * height +
							((d.child.x1 - d.child.x0) * height - d.child.h) / 2;

						const bR =
							d.child.x0 * height +
							((d.child.x1 - d.child.x0) * height - d.child.h) / 2 +
							d.child.h;

						const midPosChild = (bR - tR) / 2;
						// const fs = scaleFont(d.child.value);

						const y = tR + midPosChild;
						const x = d.child.y0 * nameWidth + DEFAULT_WIDTH * 4;
						const xOff = shouldReveal && d.child.children ? linkWidth : 0;
						return `translate(${x + xOff}, ${y})`;
					})
					.classed('is-guess', d => d.child.data.guess)
					.classed('is-correct', d => d.child.data.correct);

				$label
					.selectAll('.text-name')
					.attr('text-anchor', 'start')
					.data((d, i, n) => d3.range(n.length).map(() => ({ ...d })))
					.text(d => {
						if (shouldReveal)
							return d.child.data.correct ? 'Correct' : 'Your Path';
						return 'Your Path';
					});

				$label
					.selectAll('.text-number')
					.attr('text-anchor', 'start')
					.data((d, i, n) => d3.range(n.length).map(() => ({ ...d })))
					.attr('y', MIN_FONT_SIZE)
					.text(d => {
						const c = formatNumber(d.child.data.count);
						const t = formatNumber(stackData[0].node.data.count);
						return `${c} of ${t}`;
					})
					.style('font-size', width < 480 ? '11px' : '13px');

				$annotations.select('.annotation').remove();
				if (shouldTutorial && guessDepth >= 3)
					createAnnotation(stackData.find(d => d.child.data.key === ' brin'));
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
				scaleColorPurple.domain([0, correctName.length]);
				scaleColorBlue.domain([0, correctName.length]);
				scaleColorPink.domain([0, correctName.length]);
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
