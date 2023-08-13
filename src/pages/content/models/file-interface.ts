//interface AudioFiles = Record<string, AudioFile>

export interface AudioFile {
  album: string;
  title: string;
  bitrate: string;
  format: string;
  length: string;
  original: string;
  size: number;
  source: string;
  track: number;
}
