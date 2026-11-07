(() => {
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