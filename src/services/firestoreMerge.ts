// firestoreMerge.ts

/**
 * Generic deep merge by id.
 * Handles nested arrays with id (e.g., Team.players).
 */
export function deepMergeById<T extends { id: string }>(
  local: T[],
  remote: T[],
): T[] {
  const map = new Map<string, T>();

  // Add remote first
  remote.forEach((item) => map.set(item.id, { ...item }));

  // Merge local into remote
  local.forEach((item) => {
    if (map.has(item.id)) {
      const existing = map.get(item.id)!;
      const merged: any = { ...existing };

      Object.keys(item).forEach((key) => {
        const localVal = (item as any)[key];
        const remoteVal = (existing as any)[key];

        // Merge nested arrays of objects with 'id'
        if (
          Array.isArray(localVal) &&
          Array.isArray(remoteVal) &&
          localVal.every((v) => v?.id) &&
          remoteVal.every((v) => v?.id)
        ) {
          merged[key] = deepMergeById(localVal, remoteVal);
        }
        // Merge nested objects
        else if (
          localVal &&
          typeof localVal === "object" &&
          remoteVal &&
          typeof remoteVal === "object"
        ) {
          merged[key] = { ...remoteVal, ...localVal };
        }
        // Overwrite primitive values
        else {
          merged[key] = localVal;
        }
      });

      map.set(item.id, merged as T);
    } else {
      map.set(item.id, { ...item } as T);
    }
  });

  return Array.from(map.values());
}
