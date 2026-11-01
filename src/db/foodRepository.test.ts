import { eq } from "drizzle-orm";

import * as schema from "./schema";
import { closeTestDb, createTestDb, mockDbClient, resetTestDb, type TestDb } from "./testDb";

jest.mock("@/lib/photos", () => ({ deletePhoto: jest.fn() }));

type FoodRepository = typeof import("./foodRepository");

let testDb: TestDb;
let repo: FoodRepository;
let deletePhotoMock: jest.Mock;

beforeAll(async () => {
  testDb = await createTestDb();
  mockDbClient("./client", testDb);
  /* eslint-disable @typescript-eslint/no-require-imports */
  repo = require("./foodRepository");
  deletePhotoMock = require("@/lib/photos").deletePhoto;
  /* eslint-enable @typescript-eslint/no-require-imports */
});

afterAll(() => {
  closeTestDb(testDb);
});

beforeEach(async () => {
  await resetTestDb(testDb);
  deletePhotoMock.mockClear();
});

const foodNamed = async (name: string) =>
  (await testDb.select().from(schema.foods).where(eq(schema.foods.name, name)))[0];

describe("recettes : ingrédients ajoutés depuis la recette", () => {
  it("crée l'ingrédient Ciqual dans la liste et l'ingrédient manuel archivé", async () => {
    const recipeId = await repo.saveRecipe(null, {
      name: "Quiche",
      components: [
        { newIngredient: { name: "Poireau", source: "Ciqual", recipeOnly: false }, weightG: 300, carbsPer100gAtEntry: 4 },
        { newIngredient: { name: "Légumes", recipeOnly: true }, weightG: 100, carbsPer100gAtEntry: 6 },
      ],
    });

    const leek = await foodNamed("Poireau");
    const vegetables = await foodNamed("Légumes");
    expect(leek).toMatchObject({ type: "ingredient", carbsPer100g: 4, source: "Ciqual", isArchived: false });
    expect(vegetables).toMatchObject({ type: "ingredient", carbsPer100g: 6, isArchived: true });

    const components = await testDb
      .select()
      .from(schema.recipeComponents)
      .where(eq(schema.recipeComponents.recipeFoodId, recipeId as number))
      .orderBy(schema.recipeComponents.position);
    expect(components.map((c) => c.componentFoodId)).toEqual([leek.id, vegetables.id]);
    expect(components[1].carbsG).toBeCloseTo(6);
  });

  it("supprime l'ingrédient archivé que la recette n'utilise plus", async () => {
    const flourId = await repo.createIngredient({ name: "Farine", carbsPer100g: 70 });
    const recipeId = await repo.saveRecipe(null, {
      name: "Quiche",
      components: [{ newIngredient: { name: "Légumes", recipeOnly: true }, weightG: 100, carbsPer100gAtEntry: 6 }],
    });

    await repo.saveRecipe(recipeId, {
      name: "Quiche",
      components: [{ componentFoodId: flourId, weightG: 100, carbsPer100gAtEntry: 70 }],
    });

    expect(await foodNamed("Légumes")).toBeUndefined();
    expect(await foodNamed("Farine")).toBeDefined();
  });

  it("garde l'ingrédient archivé encore utilisé par une autre recette", async () => {
    const recipeId = await repo.saveRecipe(null, {
      name: "Quiche",
      components: [{ newIngredient: { name: "Légumes", recipeOnly: true }, weightG: 100, carbsPer100gAtEntry: 6 }],
    });
    const vegetablesId = (await foodNamed("Légumes")).id;
    await repo.saveRecipe(null, {
      name: "Tarte",
      components: [{ componentFoodId: vegetablesId, weightG: 50, carbsPer100gAtEntry: 6 }],
    });

    await repo.deleteFood(recipeId as number, null);

    expect(await foodNamed("Légumes")).toBeDefined();
  });

  it("supprime avec la recette ses ingrédients archivés et leurs photos", async () => {
    const recipeId = await repo.saveRecipe(null, {
      name: "Quiche",
      components: [{ newIngredient: { name: "Légumes", recipeOnly: true }, weightG: 100, carbsPer100gAtEntry: 6 }],
    });
    await testDb.update(schema.foods).set({ photoUri: "file:///legumes.jpg" }).where(eq(schema.foods.name, "Légumes"));

    await repo.deleteFood(recipeId as number, null);

    expect(await testDb.select().from(schema.foods)).toHaveLength(0);
    expect(deletePhotoMock).toHaveBeenCalledWith("file:///legumes.jpg");
  });
});

describe("recettes : poids du plat cuit", () => {
  it("rapporte les glucides au poids cuit", async () => {
    const flourId = await repo.createIngredient({ name: "Farine", carbsPer100g: 70 });
    const recipeId = await repo.saveRecipe(null, {
      name: "Gâteau",
      cookedWeightG: 140,
      components: [{ componentFoodId: flourId, weightG: 200, carbsPer100gAtEntry: 70 }],
    });

    const [recipe] = await testDb.select().from(schema.foods).where(eq(schema.foods.id, recipeId as number));
    expect(recipe.totalWeightG).toBe(140);
    expect(recipe.totalCarbsG).toBe(140);
    expect(recipe.carbsPer100g).toBeCloseTo(100);
  });

  it("refuse un poids cuit invraisemblable", async () => {
    const flourId = await repo.createIngredient({ name: "Farine", carbsPer100g: 70 });

    await expect(
      repo.saveRecipe(null, {
        name: "Gâteau",
        cookedWeightG: 14,
        components: [{ componentFoodId: flourId, weightG: 200, carbsPer100gAtEntry: 70 }],
      })
    ).rejects.toThrow("COOKED_WEIGHT_IMPLAUSIBLE");
  });
});
