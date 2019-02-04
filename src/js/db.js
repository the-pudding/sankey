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

function setupUserData() {
	if (hasStorage) {
		let id = window.localStorage.getItem('pudding_sankey_id');
		if (!id) {
			id = generateID();
			window.localStorage.setItem('pudding_sankey_id', id);
		}

		let guess = window.localStorage.getItem('pudding_sankey_guess');
		guess = guess ? JSON.parse(guess) : {};
		return { id, guess };
	}

	const newID = generateID();
	window.localStorage.setItem('pudding_sankey_id', newID);
	return { id: newID, guess: {} };
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

function exists() {
	// return typeof userData.guesses === 'number' && typeof userData.guess === 'number';
	return false;
}

function clear() {
	localStorage.removeItem('pudding_sankey_id');
	localStorage.removeItem('pudding_sankey_guess');
}

function setup() {
	// if (window.location.host.includes('localhost')) clear();
	userData = setupUserData();
	if (!exists()) connect();
	// update({ key: 'russell', value: 'russel' });
}

function closeConnection() {
	if (connected)
		firebaseApp.delete().then(() => {
			connected = false;
		});
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
			.then(d => {
				console.log(d);
			})
			.catch(console.log);
	}
}

export default { setup, update, getGuess, closeConnection };
