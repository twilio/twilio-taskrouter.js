import Worker from './lib/Worker';
const JWT = require('./test/util/MakeAccessToken');

const accountSid = 'AC1b1bb4fdf62b8d5eaea65fb344adb512';
const workspaceSid = 'WS6b3c171a0701ef4f4933dad8fc40e139';
const workerSid = 'WKaddcb3c3e06dc6bb0e466b17836bc323';

const options = {
    ebServer: 'https://event-bridge.stage-us1.twilio.com/v1/wschannels',
    wsServer: 'wss://event-bridge.stage' +
        '' +
        '' +
        '-us1.twilio.com/v1/wschannels',
    logLevel: 'debug'
};

const token = JWT.getAccessToken(accountSid, workspaceSid, workerSid, 60000);
const alice = new Worker(token, options);

alice.on('ready', readyAlice => {
    console.log('Alice is ready for work');
    console.log('Alice Sid = ' + alice.sid);
});

alice.on('error', error => {
    console.log('Error: ' + error);
});

alice.on('reservationCreated', res => {

    console.log('created reservation: ' + res.sid);
    res.conference({
        from: '+16024289987', // twilio phone number
    }).then(conferencedReservation => {
        console.log('alice has conferenced' + conferencedReservation.sid);
    });
});