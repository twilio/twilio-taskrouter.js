'use client';

import { Supervisor, Workspace } from 'twilio-taskrouter';
import { LogContextType, useLogContext } from '@/lib/log-context';
import React, { useEffect, useState } from 'react';
import Logger from './logger.client';
import Reservation from './reservation.client';

const WorkerWorkspace = ({ token, environment = 'stage' }: { token: string; environment: string }) => {
  const { appendLogs } = useLogContext() as LogContextType;

  const [enableAccept, setEnableAccept] = useState<boolean>(false);
  const [enableReject, setEnableReject] = useState<boolean>(false);
  const [enableDisconnectWorker, setEnableDisconnectWorker] = useState<boolean>(false);

  const [workerObj, setWorkerObj] = useState<Supervisor | null>(null);
  const [workSpace, setWorkSpace] = useState<Workspace | null>(null);
  const [reservationObj, setReservationObj] = useState<any | null>(null);

  const [currentReservations, setCurrentReservations] = useState<Array<any>>([]);

  const handleDisconnectWorker = () => {
    if (workerObj) {
      workerObj.disconnect();
    }
  };

  const handleAccept = () => {
    appendLogs(`handleAccept clicked--Reservation-- ${reservationObj?.sid}`);

    if (reservationObj) {
      reservationObj
        ?.accept()
        .then((acceptedReservation: { status: any }) => {
          appendLogs(`Accept Reservation--Reservation status is ${acceptedReservation.status}`, 'green');
        })
        .catch((err: any) => {
          appendLogs(`Accept Reservation--Error: ${err}`, 'red');
        });
    }
  };

  const handleReject = () => {
    appendLogs(`handleReject clicked--Reservation-- ${reservationObj?.sid}`);

    if (reservationObj) {
      reservationObj
        ?.reject()
        .then((acceptedReservation: { status: any }) => {
          appendLogs(`Reject Reservation--Reservation status is ${acceptedReservation.status}`, 'green');
        })
        .catch((err: any) => {
          appendLogs(`Reject Reservation--Error: ${err}`, 'red');
        });
    }
  };

  const handleFetchWorkers = async () => {
    try {
      const fetchWorkersReq = await workSpace?.fetchWorkers();
      if (fetchWorkersReq) {
        const workers = Array.from(fetchWorkersReq.values());
        appendLogs('======================================================');
        appendLogs('Workers fetched');
        workers.forEach((worker: any) => {
          appendLogs('Workers sid: ' + worker.sid);
          appendLogs('Workers friendlyName: ' + worker.friendlyName);
          appendLogs('Workers activity: ' + worker.activityName);
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    appendLogs('======================================================');
    appendLogs('Token generated');
    appendLogs(token);

    appendLogs('Initializing Worker with the new token', 'green');

    const worker = new Supervisor(token, {
      region: environment.toLowerCase() === 'stage' ? 'stage-us1' : 'us1',
      logLevel: 'debug',
      // useGraphQL: true, // Use for local development testing
    });
    const workspace = new Workspace(token, {
      region: environment.toLowerCase() === 'stage' ? 'stage-us1' : 'us1',
      logLevel: 'debug',
    });
    setWorkSpace(workspace);

    setWorkerObj(worker);

    // eslint-disable-next-line consistent-return
    return () => {
      if (worker) {
        worker.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment, token]);

  useEffect(() => {
    if (!workerObj) {
      return;
    }

    workerObj.on('ready', (readyWorker: { sid: any; friendlyName: any }) => {
      appendLogs(`ready--Worker ${readyWorker.sid} : ${readyWorker.friendlyName} is now ready for work`, 'green');

      setEnableDisconnectWorker(true);
    });

    workerObj.on('tokenExpired', (readyWorker: { sid: any; friendlyName: any }) => {
      appendLogs(`tokenExpired--Worker ${readyWorker.sid} : ${readyWorker.friendlyName}'s token expired`);
    });

    workerObj.on('tokenUpdated', (readyWorker: { sid: any; friendlyName: any }) => {
      appendLogs(`tokenUpdated--Worker ${readyWorker.sid} : ${readyWorker.friendlyName}'s token updated`);
    });

    workerObj.on('activityUpdated', (readyWorker: { sid: any; friendlyName: any }) => {
      appendLogs(`activityUpdated--Worker ${readyWorker.sid} : ${readyWorker.friendlyName}'s activity Updated`);
    });

    workerObj.on('attributesUpdated', (readyWorker: { sid: any; friendlyName: any }) => {
      appendLogs(`attributesUpdated--Worker ${readyWorker.sid} : ${readyWorker.friendlyName}'s attributes Updated`);
    });

    workerObj.on('disconnected', (reason: any) => {
      appendLogs(`disconnected--Worker is disconnected. reason: ${JSON.stringify(reason)}`);

      setEnableDisconnectWorker(false);
      setEnableAccept(false);
      setEnableReject(false);
      setCurrentReservations([]);
    });

    workerObj.on('error', (error: any) => {
      appendLogs(`error--Worker errored out. error: ${JSON.stringify(error)}`, 'red');

      workerObj.disconnect();
    });

    workerObj.on('reservationFailed', (reservation: any) => {
      appendLogs(`reservationFailed--Reservation ${reservation.sid} failed for ${workerObj.sid}`);
    });

    workerObj.on('reservationCreated', (reservation: any) => {
      setReservationObj(reservation);
      setEnableAccept(true);
      setEnableReject(true);

      appendLogs(`reservationCreated--Reservation ${reservation.sid} has been created for ${workerObj.sid}`);

      appendLogs('reservationCreated--Task attributes are: ');
      appendLogs(JSON.stringify(reservation?.task?.attributes || {}));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerObj]);

  useEffect(() => {
    if (!reservationObj) {
      return;
    }

    reservationObj.on('accepted', (acceptedReservation: { sid: any }) => {
      appendLogs(`reservationCreated--Reservation ${acceptedReservation.sid} was accepted.`, 'green');

      setEnableAccept(false);
      setEnableReject(false);
    });

    reservationObj.on('pending', (acceptedReservation: { sid: any }) => {
      appendLogs(`reservationCreated--Reservation ${acceptedReservation.sid} is pending.`);
    });
    reservationObj.on('rejected', (acceptedReservation: { sid: any }) => {
      appendLogs(`reservationCreated--Reservation ${acceptedReservation.sid} was rejected.`, 'green');

      setEnableAccept(false);
      setEnableReject(false);
    });
    reservationObj.on('timeout', (acceptedReservation: { sid: any }) => {
      appendLogs(`reservationCreated--Reservation ${acceptedReservation.sid} is timeout.`, 'red');

      setEnableAccept(false);
      setEnableReject(false);
      setEnableDisconnectWorker(false);
    });
    reservationObj.on('canceled', (acceptedReservation: { sid: any }) => {
      appendLogs(`reservationCreated--Reservation ${acceptedReservation.sid} is canceled.`);

      setEnableAccept(false);
      setEnableReject(false);
      setEnableDisconnectWorker(false);
    });
    reservationObj.on('rescinded', (acceptedReservation: { sid: any }) => {
      appendLogs(`reservationCreated--Reservation ${acceptedReservation.sid} is rescinded.`);
    });
    reservationObj.on('wrapping', (acceptedReservation: { sid: any }) => {
      appendLogs(`reservationCreated--Reservation ${acceptedReservation.sid} is wrapping.`);
    });
    reservationObj.on('completed', (acceptedReservation: { sid: any }) => {
      appendLogs(`reservationCreated--Reservation ${acceptedReservation.sid} is completed.`);

      setEnableAccept(false);
      setEnableReject(false);
      setEnableDisconnectWorker(false);
    });

    // update reservation table
    if (workerObj && workerObj.reservations) {
      let reservationArr: any = [];

      for (const reservation of workerObj.reservations.values()) {
        reservationArr.push({
          sid: reservation.sid,
          status: reservation.status,
          task: {
            sid: reservation.task.sid,
            status: reservation.task.status,
            priority: reservation.task.priority,
            queueName: reservation.task.queueName,
            taskChannelUniqueName: reservation.task.taskChannelUniqueName,
          },
        });
      }

      setCurrentReservations(reservationArr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationObj, workerObj]);

  return (
    <div className="w-full mt-4">
      <div className="border bg-gray-50 border-gray-300 block py-4 px-2 rounded-sm">Worker Dashboard</div>

      <Reservation currentReservations={currentReservations} />

      <section>
        <div className="flex flex-row justify-evenly items-center pt-4">
          <button
            onClick={handleAccept}
            disabled={!enableAccept}
            className="bg-[#0263e0] enabled:hover:bg-[#06033a] text-white py-2 px-4 mb-5 rounded disabled:opacity-75 disabled:pointer-events-none font-medium"
          >
            Accept
          </button>
          <button
            onClick={handleReject}
            disabled={!enableReject}
            className="bg-[#0263e0] enabled:hover:bg-[#06033a] text-white py-2 px-4 mb-5 rounded disabled:opacity-75 disabled:pointer-events-none font-medium"
          >
            Reject
          </button>
          <button
            onClick={handleDisconnectWorker}
            disabled={!enableDisconnectWorker}
            className="bg-[#0263e0] enabled:hover:bg-[#06033a] text-white py-2 px-4 mb-5 rounded disabled:opacity-75 disabled:pointer-events-none font-medium"
          >
            Disconnect
          </button>
          <button
            onClick={handleFetchWorkers}
            className="bg-[#0263e0] enabled:hover:bg-[#06033a] text-white py-2 px-4 mb-5 rounded disabled:opacity-75 disabled:pointer-events-none font-medium"
          >
            Fetch Workers
          </button>
        </div>
      </section>
      <Logger />
    </div>
  );
};

export default WorkerWorkspace;
