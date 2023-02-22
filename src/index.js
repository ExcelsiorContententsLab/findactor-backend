import server from './server.js';

const { log: print } = console;

const PORT = 8080;

server.listen(PORT, () => {
  print(`Running on http://localhost:${PORT}`);
});
