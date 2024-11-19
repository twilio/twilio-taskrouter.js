2.0.12
==========
New Features
----------
- Added `fetchTask` method to `Workspace`

Maintenance
----------
- Fix missing Babel dependency

2.0.11
==========
Bug fixes
----------
- Stop reconnecting after `Worker.disconnect` has been called.

New Features
----------
- Export `WorkspaceOptions` type

Maintenance
----------
- Upgraded `ws` dependency

2.0.10
==========
Bug fixes
----------
- Made the `options` parameter in `setWorkerActivity` optional


2.0.9
==========
Bug fixes
----------
- Fixed `setWorkerAttributes` and `setWorkerActivity` parameter types


2.0.8
==========
New Features
----------
- Added `setWorkerOfflineIfDisconnected` to WorkerOptions

Bug fixes
----------
- Added `setWorkerAttributes` and `setWorkerActivity` fields to Supervisor type declaration 

2.0.7
==========
Maintenance
----------
- Reduced transitive dependency size caused by Lodash.js

2.0.6
==========
New Features
----------
- Added `setWorkerAttributes` and `setWorkerActivity` to Supervisor

2.0.5
==========
New Features
----------
- Added `enableVersionCheck` to WorkerOptions

2.0.4
==========
Maintenance
----------
- Enhanced websocket reconnection logic.

2.0.3
==========
Bug Fixes
----------
- Fixed the type of `eventHandlerClass` in `WorkerOptions`

2.0.2
==========
Bug Fixes
----------
- Fixed `axios.create is not a function` when initializing a Worker

2.0.1
==========
New Features
----------
- Added `virtualStartTime` as an optional parameter to `WorkerTaskOptions` so that the virtual start time of the task can be set when `Worker.createTask` method is called
- Added `setVirtualStartTime` method to update the virtual start time of a `Task`
- Added `transcribe` and `transcriptionConfiguration` options to `reservation.conference` method

2.0.0
==========
New Features
----------
- Added React Native support
- Added status links to the readme file
- Added error handling to axios requests

Maintenance
----------
- Updated lodash from 4.17.5 to 4.17.21
- Fixed types in types.d.ts file
- Changed default branch to main
- Updated TaskHoldOptions

0.8.5
==========
Maintenance
----------
- Added sample app for testing integrations
- Tested SDK with TaskRouter standalone instance
- Allow Task's and Worker's attributes to be any object

0.8.4
==========
Bug Fixes
----------
- fixing broken types

0.8.3
==========
Maintenance
----------
- Increased timeout for http requests from 5s to 15s

0.8.2
==========
Bug Fixes
----------
- Fixed TS warnings in types file

0.8.1
==========
New Features
----------
- Added status based retries

Maintenance
----------
- Added babel transpiler as part of build process for ES6+ syntax
- Added sonarqube integration for code quality

0.8.0
==========
New Features
----------
- Added exponential backoff time for retries
- Added unit and integration tests to test retries

Bug Fixes
----------
- Fix for fetching more than 1000 workers

0.7.2
==========
Bug Fixes
----------
- Decommissioning `edge` support

0.7.1
==========
Bug Fixes
----------
- Bringing back `ebServer` and `wsServer`

0.7.0
==========
New Features
----------
- Add `fetchTaskQueues` and `fetchWorkers` to `Workspace`
- Add new fields to `Worker` and `TaskQueue` for Sync compatibility

0.6.1
==========
Bug Fixes
----------
- Handle version mismatch in Worker after creating or completing reservations


0.6.0
==========
New Features
----------
- Add `version` field to TaskRouter resources (Task, Reservation and Worker)

0.5.13
==========
New Features
----------
- TR SDK Now starts supporting edge & region parameter

0.5.11
==========
Bug Fixes
----------
- Improved the fix for race condition when initiating task transfer

Maintenance
----------
- Upgraded several dependencies to more recents versions
- Upgraded node engine requirement from 6 to >=12.17.0


