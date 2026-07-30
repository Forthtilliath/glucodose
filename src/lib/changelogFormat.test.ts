import { parseChangelogNotes } from "./changelogFormat";

describe("parseChangelogNotes", () => {
  it("reconnaît un titre de section (###)", () => {
    const blocks = parseChangelogNotes("### Ajouté");
    expect(blocks).toEqual([{ type: "heading", text: "Ajouté" }]);
  });

  it("reconnaît un item de liste (-)", () => {
    const blocks = parseChangelogNotes("- Export CSV de l'historique.");
    expect(blocks).toEqual([
      { type: "item", segments: [{ text: "Export CSV de l'historique.", bold: false }] },
    ]);
  });

  it("découpe le gras (**...**) dans un item, en préservant le texte autour", () => {
    const blocks = parseChangelogNotes("- **Widget cassé** : corrigé.");
    expect(blocks).toEqual([
      {
        type: "item",
        segments: [
          { text: "Widget cassé", bold: true },
          { text: " : corrigé.", bold: false },
        ],
      },
    ]);
  });

  it("ignore les lignes vides", () => {
    const blocks = parseChangelogNotes("### Ajouté\n\n- Item\n\n### Corrigé\n- Autre item");
    expect(blocks).toHaveLength(4);
    expect(blocks[0]).toEqual({ type: "heading", text: "Ajouté" });
    expect(blocks[2]).toEqual({ type: "heading", text: "Corrigé" });
  });

  it("traite une ligne sans marqueur comme du texte simple", () => {
    const blocks = parseChangelogNotes("Juste une phrase.");
    expect(blocks).toEqual([
      { type: "text", segments: [{ text: "Juste une phrase.", bold: false }] },
    ]);
  });

  it("parse des notes réelles complètes avec plusieurs sections", () => {
    const notes = [
      "### Ajouté",
      "- Export CSV de l'Historique, en plus du PDF.",
      "",
      "### Corrigé",
      "- **Widget d'écran d'accueil** qui ne s'affichait jamais.",
    ].join("\n");
    const blocks = parseChangelogNotes(notes);
    expect(blocks.map((b) => b.type)).toEqual(["heading", "item", "heading", "item"]);
  });
});
