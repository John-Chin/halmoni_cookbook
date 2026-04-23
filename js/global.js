(function () {
  const storageKeys = {
    activeRecipe: "pantry-active-recipe",
  };

  const defaultShopping = [
    { id: "shop-milk", text: "Milk", checked: false },
    { id: "shop-scallions", text: "Scallions", checked: false },
    { id: "shop-ginger", text: "Fresh ginger", checked: true },
  ];

  const defaultPantry = {
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
  };

  const recipes = [
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
  ];

  function cloneState() {
    return {
      shopping: JSON.parse(JSON.stringify(defaultShopping)),
      pantry: JSON.parse(JSON.stringify(defaultPantry)),
      recipes: JSON.parse(JSON.stringify(recipes)),
    };
  }

  const sharedStore = {
    state: cloneState(),
    initialized: false,
    saveTimer: null,
    pendingSave: Promise.resolve(),
  };

  function getState() {
    return JSON.parse(JSON.stringify(sharedStore.state));
  }

  async function loadSharedState() {
    const response = await window.fetch("/api/shared-state", {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Unable to load shared state");
    }

    const payload = await response.json();
    sharedStore.state = payload.state || cloneState();
    sharedStore.initialized = true;
    return getState();
  }

  async function saveSharedState() {
    const snapshot = getState();
    const response = await window.fetch("/api/shared-state", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ state: snapshot }),
    });

    if (!response.ok) {
      throw new Error("Unable to save shared state");
    }

    const payload = await response.json();
    sharedStore.state = payload.state || snapshot;
    return getState();
  }

  function scheduleSharedSave() {
    window.clearTimeout(sharedStore.saveTimer);
    sharedStore.saveTimer = window.setTimeout(function () {
      sharedStore.pendingSave = saveSharedState().catch(function (error) {
        console.error(error);
      });
    }, 250);
    return sharedStore.pendingSave;
  }

  function updateSharedState(updater) {
    const nextState = updater(getState());
    if (nextState) {
      sharedStore.state = nextState;
    }

    return scheduleSharedSave();
  }

  function readSession(key, fallback) {
    try {
      const value = window.sessionStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeSession(key, value) {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  }

  function makeId(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  window.PantryApp = {
    storageKeys,
    defaultShopping,
    defaultPantry,
    recipes,
    readSession,
    writeSession,
    makeId,
    getSharedState: getState,
    loadSharedState,
    saveSharedState,
    updateSharedState,
  };
})();
