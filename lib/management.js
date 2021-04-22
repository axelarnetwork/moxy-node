'use strict';

const setTransientState = (transientState) => (time) => (args, callback) => {
  const [key, overrides] = args;
  transientState.push({ time, [key]: overrides });
  callback(null, time);
};

module.exports = (transientState) => ({
  setTransientState: setTransientState(transientState),
});
