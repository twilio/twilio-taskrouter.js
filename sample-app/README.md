# TaskRouter V2 Sample App


![Sample TaskRouter V2 App](sample-app.png?raw=true "Sample TaskRouter V2 App")


## Local Development

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

This App is built with node v18. Hence, this project needs node18, which can be installed with `nvm.`

```bash
nvm use
```

First, install the project dependencies.
```
yarn sample-app:install
```

Start the App with below command
```bash
yarn sample-app:start
```
Open [http://localhost:3000](http://localhost:3000) in the browser for the App.


For local development, run the development server.

```bash
yarn sample-app:dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

For building the App for deployment,
```bash
yarn sample-app:build
```


# 1. Steps to Test with TaskRouter Sample App
1.1. Create a non-flex account in the Twilio stage or production.
1.2. Open the TaskRouter sample app on `http://localhost:3000` and provide the required account details
1.3. Next, click `Get New Token.` This step will initialize the Worker and prepare the Worker to accept the Task.
1.4. Create a new task and make the Worker Available in the Twilio console UI. `https://console.stage.twilio.com/us1/service/taskrouter/${YOUR_TASKROUTER_WORKSPACE_ID}/taskrouter-workspace-tasks` and `https://console.stage.twilio.com/us1/service/taskrouter/${YOUR_TASKROUTER_WORKSPACE_ID}/taskrouter-workspace-workers`
1.5. TaskRouter Sample App will display the allocated reservation details to the Worker and provide the option to accept or reject the Task.

Detailed steps are documented below.

## 2. Steps to create a TaskRouter Workspace and to create a Task in staging (same steps would work for production)

2.1. Login to https://www.stage.twilio.com/
2.2. Click on Create new account
2.3. Provide the name to the account
2.4. Provide a phone number where verification code would be sent
2.5. Select `Other Twilio product` and not Flex-based product. (Note: Flex account doesn't allow the create more than one workspace)
2.6. Select `Other` for what you plan to build
2.7. Select `With No code at all` and then create. Copy the `Account SID`.
2.8. Go to `Account` > `API Keys & Tokens` and provide the code received via email `https://console.stage.twilio.com/us1/account/keys-credentials/api-keys`.
2.9. Click `Create API Key,` give a Friendly Name, and click Create.
2.10. Copy API SID and secret, accept the copied checkbox, and click `Done`. Copy the API SID as `SigningKey SID` and the secret as `SigningKey Secret`.
2.11. Once the account is created, select `TaskRouter` under `Explore Products` and pint it.
2.12. Now, go under TaskRouter > Workspace `https://console.stage.twilio.com/us1/develop/taskrouter/workspaces` and click `create new workspace`. Copy the `Workspace SID`.
2.13. Give a name to the workspace and create with default settings.
2.14. Now, create a worker after going inside your newly created workspace `https://console.stage.twilio.com/us1/service/taskrouter/${YOUR_TASKROUTER_WORKSPACE_ID}/taskrouter-workspace-workers`.
2.15. Click `Create new worker` and give a name, say `Your_Worker_Name` , Activity to `Available` and Attributes to `{"skills": "support"}.` Click on `Save`. Copy the `Worker SID` and `You_Worker_Name` as `Identity`.
2.16. Go to Tasks under TaskRouter `https://console.stage.twilio.com/us1/service/taskrouter/${YOUR_TASKROUTER_WORKSPACE_ID}/taskrouter-workspace-tasks`.
2.17. Click `Create new Task`, Workflow to `Default Fifo Workflow`, Task Channel to `Voice,` and then Create Task.

## 3. Using TaskRouter Sample App

3.1. Run the project after installing
   `pnpm install && pnpm dev`
3.2. This will start the application at port 3000 `http://localhost:3000`
3.3. Provide the `Account SID` from the above steps.
3.4. Provide `SigningKey SID` and `SigningKey Secret` from the above steps.
3.5. Provide `Workspace SID` from the above steps. This could be found at this link `https://console.stage.twilio.com/us1/develop/taskrouter/workspaces`.
3.6. Provide `Worker SID` from above the above steps. This Could be found at this link `https://console.stage.twilio.com/us1/service/taskrouter/${YOUR_TASKROUTER_WORKSPACE_ID}/taskrouter-workspace-workers`.
3.7. Provide Identity from the above steps. `https://console.stage.twilio.com/us1/service/taskrouter/${YOUR_TASKROUTER_WORKSPACE_ID}/taskrouter-workspace-workers`.
3.8. Provide environment as `stage.`
3.9. Click on `Get New Token.` This will generate and initialize a new token for the TaskRouter worker.
   Check the Logs in the UI for the initialization success log message.
3.10. Go to console.stage.twilio.com and create a new Task following above steps. This could be found at this link `https://console.stage.twilio.com/us1/service/taskrouter/${YOUR_TASKROUTER_WORKSPACE_ID}/taskrouter-workspace-tasks`.
3.11. Make sure the Worker is in an `Available` state to be able to assign the Task.
3.12. Sample App UI will show a new Reservation, and both the `Accept` and `Reject` button is enabled to act on the Task for the given work.
