document.addEventListener("DOMContentLoaded", function () {
  const { storageKeys, recipes, readSession, writeSession, makeId, getSharedState, loadSharedState, updateSharedState } =
    window.PantryApp;
  const toc = document.querySelector("#recipe-toc");
  const title = document.querySelector("#recipe-title");
  const body = document.querySelector("#recipe-body");
  const notebookLines = document.querySelector("#notebook-lines");
  const addRecipeButton = document.querySelector("#add-recipe-button");

  let storedRecipes = recipes;
  let activeRecipeId = readSession(storageKeys.activeRecipe, storedRecipes[0] ? storedRecipes[0].id : null);
  let editingRecipeId = null;

  function syncRecipes() {
    storedRecipes = getSharedState().recipes;
  }

  function buildNotebookLines() {
    const minHeight = 700;
    const spacing = 28;
    const count = Math.ceil(minHeight / spacing);
    notebookLines.innerHTML = "";

    for (let index = 0; index <= count; index += 1) {
      const line = document.createElement("span");
      line.className = "notebook-line";
      line.style.top = 40 + spacing * index + "px";
      notebookLines.appendChild(line);
    }
  }

  function playRefreshAnimation() {
    title.parentElement.classList.remove("is-refreshing");
    body.classList.remove("is-refreshing");
    void title.offsetWidth;
    title.parentElement.classList.add("is-refreshing");
    body.classList.add("is-refreshing");
  }

  function updateRecipe(recipeId, updates) {
    storedRecipes = storedRecipes.map(function (recipe) {
      if (recipe.id === recipeId) {
        return Object.assign({}, recipe, updates);
      }
      return recipe;
    });

    updateSharedState(function (state) {
      state.recipes = storedRecipes;
      return state;
    });
  }

  function renderRecipe(recipeId) {
    const recipe = storedRecipes.find(function (entry) {
      return entry.id === recipeId;
    }) || storedRecipes[0];

    if (!recipe) {
      activeRecipeId = null;
      writeSession(storageKeys.activeRecipe, null);
      title.textContent = "No recipes yet";
      body.innerHTML = "";
      editingRecipeId = null;
      const paragraph = document.createElement("p");
      paragraph.className = "empty-recipe-message";
      paragraph.textContent = "Add a recipe from the sidebar to start filling your cookbook.";
      body.appendChild(paragraph);
      playRefreshAnimation();
      return;
    }

    activeRecipeId = recipe.id;
    writeSession(storageKeys.activeRecipe, activeRecipeId);

    title.textContent = recipe.title;
    body.innerHTML = "";
    editingRecipeId = null;

    recipe.body.split("\n").forEach(function (line) {
      const paragraph = document.createElement("p");
      paragraph.textContent = line || " ";
      body.appendChild(paragraph);
    });

    toc.querySelectorAll(".recipe-link").forEach(function (button) {
      button.classList.toggle("active", button.dataset.recipeId === recipe.id);
      button.setAttribute("aria-current", button.dataset.recipeId === recipe.id ? "true" : "false");
    });

    playRefreshAnimation();
  }

  function saveRecipeBody(recipeId, nextBody) {
    updateRecipe(recipeId, { body: nextBody });
    editingRecipeId = null;
    renderRecipe(recipeId);
  }

  function getEditorText(editor) {
    return editor.innerText.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n");
  }

  function placeCaretFromPoint(editor, clientX, clientY) {
    const selection = window.getSelection();
    if (!selection) {
      return false;
    }

    let range = null;

    if (document.caretPositionFromPoint) {
      const position = document.caretPositionFromPoint(clientX, clientY);
      if (position) {
        range = document.createRange();
        range.setStart(position.offsetNode, position.offset);
        range.collapse(true);
      }
    } else if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(clientX, clientY);
    }

    if (!range) {
      return false;
    }

    if (!editor.contains(range.startContainer) && range.startContainer !== editor) {
      return false;
    }

    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }

  function moveCaretToEnd(editor) {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }

    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function openBodyEditor(recipeId, clientX, clientY) {
    const recipe = storedRecipes.find(function (entry) {
      return entry.id === recipeId;
    });

    if (!recipe || editingRecipeId === recipeId) {
      return;
    }

    editingRecipeId = recipeId;
    body.innerHTML = "";

    const editor = document.createElement("div");
    editor.className = "recipe-body-editor";
    editor.contentEditable = "true";
    editor.setAttribute("role", "textbox");
    editor.setAttribute("aria-label", "Edit recipe instructions");
    editor.setAttribute("aria-multiline", "true");
    editor.textContent = recipe.body;

    function commitBodyEdit() {
      saveRecipeBody(recipeId, getEditorText(editor));
    }

    editor.addEventListener("blur", commitBodyEdit);
    editor.addEventListener("keydown", function (event) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        commitBodyEdit();
      }

      if (event.key === "Escape") {
        editingRecipeId = null;
        renderRecipe(recipeId);
      }
    });

    body.appendChild(editor);
    editor.focus();

    if (!placeCaretFromPoint(editor, clientX, clientY)) {
      moveCaretToEnd(editor);
    }
  }

  function renameRecipe(recipeId, nextTitle) {
    const cleanedTitle = nextTitle.trim();
    if (!cleanedTitle) {
      return;
    }

    storedRecipes = storedRecipes.map(function (recipe) {
      if (recipe.id === recipeId) {
        return Object.assign({}, recipe, { title: cleanedTitle });
      }
      return recipe;
    });

    updateSharedState(function (state) {
      state.recipes = storedRecipes;
      return state;
    });
    renderToc();

    if (activeRecipeId === recipeId) {
      renderRecipe(recipeId);
    }
  }

  function renderRenameInput(recipe, entry) {
    const existingButton = entry.querySelector(".recipe-link");
    const input = document.createElement("input");
    input.type = "text";
    input.className = "recipe-rename-input";
    input.value = recipe.title;
    input.setAttribute("aria-label", "Rename " + recipe.title);

    function commitRename() {
      renameRecipe(recipe.id, input.value || recipe.title);
    }

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        commitRename();
      }

      if (event.key === "Escape") {
        renderToc();
        renderRecipe(activeRecipeId);
      }
    });

    input.addEventListener("blur", commitRename);

    if (existingButton) {
      entry.replaceChild(input, existingButton);
      input.focus();
      input.select();
    }
  }

  function renderToc() {
    toc.innerHTML = "";

    if (!storedRecipes.length) {
      const emptyState = document.createElement("p");
      emptyState.className = "empty-recipes";
      emptyState.textContent = "No recipes yet.";
      toc.appendChild(emptyState);
      return;
    }

    storedRecipes.forEach(function (recipe) {
      const entry = document.createElement("div");
      entry.className = "recipe-entry";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "recipe-link";
      button.dataset.recipeId = recipe.id;
      button.textContent = recipe.title;
      button.addEventListener("click", function () {
        renderRecipe(recipe.id);
      });
      button.addEventListener("dblclick", function () {
        renderRenameInput(recipe, entry);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "recipe-delete";
      deleteButton.textContent = "×";
      deleteButton.setAttribute("aria-label", "Delete " + recipe.title);
      deleteButton.addEventListener("click", function () {
        const recipeIndex = storedRecipes.findIndex(function (entryItem) {
          return entryItem.id === recipe.id;
        });

        storedRecipes = storedRecipes.filter(function (entryItem) {
          return entryItem.id !== recipe.id;
        });
        updateSharedState(function (state) {
          state.recipes = storedRecipes;
          return state;
        });

        if (!storedRecipes.length) {
          activeRecipeId = null;
        } else if (activeRecipeId === recipe.id) {
          const nextRecipe = storedRecipes[Math.max(0, recipeIndex - 1)] || storedRecipes[0];
          activeRecipeId = nextRecipe.id;
        }

        renderToc();
        renderRecipe(activeRecipeId);
      });

      entry.append(button, deleteButton);
      toc.appendChild(entry);
    });
  }

  addRecipeButton.addEventListener("click", function () {
    const recipeCount = storedRecipes.length + 1;
    const newRecipe = {
      id: makeId("recipe"),
      title: "New Recipe " + recipeCount,
      body: "Ingredients:\n\nInstructions:\n",
    };

    storedRecipes = storedRecipes.concat(newRecipe);
    activeRecipeId = newRecipe.id;
    updateSharedState(function (state) {
      state.recipes = storedRecipes;
      return state;
    });
    renderToc();
    renderRecipe(activeRecipeId);
  });

  body.addEventListener("dblclick", function (event) {
    if (!activeRecipeId) {
      return;
    }

    openBodyEditor(activeRecipeId, event.clientX, event.clientY);
  });

  async function initializePage() {
    try {
      await loadSharedState();
    } catch (error) {
      console.error(error);
    }

    syncRecipes();
    if (!activeRecipeId && storedRecipes[0]) {
      activeRecipeId = storedRecipes[0].id;
    }

    buildNotebookLines();
    renderToc();
    renderRecipe(activeRecipeId);
  }

  initializePage();
  window.addEventListener("resize", buildNotebookLines);
});