0.5.10
==========
Bug Fixes
----------
- Fixed heartbeat attempting to close websocket after it was already closed

Maintenance
----------
- Add missing type declarations

0.5.9
==========
Bug Fixes
----------
- Fixed race condition when initiating task transfer

0.5.7
==========
Maintenance
----------
- Export TaskRouterEventHandler for web

0.5.6
==========
Maintenance
----------
- Add type declarations for TaskRouterEventHandler and Worker.createTask

0.5.5
==========
New Features
----------
- Updated Task Event Emitter to provide the Task object upon Task Updates
- Export TaskRouterEventHandler

0.5.4
==========
Maintenance
----------
- Clean up flaky tests
- Include types.d.ts in build

0.5.3
==========
New Features
----------
- Add explicit logging for server, programmatic, client disconnects
- Updates the Worker disconnected event emitter to also include the reason for disconnect
- Additional unit and integration tests to confirm logging

0.5.2
==========
Maintenance
----------
- Explicitly close the current websocket if no heartbeat has been detected within 60s before attempting to reconnect using a new websocket
- Additional integration tests on outbound voice functionality


0.5.1
==========
New Features
----------
- Accept HoldUrl and HoldMethod when holding a customer or worker participant

Maintenance
----------
- Add additional hold tests and transfer tests


0.5.0
==========
Bug Fixes
----------
- Fixing duplicate listeners for TR events on websocket reconnect.

0.4.5
==========
Maintenance
----------
- Add additional voice reservation tests
- Reverts Fixes for 0.4.4

0.4.4
==========
Bug Fixes
----------
- Fixing duplicate listeners for TR events on websocket reconnect.

0.4.3
==========
Bug Fixes
----------
- Fixing Logger to not persist loglevel in LocalStorage

Maintenance
----------
- Add additional voice transfer tests

0.4.2
============
New Features
------------
- Expose `reservation.failed` event, which is fired when `Worker` was unable to receive a `Reservation` for the `Task` it created
- A Worker can now create an `Outbound` Task for themselves

Maintenance
------------
- Add Twilio Client integration for e2e integration testing

0.4.1
============
Bug Fixes
------------
- `conference instruction` should not override reservation status received from worker leg

Maintenance
------------
- Added automated scripts for integration tests
- Added setup for running unit tests on browsers

0.4.0
============
Breaking Changes
------------
Transfer events, except for `transferInitiated`, previously emitted on the `Task` have been moved down one level to the appropriate `OutgoingTransfer` instance

Maintenance
------------
Improve integration tests flakiness

0.3.3
============
Bug Fixes
------------
- Stop reconnecting the websocket connection if token expires

0.3.2
============
Bug Fixes
------------
- Correctly handle `Task` and `Transfer` events if a Worker has more than one reference to the same `Task`

0.3.1
============
Bug Fixes
------------
- `Reservation` events should reflect most up-to-date status of `canceled` when a `Transfer` is canceled

0.3.0
============
New Features
------------
- A `Task` now exposes a property `transfers` which contains two keys `incoming` and `outgoing` containing related transfer information, if the incoming `Reservation` was the result of a transfer and if the Worker issued an outgoing transfer, respectively
- Exposes a new method `cancel()` callable by `task.transfers.outgoing.cancel()` that allows a Worker to cancel an in-progress transfer
- A new event `transferCanceled` is now emitted on the Task when an outgoing transfer has successfully been canceled

0.2.20
============
New Features
------------
Add task.hold(targetWorkerSid, onHold) for holding/unholding specified target worker participant in the conference.

0.2.19
============
New Features
------------
Workers can now kick another Worker's active call leg from a Conference by calling the `kick(workerSid)` method on a `Task`

Maintenance
------------
Improve integration tests flakiness

0.2.18
============
New Features
------------
Expose an optional parameter `rejectPendingReservations` when updating a Worker's activity to unavailable which will reject all pending reservations.

0.2.17
============
New Features
------------
Add `mute` and `beepOnExit` options when calling `reservation.updateParticipant()`

