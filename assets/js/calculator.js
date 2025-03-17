const CheckboxCalculator = (() => {
  const defaults = {
    checkboxContainer: ".query__input.checkbox", // Add .checkbox class
    priceElement: ".total__price .price", // Match your HTML
    currency: "$", // Default to dollar symbol
    debug: false,
    basePrice: 0,
  };

  function init(config = {}) {
    const options = { ...defaults, ...config };

    // Debugging logs
    if (options.debug) {
      console.log("Initializing CheckboxCalculator with:", options);
      console.log(
        "Looking for checkboxes:",
        `${options.checkboxContainer} input[type="checkbox"]`
      );
      console.log("Looking for total element:", options.priceElement);
    }

    const checkboxes = document.querySelectorAll(
      `${options.checkboxContainer} input[type="checkbox"]`
    );
    const totalPriceElement = document.querySelector(options.priceElement);

    // Enhanced error handling
    if (!checkboxes.length) {
      if (options.debug) console.error("No checkboxes found");
      return;
    }
    if (!totalPriceElement) {
      if (options.debug) console.error("Total element not found");
      return;
    }

    const getPrice = (checkbox) => {
      const parent = checkbox.closest(options.checkboxContainer);
      const priceText = parent?.querySelector("span")?.textContent.trim() || "";

      if (options.debug) console.log("Processing price text:", priceText);

      if (priceText.toLowerCase() === "free") return 0;

      // Fixed regex pattern
      const pricePattern = new RegExp(`\\${options.currency}(\\d+(\\.\\d+)?)`);
      const priceMatch = priceText.match(pricePattern);

      if (options.debug) console.log("Price match result:", priceMatch);

      return priceMatch ? parseFloat(priceMatch[1]) : 0;
    };

    const updateTotal = () => {
      let dynamicTotal = options.basePrice;
      checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
          const price = getPrice(checkbox);
          if (options.debug) console.log("Adding price:", price);
          dynamicTotal += price;
        }
      });
      totalPriceElement.textContent = `${
        options.currency
      }${dynamicTotal.toFixed(2)}`;
      if (options.debug) console.log("New total:", dynamicTotal);
    };

    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", updateTotal);
    });

    updateTotal();
  }

  return { init };
})();
