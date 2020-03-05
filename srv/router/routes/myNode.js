/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, newcap:0*/
/*eslint-env node, es6 */
"use strict";
const express = require("express");
const async = require("async");
const https = require('https');
const csv = require('csvtojson')
const GeoJSON = require('geojson')

function formatDate(d) {
	//get the month
	var month = d.getMonth();
	//get the day
	//convert day to string
	var day = d.getDate().toString() - 1;
	//get the year
	var year = d.getFullYear();

	//pull the last two digits of the year
	year = year.toString().substr(-2);

	//increment month by 1 since it is 0 indexed
	//converts month to a string
	month = (month + 1).toString();

	//if month is 1-9 pad right with a 0 for two digits
	if (month.length === 1) {
		month = month;
	}

	//if day is between 1-9 pad right with a 0 for two digits
	if (day.length === 1) {
		day = day;
	}

	//return the string "MMddyy"
	return month + '/' + day + '/' + year;
}

function readHeader() {
	return new Promise(resolve => {
		const result = [];
		https.get(
			'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv',
			(resp) => {
				let data = '';

				// A chunk of data has been recieved.
				resp.on('data', (chunk) => {
					data += chunk;
				});

				// The whole response has been received. Print out the result.
				resp.on('end', () => {
					csv({
							noheader: false,
							output: "json"
						})
						.fromString(data)
						.then((csvRow) => {
							const result = [];
							var d = new Date();
							var date = formatDate(d);
							console.log(date);
							for (var i = 0; i < csvRow.length; i++) {
								result.push({
									'Province/State': csvRow[i]['Province/State'],
									'Country/Region': csvRow[i]['Country/Region'],
									'Lat': csvRow[i]['Lat'],
									'Long': csvRow[i]['Long']
								})
							}
							resolve(result);
						})
				});

			}).on("error", (err) => {
			console.log("Error: " + err.message);
		});
	});
}

function readConfirmed() {
	return new Promise(resolve => {
		const result = [];
		https.get(
			'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv',
			(resp) => {
				let data = '';

				// A chunk of data has been recieved.
				resp.on('data', (chunk) => {
					data += chunk;
				});

				// The whole response has been received. Print out the result.
				resp.on('end', () => {
					csv({
							noheader: false,
							output: "json"
						})
						.fromString(data)
						.then((csvRow) => {
							const result = [];
							var d = new Date();
							var date = formatDate(d);
							console.log(date);
							for (var i = 0; i < csvRow.length; i++) {
								result.push(csvRow[i][date]);
							}
							resolve(result);
						})
				});

			}).on("error", (err) => {
			console.log("Error: " + err.message);
		});
	});
}

function readDeath() {
	return new Promise(resolve => {
		const result = [];
		https.get(
			'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Deaths.csv',
			(resp) => {
				let data = '';

				// A chunk of data has been recieved.
				resp.on('data', (chunk) => {
					data += chunk;
				});

				// The whole response has been received. Print out the result.
				resp.on('end', () => {
					csv({
							noheader: false,
							output: "json"
						})
						.fromString(data)
						.then((csvRow) => {
							const result = [];
							var d = new Date();
							var date = formatDate(d);
							console.log(date);
							for (var i = 0; i < csvRow.length; i++) {
								result.push(csvRow[i][date]);
							}
							resolve(result);
						})
				});

			}).on("error", (err) => {
			console.log("Error: " + err.message);
		});
	});
}

function readRecovered() {
	return new Promise(resolve => {
		const result = [];
		https.get(
			'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Recovered.csv',
			(resp) => {
				let data = '';

				// A chunk of data has been recieved.
				resp.on('data', (chunk) => {
					data += chunk;
				});

				// The whole response has been received. Print out the result.
				resp.on('end', () => {
					csv({
							noheader: false,
							output: "json"
						})
						.fromString(data)
						.then((csvRow) => {
							const result = [];
							var d = new Date();
							var date = formatDate(d);
							console.log(date);
							for (var i = 0; i < csvRow.length; i++) {
								result.push(csvRow[i][date]);
							}
							resolve(result);
						})
				});

			}).on("error", (err) => {
			console.log("Error: " + err.message);
		});
	});
}

module.exports = function () {
	var app = express.Router();
	var userScope = null;

	app.get("/getSessionInfo", (req, res) => {
		async function msg() {
			const header_msg = await readHeader();
			const confirmed_msg = await readConfirmed();
			const death_msg = await readDeath();
			const recovered_msg = await readRecovered();

			const result = [];

			for (var i = 0; i < header_msg.length; i++) {
				result.push({
					'Province/State': header_msg[i]['Province/State'],
					'Country/Region': header_msg[i]['Country/Region'],
					'Lat': parseFloat(header_msg[i]['Lat']),
					'Long': parseFloat(header_msg[i]['Long']),
					'Recovered': parseFloat(recovered_msg[i]),
					'Confirmed': parseFloat(confirmed_msg[i]),
					'Death': parseFloat(death_msg[i])
				})
			}

			var geojson = GeoJSON.parse(result, {
				Point: ['Lat', 'Long']
			});

			res.type("application/json").status(200).send(JSON.stringify(geojson));
		}
		msg();
		//res.type("application/json").status(200).send("OK");
	});

	return app;
};