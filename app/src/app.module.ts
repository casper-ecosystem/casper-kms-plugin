import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KeysService } from './keys/keys.service';

dotenv.config({ path: '.env.production' });
dotenv.config({ path: '.env' });
const isDebug = process.env.DEBUG === 'true';

// Override console.debug
const debug = console.debug;
console.debug = (...args) => {
  if (isDebug) {
    debug('[DEBUG]', ...args);
  }
};

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, KeysService],
})
export class AppModule {}
