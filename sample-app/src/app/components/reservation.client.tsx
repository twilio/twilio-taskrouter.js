'use client';

import React from 'react';

const TableHeaderRow = () => {
  return (
    <thead>
      <tr className="border bg-gray-50 border-gray-100 text-sm">
        <th>Reservation Status</th>
        <th>Task Sid</th>
        <th>Task Status</th>
        <th>Task Priority</th>
        <th>Task Channel</th>
      </tr>
    </thead>
  );
};

const TableRow = ({ data }: any) => {
  return (
    <tbody>
      {data.map((currentReservation: any) => (
        <tr key={`${currentReservation.sid}`} className="border border-gray-300">
          <td>{currentReservation.status}</td>
          <td>{currentReservation.task.sid}</td>
          <td>{currentReservation.task.status}</td>
          <td>{currentReservation.task.priority}</td>
          <td>{currentReservation.task.taskChannelUniqueName}</td>
        </tr>
      ))}
    </tbody>
  );
};

const Reservation = ({ currentReservations }: { currentReservations: Array<any> }): React.JSX.Element => {
  return (
    <div>
      {currentReservations.length !== 0 && (
        <div className="py-10">
          Current Reservations
          <table className="w-full">
            <TableHeaderRow />
            <TableRow data={currentReservations} />
          </table>
        </div>
      )}
    </div>
  );
};

export default Reservation;
