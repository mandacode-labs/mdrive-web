import { create } from "zustand";
import { type AppWindow, WindowType } from "@/types/window";
import { createWindowKey } from "@/utils/random_key";

type State = {
  windows: AppWindow[];
  currentWindow: {
    key: string;
    windowRef: React.RefObject<HTMLDivElement | null>;
    contentRef: React.RefObject<HTMLElement | null> | null;
    headerRef: React.RefObject<HTMLElement | null> | null;
  } | null;
  mouseEnter: boolean;
};

type Action = {
  newWindow: ({
    targetKey,
    type,
    title,
    key,
    driveID,
  }: {
    targetKey: string;
    type: WindowType;
    title: string;
    key?: string;
    driveID?: string;
  }) => void;
  updateWindow: ({
    targetWindowKey,
    type,
    targetFileKey,
    title,
  }: {
    targetWindowKey: string;
    type?: WindowType;
    targetFileKey: string;
    title?: string;
  }) => void;
  findWindow: (key: string) => AppWindow | undefined;
  findWindowByTarget: (targetKey: string) => AppWindow | undefined;
  closeWindow: (key: string) => void;
  minimizeWindow: (key: string) => void;
  restoreWindow: (key: string) => void;
  highlightWindow: (key: string) => void;
  highlightWindowsByType: (type: WindowType) => void;
  prevWindow: (key: string) => void;
  nextWindow: (key: string) => void;
  hasPrevWindow: (key: string) => boolean;
  hasNextWindow: (key: string) => boolean;
  setTitle: (key: string, title: string) => void;
  getBackgroundWindow: () => AppWindow | undefined;

  // current window
  setCurrentWindow: (window: State["currentWindow"] | null) => void;

  // mouse enter
  setMouseEnter: (enter: boolean) => void;
};

const initialState: State = {
  windows: [],
  currentWindow: null,
  mouseEnter: false,
};

