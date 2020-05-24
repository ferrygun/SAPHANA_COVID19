/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, newcap:0*/
/*eslint-env node, es6 */
"use strict";
const express = require("express");
const https = require('https');
const csv = require('csvtojson')
const GeoJSON = require('geojson')

const confirmed =
	'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv';
const death =
	'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv';
const recovered =
	'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv';

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

function readData(url, flag) {
	return new Promise(resolve => {
		const result = [];
		https.get(
			url,
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
									'Long': csvRow[i]['Long'],
									[flag]: csvRow[i][date]
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

function readStats(url, flag) {
	return new Promise(resolve => {
		const result = [];
		const fin = [];
		https.get(
			url,
			(resp) => {
				let data = '';

				// A chunk of data has been recieved.
				resp.on('data', (chunk) => {
					data += chunk;
				});

				// The whole response has been received. Print out the result.
				resp.on('end', () => {
					var count = 0;
					csv({
							noheader: false,
							output: "json"
						})
						.fromString(data)
						.then((csvRow) => {
							const result = [];
							var d = new Date();
							var date = formatDate(d);
							//console.log(date);
							for (var i = 0; i < csvRow.length; i++) {
								if(!isNaN(csvRow[i][date]) && csvRow[i][date] !== "") {
									count = count + parseInt(csvRow[i][date]);
								}
							}
							fin.push({
								'status': flag,
								'count': count,
								'date': date
							})
							resolve(fin);
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
			const confirmed_msg = await readData(confirmed, "confirmed");
			const death_msg = await readData(death, "death");
			const recovered_msg = await readData(recovered, "recovered");

			const result = [];
			var recoveredFloat;

			for (var i = 0; i < confirmed_msg.length; i++) {
				if(typeof(confirmed_msg[i]) === "undefined") {
					console.error("Undefinded confirmed case at index: " + i);
				}
				if(typeof(recovered_msg[i]) === "undefined") {
					console.error("Undefinded recovered case at index: " + i);
				} else {
					recoveredFloat = parseFloat(recovered_msg[i]['recovered']);
				}
				result.push({
					'Province/State': confirmed_msg[i]['Province/State'],
					'Country/Region': confirmed_msg[i]['Country/Region'],
					'Lat': parseFloat(confirmed_msg[i]['Lat']),
					'Long': parseFloat(confirmed_msg[i]['Long']),
					'Recovered': recoveredFloat,
					'Confirmed': parseFloat(confirmed_msg[i]['confirmed']),
					'Death': parseFloat(death_msg[i]['death'])
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

	app.get('/stats', async function (request, response) {

		var confirmed_msg = await readStats(confirmed, "confirmed");
		var confirmed_msg_count = confirmed_msg[0].count;
		var date = confirmed_msg[0].date;

		var death_msg = await readStats(death, "death");
		var death_msg_count = death_msg[0].count;

		var recovered_msg = await readStats(recovered, "recovered");
		var recovered_msg_count = recovered_msg[0].count;

		const result = [];
		result.push({
			'confirmed': confirmed_msg_count,
			'death': death_msg_count,
			'recovered': recovered_msg_count,
			'date': date
		})

		response.send(JSON.stringify(result));
	});

	return app;
};
