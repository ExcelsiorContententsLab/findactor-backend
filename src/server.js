import express from 'express';

const server = express();

server.get('/hello', (req, res) => {
  res.send('Hello World');
});

export default server;
