"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDrive, useMe } from "@/api/hooks";
import DragFileContainer from "@/components/drag/drag_file_container";
import FileContainer from "@/components/file/file_container";
import Background from "@/components/layout/background";
import Navbar from "@/components/layout/navbar/navbar_container";
import MenuBox from "@/components/menu/menu_box";
import SelectBoxContainer from "@/components/select/select_box_container";
import Window from "@/components/window/window";
import { useWindowStore } from "@/store/window.store";
import { WindowType } from "@/types/window";
import { createWindowKey } from "@/utils/random_key";
import styles from "./page.module.css";

export default function DrivePage() {
  const router = useRouter();
  const params = useParams();
  const driveID = params.drive_id as string;

  const backgroundWindowKey = useMemo(() => createWindowKey(), []);

  const windows = useWindowStore((state) => state.windows);
  const newBackgroundWindow = useWindowStore((state) => state.newWindow);
  const setCurrentWindow = useWindowStore((state) => state.setCurrentWindow);

  const backgroundWindowRef = useRef<HTMLDivElement>(null);

  const getUserQuery = useMe();

  const driveQuery = useDrive(driveID);

  useEffect(() => {
    if (getUserQuery.data?.status === 401) {
      router.push("/login");
    }
  }, [getUserQuery.data?.status, router]);

  // Create the background window once we have a confirmed drive.
  useEffect(() => {
    if (driveQuery.isSuccess && driveQuery.data?.status === 200 && driveID) {
      const rootPath = driveQuery.data.data.rootNodeID ? "/" : "/";
      newBackgroundWindow({
        targetKey: rootPath,
        type: WindowType.Background,
        title: driveQuery.data.data.name || "background",
        key: backgroundWindowKey,
        driveID,
      });
    }
  }, [
    backgroundWindowKey,
    driveID,
    driveQuery.data,
    driveQuery.isSuccess,
    newBackgroundWindow,
  ]);

  const onMouseEnter = useCallback(() => {
    setCurrentWindow({
      key: backgroundWindowKey,
      windowRef: backgroundWindowRef,
      contentRef: null,
      headerRef: null,
    });
  }, [backgroundWindowKey, setCurrentWindow]);

  if (
    getUserQuery.isLoading ||
    getUserQuery.isPending ||
    !driveID ||
    driveQuery.isLoading ||
    driveQuery.isPending ||
    !driveQuery.data ||
    driveQuery.data.status !== 200
  ) {
    return <div className="flex-center full-size">Loading...</div>;
  }

  const drive = driveQuery.data.data;
  void drive;

  return (
    <div
      className={`${styles.page} flex-center full-size`}
      onContextMenu={(e) => e.preventDefault()}
      role="application"
    >
      <Background>
        <MenuBox>
          <SelectBoxContainer>
            <DragFileContainer>
              <section
                ref={backgroundWindowRef}
                className={`full-size flex-center ${styles.background_window}`}
                onMouseEnter={onMouseEnter}
                aria-label="background workspace"
              >
                <FileContainer
                  windowKey={backgroundWindowKey}
                  driveID={driveID}
                  path="/"
                  upload
                  backgroundFile
                />
              </section>
              {windows
                .filter((w) => w.type !== WindowType.Background)
                .map((window) => (
                  <Window key={window.key} windowKey={window.key} />
                ))}
            </DragFileContainer>
          </SelectBoxContainer>
        </MenuBox>
      </Background>
      <Navbar windows={windows} driveID={driveID} />
    </div>
  );
}