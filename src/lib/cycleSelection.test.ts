import { nextInCycle } from "./cycleSelection";

describe("nextInCycle", () => {
  it("retourne null si la liste est vide", () => {
    expect(nextInCycle([], null)).toBeNull();
    expect(nextInCycle([], 5)).toBeNull();
  });

  it("retourne le premier élément si rien n'est sélectionné", () => {
    expect(nextInCycle([1, 2, 3], null)).toBe(1);
  });

  it("retourne l'élément suivant l'actuel", () => {
    expect(nextInCycle([1, 2, 3], 1)).toBe(2);
    expect(nextInCycle([1, 2, 3], 2)).toBe(3);
  });

  it("reboucle au premier élément après le dernier", () => {
    expect(nextInCycle([1, 2, 3], 3)).toBe(1);
  });

  it("repart du premier élément si l'actuel n'est plus dans la liste", () => {
    expect(nextInCycle([1, 2, 3], 99)).toBe(1);
  });

  it("gère une liste à un seul élément (reste sur lui-même)", () => {
    expect(nextInCycle([1], 1)).toBe(1);
    expect(nextInCycle([1], null)).toBe(1);
  });
});
