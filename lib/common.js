// Prefix
const toPrefixedHex = (value) => (value.toString(16).startsWith('0x') ? value.toString(16) : '0x' + value.toString(16));

// Returns the the most recent relevant override state, if any
const getLastState = (transientState, time, property) =>
  transientState.filter((state) => state.time <= time && state[property]).pop()?.[property];

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
      ? toHex(BigInt(toPrefixedHex(result)) + BigInt(toPrefixedHex(offset)), Object.assign({ length: result.length }, options))
      : Number(result + offset)
    : result;

// Returns the propterty, overriden or otherwise, based on its type, as an unpadded hex string
const overridePropery = (result, { value, offset, flip }, options) =>
  typeof value === 'object'
    ? value
    : typeof value === 'boolean' || flip
    ? overrideBoolean(result, { value, flip }, options)
    : overrideNumber(result, { value, offset }, options);

// Handles a plain hex number reposnse, ovverriding if neccessary
const handleNumberResponse = (realClient, method, args, callback, overrides = {}, options) =>
  realClient.request(method, args, (err, response) =>
    err
      ? callback(JSON.parse(err.message).error, null)
      : callback(null, overrideNumber(response.result, overrides, options))
  );

// Handles an object reposnse, ovverriding properties where neccessary
const handleObjectResponse = (realClient, method, args, callback, overrides = {}, options) =>
  realClient.request(method, args, (err, response) =>
    err
      ? callback(JSON.parse(err.message).error, null)
      : callback(
          null,
          Object.entries(overrides).reduce(
            (newResult, [property, override]) =>
              Object.assign(newResult, { [property]: overridePropery(response.result?.[property], override, options) }),
            response.result
          )
        )
  );

// Performs an rpc call, overriding if neccessary, where just a number is expected as a response result
const getNumber = (realClient, transientState, method, property, options) => (time) => (args, callback) =>
  handleNumberResponse(realClient, method, args, callback, getLastState(transientState, time, property), options);

// Performs an rpc call, overriding if neccessary, where just a number is expected as a response result
const getNumberFromArg = (realClient, transientState, method, index = 0, options) => (time) => (args, callback) =>
  handleNumberResponse(realClient, method, args, callback, getLastState(transientState, time, args[index]), options);

module.exports = {
  getLastState,
  leftPad,
  toHex,
  overrideBoolean,
  overrideNumber,
  overridePropery,
  handleNumberResponse,
  handleObjectResponse,
  getNumber,
  getNumberFromArg,
};
