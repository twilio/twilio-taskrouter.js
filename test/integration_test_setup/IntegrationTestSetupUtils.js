/* eslint-disable */
require('dotenv').config({ path: `${__dirname}/.env` });

const { Twilio } = require('twilio');
const ENV = process.env.ENV;
const ACCOUNT_SID = process.env.ACCOUNT_SID;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

const clientOptions = ENV === 'stage' || ENV === 'dev' ? { region: ENV } : undefined;
const client = new Twilio(ACCOUNT_SID, AUTH_TOKEN, clientOptions);


function getEventBridgeUrl() {
    if (ENV === 'stage' || ENV === 'dev') {
        return `event-bridge.${ENV}-us1.twilio.com`;
    }
    return 'event-bridge.twilio.com';
}


async function createWorkspace(workspaceName, multiTaskEnabled) {
    const workspaces = await client.taskrouter.workspaces.list();

    let workspace = workspaces.find((w) => w.friendlyName === workspaceName);

    if (workspace) {
        console.log(`workspace ${workspaceName} already exists`);
        return workspace;
    }

    workspace = await client.taskrouter.workspaces.create({
        template: 'FIFO',
        friendlyName: workspaceName,
        multiTaskEnabled
    });
    console.log(`Created workspace ${workspaceName}`);
    return workspace;
}

async function createWorker(multiTaskWorkspace, friendlyName, attributes) {
    const workersBeforeCreation = await client.taskrouter.workspaces(multiTaskWorkspace.sid).workers.list();
    const worker = workersBeforeCreation.find((w) => w.friendlyName === friendlyName);

    if (worker) {
        console.log(`Worker ${friendlyName} already exists`);
        return worker;
    }

    const multiTaskAlice = await client.taskrouter.workspaces(multiTaskWorkspace.sid).workers.create({
        attributes: JSON.stringify(attributes),
        friendlyName
    });
    console.log(`Created worker ${friendlyName}`);
    return multiTaskAlice;
}

async function renameExistingActivity(workspaceSid, currentFriendlyName, newFriendlyName) {
    const activities = await client.taskrouter.workspaces(workspaceSid).activities.list();

    let activity = activities.find((a) => a.friendlyName === newFriendlyName);

    if (activity) {
        console.log(`Activity ${newFriendlyName} already exists`);
        return activity;
    }

    activity = activities.find((a) => a.friendlyName === currentFriendlyName);
    if (activity) {
        await activity.update({ friendlyName: newFriendlyName });
        console.log(`Renamed activity from ${currentFriendlyName} to ${newFriendlyName}`);
    }
    return activity;
}

async function createReservedTask(workspaceSid) {
    const activities = await client.taskrouter.workspaces(workspaceSid).activities.list();

    let activity = activities.find((a) => a.friendlyName === 'Reserved');

    if (activity) {
        console.log('activity Reserved already exists');
        return activity;
    }

    activity = await client.taskrouter.workspaces(workspaceSid).activities.create({
        available: false,
        friendlyName: 'Reserved'
    });
    console.log('Created Task Reserved');
    return activity;
}

async function createActivities(workspaceSid) {
    const multiTaskActivities = await client.taskrouter.workspaces(workspaceSid).activities.list();

    const multiTaskOffline = multiTaskActivities.find((activity) => activity.friendlyName === 'Offline');
    const multiTaskAvailable = await renameExistingActivity(workspaceSid, 'Available', 'Idle');
    const multiTaskBusy = await renameExistingActivity(workspaceSid, 'Unavailable', 'Busy');

    const multiTaskReserved = await createReservedTask(workspaceSid);

    return { multiTaskOffline, multiTaskAvailable, multiTaskBusy, multiTaskReserved };
}


async function updateActivitiesInTaskQueue(
    multiTaskWorkspace,
    multiTaskBusy,
    multiTaskReserved
) {
    const multiTaskqueues = await client.taskrouter.workspaces(multiTaskWorkspace.sid).taskQueues.list();
    const multiTaskqueue = await multiTaskqueues[0];

    await client.taskrouter.workspaces(multiTaskWorkspace.sid).taskQueues(multiTaskqueue.sid).update({
        assignmentActivitySid: multiTaskBusy.sid,
        reservationActivitySid: multiTaskReserved.sid
    });

    return multiTaskqueue;
}


async function createWorkers(multiTaskWorkspace) {
    const multiTaskAlice = await createWorker(multiTaskWorkspace, 'Alice', {
        'contact_uri': 'client:alice'
    });

    const multiTaskBob = await createWorker(multiTaskWorkspace, 'Bob', {
        'contact_uri': 'client:bob'
    });

    return { multiTaskAlice, multiTaskBob };
}

module.exports = {
    createWorkspace,
    updateActivitiesInTaskQueue,
    createActivities,
    getEventBridgeUrl,
    createWorkers
};
