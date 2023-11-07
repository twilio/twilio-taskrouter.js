export const sleepSync = (timeout) => {
  let start = new Date().getTime();
  while (new Date().getTime() < start + timeout) {
    /* do nothing */
  }
};
