0.1.7
===========

In this release, the SDK has been renamed twilio-taskrouter.js and replaces the
earlier taskrouter.js. twilio-taskrouter.js is not backwards compatible with twilio-taskrouter.js but offers multiple improvements such as:

- Promises over callbacks
- Migration to FPA model using Twilio Access Tokens
- Replace es5 patterns with es6
- New "completed" event on a Reservation and support for events on a Task
- Introduce a Workspace class that allows querying for Workers and TaskQueues

Refer to the API docs for the full set of features.
