import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./power_button.module.css";

interface PowerButtonProps {
  systemId?: string;
}

export default function PowerButton({ systemId }: PowerButtonProps) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePowerClick = () => {
    setShowDialog(true);
  };

  // Exit just navigates to main page (logout happens on main page)
  const handleExit = () => {
    router.push("/");
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (confirmText.toLowerCase() !== "confirm" || !systemId) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/systems/${systemId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        router.push("/");
      }
    } catch {
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setShowDialog(false);
    }
  };

  return (
    <>
      <button
        className={styles.power_button}
        onClick={handlePowerClick}
        type="button"
        title="Shutdown"
      >
        <svg
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Shutdown"
        >
          <title>Shutdown</title>
          <rect x="11" y="2" width="2" height="5" rx="1" fill="currentColor" />
        </svg>
        <span className={styles.button_text}>start</span>
      </button>

      {showDialog && (
        <div
          className={styles.dialog_overlay}
          onClick={handleCancel}
          onKeyDown={(e) => e.key === "Escape" && handleCancel()}
          role="none"
        >
          <div
            className={styles.dialog}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shutdown-title"
          >
            <div className={styles.dialog_header}>
              <h2 id="shutdown-title">Shut Down Windows</h2>
            </div>
            <div className={styles.dialog_content}>
              <p>What do you want the computer to do?</p>
            </div>
            <div className={styles.dialog_footer}>
              <button
                className={styles.dialog_button}
                onClick={handleExit}
                type="button"
              >
                Exit
              </button>
              <button
                className={styles.dialog_button}
                onClick={handleCancel}
                type="button"
              >
                Cancel
              </button>
            </div>
            {systemId && (
              <div className={styles.delete_section}>
                <button
                  className={styles.delete_button}
                  onClick={handleDeleteClick}
                  type="button"
                >
                  Delete System
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className={styles.dialog_overlay}
          onClick={() => setShowDeleteConfirm(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowDeleteConfirm(false)}
          role="none"
        >
          <div
            className={styles.dialog}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.dialog_header}>
              <h2>Delete System</h2>
            </div>
            <div className={styles.dialog_content}>
              <p>This action cannot be undone.</p>
              <p>Type &quot;confirm&quot; to delete this system:</p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className={styles.confirm_input}
                placeholder="confirm"
                disabled={isDeleting}
              />
            </div>
            <div className={styles.dialog_footer}>
              <button
                className={`${styles.dialog_button} ${styles.delete_button}`}
                onClick={handleDeleteConfirm}
                type="button"
                disabled={confirmText.toLowerCase() !== "confirm" || isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
              <button
                className={styles.dialog_button}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConfirmText("");
                }}
                type="button"
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
