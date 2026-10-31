import { parseDecimal } from "./parseDecimal";

describe("parseDecimal", () => {
  it("lit la virgule comme séparateur décimal", () => {
    expect(parseDecimal("1,8")).toBe(1.8);
    expect(parseDecimal("63,5")).toBe(63.5);
  });

  it("lit aussi le point", () => {
    expect(parseDecimal("1.8")).toBe(1.8);
    expect(parseDecimal("440")).toBe(440);
  });

  it("tolère les espaces autour et les formes abrégées", () => {
    expect(parseDecimal(" 12 ")).toBe(12);
    expect(parseDecimal("12,")).toBe(12);
    expect(parseDecimal(",5")).toBe(0.5);
    expect(parseDecimal("-1,5")).toBe(-1.5);
  });

  it("refuse une saisie qui n'est pas un nombre complet", () => {
    for (const text of ["", " ", ",", "1,8,2", "1.8.2", "12abc", "abc", "1 000", "1e3"]) {
      expect(parseDecimal(text)).toBeNaN();
    }
  });
});
