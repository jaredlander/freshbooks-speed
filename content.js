// FreshBooks Speed Boost - Content Script
(function() {
  'use strict';

  const CONFIG = {
    pageSize: 50,
    checkInterval: 500,
    maxChecks: 100
  };

  let merchantCache = [];
  let currentPage = 0;
  let allMerchants = [];
  let isInitialized = false;
  let checkCount = 0;
  let isOptimizing = false;
  let lastOptimizedDropdown = null;

  // Track pagination UI for cleanup (WeakMap prevents memory leaks)
  const paginationCleanup = new WeakMap();

  // Track merchant input listeners for cleanup
  let merchantInputListeners = {
    click: null,
    focus: null,
    input: null
  };

  // Track mutation observer for lifecycle management
  let globalMutationObserver = null;

  /**
   * Clean up all references and listeners when dropdown closes
   */
  function cleanupDropdown() {
    // Clear DOM element array (CRITICAL FIX)
    allMerchants = [];

    // Clear dropdown reference (CRITICAL FIX)
    lastOptimizedDropdown = null;

    // Reset pagination state
    currentPage = 0;

    // Remove pagination UI if it exists (with event listener cleanup)
    const paginationUI = document.querySelector('.merchant-pagination-controls');
    if (paginationUI) {
      // Retrieve and call cleanup function from WeakMap
      const cleanup = paginationCleanup.get(paginationUI);
      if (cleanup) {
        cleanup(); // Removes event listeners
      }
      paginationUI.remove();
      paginationCleanup.delete(paginationUI);
    }

    console.log('[FreshBooks Speed Boost] Dropdown cleaned up');
  }

  /**
   * Initialize pagination for merchant dropdown
   */
  function initializePagination() {
    if (isInitialized) return;

    const merchantInput = document.querySelector(
      '[data-ebd-id="ember361582-trigger"], .ember-power-select-typeahead-input'
    );

    if (!merchantInput) {
      checkCount++;
      if (checkCount < CONFIG.maxChecks) {
        setTimeout(initializePagination, CONFIG.checkInterval);
      }
      return;
    }

    console.log('[FreshBooks Speed Boost] Initializing merchant dropdown optimization...');

    // Store listener references for cleanup
    merchantInputListeners.click = handleInputClick;
    merchantInputListeners.focus = handleInputFocus;
    merchantInputListeners.input = handleInputChange;

    // Intercept dropdown opening
    merchantInput.addEventListener('click', merchantInputListeners.click);
    merchantInput.addEventListener('focus', merchantInputListeners.focus);
    merchantInput.addEventListener('input', merchantInputListeners.input);

    isInitialized = true;
    console.log('[FreshBooks Speed Boost] Merchant dropdown initialized');
  }

  /**
   * Handle input click to optimize dropdown
   */
  function handleInputClick(e) {
    setTimeout(() => optimizeDropdown(), 100);
  }

  /**
   * Handle input focus to optimize dropdown
   */
  function handleInputFocus(e) {
    setTimeout(() => optimizeDropdown(), 100);
  }

  /**
   * Handle input change to reset pagination
   */
  function handleInputChange(e) {
    currentPage = 0;
    lastOptimizedDropdown = null; // Allow re-optimization after filtering
    setTimeout(() => optimizeDropdown(), 100);
  }

  /**
   * Check if user is actively filtering/searching in any dropdown
   */
  function isUserFiltering() {
    // Look for any Ember Power Select typeahead input that's currently active
    const activeInputs = document.querySelectorAll('.ember-power-select-typeahead-input');

    for (const input of activeInputs) {
      // Check if this input is visible and has text
      if (input.offsetParent !== null) {
        const inputValue = input.value || '';
        if (inputValue.trim().length > 0) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Main optimization function for the dropdown
   */
  function optimizeDropdown() {
    // Prevent infinite loops
    if (isOptimizing) return;

    const dropdown = document.querySelector(
      '[role="listbox"], .ember-power-select-dropdown'
    );

    if (!dropdown || !dropdown.offsetParent) return; // Hidden or doesn't exist

    const items = dropdown.querySelectorAll('[role="option"]');

    if (items.length === 0) return;

    // If user is filtering, don't paginate - show all filtered results
    if (isUserFiltering()) {
      console.log('[FreshBooks Speed Boost] User is filtering, skipping pagination');
      // Remove pagination controls if they exist (with cleanup)
      const existingPagination = document.querySelector('.merchant-pagination-controls');
      if (existingPagination) {
        const cleanup = paginationCleanup.get(existingPagination);
        if (cleanup) {
          cleanup();
        }
        existingPagination.remove();
        paginationCleanup.delete(existingPagination);
      }
      // Show all items
      items.forEach(item => {
        item.style.display = '';
        item.style.visibility = 'visible';
      });
      return;
    }

    // Check if this dropdown is already optimized
    if (dropdown === lastOptimizedDropdown && dropdown.querySelector('.merchant-pagination-controls')) {
      return;
    }

    isOptimizing = true;

    try {
      // Cache all merchants
      allMerchants = Array.from(items);
      console.log(`[FreshBooks Speed Boost] Found ${allMerchants.length} merchants`);

      // Hide excess items
      limitDisplayedItems();

      // Add pagination UI if needed
      if (allMerchants.length > CONFIG.pageSize) {
        addPaginationUI(dropdown);
      }

      lastOptimizedDropdown = dropdown;
    } finally {
      isOptimizing = false;
    }
  }

  /**
   * Limit displayed items to current page
   */
  function limitDisplayedItems() {
    const startIdx = currentPage * CONFIG.pageSize;
    const endIdx = startIdx + CONFIG.pageSize;

    allMerchants.forEach((item, idx) => {
      if (idx >= startIdx && idx < endIdx) {
        item.style.display = '';
        item.style.visibility = 'visible';
      } else {
        item.style.display = 'none';
        item.style.visibility = 'hidden';
      }
    });

    // Remove existing pagination UI (with proper cleanup)
    const existingPagination = document.querySelector('.merchant-pagination-controls');
    if (existingPagination) {
      // Call cleanup function before removal (HIGH PRIORITY FIX)
      const cleanup = paginationCleanup.get(existingPagination);
      if (cleanup) {
        cleanup();
      }
      existingPagination.remove();
      paginationCleanup.delete(existingPagination);
    }

    if (allMerchants.length > CONFIG.pageSize) {
      addPaginationUI(document.querySelector('[role="listbox"]'));
    }
  }

  /**
   * Add pagination controls to dropdown
   */
  function addPaginationUI(dropdownElement) {
    // Don't add if already exists
    if (document.querySelector('.merchant-pagination-controls')) return;

    const totalPages = Math.ceil(allMerchants.length / CONFIG.pageSize);
    const container = document.createElement('div');
    container.className = 'merchant-pagination-controls';
    container.style.cssText = `
      padding: 10px;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      background: #f9f9f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `;

    // Info text
    const infoSpan = document.createElement('span');
    infoSpan.textContent = `Page ${currentPage + 1} of ${totalPages} (${allMerchants.length} total)`;
    infoSpan.style.cssText = 'color: #666; flex: 1;';

    // Prev button (with data attribute for event delegation)
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = currentPage === 0;
    prevBtn.dataset.action = 'prev'; // For event delegation
    prevBtn.style.cssText = `
      padding: 6px 12px;
      margin-right: 5px;
      background: #0075dd;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      ${currentPage === 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}
    `;

    // Next button (with data attribute for event delegation)
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = currentPage === totalPages - 1;
    nextBtn.dataset.action = 'next'; // For event delegation
    nextBtn.style.cssText = `
      padding: 6px 12px;
      margin-left: 5px;
      background: #0075dd;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      ${currentPage === totalPages - 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''}
    `;

    container.appendChild(prevBtn);
    container.appendChild(infoSpan);
    container.appendChild(nextBtn);

    // EVENT DELEGATION: Single listener on container (CRITICAL FIX)
    const handlePaginationClick = (e) => {
      const button = e.target.closest('button');
      if (!button || button.disabled) return;

      const action = button.dataset.action;
      const totalPages = Math.ceil(allMerchants.length / CONFIG.pageSize);

      if (action === 'prev' && currentPage > 0) {
        currentPage--;
        limitDisplayedItems();
      } else if (action === 'next' && currentPage < totalPages - 1) {
        currentPage++;
        limitDisplayedItems();
      }
    };

    container.addEventListener('click', handlePaginationClick);

    // Store cleanup function in WeakMap (CRITICAL FIX)
    paginationCleanup.set(container, () => {
      container.removeEventListener('click', handlePaginationClick);
    });

    // Append to dropdown
    if (dropdownElement) {
      dropdownElement.appendChild(container);
    }
  }

  /**
   * Watch for dropdown changes and optimize when visible
   */
  function setupMutationObserver() {
    let debounceTimer = null;

    const observer = new MutationObserver((mutations) => {
      // Debounce to avoid excessive calls
      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        // Check if dropdown was added to DOM
        const dropdown = document.querySelector('[role="listbox"]');
        if (dropdown && dropdown.offsetParent !== null && !isOptimizing) {
          optimizeDropdown();
        } else if (!dropdown || !dropdown.offsetParent) {
          // Dropdown closed - CRITICAL FIX: call cleanup
          if (lastOptimizedDropdown !== null) {
            cleanupDropdown(); // Comprehensive cleanup
          }
        }
      }, 50);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });

    return observer; // Return for potential cleanup
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePagination);
  } else {
    initializePagination();
  }

  // Also set up mutation observer to catch dropdown creation
  globalMutationObserver = setupMutationObserver();

  console.log('[FreshBooks Speed Boost] Content script loaded');
})();
