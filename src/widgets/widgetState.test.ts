import { closeTestDb, createTestDb, mockDbClient, resetTestDb, type TestDb } from "@/db/testDb";
import * as schema from "@/db/schema";

type WidgetState = typeof import("./widgetState");

let testDb: TestDb;
let widgetState: WidgetState;

beforeAll(async () => {
  testDb = await createTestDb();
  mockDbClient("@/db/client", testDb);
  // require(), not import(): must run after mockDbClient, synchronously, so
  // this gets a fresh module instance built against the mocked db client
  // instead of the one already cached from the top-level import graph.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  widgetState = require("./widgetState");
});

afterAll(() => {
  closeTestDb(testDb);
});

beforeEach(async () => {
  await resetTestDb(testDb);
});

async function seedContainerAndFood(containerName: string, foodName: string) {
  const [container] = await testDb.insert(schema.containers).values({ name: containerName, tareWeightG: 100 }).returning();
  const [food] = await testDb.insert(schema.foods).values({ name: foodName, type: "ingredient", carbsPer100g: 10 }).returning();
  return { container, food };
}

async function weigh(containerId: number, foodId: number, weighedAt: string) {
  await testDb.insert(schema.weighings).values({
    containerId,
    foodId,
    foodNameSnapshot: "snapshot",
    grossWeightG: 200,
    tareWeightG: 100,
    netWeightG: 100,
    carbsPer100gSnapshot: 10,
    carbsG: 10,
    mealInsulinUnits: 0,
    correctionInsulinUnits: 0,
    totalInsulinUnits: 0,
    weighedAt,
  });
}

describe("getWidgetSelection", () => {
  it("ne sélectionne rien par défaut", async () => {
    expect(await widgetState.getWidgetSelection()).toEqual({
      containerId: null,
      containerName: null,
      foodId: null,
      foodName: null,
    });
  });

  it("résout le nom du récipient/aliment après un cycle", async () => {
    const { container, food } = await seedContainerAndFood("Bol", "Pomme");
    await weigh(container.id, food.id, "2026-01-01T00:00:00.000Z");

    await widgetState.cycleWidgetContainer();
    await widgetState.cycleWidgetFood();

    expect(await widgetState.getWidgetSelection()).toEqual({
      containerId: container.id,
      containerName: "Bol",
      foodId: food.id,
      foodName: "Pomme",
    });
  });
});

describe("cycleWidgetContainer / cycleWidgetFood", () => {
  it("ne fait rien si aucune pesée n'existe (reste sans sélection)", async () => {
    await widgetState.cycleWidgetContainer();
    expect((await widgetState.getWidgetSelection()).containerId).toBeNull();
  });

  it("passe au récipient récent suivant à chaque tap, puis reboucle", async () => {
    const a = await seedContainerAndFood("Bol", "Pomme");
    const b = await seedContainerAndFood("Assiette", "Riz");
    // Assiette est la pesée la plus récente : premier tap doit la sélectionner en premier.
    await weigh(a.container.id, a.food.id, "2026-01-01T00:00:00.000Z");
    await weigh(b.container.id, b.food.id, "2026-01-02T00:00:00.000Z");

    await widgetState.cycleWidgetContainer();
    expect((await widgetState.getWidgetSelection()).containerId).toBe(b.container.id);

    await widgetState.cycleWidgetContainer();
    expect((await widgetState.getWidgetSelection()).containerId).toBe(a.container.id);

    await widgetState.cycleWidgetContainer();
    expect((await widgetState.getWidgetSelection()).containerId).toBe(b.container.id);
  });
});
