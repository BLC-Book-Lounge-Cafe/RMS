import path from 'node:path';
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join(__dirname, 'schema.prisma'),
  datasource: {
    url: process.env.RMS_DATABASE_URL,
  },
});
