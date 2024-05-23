import { Injectable, NestMiddleware } from '@nestjs/common';
import * as express from 'express';

@Injectable()
export class JsonBodyParserMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    express.json({ limit: '2mb' })(req, res, next);
  }
}
