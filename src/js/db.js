import lev from 'js-levenshtein';
import firebase from '@firebase/app';
import '@firebase/database';
import generateID from './generate-id';
import checkStorage from './check-storage';
import SWEAR from './swear';

let firebaseApp = null;
let firebaseDB = null;
let userData = {};
let connected = false;

const hasStorage = checkStorage('localStorage');

function getGuess(id) {
	if (userData.guess) return userData.guess[id];
	return null;
}

function hasResults() {
	return userData.results;
}

function getReturner() {
	return userData.returner;
}

function setReturner() {
	userData.returner = 'true';
	if (hasStorage)
		window.localStorage.setItem('pudding_sankey_returner', 'true');
}

function setupUserData() {
	if (hasStorage) {
		let id = window.localStorage.getItem('pudding_sankey_id');
		if (!id) {
			id = generateID();
			window.localStorage.setItem('pudding_sankey_id', id);
		}

		let guess = window.localStorage.getItem('pudding_sankey_guess');
		guess = guess ? JSON.parse(guess) : {};

		const results = window.localStorage.getItem('pudding_sankey_results');
		const returner = window.localStorage.getItem('pudding_sankey_returner');

		return { id, guess, results, returner };
	}

	const newID = generateID();
	window.localStorage.setItem('pudding_sankey_id', newID);
	return { id: newID, guess: {}, results: false, returner: false };
}

function connect() {
	// Initialize Firebase
	const config = {
		apiKey: 'AIzaSyAlExpUVmw8SEvupKd3ros5wHdk5lOY2Dg',
		authDomain: 'sankey-d043b.firebaseapp.com',
		databaseURL: 'https://sankey-d043b.firebaseio.com',
		projectId: 'sankey-d043b'
	};
	firebaseApp = firebase.initializeApp(config);
	firebaseDB = firebaseApp.database();
	connected = true;
}

function clear() {
	localStorage.removeItem('pudding_sankey_id');
	localStorage.removeItem('pudding_sankey_guess');
	localStorage.removeItem('pudding_sankey_results');
	localStorage.removeItem('pudding_sankey_returner');
}

function setup() {
	if (window.location.host.includes('localhost')) clear();
	userData = setupUserData();
	if (!userData.results) connect();
	// console.log({ userData });
}

function closeConnection() {
	if (connected)
		firebaseApp.delete().then(() => {
			connected = false;
		});
}

function finish() {
	userData.results = 'true';
	if (hasStorage) window.localStorage.setItem('pudding_sankey_results', 'true');

	closeConnection();
}

function getSubmissions(data) {
	const output = {};
	Object.keys(data).forEach(d => {
		const g = data[d];
		// minimum character length
		const minChars = Math.floor(d.length * 0.67);
		if (g.length < minChars) return false;

		const hasSwear = SWEAR.find(s => g.includes(s));
		if (hasSwear) return false;

		const maxDist = Math.floor(d.length * 0.5);
		const dist = lev(d, g);
		const mostlyWrong = dist > maxDist;
		if (mostlyWrong) return false;

		// add to submit list
		output[d] = g;
	});
	return output;
}

function update({ key, value }) {
	userData.guess[key] = value;
	if (hasStorage)
		window.localStorage.setItem(
			'pudding_sankey_guess',
			JSON.stringify(userData.guess)
		);
	const { id, guess } = userData;
	const submissions = getSubmissions(guess);

	if (Object.keys(submissions).length && connected) {
		firebaseDB
			.ref(id)
			.set({ guess: submissions })
			.then(() => {
				// console.log('saved');
			})
			.catch(console.log);
	}
}

export default {
	setup,
	update,
	finish,
	getGuess,
	hasResults,
	setReturner,
	getReturner,
	closeConnection
};
