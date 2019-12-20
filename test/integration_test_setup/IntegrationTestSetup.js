const ACCOUNT_SID = 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const AUTH_TOKEN = 'bXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const SIGNING_KEY_SID = 'SKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const SIGNING_KEY_SECRET = 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);
const fs = require('fs');

async function createWorkspaces() {
    // Create a nonMultiTaskWorkSpace
    const nonMultiTaskWorkspace = await client.taskrouter.workspaces
                                            .create({
                                                template: 'FIFO',
                                                friendlyName: 'js-sdk e2e tester - Single Tasking',
                                                multiTaskEnabled: 'false'
                                            });

    // Create nonMultiTaskWorkers
    const nonMultiTaskAlice = await client.taskrouter.workspaces(nonMultiTaskWorkspace.sid)
                                        .workers
                                        .create({ attributes: JSON.stringify({
                                            languages: ['en'], name: 'Ms. Alice'
                                        }), friendlyName: 'Alice'
                                        });

    const nonMultiTaskBob = await client.taskrouter.workspaces(nonMultiTaskWorkspace.sid)
                                      .workers
                                      .create({ attributes: JSON.stringify({
                                          somethingRandom: 0.5873040664007263
                                      }), friendlyName: 'Bob'
                                      });

    // Create a multiTaskWorkspace
    const multiTaskWorkspace = await client.taskrouter.workspaces
                                         .create({
                                             template: 'FIFO',
                                             friendlyName: 'js-sdk e2e tester - Multi Tasking',
                                             multiTaskEnabled: 'true'
                                         });

    // Update multiTaskActivities
    const multiTaskActivities = await client.taskrouter.workspaces(multiTaskWorkspace.sid)
                                          .activities
                                          .list();

    const multiTaskOffline = await multiTaskActivities[0];
    const multiTaskAvailable = await multiTaskActivities[1];
    const multiTaskUnavailable = await multiTaskActivities[2];

    client.taskrouter.workspaces(multiTaskWorkspace.sid)
          .activities(multiTaskAvailable.sid)
          .update({ friendlyName: 'Idle'
          });

    const multiTaskBusy = await client.taskrouter.workspaces(multiTaskWorkspace.sid)
                                    .activities(multiTaskUnavailable.sid)
                                    .update({ friendlyName: 'Busy'
                                    });

    const multiTaskReserved = await client.taskrouter.workspaces(multiTaskWorkspace.sid)
                                        .activities
                                        .create({
                                            available: false,
                                            friendlyName: 'Reserved'
                                        });

    // Update multiTaskqueues
    const multiTaskqueues = await client.taskrouter.workspaces(multiTaskWorkspace.sid)
                                      .taskQueues
                                      .list();
    const multiTaskqueue = await multiTaskqueues[0];

    client.taskrouter.workspaces(multiTaskWorkspace.sid)
          .taskQueues(multiTaskqueue.sid)
          .update({ assignmentActivitySid: multiTaskBusy.sid, reservationActivitySid: multiTaskReserved.sid
          });

    // Create multiTaskWorkers
    const multiTaskAlice = await client.taskrouter.workspaces(multiTaskWorkspace.sid)
                                     .workers
                                     .create({ attributes: JSON.stringify({
                                         'contact_uri': 'client:alice'
                                     }), friendlyName: 'Alice'
                                     });

    const multiTaskBob = await client.taskrouter.workspaces(multiTaskWorkspace.sid)
                                   .workers
                                   .create({ attributes: JSON.stringify({
                                       'contact_uri': 'client:bob'
                                   }), friendlyName: 'Bob'
                                   });

    // Write required variables to json file
    const nonMultiTaskWorkflows = await client.taskrouter.workspaces(nonMultiTaskWorkspace.sid)
                                            .workflows
                                            .list();
    const nonMultiTaskWorkflow = await nonMultiTaskWorkflows[0];

    const nonMultiTaskActivities = await client.taskrouter.workspaces(nonMultiTaskWorkspace.sid)
                                             .activities
                                             .list();
    const nonMultiTaskOffline = await nonMultiTaskActivities[0];
    const nonMultiTaskIdle = await nonMultiTaskActivities[1];

    const multiTaskWorkflows = await client.taskrouter.workspaces(multiTaskWorkspace.sid)
                                         .workflows
                                         .list();
    const multiTaskWorkflow = await multiTaskWorkflows[0];

    const obj = { accountSid: ACCOUNT_SID,
                authToken: AUTH_TOKEN,
                signingKeySid: SIGNING_KEY_SID,
                signingKeySecret: SIGNING_KEY_SECRET,
                nonMultiTaskWorkspaceSid: nonMultiTaskWorkspace.sid,
                nonMultiTaskWorkflowSid: nonMultiTaskWorkflow.sid,
                nonMultiTaskAliceSid: nonMultiTaskAlice.sid,
                nonMultiTaskBobSid: nonMultiTaskBob.sid,
                nonMultiTaskConnectActivitySid: nonMultiTaskIdle.sid,
                nonMultiTaskUpdateActivitySid: nonMultiTaskOffline.sid,
                nonMultiTaskNumActivities: 4,
                multiTaskWorkspaceSid: multiTaskWorkspace.sid,
                multiTaskQueueSid: multiTaskqueue.sid,
                multiTaskWorkflowSid: multiTaskWorkflow.sid,
                multiTaskAliceSid: multiTaskAlice.sid,
                multiTaskBobSid: multiTaskBob.sid,
                multiTaskConnectActivitySid: multiTaskAvailable.sid,
                multiTaskUpdateActivitySid: multiTaskOffline.sid,
                multiTaskNumActivities: 4,
                multiTaskNumChannels: 5,
                ebServer: 'https://event-bridge.twilio.com',
                wsServer: 'wss://event-bridge.twilio.com'
             };

    const data = JSON.stringify(obj);
    fs.writeFileSync('/.../test.json', data);
}

createWorkspaces();
