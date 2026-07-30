import { renderHook } from "@testing-library/react-native";

const mockUseLiveQuery = jest.fn();
jest.mock("drizzle-orm/expo-sqlite", () => ({
  useLiveQuery: (...args: unknown[]) => mockUseLiveQuery(...args),
}));

const mockRunAutoBackup = jest.fn().mockResolvedValue(undefined);
jest.mock("@/lib/backup", () => ({ runAutoBackup: () => mockRunAutoBackup() }));

jest.mock("@/db/client", () => ({ db: { select: () => ({ from: () => "query" }) } }));
jest.mock("@/db/schema", () => ({ containers: {}, foods: {}, settings: {} }));

import { useAutoBackup } from "./useAutoBackup";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

function setData(containersData: unknown, foodsData: unknown, settingsData: unknown) {
  mockUseLiveQuery
    .mockReturnValueOnce({ data: containersData })
    .mockReturnValueOnce({ data: foodsData })
    .mockReturnValueOnce({ data: settingsData });
}

describe("useAutoBackup", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockRunAutoBackup.mockClear();
    mockUseLiveQuery.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("ne déclenche rien tant que les 3 requêtes n'ont pas toutes livré leur premier résultat", () => {
    setData(undefined, undefined, undefined);
    renderHook(() => useAutoBackup());

    jest.advanceTimersByTime(FIVE_MINUTES_MS);
    expect(mockRunAutoBackup).not.toHaveBeenCalled();
  });

  it("ne déclenche pas de sauvegarde au premier rendu une fois les données chargées", () => {
    setData([], [], []);
    renderHook(() => useAutoBackup());

    jest.advanceTimersByTime(FIVE_MINUTES_MS);
    expect(mockRunAutoBackup).not.toHaveBeenCalled();
  });

  it("déclenche une sauvegarde 5 minutes après un changement de données", () => {
    setData([], [], []);
    const { rerender } = renderHook(() => useAutoBackup());

    setData([{ id: 1 }], [], []);
    rerender({});

    jest.advanceTimersByTime(FIVE_MINUTES_MS - 1);
    expect(mockRunAutoBackup).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(mockRunAutoBackup).toHaveBeenCalledTimes(1);
  });

  it("repousse la sauvegarde si un nouveau changement survient avant les 5 minutes", () => {
    setData([], [], []);
    const { rerender } = renderHook(() => useAutoBackup());

    setData([{ id: 1 }], [], []);
    rerender({});
    jest.advanceTimersByTime(4 * 60 * 1000);

    setData([{ id: 1 }, { id: 2 }], [], []);
    rerender({});
    jest.advanceTimersByTime(4 * 60 * 1000);
    expect(mockRunAutoBackup).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1 * 60 * 1000);
    expect(mockRunAutoBackup).toHaveBeenCalledTimes(1);
  });
});
