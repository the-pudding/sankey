import './pudding-chart/tree';
import './pudding-chart/sankey';
import db from './db';
import generateTreeData from './generate-tree-data';
import generateSankeyData from './generate-sankey-data';
import britneyData from './britney';
import PEOPLE from './people';

const TUTORIAL_DATA = britneyData.filter(d => d.count > 1000).slice(0, 10);

const SVG_VOLUME =
	'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-volume-2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';

const $audioTutorial = d3.select('.audio--tutorial');
const $audioQuiz = d3.select('audio--quiz');
const $quiz = d3.select('#quiz');
const $quizContent = $quiz.select('.quiz__content');
const $tutorialContent = d3.select('.tutorial__content');
const $nav = $quiz.select('.quiz__nav');
const $all = d3.select('#all');

const width = 0;
const height = 0;

let tutorialChart = null;
let quizChart = null;
let allCharts = [];

let allData = {};

function resize() {}

function handleInputChange() {
	const $input = d3.select(this);
	const val = this.value.toLowerCase();
	const start = $input.attr('data-start');
	const guess = val.length && val.charAt(0) === start ? val : start;
	this.value = guess;

	const { id, versions } = $input.datum();
	const versionsClone = versions.map(d => ({ ...d }));

	const match = versionsClone.find(d => d.name === ` ${guess}`);
	if (match) match.count += 1;
	else versionsClone.push({ name: ` ${guess}`, count: 1, countScaled: 1 });

	const total = d3.sum(versionsClone, d => d.count);

	const sankeyData = generateSankeyData({
		data: versionsClone,
		guess,
		correct: id,
		total
	});

	quizChart
		.data(sankeyData)
		.guess(guess.length)
		.resize()
		.render(true);

	// 	const [treeData] = generateTreeData({
	// 		data: versionsClone,
	// 		guess,
	// 		correct: id,
	// 		total
	// 	});

	// 	quizChart
	// 		.data(treeData)
	// 		.guess(guess.length - 1)
	// 		.resize()
	// 		.render(true);
}

function handleResponseClick() {
	quizChart.reveal(true);
	const $input = d3.select(this.previousSibling);
	handleInputChange.call($input.node());
	$input.property('disabled', true);
}

function handlePersonClick() {
	$audioQuiz.node().play();
}

function handleBritneyClick() {
	$audioTutorial.node().play();
}

function handleNewClick() {
	$quizContent.select('.question').remove();
	showQuestion('russell');
}

function handleAllClick() {
	$quizContent.select('.question').remove();

	allCharts = PEOPLE.map(person => {
		const { id, fullname } = person;

		const total = d3.sum(allData[id], d => d.count);

		const [treeData] = generateTreeData({
			data: allData[id],
			correct: id,
			total
		});

		const $person = $all.append('div').attr('class', 'person');
		$person.append('p').text(fullname.join(' '));

		const $figure = $person.append('figure');

		const chart = $figure
			.datum(treeData)
			.puddingChartTree()
			.reveal(true)
			.resize()
			.render();

		return chart;
	});
}

function handleSkipClick(event) {
	event.preventDefault();
	handleAllClick();
	return false;
}

function createQuestion(d) {
	const $question = $quizContent
		.append('div')
		.attr('class', 'question')
		.datum(d);

	// PERSON
	const $person = $question.append('div').attr('class', 'question__person');

	$person
		.append('img')
		.attr('src', `assets/images/${d.id}.jpg`)
		.attr('alt', d.id);

	const $button = $person.append('button').attr('class', 'btn');
	const [first, last] = d.fullname;
	const firstHide = d3
		.range(first.length)
		.map(() => '_')
		.join('');
	const lastHide = d3
		.range(last.length)
		.map(() => '_')
		.join('');

	$button
		.append('span')
		.attr('class', 'first')
		.text(d.pos === 0 ? firstHide : first);
	$button
		.append('span')
		.attr('class', 'last')
		.text(d.pos === 1 ? lastHide : last);
	$button
		.append('span')
		.attr('class', 'icon')
		.html(SVG_VOLUME);

	// RESPONSE
	const $response = $question.append('div').attr('class', 'question__response');
	const start = d.pos === 0 ? first.charAt(0) : last.charAt(0);
	$response
		.append('input')
		.attr('maxlength', d.id.length + 2)
		.attr('spellcheck', false)
		.attr('data-start', start)
		.attr('value', start);
	$response
		.append('button')
		.attr('class', 'btn')
		.text('I Think I’ve Got It');

	// FIGURE
	$question.append('figure').attr('class', 'question__figure');

	// AUDIO
	$audioQuiz.attr('src', `assets/audio/${d.id}.mp3`);
	return $question;
}

