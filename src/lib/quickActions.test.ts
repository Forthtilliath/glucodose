import { routeForQuickAction } from "./quickActions";

describe("routeForQuickAction", () => {
  it("retourne la route de pesée avec autofocus pour l'action 'weigh'", () => {
    expect(routeForQuickAction("weigh")).toEqual({
      pathname: "/",
      params: { autoFocusWeight: "1" },
    });
  });

  it("retourne la route de création de récipient", () => {
    expect(routeForQuickAction("add-container")).toBe("/containers/new");
  });

  it("retourne la route de création d'aliment", () => {
    expect(routeForQuickAction("add-food")).toBe("/foods/new");
  });

  it("retourne undefined pour un id d'action inconnu", () => {
    expect(routeForQuickAction("does-not-exist")).toBeUndefined();
  });
});
