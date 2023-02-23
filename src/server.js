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

server.patch('/auditions', async (req, res) => {
  const { auditionTitle } = req.query;

  if (!auditionTitle) {
    res.status(404).send();
    return;
  }

  const { auditions } = db.data;

  if (!auditions.some((audition) => audition.title === auditionTitle)) {
    res.status(404).send();
    return;
  }

  const audition = auditions.find((a) => a.title === auditionTitle);

  if (!audition.appliedAuditionees.some(({ email }) => email === 'zoonyfil@nate.com')) {
    audition.appliedAuditionees.push({
      name: '이승찬',
      gender: 'male',
      age: '29',
      email: 'zoonyfil@nate.com',
      height: '176',
      weight: '72',
      imgSrc: 'https://findactor.s3.ap-northeast-2.amazonaws.com/2023-02-16T08%3A03%3A43.810Z-2.jpg',
    });
  }

  await db.write();

  res.status(200).send();
});

server.get('/auditions/applied', (req, res) => {
  const { auditionTitle } = req.query;

  if (!auditionTitle) {
    res.status(404).send();
    return;
  }

  const { auditions } = db.data;

  const audition = auditions.find((a) => a.title === auditionTitle);

  const isApplied = audition.appliedAuditionees.some(({ email }) => email === 'zoonyfil@nate.com');

  res.send(isApplied);
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
