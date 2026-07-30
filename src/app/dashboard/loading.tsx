import { BhadaLogo } from "@/components/brand-logo";
import styles from "@/components/dashboard.module.css";

export default function DashboardLoading() {
  return (
    <div
      className={styles.loadingShell}
      role="status"
      aria-busy="true"
      aria-label="Loading your workspace"
    >
      <div className={styles.loadingCenter}>
        <div className={styles.loadingBrand}>
          <BhadaLogo
            markClassName="size-10 text-[#edede8]"
            wordmarkClassName="text-[22px] text-[#edede8]"
          />
        </div>

        <div className={styles.loadingTrack} aria-hidden="true">
          <span className={styles.loadingProgress} />
        </div>

        <p className={styles.loadingLabel}>Preparing your workspace</p>
      </div>
    </div>
  );
}
