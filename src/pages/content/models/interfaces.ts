export interface ArchiveFile {
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

export interface ArchiveShow {
  files: Record<string, ArchiveFile>;
  metadata: Metadata;
  server: string;
  dir: string;
}

export interface Metadata {
  date: string[];
}

export interface Track {
  title: string;
  url: string;
}