Maintenance
------------
Update testing of channels on newly created Workspaces


0.2.16
============
Maintenance
------------
Expose `region` parameter on signaling layer

0.2.15
============
Bug Fixes
------------
Fix call to invalid function `webSocket.removeAllListeners()`.


0.2.14
============
Bug Fixes
------------
Clears reservation map before updating it with the latest reservations


0.2.13
============
Bug Fixes
------------
Stabilizes transfer tests, updates README


0.2.12
============
New Features
------------
Adds `endConferenceOnExit` for workers. Workers can now opt-in to
terminate the conference when they exit the conference by calling
`reservation.updateParticipant()` with `endConferenceOnExit=true`.


0.2.11
============
New Features
------------
Two features added
- adds `region` parameter to `Worker` for Twilio Interconnect.
  `region` specifies the ingress region for connections, e.g. "ie1".
- adds `beepOnCustomerEntrance` parameter to Conference instruction.
  Plays a beep sound when customer enters the conference.


0.2.10
============
Maintenance
------------
Adds npm badge to the README file.


0.2.9
============
Bug Fixes
------------
- adds jitter to backoff interval

New Features
------------
- supports `endConferenceOnExit` for worker call leg

Maintenance
------------
- adds transfer tests and docs
- removes `task.hold()` and `task.unhold()`.
  Call `task.updateParticipant()` with `hold=true` or `hold=false`.


0.2.8
============
New Features
------------
More features around task transfer feature
- handle transfer events
- new `Transfer` and `TransferDescriptor` objects
- implement `reservation.wrap()` and `reservation.complete()`
  to wrapup or complete a reservation


0.2.7
============
New Features
------------
Adds task transfer feature for workers. Call `task.transfer()`
to transfer the task to another worker.
`reservation.wrapup` event is also exposed as part of this change.


0.2.6
============
New Features
------------
Adds hold or unhold customer. Workers can now hold or unhold a
customer by calling `task.hold()` or `task.unhold()`. Valid only
for tasks for which reservations were accepted with the Conference
instruction.


0.2.5
============
Maintenance
------------
Updates to tests and docs
- Add eslint to integration tests
- Fix broken tests
- General improvements to docs and comments


0.2.4
============
New Features
------------
Adds a new Conference instruction option called
`endConferenceOnCustomerExit`. If enabled, TaskRouter terminates
the conference when customer hangs up. Default value is false.


0.2.3
============
New Features
------------
Adds monitoring feature for `Supervisor`s.
Supervisors can monitor an ongoing call by invoking
`.monitor()` with a task sid and a reservation sid.


0.2.2
============
Maintenance
------------
- uses UMD pattern for web build
- uses TypeScript
- adds retries for updating worker activity


0.2.1
============
Maintenance
------------
Bumping version only. No change from 0.2.0.


0.2.0
============
Maintenance
------------
Changes to build process, refactoring
- correctly build window dist
- remove sids from URIs, remote JWT parsing
- encapsulate routes
- restore token expiration event
- add setAttributes method to Task
- remove redundant JSON.stringify from Task and Worker


0.1.10
============
Maintenance
------------
Various improvements
- node version bumped to 8.
- more changes to the build process. using yarn.


0.1.9
============
Maintenance
------------
Small change in the build process. No functional change from 0.1.8.


0.1.8
============
Maintenance
------------
- Introduces distinction between soft-deleted vs. hard-deleted reservations
- Adds unit tests and integration tests


0.1.7
===========

In this release, the SDK has been renamed twilio-taskrouter.js and replaces the
earlier taskrouter.js. twilio-taskrouter.js is not backwards compatible with
taskrouter.js but offers multiple improvements such as:

- Promises over callbacks
- Migration to FPA model using Twilio Access Tokens
- Replace es5 patterns with es6
- New "completed" event on a Reservation and support for events on a Task
- Introduce a Workspace class that allows querying for Workers and TaskQueues

Refer to the API docs for the full set of features.
