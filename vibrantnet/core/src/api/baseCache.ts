import NodeCache from 'node-cache';
import { BaseApi } from './base';

export class BaseCacheApi extends BaseApi {
  cache: NodeCache;

  constructor(apiUrl: string, stdTTL = 600) {
    super(apiUrl);
    this.cache = new NodeCache({ stdTTL });
  }
}
