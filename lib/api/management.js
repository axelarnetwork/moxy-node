const setTransientState = (params, transientState, time, original) => {
  const [key, overrides] = params;
  console.log(`Setting transient state for ${key} (${time}).`);
  transientState.push({ time, [key]: overrides });
  return time;
};

module.exports = {
  setTransientState,
};
