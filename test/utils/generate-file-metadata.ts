import { Readable } from 'stream';

const getRandomString = () => {
  return Math.random().toString(36).substring(2, 15);
};

export const generateFileMetadata = (data?: string, mimetype?: string) => {
  const filename = getRandomString();
  return {
    fieldname: 'file',
    originalname: `${getRandomString()}.jpg`,
    encoding: '8bit',
    mimetype: mimetype ?? 'image/jpeg',
    size: Math.floor(Math.random() * 1000) + 1,
    destination: './uploads',
    filename,
    path: `./uploads/${filename}`,
    buffer: Buffer.from(data ?? 'file'),
    stream: new Readable(),
  };
};
