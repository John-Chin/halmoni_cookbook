import { getStore } from "@netlify/blobs";

const STORE_NAME = "halmoni-cookbook";
const STATE_KEY = "shared-state";

const defaultState = {
  shopping: [
    { id: "shop-milk", text: "Milk", checked: false },
    { id: "shop-scallions", text: "Scallions", checked: false },
    { id: "shop-ginger", text: "Fresh ginger", checked: true },
  ],
  pantry: {
    fridge: [
      { id: "fridge-yogurt", text: "Greek yogurt" },
      { id: "fridge-eggs", text: "Eggs" },
      { id: "fridge-spinach", text: "Baby spinach" },
    ],
    freezer: [
      { id: "freezer-dumplings", text: "Soup dumplings" },
      { id: "freezer-berries", text: "Frozen berries" },
      { id: "freezer-broth", text: "Chicken broth cubes" },
    ],
  },
  recipes: [
    {
      id: "pasta-primavera",
      title: "Pasta Primavera",
      body:
        "Ingredients:\n1 pound pasta\n2 cups mixed vegetables\n3 garlic cloves\nOlive oil, lemon, parmesan, salt, pepper\n\nInstructions:\nBoil the pasta until springy and tender.\nSaute the vegetables with olive oil and garlic until bright and just soft.\nToss everything together with lemon juice, parmesan, salt, and pepper.\nFinish with extra cheese and a shower of cracked black pepper.",
    },
    {
      id: "chocolate-chip-cookies",
      title: "Chocolate Chip Cookies",
      body:
        "Ingredients:\n2 1/4 cups flour\n1 teaspoon baking soda\n1 cup butter\n3/4 cup brown sugar\n3/4 cup sugar\n2 eggs\n2 cups chocolate chips\n\nInstructions:\nCream butter and sugars until fluffy.\nBeat in eggs, then fold in the dry ingredients and chocolate chips.\nScoop onto a tray and bake at 375F until the edges are golden and the center stays soft.\nCool just enough to keep the chips molten.",
    },
    {
      id: "caesar-salad",
      title: "Caesar Salad",
      body:
        "Ingredients:\n1 head romaine\n1/3 cup grated parmesan\nCroutons\n1 garlic clove\n1 lemon\n2 tablespoons mayo or egg yolk\nAnchovy paste, olive oil, salt, pepper\n\nInstructions:\nWhisk the dressing until creamy, sharp, and savory.\nTear the romaine into crisp ribbons.\nToss the lettuce with dressing, parmesan, and croutons.\nFinish with more pepper and lemon right before serving.",
    },
    {
      id: "tomato-soup",
      title: "Tomato Soup",
      body:
        "Ingredients:\n1 onion\n3 garlic cloves\n1 tablespoon tomato paste\n1 can crushed tomatoes\n2 cups broth\nSplash of cream\n\nInstructions:\nCook onion and garlic until soft and sweet.\nStir in tomato paste, then add tomatoes and broth.\nSimmer for 20 minutes and blend until silky.\nAdd a splash of cream, taste for seasoning, and serve with toast.",
    },
    {
      id: "stir-fry",
      title: "Stir Fry",
      body:
        "Ingredients:\nProtein of choice\n4 cups chopped vegetables\n2 tablespoons soy sauce\n1 tablespoon sesame oil\n1 tablespoon honey\nGarlic and ginger\n\nInstructions:\nWhisk the sauce together first so it is ready.\nSear the protein in a hot pan, then set aside.\nCook the vegetables quickly so they stay colorful.\nReturn everything to the pan, toss with sauce, and serve over rice or noodles.",
    },
  ],
};

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function normalizeItem(item, prefix) {
  return {
    id: typeof item?.id === "string" && item.id ? item.id : `${prefix}-${Date.now().toString(36)}`,
    text: typeof item?.text === "string" ? item.text : "",
    checked: Boolean(item?.checked),
  };
}

function normalizeRecipe(recipe, index) {
  return {
    id: typeof recipe?.id === "string" && recipe.id ? recipe.id : `recipe-${index + 1}`,
    title: typeof recipe?.title === "string" && recipe.title.trim() ? recipe.title.trim() : `Recipe ${index + 1}`,
    body: typeof recipe?.body === "string" ? recipe.body : "",
  };
}

function normalizeState(input) {
  const safeState = cloneDefaultState();

  if (!input || typeof input !== "object") {
    return safeState;
  }

  if (Array.isArray(input.shopping)) {
    safeState.shopping = input.shopping.map(function (item, index) {
      return normalizeItem(item, `shopping-${index + 1}`);
    });
  }

  if (input.pantry && typeof input.pantry === "object") {
    if (Array.isArray(input.pantry.fridge)) {
      safeState.pantry.fridge = input.pantry.fridge.map(function (item, index) {
        return {
          id:
            typeof item?.id === "string" && item.id
              ? item.id
              : `fridge-${index + 1}`,
          text: typeof item?.text === "string" ? item.text : "",
        };
      });
    }

    if (Array.isArray(input.pantry.freezer)) {
      safeState.pantry.freezer = input.pantry.freezer.map(function (item, index) {
        return {
          id:
            typeof item?.id === "string" && item.id
              ? item.id
              : `freezer-${index + 1}`,
          text: typeof item?.text === "string" ? item.text : "",
        };
      });
    }
  }

  if (Array.isArray(input.recipes)) {
    safeState.recipes = input.recipes.map(normalizeRecipe);
  }

  return safeState;
}

async function readSharedState() {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  const existingState = await store.get(STATE_KEY, { type: "json" });

  if (!existingState) {
    const seededState = cloneDefaultState();
    await store.setJSON(STATE_KEY, seededState);
    return seededState;
  }

  return normalizeState(existingState);
}

export default async function handler(request) {
  if (request.method === "GET") {
    const state = await readSharedState();
    return Response.json({ state });
  }

  if (request.method === "PUT") {
    const payload = await request.json();
    const nextState = normalizeState(payload?.state);
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    await store.setJSON(STATE_KEY, nextState);
    return Response.json({ state: nextState });
  }

  return new Response("Method not allowed", {
    status: 405,
    headers: {
      Allow: "GET, PUT",
    },
  });
}

export const config = {
  path: "/api/shared-state",
  method: ["GET", "PUT"],
};
