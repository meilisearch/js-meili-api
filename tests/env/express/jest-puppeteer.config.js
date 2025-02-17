// jest-puppeteer.config.js
module.exports = {
  server: {
    command: "node src/server.js",
    protocol: "http",
    port: 3000,
    debug: true,
    launchTimeout: 240000,
  },
};
