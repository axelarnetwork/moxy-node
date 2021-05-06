'use strict';

const setTransientState = (params, transientState, time, original) => {
  const [key, overrides] = params;
  transientState.push({ time, [key]: overrides });
  return time;
};

module.exports = {
  setTransientState,
};
