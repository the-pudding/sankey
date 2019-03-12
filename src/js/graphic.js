import './pudding-chart/tree';
import './pudding-chart/sankey';
import db from './db';
import generateSankeyData from './generate-sankey-data';
import britneyData from './britney';
import PEOPLE from './people';

const RANGE = [1, 10];

PEOPLE.sort((a, b) => d3.ascending(a.id, b.id));
// TODO remove slice
const PEOPLE_QUEUE = PEOPLE.map(d => ({ ...d })).filter(
	d => d.id !== 'britney'
);
d3.shuffle(PEOPLE_QUEUE);

const TUTORIAL_DATA = britneyData.filter(d => d.count > 1000).slice(0, 10);

const SVG_VOLUME =
	'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-volume-2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';

const $audioTutorial = d3.select('.audio--tutorial');
const $audioQuiz = d3.select('.audio--quiz');
const $quiz = d3.select('#quiz');
const $quizContent = $quiz.select('.quiz__content');
const $tutorialContent = d3.select('.tutorial__content');
const $all = d3.select('#all');
const $allContent = $all.select('.all__content');

let $nav = null;

let tutorialChart = null;
let quizChart = null;
let allCharts = null;
let rawData = {};
const allData = {};

function resize() {
	if (tutorialChart) tutorialChart.resize().render();
	if (quizChart) quizChart.resize().render();
	if (allCharts) allCharts.forEach(c => c.resize().render());
}

function cleanInput({ val, start }) {
	const clean = val.replace(/[^a-z]/g, '');
	return clean.length && clean.charAt(0) === start ? clean : start;
}

function handleFocus() {
	const { top } = $quiz
		.select('.question__person button')
		.node()
		.getBoundingClientRect();
	const y = window.scrollY + top - 16;
	window.scrollTo(0, y);
}

function handleInputChange() {
	const $input = d3.select(this);
	const val = this.value.toLowerCase();
	const start = $input.attr('data-start');
	const guess = cleanInput({ val, start });
	this.value = guess;

	const { id, versions } = $input.datum();
	const versionsClone = versions.filter(d => !d.user).map(d => ({ ...d }));

	const match = versionsClone.find(d => d.name === ` ${guess}`);
	if (match) match.count += 1;
	else versionsClone.push({ name: ` ${guess}`, count: 1 });

	const max = d3.max(versionsClone, p => p.count);
	const scaleCount = d3
		.scaleLinear()
		.domain([1, max])
		.range(RANGE);

	versionsClone.forEach(v => (v.countScaled = scaleCount(v.count)));

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

	const correct = guess === id;
	const { count } = versionsClone.find(d => d.name === ` ${id}`);
	const percent = d3.format('.0%')(count / total);
	const msg = `${
		correct ? 'Correct' : 'Wrong'
	}. <span>${percent}</span> of readers got it right.`;
	$quiz
		.select('.question__message')
		.classed('is-correct', guess === id)
		.html(msg);

	$input.classed('is-correct', guess === id);
}

function handleResponseClick() {
	const $input = d3.select(this.previousSibling);
	const disabled = $input.property('disabled');
	if (disabled) handleNewClick();
	else {
		quizChart.reveal(true);
		d3.select(this)
			.text('Show Me Another')
			.classed('is-next', true);
		handleInputChange.call($input.node(), true);
		$input.property('disabled', true).classed('is-done', true);
		$quiz.select('.question__message').classed('is-visible', true);
		const { top } = $quiz
			.select('.question__response')
			.node()
			.getBoundingClientRect();
		const y = window.scrollY + top;
		window.scrollTo(0, y);

		const { id } = $input.datum();
		const { value } = $input.node();
		db.update({ key: id, value });
	}
}

function handlePersonClick() {
	$audioQuiz.node().play();
}

function handleBritneyClick() {
	$audioTutorial.node().play();
}

function handleNewClick() {
	$quizContent
		.transition()
		.duration(250)
		.ease(d3.easeCubicInOut)
		.style('opacity', 0)
		.on('end', () => {
			$quizContent.select('.question').remove();

			if (PEOPLE_QUEUE.length) {
				nextQuestion();
				const { top } = $quizContent.node().getBoundingClientRect();
				const y = window.scrollY + top;
				window.scrollTo(0, y);
			}
		});
}

