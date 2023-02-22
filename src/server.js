import express from 'express';

import cors from 'cors';

const server = express();

server.use(cors());

server.get('/hello', (req, res) => {
  res.send('Hello World');
});

export default server;
