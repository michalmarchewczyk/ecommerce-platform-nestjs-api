import { Injectable, StreamableFile } from '@nestjs/common';
import { FileSerializer } from './models/file-serializer.interface';
import { Readable } from 'stream';
import * as tar from 'tar';
import * as os from 'os';
import { Collection } from './models/collection.type';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as csvtojson from 'csvtojson';
import * as json2csv from 'json2csv';

@Injectable()
export class ZipSerializer implements FileSerializer {
  async parse(data: Buffer): Promise<Record<string, any>> {
    const stream = Readable.from(data);
    const filenames: string[] = [];
    const tarStream = tar.extract({
      cwd: os.tmpdir(),
      onentry: (entry) => {
        filenames.push(entry.path);
      },
    });
    stream.pipe(tarStream);
    await new Promise((resolve) => tarStream.on('end', resolve));
    const collections: Record<string, Collection> = {};
    for (const filename of filenames) {
      const filePath = path.join(os.tmpdir(), filename);
      if (path.extname(filePath) === '.csv') {
        const csv = await fs.readFile(filePath, { encoding: 'utf-8' });
        collections[filename.split('.')[0]] = await this.parseCsv(csv);
      }
    }
    for (const filename of filenames) {
      if (filename.startsWith('photos/')) {
        const foundPhoto = collections['productPhotos'].find((photo) =>
          (photo.path as string).includes('/' + path.basename(filename)),
        );
        if (!foundPhoto || !foundPhoto.path) {
          continue;
        }
        await fs.copyFile(
          path.join(os.tmpdir(), filename),
          path.join(
            process.cwd(),
            'uploads',
            path.basename(filename).replace(path.extname(filename), ''),
          ),
        );
        foundPhoto.path = (foundPhoto.path as string).replace(
          path.extname(foundPhoto.path as string),
          '',
        );
      }
    }
    return collections;
  }

  private async parseCsv(csv: string) {
    const parser: Record<string, any> = {};
    if (!csv) {
      return [];
    }
    const headers = (
      await csvtojson({
        output: 'csv',
        noheader: true,
      }).fromString(csv.split(os.EOL)[0])
    )[0];
    for (const header of headers) {
      parser[header] = 'string';
    }
    return csvtojson({
      checkType: true,
      colParser: parser,
    })
      .preFileLine((fileLineString, lineIdx) => {
        if (lineIdx === 1) {
          const columns = fileLineString.split(',');
          columns.forEach((column, index) => {
            if (!column.startsWith('"') || !column.endsWith('"')) {
              delete parser[headers[index]];
            }
          });
        }
        return fileLineString;
      })
      .fromString(csv);
  }

  async serialize(
    data: Record<string, any>,
    photoPaths?: string[],
  ): Promise<StreamableFile> {
    const fields = Object.keys(data);
    const files: string[] = [];
    for (const field of fields) {
      if (data[field].length > 0) {
        const parsed = json2csv.parse(data[field]);
        const filePath = path.join(os.tmpdir(), `${field}.csv`);
        await fs.writeFile(filePath, parsed);
        files.push(`${field}.csv`);
      } else {
        const filePath = path.join(os.tmpdir(), `${field}.csv`);
        await fs.writeFile(filePath, '');
        files.push(`${field}.csv`);
      }
    }
    if (photoPaths) {
      await fs.mkdir(path.join(os.tmpdir(), 'photos'), { recursive: true });
      for (const photoPath of photoPaths) {
        await fs.copyFile(
          path.join(
            process.cwd(),
            photoPath.replace(path.extname(photoPath), ''),
          ),
          path.join(os.tmpdir(), 'photos', path.basename(photoPath)),
        );
        files.push(path.join('photos', path.basename(photoPath)));
      }
    }
    const stream = tar.create({ gzip: true, cwd: os.tmpdir() }, files);
    return new StreamableFile(stream, {
      type: 'application/gzip',
    });
  }
}
