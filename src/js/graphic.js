import './pudding-chart/tree';
import db from './db';
import generateTreeData from './generate-tree-data';
import britneyData from './britney';
import PEOPLE from './people';

const TUTORIAL_DATA = britneyData.filter(d => d.count > 1000).slice(0, 10);
const SVG_VOLUME =
	'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-volume-2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';

const $audio = d3.select('audio');
const $quiz = d3.select('#quiz');
const $content = $quiz.select('.quiz__content');
const $nav = $quiz.select('.quiz__nav');
const $all = d3.select('#all');

const width = 0;
const height = 0;

let quizChart = null;
const allCharts = [];

let allData = {};

function resize() {
	if (quizChart) quizChart.resize();
}
// function resize(maxChars = 0) {
// 	const margin = { top: 30, right: 30, bottom: 30, left: 30 };
// 	const widthPerChar = 48;
// 	const w = widthPerChar * maxChars;
// 	const h = 480;
// 	width = w - margin.left - margin.right;
// 	height = h - margin.top - margin.bottom;

// 	$svg
// 		.attr('width', width + margin.left + margin.right)
// 		.attr('height', height + margin.top + margin.bottom);
// 	$g.attr('transform', `translate(${margin.left}, ${margin.top})`);
// }

// function updateChart({ treeData, versions, guess, reveal }) {
// 	const maxChars = d3.max(versions, d => d.name.length);
// 	const guessDepth = guess.length;

// 	resize(maxChars);
// }

function handleInputChange() {
	const $input = d3.select(this);
	const val = this.value.toLowerCase();
	const start = $input.attr('data-start');
	const guess = val.length && val.charAt(0) === start ? val : start;
	this.value = guess;

	const { id, versions } = $input.datum();
	const versionsClone = versions.map(d => ({ ...d }));

	const match = versionsClone.find(d => d.name === guess);
	if (match) match.count += 1;
	else versionsClone.push({ name: guess, count: 1 });
	const [treeData] = generateTreeData({
		data: versionsClone,
		guess,
		correct: id
	});

	const chars = d3.max(versionsClone, d => d.name.length);
	quizChart
		.data(treeData)
		.chars(chars)
		.guess(guess.length - 1)
		.resize()
		.render();
}

function handleResponseClick() {
	quizChart.reveal(true);
	const $input = d3.select(this.previousSibling);
	handleInputChange.call($input.node());
	$input.property('disabled', true);
}

function handlePersonClick() {
	$audio.node().play();
}

function createQuestion(d) {
	const $question = $content
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
		.attr('maxlength', 16)
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
	$audio.attr('src', `assets/audio/${d.id}.mp3`);
	return $question;
}

function showQuestion(id) {
	const datum = {
		...PEOPLE.find(d => d.id === id),
		versions: [...allData[id], { name: id.charAt(0), count: 1 }]
	};

	const $question = createQuestion(datum);

	const [treeData] = generateTreeData({
		data: datum.versions,
		guess: id.charAt(0),
		correct: datum.id
	});

	const chars = d3.max(datum.versions, d => d.name.length);

	quizChart = d3
		.select('figure')
		.datum(treeData)
		.puddingChartTree()
		.chars(chars)
		.resize()
		.render();

	$question.select('.question__response input').on('keyup', handleInputChange);
	$question.select('.question__person button').on('click', handlePersonClick);
	$question
		.select('.question__response button')
		.on('click', handleResponseClick);
}

function init() {
	d3.json(
		`https://pudding.cool/2019/02/sankey-data/data.json?version=${Date.now()}`
	)
		.then(response => {
			allData = response.data;
			allData.britney = TUTORIAL_DATA;
			// const person = Math.random() < 0.5 ? 'russell' : 'britney';
			showQuestion('britney');
			$nav.classed('is-visible', true);
			$nav.select('button').on('click', () => {
				$content.select('.question').remove();
				showQuestion('russell');
			});
		})
		.catch(console.error);
	// db.setup();
	// console.log(db.getGuess());

	resize();
}

export default { init, resize };
