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

server.patch('/auditions/close', async (req, res) => {
  const { auditionTitle } = req.query;

  if (!auditionTitle) {
    res.status(400).send();
    return;
  }

  const { auditions } = db.data;

  const audition = auditions.find((a) => a.title === auditionTitle);

  audition.isClosed = true;

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

  const {
    appliedAuditionees,
    pendingAuditionees,
    rejectedAuditionees,
    passedAuditionees,
  } = auditions.find((a) => a.title === auditionTitle);

  const isApplied = appliedAuditionees.some((a) => a.email === 'zoonyfil@nate.com')
    || pendingAuditionees.some((a) => a.email === 'zoonyfil@nate.com')
    || rejectedAuditionees.some((a) => a.email === 'zoonyfil@nate.com')
    || passedAuditionees.some((a) => a.email === 'zoonyfil@nate.com');

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

server.get('/initialize', async (req, res) => {
  const { auditions } = db.data;

  db.data.auditions = auditions.map((audition) => {
    if (audition.productionName !== '(주)엑셀시오르콘텐츠랩') {
      return audition;
    }

    return {
      ...audition,
      isClosed: false,
      appliedAuditionees: audition.appliedAuditionees.filter(({ name }) => (
        name !== '이승찬'
      )),
      passedAuditionees: audition.passedAuditionees.filter(({ name }) => (
        name !== '이승찬'
      )),
      pendingAuditionees: audition.pendingAuditionees.filter(({ name }) => (
        name !== '이승찬'
      )),
      rejectedAuditionees: audition.rejectedAuditionees.filter(({ name }) => (
        name !== '이승찬'
      )),
    };
  });

  db.data.requests = [];

  await db.write();

  res.status(200).send();
});

server.patch('/auditions/:auditionTitle/applicants', async (req, res) => {
  const { auditionTitle } = req.params;
  const { operationType, actorEmail } = req.query;

  const { auditions, actors } = db.data;

  const audition = auditions.find(({ title }) => auditionTitle === title);
  const actor = actors.find(({ email }) => email === actorEmail);

  const {
    appliedAuditionees,
    passedAuditionees,
    pendingAuditionees,
    rejectedAuditionees,
  } = audition;

  audition.appliedAuditionees = appliedAuditionees.filter((a) => a.email !== actorEmail);
  audition.passedAuditionees = passedAuditionees.filter((a) => a.email !== actorEmail);
  audition.pendingAuditionees = pendingAuditionees.filter((a) => a.email !== actorEmail);
  audition.rejectedAuditionees = rejectedAuditionees.filter((a) => a.email !== actorEmail);

  if (operationType === 'accept') {
    audition.passedAuditionees.push(actor);
  }
  if (operationType === 'reject') {
    audition.rejectedAuditionees.push(actor);
  }
  if (operationType === 'postpone') {
    audition.pendingAuditionees.push(actor);
  }

  await db.write();

  res.status(200).send();
});

server.post('/requests', async (req, res) => {
  const { audition, actorEmail, auditionTitle } = req.body;

  const { requests } = db.data;

  requests.push({
    id: nanoid(),
    actorEmail,
    auditionTitle,
    audition,
  });

  await db.write();

  res.status(201).send();
});

server.get('/requests/requested', async (req, res) => {
  const { actorEmail, auditionTitle } = req.query;

  const { requests } = db.data;

  await db.write();

  res.status(200).send(
    requests.some((request) => (
      request.actorEmail === actorEmail && request.auditionTitle === auditionTitle
    )),
  );
});

server.get('/requests', async (req, res) => {
  const { actorEmail, productionName } = req.query;

  const { requests } = db.data;

  if (!actorEmail && !productionName) {
    res.status(200).send(requests);
    return;
  }

  if (!actorEmail) {
    res.status(200).send(
      requests.filter((request) => (
        !request.audition.isClosed && request.audition.productionName === productionName
      )),
    );
    return;
  }

  res.status(200).send(
    requests.filter((request) => request.actorEmail === actorEmail),
  );
});

server.patch('/requests/reject', async (req, res) => {
  const { actorEmail, auditionTitle } = req.query;

  const { requests } = db.data;

  const request = requests
    .find((a) => a.actorEmail === actorEmail && a.auditionTitle === auditionTitle);

  request.isRejected = true;

  await db.write();

  res.status(200).send();
});

server.get('/requests/reject', async (req, res) => {
  const { actorEmail, auditionTitle } = req.query;

  const { requests } = db.data;

  const request = requests
    .find((a) => a.actorEmail === actorEmail && a.auditionTitle === auditionTitle);

  res.status(200).send(request.isRejected);
});

export default server;
