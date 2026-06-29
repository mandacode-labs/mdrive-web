export enum WindowType {
  Background = "background",
  Navigator = "navigator",
  Image = "image",
  Video = "video",
  Audio = "audio",
  Document = "document",
  Uploader = "uploader",
  Info = "info",
  Other = "other",
}

export interface AppWindow {
  key: string;
  title: string;
  targetKey: string;
  type: WindowType;
  driveID?: string;
  targetHistory?: string[];
  historyIndex?: number;
  minimized?: boolean;
}

export interface WindowConfig {
  defaultSize: { width: number; height: number };
  supportsHistory: boolean;
  supportsSelection: boolean;
  supportsDragTarget: boolean;
}
