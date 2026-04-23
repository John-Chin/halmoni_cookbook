document.addEventListener("DOMContentLoaded", function () {
  const { makeId, getSharedState, loadSharedState, updateSharedState } = window.PantryApp;

  const shoppingForm = document.querySelector("#shopping-form");
  const shoppingInput = document.querySelector("#shopping-input");
  const shoppingList = document.querySelector("#shopping-list");
  const fridgeTrigger = document.querySelector("#fridge-trigger");
  const modal = document.querySelector("#fridge-modal");
  const modalClose = document.querySelector("#modal-close");
  const fridgeList = document.querySelector("#fridge-items");
  const freezerList = document.querySelector("#freezer-items");
  const pantryForms = document.querySelectorAll(".pantry-add-form");

  let shoppingItems = [];
  let pantryItems = { fridge: [], freezer: [] };

  function syncLocalState() {
    const state = getSharedState();
    shoppingItems = state.shopping;
    pantryItems = state.pantry;
  }

  function renderShopping() {
    shoppingList.innerHTML = "";

    shoppingItems.forEach(function (item) {
      const row = document.createElement("li");
      row.className = "editable-row" + (item.checked ? " checked" : "");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "check-input";
      checkbox.checked = item.checked;
      checkbox.setAttribute("aria-label", "Mark " + item.text + " as complete");
      checkbox.addEventListener("change", function () {
        item.checked = checkbox.checked;
        updateSharedState(function (state) {
          state.shopping = shoppingItems;
          return state;
        });
        renderShopping();
      });

      const input = document.createElement("input");
      input.type = "text";
      input.className = "mini-input";
      input.value = item.text;
      input.setAttribute("aria-label", "Shopping item");
      input.addEventListener("input", function () {
        item.text = input.value;
        updateSharedState(function (state) {
          state.shopping = shoppingItems;
          return state;
        });
      });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "mini-button";
      removeButton.textContent = "×";
      removeButton.setAttribute("aria-label", "Remove " + item.text);
      removeButton.addEventListener("click", function () {
        shoppingItems = shoppingItems.filter(function (entry) {
          return entry.id !== item.id;
        });
        updateSharedState(function (state) {
          state.shopping = shoppingItems;
          return state;
        });
        renderShopping();
      });

      row.append(checkbox, input, removeButton);
      shoppingList.appendChild(row);
    });
  }

  function renderPantrySection(sectionName, target) {
    target.innerHTML = "";

    pantryItems[sectionName].forEach(function (item) {
      const row = document.createElement("li");
      row.className = "editable-row";

      const spacer = document.createElement("span");
      spacer.setAttribute("aria-hidden", "true");

      const input = document.createElement("input");
      input.type = "text";
      input.className = "mini-input";
      input.value = item.text;
      input.setAttribute("aria-label", sectionName + " item");
      input.addEventListener("input", function () {
        item.text = input.value;
        updateSharedState(function (state) {
          state.pantry = pantryItems;
          return state;
        });
      });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "mini-button";
      removeButton.textContent = "×";
      removeButton.setAttribute("aria-label", "Remove " + item.text);
      removeButton.addEventListener("click", function () {
        pantryItems[sectionName] = pantryItems[sectionName].filter(function (entry) {
          return entry.id !== item.id;
        });
        updateSharedState(function (state) {
          state.pantry = pantryItems;
          return state;
        });
        renderPantry();
      });

      row.append(spacer, input, removeButton);
      target.appendChild(row);
    });
  }

  function renderPantry() {
    renderPantrySection("fridge", fridgeList);
    renderPantrySection("freezer", freezerList);
  }

  shoppingForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const value = shoppingInput.value.trim();
    if (!value) {
      return;
    }

    shoppingItems = shoppingItems.concat({
      id: makeId("shop"),
      text: value,
      checked: false,
    });
    updateSharedState(function (state) {
      state.shopping = shoppingItems;
      return state;
    });
    renderShopping();
    shoppingForm.reset();
    shoppingInput.focus();
  });

  pantryForms.forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const sectionName = form.getAttribute("data-section");
      const input = form.querySelector("input");
      const value = input.value.trim();

      if (!value || !sectionName) {
        return;
      }

      pantryItems[sectionName] = pantryItems[sectionName].concat({
        id: makeId(sectionName),
        text: value,
      });
      updateSharedState(function (state) {
        state.pantry = pantryItems;
        return state;
      });
      renderPantry();
      form.reset();
      input.focus();
    });
  });

  function openModal() {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  fridgeTrigger.addEventListener("click", openModal);
  modalClose.addEventListener("click", closeModal);

  modal.addEventListener("click", function (event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  async function initializePage() {
    try {
      await loadSharedState();
    } catch (error) {
      console.error(error);
    }

    syncLocalState();
    renderShopping();
    renderPantry();
  }

  initializePage();
});
