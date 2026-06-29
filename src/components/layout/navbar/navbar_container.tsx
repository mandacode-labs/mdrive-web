import { useEffect, useMemo, useState } from "react";
import PowerButton from "@/components/power/power_button";
import { type AppWindow, WindowType } from "@/types/window";
import styles from "./navbar_container.module.css";
import NavbarIcon from "./navbar_icon";

interface NavbarProps {
  windows: AppWindow[];
  driveID?: string;
}

export default function Navbar({ windows, driveID }: NavbarProps) {
  const defaultIcons = useMemo(
    () => [
      { type: WindowType.Navigator, count: 0, fixed: false },
      { type: WindowType.Image, count: 0, fixed: false },
      { type: WindowType.Video, count: 0, fixed: false },
      { type: WindowType.Audio, count: 0, fixed: false },
      { type: WindowType.Uploader, count: 0, fixed: true },
      { type: WindowType.Document, count: 0, fixed: false },
    ],
    []
  );

  const [icons, setIcons] =
    useState<{ type: WindowType; count: number; fixed: boolean }[]>(
      defaultIcons
    );

  useEffect(() => {
    const newIcons = defaultIcons.map((icon) => {
      const count = windows.filter(
        (window) => window.type === icon.type
      ).length;
      return { ...icon, count };
    });
    setIcons(newIcons);
  }, [defaultIcons, windows]);

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <PowerButton driveID={driveID} />
        {icons.map((icon) => (
          <div key={icon.type} className={styles.icon_container}>
            {(icon.fixed || icon.count > 0) && (
              <NavbarIcon
                windowType={icon.type}
                windowCount={icon.count}
                driveID={driveID}
              />
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
