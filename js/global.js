(function () {
  const storageKeys = {
    shopping: "pantry-shopping-list",
    pantry: "pantry-fridge-items",
    recipes: "pantry-recipes",
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

  function readStorage(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
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
    readStorage,
    writeStorage,
    readSession,
    writeSession,
    makeId,
  };
})();
