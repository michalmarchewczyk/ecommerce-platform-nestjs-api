import { Injectable, StreamableFile } from '@nestjs/common';
import { FileSerializer } from './models/file-serializer.interface';
import { Readable } from 'stream';

@Injectable()
export class JsonSerializer implements FileSerializer {
  async parse(data: Buffer): Promise<Record<string, any>> {
    return JSON.parse(data.toString());
  }

  async serialize(data: Record<string, any>): Promise<StreamableFile> {
    const parsed = JSON.stringify(data);
    return new StreamableFile(Readable.from([parsed]), {
      type: 'application/json',
    });
  }
}