function showQuestion(id) {
	const datum = {
		...PEOPLE.find(d => d.id === id),
		versions: [
			...allData[id],
			{ name: ` ${id.charAt(0)}`, count: 1, countScaled: 1 }
		]
	};

	const $question = createQuestion(datum);

	const total = d3.sum(datum.versions, d => d.count);

	const sankeyData = generateSankeyData({
		data: datum.versions,
		guess: id.charAt(0),
		correct: datum.id,
		total
	});

	quizChart = $quizContent
		.select('figure')
		.datum(sankeyData)
		.puddingChartSankey()
		.correct(datum.id)
		.resize()
		.render();

	$question.select('.question__response input').on('keyup', handleInputChange);
	$question.select('.question__person button').on('click', handlePersonClick);
	$question
		.select('.question__response button')
		.on('click', handleResponseClick);
}

function stepTutorial({ id, depth = 1 }) {
	const total = d3.sum(allData[id], d => d.count);

	const sankeyData = generateSankeyData({
		data: allData[id],
		correct: id,
		guess: id.substring(0, depth),
		total
	});

	tutorialChart
		.data(sankeyData)
		.guess(depth)
		.resize()
		.render(true);

	d3.timeout(
		() => {
			const next = depth + 1;
			const nextDepth = next > id.length + 1 ? 1 : depth + 1;
			stepTutorial({ id, depth: nextDepth });
		},
		depth > id.length ? 3000 : 200 + depth * 200
	);
}

function showTutorial(id) {
	const total = d3.sum(allData[id], d => d.count);

	const sankeyData = generateSankeyData({
		data: allData[id],
		correct: id,
		total
	});

	tutorialChart = $tutorialContent
		.select('figure')
		.datum(sankeyData)
		.puddingChartSankey()
		.correct(id)
		.tutorial(true)
		.resize()
		.render();

	stepTutorial({ id });
}

function cleanAllData(data) {
	allData = data;
	allData.britney = TUTORIAL_DATA;
	for (const i in allData) {
		// const scaleCount = d3.scaleLog().domain([1, britneyData[0].count]);
		const person = allData[i];
		const max = d3.max(person, p => p.count);
		const scaleCount = d3
			.scaleSqrt()
			.domain([1, max])
			.range([2, 10]);
		allData[i] = person.map(d => ({
			...d,
			countScaled: scaleCount(d.count),
			name: ` ${d.name}`
		}));
	}
}

function init() {
	d3.json(
		`https://pudding.cool/2019/02/sankey-data/data.json?version=${Date.now()}`
	)
		.then(response => {
			cleanAllData(response.data);
			$nav.classed('is-visible', true);
			$nav.select('.btn--new').on('click', handleNewClick);
			$nav.select('.btn--all').on('click', handleAllClick);
			d3.select('.btn--skip')
				.node()
				.addEventListener('click', handleSkipClick);

			d3.select('.btn--britney')
				.on('click', handleBritneyClick)
				.append('span')
				.html(SVG_VOLUME);

			showTutorial('britney');
			showQuestion('russell');
		})
		.catch(console.error);

	// db.setup();
	// console.log(db.getGuess());

	resize();
}

export default { init, resize };