function finishData() {
	// update data
	Object.keys(allData).forEach(id => {
		const value = db.getGuess(id);
		if (value) {
			const match = allData[id].find(d => d.name === ` ${value}`);
			// only add to tally if not a returner
			if (match) {
				if (!db.getReturner()) match.count += 1;
			} else allData[id].push({ name: ` ${value}`, count: 1 });

			const max = d3.max(allData[id], p => p.count);
			const scaleCount = d3
				.scaleLinear()
				.domain([1, max])
				.range(RANGE);

			allData[id].forEach(v => (v.countScaled = scaleCount(v.count)));
		}
	});

	db.setReturner();
}

function handlePhoneticClick({ phonetic }) {
	d3.select(this)
		.text(phonetic)
		.on('click', () => {})
		.classed('is-done', true);
}

function handleAllClick(noscroll) {
	d3.select('.quiz__below').remove();
	db.finish();

	finishData();

	$quiz.style('display', 'none');

	$all.classed('is-visible', true);

	allCharts = PEOPLE.filter(d => d.id !== 'britney').map(person => {
		const { id, fullname, description } = person;

		const total = d3.sum(allData[id], d => d.count);

		const sankeyData = generateSankeyData({
			data: allData[id],
			correct: id,
			total,
			guess: db.getGuess(id) || ''
		});

		const $person = $allContent.append('div').attr('class', 'person');
		$person
			.append('p')
			.attr('class', 'person__name')
			.text(fullname.join(' '));

		$person
			.append('p')
			.attr('class', 'person__description')
			.text(description);

		const $figure = $person.append('figure');

		const chart = $figure
			.datum(sankeyData)
			.puddingChartSankey()
			.correct(id)
			.resize()
			.reveal(true)
			.render(true);

		return chart;
	});

	if (noscroll) return false;

	const { top } = $all.node().getBoundingClientRect();
	const y = window.scrollY + top;
	window.scrollTo(0, y);
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
		.attr('src', `assets/images/${d.id}@2x.jpg`)
		.attr('alt', d.id);

	$person.append('p').text(d.description);

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
		.classed('is-guess', d.pos === 0)
		.text(d.pos === 0 ? firstHide : first);
	$button
		.append('span')
		.attr('class', 'last')
		.classed('is-guess', d.pos === 1)
		.text(d.pos === 1 ? lastHide : last);
	$button
		.append('span')
		.attr('class', 'icon')
		.html(SVG_VOLUME);

	if (d.phonetic) {
		$person
			.append('button')
			.attr('class', 'btn btn--phonetic')
			.text('Phonetic Spelling')
			.on('click', handlePhoneticClick);
	}

	// RESPONSE
	const $response = $question.append('div').attr('class', 'question__response');
	$nav = $question.append('div').attr('class', 'question__nav is-visible');

	if (PEOPLE_QUEUE.length > 1) {
		$nav
			.append('button')
			.attr('class', 'btn btn--new')
			.text('Show Me Another')
			.on('click', handleNewClick);
	} else {
		d3.select('.quiz__below .btn--new').remove();
	}

	$nav
		.append('button')
		.attr('class', 'btn btn--all')
		.text('Skip To Results')
		.on('click', d => handleAllClick());

	$nav.append('p').text(`${PEOPLE_QUEUE.length - 1} names left`);

	$question.append('p').attr('class', 'question__message');

	const start = d.pos === 0 ? first.charAt(0) : last.charAt(0);

	$response
		.append('input')
		.attr('maxlength', d.id.length + 2)
		.attr('spellcheck', false)
		.attr('data-start', start.toLowerCase())
		.attr('value', start.toLowerCase())
		.on('focus', handleFocus);

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
			{ name: ` ${id.charAt(0)}`, count: 1, user: true }
		]
	};

	const max = d3.max(datum.versions, p => p.count);
	const scaleCount = d3
		.scaleLinear()
		.domain([1, max])
		.range(RANGE);
	datum.versions.forEach(v => (v.countScaled = scaleCount(v.count)));

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

	$quizContent
		.transition()
		.duration(250)
		.ease(d3.easeCubicInOut)
		.style('opacity', 1);
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
		.reveal(depth > id.length)
		.render(true);

	let delay = 500;
	if (depth > id.length) delay = 4000;
	else if (depth === 4) delay = 4000;

	d3.timeout(() => {
		const next = depth + 1;
		const nextDepth = next > id.length + 1 ? 1 : depth + 1;
		stepTutorial({ id, depth: nextDepth });
	}, delay);
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
		.guess(1)
		.tutorial(true)
		.resize()
		.render();

	stepTutorial({ id });
}

