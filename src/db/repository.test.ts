import { eq } from "drizzle-orm";

import * as schema from "./schema";
import { closeTestDb, createTestDb, mockDbClient, resetTestDb, type TestDb } from "./testDb";

jest.mock("@/lib/photos", () => ({ deleteContainerPhoto: jest.fn() }));

type Repository = typeof import("./repository");

let testDb: TestDb;
let repo: Repository;
let deleteContainerPhotoMock: jest.Mock;

beforeAll(async () => {
  testDb = await createTestDb();
  mockDbClient("./client", testDb);
  repo = require("./repository");
  deleteContainerPhotoMock = require("@/lib/photos").deleteContainerPhoto;
});

afterAll(() => {
  closeTestDb(testDb);
});

beforeEach(async () => {
  await resetTestDb(testDb);
  deleteContainerPhotoMock.mockClear();
});

describe("récipients", () => {
  it("crée puis met à jour un récipient", async () => {
    await repo.createContainer({ name: "Bol bleu", tareWeightG: 120 });
    const [created] = await testDb.select().from(schema.containers);
    expect(created.name).toBe("Bol bleu");

    await repo.updateContainer(created.id, { name: "Grand bol bleu", tareWeightG: 130 });
    const [updated] = await testDb.select().from(schema.containers);
    expect(updated.name).toBe("Grand bol bleu");
    expect(updated.tareWeightG).toBe(130);
  });

  it("supprime un récipient et nettoie sa photo sur disque", async () => {
    await repo.createContainer({ name: "Bol", tareWeightG: 100, photoUri: "file:///bol.jpg" });
    const [created] = await testDb.select().from(schema.containers);

    await repo.deleteContainer(created.id, created.photoUri);

    expect(deleteContainerPhotoMock).toHaveBeenCalledWith("file:///bol.jpg");
    const remaining = await testDb.select().from(schema.containers);
    expect(remaining).toHaveLength(0);
  });

  it("met à null le récipient d'une pesée existante quand il est supprimé (onDelete: set null)", async () => {
    await repo.createContainer({ name: "Bol", tareWeightG: 100 });
    const [container] = await testDb.select().from(schema.containers);
    const foodId = await repo.createIngredient({ name: "Pomme", carbsPer100g: 12 });
    await repo.recordWeighing(buildWeighingInput({ foodId, containerId: container.id }));

    await repo.deleteContainer(container.id, null);

    const [weighing] = await testDb.select().from(schema.weighings);
    expect(weighing.containerId).toBeNull();
  });
});

describe("aliments : ingrédients", () => {
  it("crée un ingrédient et retourne son id", async () => {
    const id = await repo.createIngredient({ name: "Pomme", carbsPer100g: 12 });
    expect(typeof id).toBe("number");

    const [row] = await testDb.select().from(schema.foods).where(eq(schema.foods.id, id));
    expect(row.name).toBe("Pomme");
    expect(row.type).toBe("ingredient");
  });

  it("met à jour un ingrédient existant", async () => {
    const id = await repo.createIngredient({ name: "Pomme", carbsPer100g: 12 });
    await repo.updateIngredient(id, { name: "Pomme golden", carbsPer100g: 13 });

    const [row] = await testDb.select().from(schema.foods).where(eq(schema.foods.id, id));
    expect(row.name).toBe("Pomme golden");
    expect(row.carbsPer100g).toBe(13);
  });
});

describe("aliments : suppression et archivage", () => {
  it("supprime un ingrédient non utilisé dans une recette", async () => {
    const id = await repo.createIngredient({ name: "Pomme", carbsPer100g: 12 });
    await repo.deleteFood(id);

    const remaining = await testDb.select().from(schema.foods);
    expect(remaining).toHaveLength(0);
  });

  it("refuse de supprimer un ingrédient utilisé dans une recette (FOOD_IN_USE)", async () => {
    const ingredientId = await repo.createIngredient({ name: "Farine", carbsPer100g: 70 });
    await repo.saveRecipe(null, {
      name: "Gâteau",
      components: [{ componentFoodId: ingredientId, weightG: 200, carbsPer100gAtEntry: 70 }],
    });

    await expect(repo.deleteFood(ingredientId)).rejects.toThrow("FOOD_IN_USE");
  });

  it("la contrainte de clé étrangère de la base refuse aussi une suppression directe (ceinture et bretelles)", async () => {
    const ingredientId = await repo.createIngredient({ name: "Farine", carbsPer100g: 70 });
    await repo.saveRecipe(null, {
      name: "Gâteau",
      components: [{ componentFoodId: ingredientId, weightG: 200, carbsPer100gAtEntry: 70 }],
    });

    await expect(testDb.delete(schema.foods).where(eq(schema.foods.id, ingredientId))).rejects.toThrow();
  });

  it("archive un ingrédient au lieu de le supprimer", async () => {
    const id = await repo.createIngredient({ name: "Farine", carbsPer100g: 70 });
    await repo.archiveFood(id);

    const [row] = await testDb.select().from(schema.foods).where(eq(schema.foods.id, id));
    expect(row.isArchived).toBe(true);
  });

  it("isFoodUsedInRecipes détecte correctement l'usage", async () => {
    const ingredientId = await repo.createIngredient({ name: "Farine", carbsPer100g: 70 });
    expect(await repo.isFoodUsedInRecipes(ingredientId)).toBe(false);

    await repo.saveRecipe(null, {
      name: "Gâteau",
      components: [{ componentFoodId: ingredientId, weightG: 200, carbsPer100gAtEntry: 70 }],
    });
    expect(await repo.isFoodUsedInRecipes(ingredientId)).toBe(true);
  });
});

