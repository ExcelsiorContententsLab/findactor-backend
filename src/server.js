import express from 'express';

import cors from 'cors';

import { nanoid } from 'nanoid';

import db from './db/db.js';

const server = express();

server.use(cors());

server.use(express.json());

server.get('/hello', (req, res) => {
  res.send('Hello World');
});

server.get('/auditions', (req, res) => {
  const { productionName } = req.query;

  const { auditions } = db.data;

  if (!productionName) {
    res.send(auditions);
    return;
  }

  res.send(auditions.filter((audition) => (
    audition.productionName === productionName
  )));
});

server.post('/auditions', async (req, res) => {
  const auditionData = req.body;

  const newId = nanoid();

  const audition = {
    id: newId,
    appliedAuditionees: [],
    passedAuditionees: [],
    pendingAuditionees: [],
    rejectedAuditionees: [],
    ...auditionData,
  };

  db.data.auditions.push(audition);
  await db.write();

  res.send(newId);
});

export default server;
