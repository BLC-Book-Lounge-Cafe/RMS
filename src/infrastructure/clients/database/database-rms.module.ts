import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseRmsClient } from './database-rms.client';

@Module({
  imports: [ConfigModule],
  providers: [DatabaseRmsClient],
  exports: [DatabaseRmsClient],
})
export class DatabaseRmsModule {}
