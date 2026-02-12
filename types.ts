
export enum VoiceName {
  KORE = 'Kore',
  PUCK = 'Puck',
  CHARON = 'Charon',
  FENRIR = 'Fenrir',
  ZEPHYR = 'Zephyr'
}

export interface VoiceOption {
  id: VoiceName;
  label: string;
  description: string;
}

export interface NovelContent {
  title: string;
  paragraphs: string[];
}

export enum ReaderTheme {
  LIGHT = 'light',
  DARK = 'dark',
  SEPIA = 'sepia'
}