function cleanAllData(data) {
	rawData = data;
	rawData.britney = TUTORIAL_DATA;
	for (const i in rawData) {
		// sort + slice
		const dupe = rawData[i].map(d => ({ ...d }));
		dupe.sort((a, b) => d3.descending(a.count, b.count));

		const max = d3.max(dupe, p => p.count);
		const scaleCount = d3
			.scaleLinear()
			.domain([1, max])
			.range(RANGE);
		allData[i] = dupe.slice(0, 8).map(d => ({
			...d,
			countScaled: scaleCount(d.count),
			name: ` ${d.name}`
		}));
		if (i !== 'britney') d3.shuffle(allData[i]);
	}
}

function nextQuestion() {
	const { id } = PEOPLE_QUEUE.pop();
	if (!PEOPLE_QUEUE.length) handleAllClick();

	if (!db.getGuess(id)) showQuestion(id);
	else nextQuestion();
}

function createTable({ id, data }) {
	const w = d3.select('#list').node().offsetWidth;
	const test = '10,000'.length;
	const max = 'galifianakis'.length + 3 + test;
	const clean = data.slice(0, 64).map(d => ({
		...d,
		count: d3.format(',')(d.count)
	}));

	// const max = d3.max(data, d => d.name.length);
	const $t = d3
		.select('#list')
		.append('div')
		.attr('class', 'table');

	const { fullname, description } = PEOPLE.find(d => d.id === id);
	const $hed = $t.append('h3');
	$hed
		.append('span')
		.attr('class', 'name')
		.text(fullname.join(' '));

	const total = d3.format(',')(d3.sum(data, d => d.count));
	$hed
		.append('span')
		.attr('class', 'description')
		.text(`${description} [${total} responses]`);

	const $figure = $t.append('figure');

	$figure
		.selectAll('p')
		.data(clean)
		.join('p')
		.html(d => {
			const gap = max - (d.name.length + d.count.length);
			const dots = d3
				.range(gap)
				.map(() => '.')
				.join('');
			const correct = d.name === id ? 'correct' : '';
			return `<span class="${correct}">${
				d.name
			}</span><span>${dots}</span><span>${d.count}</span>`;
		});
	// .style('width', `${max * 24}px`);
}

function setupList() {
	const toSort = [];
	for (const i in rawData) {
		if (i !== 'britney') toSort.push({ id: i, data: rawData[i] });
	}

	toSort.sort((a, b) =>
		d3.descending(d3.sum(a.data, v => v.count), d3.sum(b.data, v => v.count))
	);
	toSort.forEach(createTable);
}

function init() {
	db.setup();

	d3.json(
		`https://pudding.cool/2019/02/sankey-data/data.json?version=${Date.now()}`
	)
		.then(response => {
			d3.select('#all .prose span').text(d3.format(',')(response.data.total));
			d3.select('#list h1 span').text(d3.format(',')(response.data.total));
			cleanAllData(response.data.names);
			if (response && response.updated) console.log(response.updated);
			d3.select('.btn--skip')
				.node()
				.addEventListener('click', handleSkipClick);

			d3.select('.btn--britney')
				.on('click', handleBritneyClick)
				.append('span')
				.html(SVG_VOLUME);

			showTutorial('britney');
			if (db.getReturner()) handleAllClick(true);
			else nextQuestion();

			d3.select('.quiz__below .btn--all').on('click', handleAllClick);
			d3.select('.quiz__below .btn--new').on('click', handleNewClick);

			// setupList();
		})
		.catch(console.error);
}

export default { init, resize };
