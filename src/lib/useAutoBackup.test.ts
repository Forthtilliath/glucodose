import { renderHook } from "@testing-library/react-native";

import { useAutoBackup } from "./useAutoBackup";

const mockUseLiveQuery = jest.fn();
jest.mock("drizzle-orm/expo-sqlite", () => ({
  useLiveQuery: (...args: unknown[]) => mockUseLiveQuery(...args),
}));

const mockNotifyDataChanged = jest.fn();
const mockRemoveLegacyAutoBackup = jest.fn();
jest.mock("@/lib/backupManager", () => ({
  backup: { notifyDataChanged: () => mockNotifyDataChanged() },
  removeLegacyAutoBackup: () => mockRemoveLegacyAutoBackup(),
}));

const mockStartManager = jest.fn();
jest.mock("@forthtilliath/expo-backup-ui", () => ({
  useAutoBackup: (manager: unknown) => mockStartManager(manager),
}));

jest.mock("@/db/client", () => {
  const query = { from: () => query };
  return { db: { select: () => query } };
});

const LIVE_QUERIES = 6;
const NO_WEIGHING = [{ total: 0, lastId: null }];

// useLiveQuery est appelé 6 fois par rendu, dans l'ordre : récipients,
// aliments, composants, ratios, réglages, agrégat des pesées.
function setData(...values: unknown[]) {
  for (let i = 0; i < LIVE_QUERIES; i++) {
    mockUseLiveQuery.mockReturnValueOnce({ data: values[i] });
  }
}

describe("useAutoBackup", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockNotifyDataChanged.mockClear();
    mockUseLiveQuery.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("démarre le gestionnaire et supprime l'ancienne sauvegarde locale en clair", async () => {
    setData([], [], [], [], [], NO_WEIGHING);
    await renderHook(() => useAutoBackup());
    expect(mockStartManager).toHaveBeenCalled();
    expect(mockRemoveLegacyAutoBackup).toHaveBeenCalled();
  });

  it("ne signale rien tant que les données ne sont pas chargées, ni au premier chargement", async () => {
    setData(undefined, undefined, undefined, undefined, undefined, undefined);
    const { rerender } = await renderHook(() => useAutoBackup());
    setData([], [], [], [], [], NO_WEIGHING);
    await rerender({});

    jest.runAllTimers();
    expect(mockNotifyDataChanged).not.toHaveBeenCalled();
  });

  it("signale chaque modification, pesées comprises", async () => {
    setData([], [], [], [], [], NO_WEIGHING);
    const { rerender } = await renderHook(() => useAutoBackup());

    setData([], [], [], [], [], [{ total: 1, lastId: 1 }]);
    await rerender({});
    jest.runAllTimers();
    expect(mockNotifyDataChanged).toHaveBeenCalledTimes(1);

    setData([{ id: 1 }], [], [], [], [], [{ total: 1, lastId: 1 }]);
    await rerender({});
    jest.runAllTimers();
    expect(mockNotifyDataChanged).toHaveBeenCalledTimes(2);
  });
});
