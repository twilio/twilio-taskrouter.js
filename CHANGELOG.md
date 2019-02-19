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
