import crypto from 'crypto'
import { AttachmentBuilder } from 'discord.js';
import { URLSearchParams } from 'url'
import axios from 'axios';

export type NftCdnAttachment = {
  files: AttachmentBuilder[]
  name: string | null
}

export default {
  nftcdnUrl(asset: string, uri = '/image', params = {}) {
    const [domain, key] = [process.env.NFTCDN_DOMAIN!, Buffer.from(process.env.NFTCDN_KEY!, 'base64')];
    const plainUrl = this.buildUrl(domain, asset, uri, { ...params, tk: '' });
    const urlHash = crypto.createHmac('sha256', key).update(plainUrl).digest('base64url');
    return this.buildUrl(domain, asset, uri, { ...params, tk: urlHash });
  },
  buildUrl(domain: string, asset: string, uri: string, params: Record<string, string | readonly string[]>) {
    const searchParams = new URLSearchParams(params);
    return `https://${asset}.${domain}.nftcdn.io${uri}?${searchParams.toString()}`;
  },
  async nftcdnBlob(asset: string, params = {}): Promise<NftCdnAttachment> {
    const nftcdnUrl = this.nftcdnUrl(asset, '/image', params);
    if (nftcdnUrl) {
      const nftcdnResponse = await axios.get(nftcdnUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(nftcdnResponse.data, 'binary');
      const attachment = new AttachmentBuilder(buffer, { name: `${asset}.webp` });
      return {
        files: [attachment],
        name: `attachment://${asset}.webp`,
      };
    }
    return {
      files: [],
      name: null,
    };
  }
}