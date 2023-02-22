/* eslint-disable import/no-unresolved */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const directoryName = dirname(fileURLToPath(import.meta.url));

const adapter = new JSONFile(`${directoryName}/db.json`);
const db = new Low(adapter);

await db.read();

db.data ||= { auditions: [] };

export default db;
