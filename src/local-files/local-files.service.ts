import { Injectable, StreamableFile } from '@nestjs/common';
import * as sharp from 'sharp';
import { createReadStream } from 'fs';
import * as path from 'path';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class LocalFilesService {
  constructor(private settingsService: SettingsService) {}

  async getPhoto(filepath: string, mimeType: string) {
    const stream = createReadStream(path.join(process.cwd(), filepath));

    const res = new StreamableFile(stream, {
      type: mimeType,
      disposition: 'inline',
    });

    res.setErrorHandler(() => {
      return;
    });

    return res;
  }

  async savePhoto(
    file: Express.Multer.File,
  ): Promise<{ path: string; mimeType: string }> {
    if (
      (await this.settingsService.getSettingValueByName(
        'Convert images to JPEG',
      )) !== 'true'
    ) {
      return { path: file.path, mimeType: file.mimetype };
    }
    const buffer = await sharp(file.path)
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 95, mozjpeg: true })
      .toBuffer();
    await sharp(buffer).toFile(file.path);
    return { path: file.path, mimeType: 'image/jpeg' };
  }

  async createPhotoThumbnail(path: string): Promise<string> {
    const outputPath = `${path}-thumbnail`;
    const size = Math.abs(
      parseInt(
        await this.settingsService.getSettingValueByName('Thumbnail size'),
      ),
    );
    await sharp(path)
      .resize(size, size, { fit: 'contain', background: '#ffffff' })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(outputPath);
    return outputPath;
  }

  async createPhotoPlaceholder(path: string): Promise<string> {
    const res = await sharp(path)
      .resize(12, 12, { fit: 'contain', background: '#ffffff' })
      .toBuffer();
    return `data:image/png;base64,${res.toString('base64')}`;
  }
}
