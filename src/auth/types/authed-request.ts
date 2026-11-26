import { Request } from 'express';
import { JwtPayload } from './jwt-payload';

export interface AuthedRequest extends Request {
  user?: JwtPayload;
}
