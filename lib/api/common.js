// Prefix
const toPrefixedHex = (value) => (value.toString(16).startsWith('0x') ? value.toString(16) : '0x' + value.toString(16));

// Returns the the most recent relevant override state, if any
const getLastState = (transientState, time, property) => {
  const state = transientState.filter((state) => state.time <= time && state[property]).pop()?.[property];
  return state && Object.keys(state).length !== 0 ? state : undefined;
};

// Left pads a string with zeros until it has a least at least as specified
const leftPad = (value, length = 0) => (value.length < length ? leftPad('0' + value, length) : value);

// Convert a boolean or some number-like value to a hex string, with optional prefix and left padding
const toHex = (value, { prefix = false, length } = {}) => {
  const hexValue = leftPad(typeof value == 'boolean' ? (value ? '1' : '0') : value.toString(16), length);
  return prefix ? toPrefixedHex(hexValue) : hexValue;
};

// Returns the override value, flipped result, or result itself, as an unpadded hex string
const overrideBoolean = (result, { value, flip }, options) =>
  value !== undefined
    ? typeof result !== 'boolean'
      ? toHex(value, options)
      : value
    : flip
    ? typeof result !== 'boolean'
      ? toHex(1n - BigInt(toPrefixedHex(result)), options)
      : !result
    : result;

// Returns the override value, offset result, or result itself, as an unpadded hex string
const overrideNumber = (result, { value, offset }, options) =>
  value !== undefined
    ? typeof result !== 'number'
      ? toHex(value, options)
      : value
    : offset !== undefined
    ? typeof result !== 'number'
      ? toHex(
          BigInt(toPrefixedHex(result)) + BigInt(toPrefixedHex(offset)),
          Object.assign({ length: result.length }, options)
        )
      : Number(result + offset)
    : result;

// Returns the property, overridden or otherwise, based on its type, as an unpadded hex string
const overrideProperty = (result, { value, offset, flip }, options) =>
  typeof value === 'object'
    ? value
    : typeof value === 'boolean' || flip
    ? overrideBoolean(result, { value, flip }, options)
    : overrideNumber(result, { value, offset }, options);

const applyObjectOverrides = (result, overrides, options = {}) =>
  Object.entries(overrides).reduce(
    (newResult, [property, override]) =>
      options.ignoreUnset && result?.[property] === undefined
        ? newResult
        : Object.assign(newResult, { [property]: overrideProperty(result?.[property], override, options) }),
    result
  );

// Handles an object response, overriding properties where necessary
const objectResponseOverride = (overrides = {}, options) => (err, response) =>
  response.error ? { error: response.error } : { response: applyObjectOverrides(response.result, overrides, options) };

// Handles a plain hex number response, overriding if necessary
const numberResponseOverride = (overrides = {}, options) => (err, response) =>
  response.error ? { error: response.error } : { response: overrideNumber(response.result, overrides, options) };

const getNumber = (property, options) => (params, transientState, time) => (err, response) =>
  numberResponseOverride(getLastState(transientState, time, property), options)(err, response);

const getNumberFromArg = (index = 0, options) => (params, transientState, time) => (err, response) =>
  numberResponseOverride(getLastState(transientState, time, params[index]), options)(err, response);

module.exports = {
  getLastState,
  leftPad,
  toHex,
  overrideBoolean,
  overrideNumber,
  overrideProperty,
  numberResponseOverride,
  objectResponseOverride,
  getNumber,
  getNumberFromArg,
};
