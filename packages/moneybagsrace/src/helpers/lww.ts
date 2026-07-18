import { ProfileData } from '../types/profile';
import { MonthlySnapshotData, SharedAssetsEntry } from '../types/snapshot';
import { SharedAssumptionsEntry } from '../types/assumptions';

const newestByUpdatedAt = <Entry extends { updatedAt: string }>(
  entries: Entry[]
): Entry | undefined =>
  entries.reduce<Entry | undefined>((newest, entry) => {
    if (!newest) {
      return entry;
    }
    return Date.parse(entry.updatedAt) > Date.parse(newest.updatedAt)
      ? entry
      : newest;
  }, undefined);

export const resolveSharedAssets = (
  snapshots: (MonthlySnapshotData | undefined)[]
): SharedAssetsEntry | undefined =>
  newestByUpdatedAt(
    snapshots.flatMap((snapshot) => (snapshot?.shared ? [snapshot.shared] : []))
  );

export const resolveSharedAssumptions = (
  profiles: (ProfileData | undefined)[]
): SharedAssumptionsEntry | undefined =>
  newestByUpdatedAt(
    profiles.flatMap((profile) =>
      profile?.sharedAssumptions ? [profile.sharedAssumptions] : []
    )
  );

export const isMonthComplete = (
  memberUserIds: string[],
  memberSnapshots: { [userId: string]: MonthlySnapshotData | undefined }
): boolean => {
  if (memberUserIds.length === 0) {
    return false;
  }
  const snapshots = memberUserIds.map((userId) => memberSnapshots[userId]);
  const everyMemberComplete = snapshots.every(
    (snapshot) => snapshot?.complete === true
  );
  return everyMemberComplete && resolveSharedAssets(snapshots) !== undefined;
};