describe("recettes", () => {
  it("calcule le taux de glucides pour 100g à partir des composants", async () => {
    const flourId = await repo.createIngredient({ name: "Farine", carbsPer100g: 70 });
    const sugarId = await repo.createIngredient({ name: "Sucre", carbsPer100g: 100 });

    const recipeId = await repo.saveRecipe(null, {
      name: "Gâteau",
      components: [
        { componentFoodId: flourId, weightG: 200, carbsPer100gAtEntry: 70 },
        { componentFoodId: sugarId, weightG: 100, carbsPer100gAtEntry: 100 },
      ],
    });

    const [recipe] = await testDb.select().from(schema.foods).where(eq(schema.foods.id, recipeId as number));
    // 200g à 70g/100g = 140g + 100g à 100g/100g = 100g -> 240g de glucides pour 300g -> 80g/100g
    expect(recipe.totalWeightG).toBe(300);
    expect(recipe.totalCarbsG).toBe(240);
    expect(recipe.carbsPer100g).toBeCloseTo(80);
  });

  it("remplace entièrement les composants existants à chaque sauvegarde", async () => {
    const flourId = await repo.createIngredient({ name: "Farine", carbsPer100g: 70 });
    const sugarId = await repo.createIngredient({ name: "Sucre", carbsPer100g: 100 });

    const recipeId = await repo.saveRecipe(null, {
      name: "Gâteau",
      components: [{ componentFoodId: flourId, weightG: 200, carbsPer100gAtEntry: 70 }],
    });

    await repo.saveRecipe(recipeId, {
      name: "Gâteau",
      components: [{ componentFoodId: sugarId, weightG: 50, carbsPer100gAtEntry: 100 }],
    });

    const components = await testDb
      .select()
      .from(schema.recipeComponents)
      .where(eq(schema.recipeComponents.recipeFoodId, recipeId as number));
    expect(components).toHaveLength(1);
    expect(components[0].componentFoodId).toBe(sugarId);
  });
});

describe("ratios insuline/glucides", () => {
  it("crée, met à jour puis supprime un ratio", async () => {
    await repo.createRatio({ label: "Petit-déjeuner", carbsGramsPerUnit: 10 });
    const [created] = await testDb.select().from(schema.insulinRatios);

    await repo.updateRatio(created.id, { label: "Déjeuner", carbsGramsPerUnit: 12 });
    const [updated] = await testDb.select().from(schema.insulinRatios);
    expect(updated.label).toBe("Déjeuner");
    expect(updated.carbsGramsPerUnit).toBe(12);

    await repo.deleteRatio(created.id);
    expect(await testDb.select().from(schema.insulinRatios)).toHaveLength(0);
  });
});

describe("réglages", () => {
  it("crée la ligne de réglages si elle n'existe pas encore", async () => {
    await repo.updateSettings({
      glycemiaUnit: "mmol/L",
      targetGlycemia: 6,
      sensitivityFactor: 3,
      showInsulinDose: true,
    });

    const rows = await testDb.select().from(schema.settings);
    expect(rows).toHaveLength(1);
    expect(rows[0].targetGlycemia).toBe(6);
  });

  it("met à jour la ligne existante plutôt que d'en créer une seconde", async () => {
    await repo.updateSettings({
      glycemiaUnit: "mmol/L",
      targetGlycemia: 6,
      sensitivityFactor: 3,
      showInsulinDose: true,
    });
    await repo.updateSettings({
      glycemiaUnit: "g/L",
      targetGlycemia: 1.1,
      sensitivityFactor: 0.5,
      showInsulinDose: false,
    });

    const rows = await testDb.select().from(schema.settings);
    expect(rows).toHaveLength(1);
    expect(rows[0].glycemiaUnit).toBe("g/L");
    expect(rows[0].showInsulinDose).toBe(false);
  });
});

describe("pesées", () => {
  it("enregistre puis supprime une pesée", async () => {
    const foodId = await repo.createIngredient({ name: "Pomme", carbsPer100g: 12 });
    await repo.recordWeighing(buildWeighingInput({ foodId }));
    const [weighing] = await testDb.select().from(schema.weighings);
    expect(weighing.foodNameSnapshot).toBe("Pomme");

    await repo.deleteWeighing(weighing.id);
    expect(await testDb.select().from(schema.weighings)).toHaveLength(0);
  });
});

function buildWeighingInput(overrides: Partial<Parameters<Repository["recordWeighing"]>[0]> = {}) {
  return {
    foodId: 0,
    foodName: "Pomme",
    containerId: null,
    grossWeightG: 200,
    tareWeightG: 0,
    netWeightG: 200,
    carbsPer100g: 12,
    carbsG: 24,
    ratioId: null,
    ratioLabel: null,
    carbsGramsPerUnit: null,
    mealInsulinUnits: 0,
    glycemiaUnit: null,
    currentGlycemia: null,
    targetGlycemia: null,
    sensitivityFactor: null,
    correctionInsulinUnits: 0,
    totalInsulinUnits: 0,
    ...overrides,
  };
}
