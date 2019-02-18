import firebase from '@firebase/app';
import '@firebase/database';
import generateID from './generate-id';
import checkStorage from './check-storage';

let firebaseApp = null;
let firebaseDB = null;
let userData = {};
let connected = false;

const hasStorage = checkStorage('localStorage');

function getGuess() {
	return userData.guess;
}

function getResults() {
	return userData.results;
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

		return { id, guess, results };
	}

	const newID = generateID();
	window.localStorage.setItem('pudding_sankey_id', newID);
	return { id: newID, guess: {}, results: false };
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

function update({ key, value }) {
	userData.guess[key] = value;
	if (hasStorage)
		window.localStorage.setItem(
			'pudding_sankey_guess',
			JSON.stringify(userData.guess)
		);
	const { id, guess } = userData;
	if (connected) {
		firebaseDB
			.ref(id)
			.set({ guess })
			.then(() => {
				console.log('saved');
			})
			.catch(console.log);
	}
}

export default { setup, update, finish, getGuess, getResults, closeConnection };
