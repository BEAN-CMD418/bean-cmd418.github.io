(() => {
  // A single underline glides between the primary navigation links.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = document.querySelector(".main-nav");
  let navIndicator = null;

  if (nav) {
    const navLinks = Array.from(nav.querySelectorAll("a[href]"));
    const activeLink = navLinks.find((link) => link.getAttribute("aria-current") === "page");
    navIndicator = document.createElement("span");
    navIndicator.className = "main-nav-indicator";
    navIndicator.setAttribute("aria-hidden", "true");
    nav.appendChild(navIndicator);

    const moveIndicator = (link, moving = false) => {
      if (!link) return;
      navIndicator.style.setProperty("--nav-indicator-x", link.offsetLeft + "px");
      navIndicator.style.setProperty("--nav-indicator-width", link.offsetWidth + "px");
      navIndicator.classList.toggle("is-moving", moving);
    };

    moveIndicator(activeLink);
    window.addEventListener("resize", () => {
      const current = navLinks.find((link) =>
        link.getAttribute("aria-current") === "page"
      );
      if (!navIndicator.classList.contains("is-moving")) moveIndicator(current);
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (!reduceMotion) moveIndicator(link, true);
      });
    });
  }

  // Briefly fade the current page before same-site navigation.
  let navigating = false;

  if (!reduceMotion) {
    document.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const clicked = event.target instanceof Element ? event.target : event.target.parentElement;
      const link = clicked && clicked.closest("a[href]");
      if (!link || link.hasAttribute("download") ||
          (link.target && link.target !== "_self")) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname &&
          destination.search === window.location.search &&
          destination.hash === window.location.hash) return;
      if (navigating) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      navigating = true;
      const isPrimaryNav = link.closest(".main-nav");
      if (isPrimaryNav) {
        if (navIndicator) {
          const navLinks = Array.from(nav.querySelectorAll("a[href]"));
          navLinks.forEach((item) => item.removeAttribute("aria-current"));
          link.setAttribute("aria-current", "page");
          navIndicator.classList.add("is-moving");
          navIndicator.style.setProperty("--nav-indicator-x", link.offsetLeft + "px");
          navIndicator.style.setProperty("--nav-indicator-width", link.offsetWidth + "px");
        }
        window.setTimeout(() => document.body.classList.add("is-leaving"), 300);
        window.setTimeout(() => window.location.assign(destination.href), 470);
      } else {
        document.body.classList.add("is-leaving");
        window.setTimeout(() => window.location.assign(destination.href), 145);
      }
    });
  }

  const input = document.getElementById("post-search");
  const list = document.getElementById("post-list");
  const status = document.getElementById("search-status");
  const empty = document.getElementById("no-results");
  const tagButtons = document.querySelectorAll("[data-tag]");
  if (!input) return;

  // On an individual post page, send search/tag requests to the homepage.
  if (!list) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && input.value.trim()) {
        window.location.href = "/?q=" + encodeURIComponent(input.value.trim());
      }
    });
    tagButtons.forEach((button) => {
      button.addEventListener("click", () => {
        window.location.href = "/?tag=" + encodeURIComponent(button.dataset.tag || "");
      });
    });
    return;
  }

  const rows = Array.from(list.querySelectorAll("[data-post-row]"));
  const params = new URLSearchParams(window.location.search);
  let activeTag = params.get("tag") || "";
  input.value = params.get("q") || (activeTag ? "#" + activeTag : "");

  function filterPosts() {
    const query = input.value.trim().toLocaleLowerCase();
    const filtering = Boolean(query || activeTag);
    let visible = 0;

    rows.forEach((row) => {
      const tags = (row.dataset.tags || "").split("||").map((tag) => tag.trim().toLocaleLowerCase());
      const haystack = [
        row.dataset.title || "",
        row.dataset.tags || "",
        row.dataset.categories || "",
        row.dataset.searchContent || "",
        row.textContent || ""
      ].join(" ").toLocaleLowerCase();

      const matchesQuery = !query || haystack.includes(query.replace(/^#/, ""));
      const matchesTag = !activeTag || tags.includes(activeTag.toLocaleLowerCase());
      const matches = matchesQuery && matchesTag;
      const show = filtering ? matches : row.dataset.initialHidden !== "true";

      row.hidden = !show;
      if (show) visible += 1;
    });

    if (status) {
      status.textContent = filtering
        ? `${visible}개의 게시글이 검색 조건과 일치합니다.`
        : "";
    }
    if (empty) empty.hidden = visible !== 0;
  }

  input.addEventListener("input", () => {
    activeTag = "";
    tagButtons.forEach((button) => {
      button.classList.remove("is-active");
      button.setAttribute("aria-pressed", "false");
    });
    filterPosts();
  });

  tagButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.dataset.tag || "";
      activeTag = activeTag === tag ? "" : tag;
      tagButtons.forEach((item) => {
        const active = item.dataset.tag === activeTag;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      input.value = activeTag ? "#" + activeTag : "";
      filterPosts();
    });
    button.setAttribute("aria-pressed", String(button.dataset.tag === activeTag));
  });

  filterPosts();
})();