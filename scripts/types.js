const fs = require('fs');

const prefix = './dist/declarations';
function convertClassToInterface(files) {

    files.forEach(file => {
        const path = `${prefix}/${file}`;
        let typesFileContent = fs.readFileSync(path, 'utf-8');
        // removing private fields
        typesFileContent = typesFileContent.replace(/.*private.*\n/g, '');
        // removing constructor
        typesFileContent = typesFileContent.replace(/.*constructor.*\n/g, '');
        // converting class to interface
        typesFileContent = typesFileContent.replace(/class/g, 'interface');
        fs.writeFileSync(path, typesFileContent);

    });
}

convertClassToInterface(['Activity.d.ts', 'Channel.d.ts', 'Reservation.d.ts', 'Task.d.ts', 'TaskQueue.d.ts']);

const indexTypes =
`export as namespace TaskRouter;

import Activity from './Activity';
import Channel from './Channel';
import Reservation from './Reservation';
import Task from './Task';
import TaskQueue from './TaskQueue';

// exporting all types
export * from './Activity';
export * from './Channel';
export * from './Reservation';
export * from './Task';
export * from './TaskQueue';
export * from './Supervisor';
export * from './Worker';
export * from './Workspace';
export * from './handlers/TaskRouterEventHandler';

// named exports for interfaces
export { Activity, Channel, Reservation, Task, TaskQueue };

// Default exports
export { default as Supervisor } from './Supervisor';
export { default as Worker } from './Worker';
export { default as Workspace } from './Workspace';
export { default as TaskRouterEventHandler } from './handlers/TaskRouterEventHandler';
`;

fs.writeFileSync(`${prefix}/index.d.ts`, indexTypes, 'utf-8');
