const isProd = process.env.NODE_ENV === 'production';

const noop = () => {};

const logger = {
  debug: isProd ? noop : (...args) => console.debug(...args),
  info: isProd ? noop : (...args) => console.info(...args),
  log: isProd ? noop : (...args) => console.log(...args),
  warn: isProd ? (...args) => console.warn(...args) : (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

export default logger;
