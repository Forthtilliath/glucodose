import { Alert } from "react-native";
import { render } from "@testing-library/react-native";

import { BackupProblemNotifier } from "./BackupProblemNotifier";

const mockPush = jest.fn();
let mockPathname = "/";
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));
jest.mock("@/lib/backupManager", () => ({ backup: {} }));
// Problème renvoyé par le hook, modifiable par test.
let mockProblem: { code: string; detail: string | null; since: number } | null = null;
jest.mock("@forthtilliath/expo-backup-ui", () => {
  const actual = jest.requireActual("@forthtilliath/expo-backup-ui/labels");
  const dialogs = jest.requireActual("@forthtilliath/expo-backup-ui/dialogs");
  return {
    defaultLabels: actual.defaultLabels,
    codeMessage: dialogs.codeMessage,
    useCloudBackupProblem: () => mockProblem,
  };
});

const storageFull = { code: "drive-storage-full", detail: "HTTP 403 · storageQuotaExceeded", since: 0 };

describe("BackupProblemNotifier", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    mockPathname = "/";
    mockProblem = null;
  });

  it("ne dit rien tant que la sauvegarde fonctionne", async () => {
    await render(<BackupProblemNotifier />);
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it("explique le problème et mène à l'écran Sauvegarde", async () => {
    mockProblem = storageFull;
    await render(<BackupProblemNotifier />);
    expect(Alert.alert).toHaveBeenCalledWith(
      "La sauvegarde Google Drive ne fonctionne plus",
      expect.stringMatching(/stockage Google est plein[\s\S]*échouent depuis le/),
      expect.any(Array)
    );
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as { text: string; onPress?: () => void }[];
    buttons.find((button) => button.text === "Voir")?.onPress?.();
    expect(mockPush).toHaveBeenCalledWith("/settings/backup");
  });

  it("n'alerte qu'une fois par problème, et pas sur l'écran Sauvegarde", async () => {
    mockProblem = storageFull;
    const screen = await render(<BackupProblemNotifier />);
    await screen.rerender(<BackupProblemNotifier />);
    expect(Alert.alert).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
    mockPathname = "/settings/backup";
    await render(<BackupProblemNotifier />);
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
