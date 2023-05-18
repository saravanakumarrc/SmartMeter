const mqtt = require('mqtt');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Subscription = require('./subscription');
const Reading = require('./reading');
const Alert = require('./alert');
var https = require('follow-redirects').https;
var fs = require('fs');
const { Vonage } = require('@vonage/server-sdk');
const UserProfile = require('./userprofile');
const moment = require('moment/moment');
const nodemailer = require('nodemailer');

const vonage = new Vonage({
  apiKey: "ef3f295c",
  apiSecret: "9WAtMUX4o6FGzAZy"
})

//connecting to mqtt broker
const mqttclient = mqtt.connect('mqtt://broker.hivemq.com')
//mqttclient.subscribe('KNOW_16042023_VOL');
//mqttclient.subscribe('KNOW_16042023_CUR');
mqttclient.subscribe('KNOW_16042023_POW');

// connect to mongodb
mongoose.connect('mongodb+srv://saravanakumarrc:sarapower@cluster0.omi9lez.mongodb.net/SmartHomeDB?retryWrites=true&w=majority');
mongoose.Promise = global.Promise;

// set up our express app
const app = express();
app.use(express.static('public'));
app.use(express.json());
app.use(cors());
// initialize routes
app.use('/api', require('./api'));

// error handling middleware
app.use(function (err, req, res, next) {
	//console.log(err);
	res.status(422).send({ error: err.message });
});

// listen for requests
app.listen(process.env.port || 4000, function () {
	console.log('Ready to Go!');
});

mqttclient.on('message', (topic, message, packet) => {
	console.log(`Received message on topic ${topic}: ${message.toString()}`);
	var deviceId = topic.split('_')[1];
	var readingType = topic.split('_')[2];
	var cost = 0;
	var reading = {};
	if (readingType == "POW") {		
		var date = new Date();
		var monthStartingDay = new Date(date.getFullYear(), date.getMonth(), 1);
		Reading.findOne({ deviceId: deviceId, unitType: "POW", usedAt: { $gt: monthStartingDay } },[], { sort: { 'usedAt': -1 }}).then(function(lastReading){
			var unit = message/1000;
			if(lastReading){
				console.log("usedAt",lastReading.usedAt);
				console.log("units",lastReading.units);
				units = parseFloat(lastReading.units + unit);				
				cost = calculateCost(units);
				Alert.find({deviceId: deviceId, isSent: false}).then(function(alerts){
					console.log("alerts", alerts);
					alerts.forEach(function(alert){
						console.log("units", units);
						console.log("alert.unitLimit", alert.unitLimit);
						console.log("alert.alertType", alert.alertType);
						if(alert && !alert.isSent 
							&& ((alert.alertType == "power" && parseFloat(message.toString()) > alert.unitLimit)
							|| (alert.alertType == "units" && units > alert.unitLimit)
							|| (alert.alertType == "cost" && cost > alert.unitLimit))){		
							UserProfile.findOne({ _id: alert.userId }).then(function(userprofile){
								var consumption = 0;
								if(alert.alertType == "power"){
									consumption = parseFloat(message.toString());
								} else if(alert.alertType == "units"){
									consumption = units.toFixed(2);
								} else if(alert.alertType == "cost"){
									consumption = cost;
								}
								var text = `Smartmeter - usage alert: The ${alert.alertType} ${consumption} exceeds limit ${alert.unitLimit} from ${moment(monthStartingDay).format('L') }. Please save energy!!`;
								console.log("text", text);
								sendMail(userprofile.username, text);
								sendSMS("91"+userprofile.phonenumber, text);
								alert.isSent = true;
								alert.sentDate = new Date();
								console.log("alert", alert);
								Alert.bulkSave([alert]);
							})
						}
					});					
				});
			} else {				
				console.log("No Last Reading");
				units = parseFloat(unit);
				cost = calculateCost(units);
			}			
			console.log(units);
			
			reading = BuildReadingObject(message, deviceId, topic, cost, units);

			Reading.create(reading).then(function (reading) {
				console.log(`Persisted!`);
			});			
		});
	}
});

function BuildReadingObject(message, deviceId, topic, cost, units) {
	return {
		usage: Number(message.toString()),
		usedAt: new Date(),
		deviceId: deviceId,
		unitType: topic.split('_')[2],
		cost: cost,
		units: units
	};
}

function calculateCost(units) {
	var cost = 0;
	//units = units - 50;
	if (units > 0) {
		if (units > 150) {
			cost += 150 * 4.5;
		} else {
			cost += units * 4.5;
		}
		units = units - 150;
	}
	if (units > 0) {
		if (units > 50) {
			cost += 50 * 6;
		} else {
			cost += units * 6;
		}
		units = units - 50;
	}
	if (units > 0) {
		if (units > 50) {
			cost += 50 * 8;
		} else {
			cost += units * 8;
		}
		units = units - 50;
	}
	if (units > 0) {
		if (units > 100) {
			cost += 100 * 9;
		} else {
			cost += units * 9;
		}
		units = units - 100;
	}
	if (units > 0) {
		if (units > 100) {
			cost += 100 * 100;
		} else {
			cost += units * 10;
		}
		units = units - 100;
	}
	if (units > 0) {
		cost += units * 11;
	}
	return cost;
}

async function sendSMS(to, text) {	
	const from = "Vonage APIs";
    await vonage.sms.send({to, from, text})
        .then(resp => { console.log('Message sent successfully'); console.log(resp); })
        .catch(err => { console.log('There was an error sending the messages.'); console.error(err); });
}

async function sendMail(to, text) {	
	let mailTransporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: 'saravanakumar071188@gmail.com',
			pass: 'knkhyaaltirywdwy'
		}
	});
	 
	let mailDetails = {
		from: 'saravanakumar071188@gmail.com',
		to: to,
		subject: 'Power Usage Alert: Unit exceeded',
		text: text
	};
	console.log('to', to);
	mailTransporter.sendMail(mailDetails, function(err, data) {
		if(err) {
			console.log('Error Occurs', err, data);
		} else {
			console.log('Email sent successfully');
		}
	});
}