export const useWindowStore = create<State & Action>((set, get) => ({
  windows: initialState.windows,
  currentWindow: initialState.currentWindow,
  mouseEnter: initialState.mouseEnter,
  newWindow: ({ targetKey, type, title, key, driveID }) => {
    set((state) => {
      const existingWindow = state.windows.find(
        (w) => w.targetKey === targetKey && w.type === type
      );
      if (existingWindow) {
        const filteredWindows = state.windows.filter(
          (w) => w.targetKey !== targetKey
        );
        state.windows = [...filteredWindows, existingWindow];
        return { windows: state.windows };
      } else {
        const newWindow: AppWindow = {
          key: key || createWindowKey(),
          title: title || "New Window",
          targetKey: targetKey,
          type,
          driveID,
        };
        if (type === WindowType.Navigator) {
          newWindow.targetHistory = [targetKey];
          newWindow.historyIndex = 0;
        }
        state.windows = [...state.windows, newWindow];
        return { windows: state.windows };
      }
    });
  },
  updateWindow: ({ targetWindowKey, type, targetFileKey, title }) => {
    set((state) => {
      const windowIndex = state.windows.findIndex(
        (w) => w.key === targetWindowKey
      );
      if (windowIndex === -1) return state;

      const window = state.windows[windowIndex];
      if (window.targetKey === targetFileKey && window.type === type) {
        return state;
      }

      const newWindow: typeof window = {
        ...window,
        targetKey: targetFileKey,
      };
      if (type) {
        newWindow.type = type;
      }
      if (title) {
        newWindow.title = title;
      }
      if (window.targetHistory && window.historyIndex !== undefined) {
        newWindow.targetHistory = [
          ...window.targetHistory.slice(0, window.historyIndex + 1),
          targetFileKey,
        ];
        newWindow.historyIndex = newWindow.targetHistory.length - 1;
      }

      const newWindows = [...state.windows];
      newWindows[windowIndex] = newWindow;
      return { windows: newWindows };
    });
  },
  findWindow(key) {
    return get().windows.find((w) => w.key === key);
  },
  findWindowByTarget: (targetKey) => {
    return get().windows.find((w) => w.targetKey === targetKey);
  },
  closeWindow: (key) => {
    set((state) => {
      state.windows = state.windows.filter((w) => w.key !== key);
      const shouldResetCurrent = state.currentWindow?.key === key;
      return {
        windows: state.windows,
        ...(shouldResetCurrent ? { currentWindow: null } : {}),
      };
    });
  },
  minimizeWindow: (key) => {
    set((state) => {
      const window = state.windows.find((w) => w.key === key);
      if (window) {
        window.minimized = true;
        state.windows = [...state.windows];
      }
      return { windows: state.windows };
    });
  },
  restoreWindow: (key) => {
    set((state) => {
      const window = state.windows.find((w) => w.key === key);
      if (window) {
        window.minimized = false;
        state.windows = [...state.windows];
      }
      return { windows: state.windows };
    });
  },
  highlightWindow: (key) => {
    set((state) => {
      const window = state.windows.find((w) => w.key === key);
      if (window) {
        const filteredWindows = state.windows.filter((w) => w.key !== key);
        state.windows = [...filteredWindows, window];
      }
      return { windows: state.windows };
    });
  },
  highlightWindowsByType: (type) => {
    set((state) => {
      const windows = [
        ...state.windows.filter((w) => w.type !== type),
        ...state.windows.filter((w) => w.type === type),
      ];
      return { windows };
    });
  },
  prevWindow: (key) => {
    set((state) => {
      const windowIndex = state.windows.findIndex((w) => w.key === key);
      if (windowIndex === -1) return state;

      const window = state.windows[windowIndex];
      if (window?.targetHistory && window.historyIndex !== undefined) {
        if (window.historyIndex > 0) {
          const newHistoryIndex = window.historyIndex - 1;
          const newWindow = {
            ...window,
            historyIndex: newHistoryIndex,
            targetKey: window.targetHistory[newHistoryIndex],
          };
          const newWindows = [...state.windows];
          newWindows[windowIndex] = newWindow;
          return { windows: newWindows };
        }
      }
      return state;
    });
  },
  nextWindow: (key) => {
    set((state) => {
      const windowIndex = state.windows.findIndex((w) => w.key === key);
      if (windowIndex === -1) return state;

      const window = state.windows[windowIndex];
      if (window?.targetHistory && window.historyIndex !== undefined) {
        if (window.historyIndex < window.targetHistory.length - 1) {
          const newHistoryIndex = window.historyIndex + 1;
          const newWindow = {
            ...window,
            historyIndex: newHistoryIndex,
            targetKey: window.targetHistory[newHistoryIndex],
          };
          const newWindows = [...state.windows];
          newWindows[windowIndex] = newWindow;
          return { windows: newWindows };
        }
      }
      return state;
    });
  },
  hasPrevWindow: (key) => {
    const window = get().windows.find((w) => w.key === key);
    if (window && window.historyIndex !== undefined) {
      return window.historyIndex > 0;
    }
    return false;
  },
  hasNextWindow: (key) => {
    const window = get().windows.find((w) => w.key === key);
    if (window?.targetHistory && window.historyIndex !== undefined) {
      return (
        window.historyIndex < window.targetHistory.length - 1 &&
        window.targetHistory.length > 1
      );
    }
    return false;
  },
  setTitle: (key, title) => {
    set((state) => {
      const window = state.windows.find((w) => w.key === key);
      if (window) {
        window.title = title;
        state.windows = [...state.windows];
      }
      return { windows: state.windows };
    });
  },
  getBackgroundWindow: () => {
    return get().windows.find((w) => w.type === WindowType.Background);
  },

  // current window
  setCurrentWindow: (window) => {
    set({ currentWindow: window });
  },

  // mouse enter
  setMouseEnter: (enter) => {
    set({ mouseEnter: enter });
  },
}));
