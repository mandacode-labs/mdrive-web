"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useCreateDrive,
  useDrives,
  useGoogleLogin,
  useLogout,
  useMe,
} from "@/api/hooks";
import { XPImageIcons } from "@/components/icons/xp_image_icons";
import styles from "./page.module.css";

export default function SystemSelectionPage() {
  const router = useRouter();
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [driveName, setDriveName] = useState("");
  const [driveDescription, setDriveDescription] = useState("");

  const meQuery = useMe();
  const isAuthenticated = !!meQuery.data;

  const logoutMutation = useLogout();
  const listDrivesQuery = useDrives(isAuthenticated);
  const createDriveMutation = useCreateDrive();
  const googleLogin = useGoogleLogin();

  useEffect(() => {
    if (createDriveMutation.isSuccess) {
      setIsCreateMode(false);
      setDriveName("");
      setDriveDescription("");
    }
  }, [createDriveMutation.isSuccess]);

  const handleDriveSelect = (driveID: string) => {
    router.push(`/${driveID}`);
  };

  const handleCreateDrive = () => {
    if (!driveName.trim()) return;

    createDriveMutation.mutate({
      data: {
        name: driveName.trim(),
        description: driveDescription.trim() || undefined,
      },
    });
  };

  const handleCancelCreate = () => {
    setIsCreateMode(false);
    setDriveName("");
    setDriveDescription("");
  };

  const handleLoginClick = () => {
    googleLogin();
  };

  const handleTurnOffClick = () => {
    if (isAuthenticated) {
      logoutMutation.mutate();
    } else {
      handleLoginClick();
    }
  };

  if (meQuery.isLoading || meQuery.isPending) {
    return (
      <div className={styles.xp_login}>
        <div className={styles.top_bar} />
        <p className={styles.loading_text}>Loading...</p>
        <div className={styles.bottom_bar} />
      </div>
    );
  }

  if (
    isAuthenticated &&
    (listDrivesQuery.isLoading || listDrivesQuery.isPending)
  ) {
    return (
      <div className={styles.xp_login}>
        <div className={styles.top_bar} />
        <p className={styles.loading_text}>Loading drives...</p>
        <div className={styles.bottom_bar} />
      </div>
    );
  }

  const drives = listDrivesQuery.data ?? [];

  return (
    <div className={styles.xp_login}>
      <div className={styles.top_bar} />

      <div className={styles.main_content}>
        <div className={styles.left_panel}>
          <div className={styles.windows_logo}>
            <svg
              viewBox="0 0 88 88"
              className={styles.logo_svg}
              role="img"
              aria-label="MDrive Logo"
            >
              <title>MDrive Logo</title>
              <path fill="#F25022" d="M0 0h42v42H0z" />
              <path fill="#00A4EF" d="M46 0h42v42H46z" />
              <path fill="#7FBA00" d="M0 46h42v42H0z" />
              <path fill="#FFB900" d="M46 46h42h-42v42z" />
            </svg>
          </div>
          <h1 className={styles.welcome_title}>Welcome</h1>
          <p className={styles.welcome_hint}>
            {!isAuthenticated
              ? "Please log in to continue"
              : isCreateMode
                ? "Create a new drive"
                : "Click a drive to begin"}
          </p>
        </div>

        <div className={styles.right_panel}>
          {!isAuthenticated ? (
            <div className={styles.login_section}>
              <button
                className={styles.login_button}
                onClick={handleLoginClick}
                type="button"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="white"
                  width="32"
                  height="32"
                  role="img"
                  aria-label="User"
                >
                  <title>User</title>
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span>Login with Google</span>
              </button>
            </div>
          ) : isCreateMode ? (
            <div className={styles.create_form}>
              <div className={styles.form_group}>
                <label htmlFor="drive-name" className={styles.form_label}>
                  Drive Name
                </label>
                <input
                  id="drive-name"
                  type="text"
                  className={styles.form_input}
                  value={driveName}
                  onChange={(e) => setDriveName(e.target.value)}
                  placeholder="Enter drive name"
                  maxLength={255}
                  disabled={createDriveMutation.isPending}
                />
              </div>
              <div className={styles.form_group}>
                <label htmlFor="drive-desc" className={styles.form_label}>
                  Description (optional)
                </label>
                <input
                  id="drive-desc"
                  type="text"
                  className={styles.form_input}
                  value={driveDescription}
                  onChange={(e) => setDriveDescription(e.target.value)}
                  placeholder="Enter description"
                  maxLength={1000}
                  disabled={createDriveMutation.isPending}
                />
              </div>
              <div className={styles.form_buttons}>
                <button
                  className={styles.form_button_primary}
                  onClick={handleCreateDrive}
                  type="button"
                  disabled={!driveName.trim() || createDriveMutation.isPending}
                >
                  {createDriveMutation.isPending ? "Creating..." : "Create"}
                </button>
                <button
                  className={styles.form_button_secondary}
                  onClick={handleCancelCreate}
                  type="button"
                  disabled={createDriveMutation.isPending}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.user_tiles}>
              {drives.map((drive) => (
                <button
                  key={drive.id}
                  className={styles.user_tile}
                  onClick={() => drive.id && handleDriveSelect(drive.id)}
                  type="button"
                  aria-label={`Select ${drive.name}`}
                >
                  <div className={styles.user_avatar}>
                    <XPImageIcons.Home />
                  </div>
                  <span className={styles.user_name}>{drive.name}</span>
                </button>
              ))}
              <button
                className={styles.user_tile}
                onClick={() => setIsCreateMode(true)}
                type="button"
                aria-label="Add new drive"
              >
                <div className={styles.user_avatar}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="white"
                    width="32"
                    height="32"
                    role="img"
                    aria-label="Add"
                  >
                    <title>Add</title>
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </div>
                <span className={styles.user_name}>Add drive</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.bottom_bar}>
        <button
          className={styles.power_button}
          onClick={handleTurnOffClick}
          type="button"
          disabled={logoutMutation.isPending}
          aria-label="Log out"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            role="img"
            aria-label="Power"
          >
            <title>Power</title>
            <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z" />
          </svg>
          <span>
            {logoutMutation.isPending ? "Logging out..." : "Log out"}
          </span>
        </button>
        <span className={styles.bottom_hint}>
          {!isAuthenticated
            ? "Click login to access your drives"
            : isCreateMode
              ? "Fill in the form to create a drive"
              : "To begin, click your drive"}
        </span>
      </div>
    </div>
  );
}