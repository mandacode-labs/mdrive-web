import type { WindowConfig } from "@/types/window";
import { WindowType } from "@/types/window";

const windowConfigs: Record<WindowType, WindowConfig> = {
  [WindowType.Background]: {
    defaultSize: { width: 0, height: 0 },
    supportsHistory: false,
    supportsSelection: true,
    supportsDragTarget: true,
  },
  [WindowType.Navigator]: {
    defaultSize: { width: 600, height: 300 },
    supportsHistory: true,
    supportsSelection: true,
    supportsDragTarget: true,
  },
  [WindowType.Image]: {
    defaultSize: { width: 600, height: 300 },
    supportsHistory: false,
    supportsSelection: false,
    supportsDragTarget: false,
  },
  [WindowType.Video]: {
    defaultSize: { width: 600, height: 300 },
    supportsHistory: false,
    supportsSelection: false,
    supportsDragTarget: false,
  },
  [WindowType.Audio]: {
    defaultSize: { width: 600, height: 300 },
    supportsHistory: false,
    supportsSelection: false,
    supportsDragTarget: false,
  },
  [WindowType.Document]: {
    defaultSize: { width: 600, height: 300 },
    supportsHistory: false,
    supportsSelection: false,
    supportsDragTarget: false,
  },
  [WindowType.Uploader]: {
    defaultSize: { width: 600, height: 340 },
    supportsHistory: false,
    supportsSelection: false,
    supportsDragTarget: false,
  },
  [WindowType.Info]: {
    defaultSize: { width: 300, height: 260 },
    supportsHistory: false,
    supportsSelection: false,
    supportsDragTarget: false,
  },
  [WindowType.Other]: {
    defaultSize: { width: 600, height: 300 },
    supportsHistory: false,
    supportsSelection: false,
    supportsDragTarget: false,
  },
};

export function getWindowConfig(type: WindowType): WindowConfig {
  return windowConfigs[type] ?? windowConfigs[WindowType.Other];
}
