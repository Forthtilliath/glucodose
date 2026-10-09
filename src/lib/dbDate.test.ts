import { parseDbDate } from "./dbDate";

describe("parseDbDate", () => {
  it("lit une date SQLite current_timestamp comme de l'UTC", () => {
    expect(parseDbDate("2026-10-09 19:46:00").toISOString()).toBe("2026-10-09T19:46:00.000Z");
  });

  it("lit une date ISO complète telle quelle", () => {
    expect(parseDbDate("2026-01-15T12:30:00.000Z").toISOString()).toBe("2026-01-15T12:30:00.000Z");
  });

  it("respecte un décalage horaire explicite", () => {
    expect(parseDbDate("2026-10-09T21:46:00+02:00").toISOString()).toBe("2026-10-09T19:46:00.000Z");
  });
});
