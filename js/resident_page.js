
document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector(".search");
    const input = document.getElementById("siteSearch");
    const list = document.getElementById("searchResults");
    if (!form || !input || !list) return;
  
    const HEADING_OFFSET = 90;
    const MAX_RESULTS = 5;
  

  
    function scrollToEl(el) {
      const rect = el.getBoundingClientRect();
      const isHeading = /^H[1-4]$/.test(el.tagName) || el.tagName === "FOOTER";
      const top = isHeading
        ? rect.top + window.scrollY - HEADING_OFFSET
        : rect.top + window.scrollY - (window.innerHeight - rect.height) / 2;
  
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  
      el.classList.remove("search-hit");
      void el.offsetWidth;
      el.classList.add("search-hit");
      setTimeout(() => el.classList.remove("search-hit"), 2100);
    }
  

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      const id = link.getAttribute("href").slice(1);
      if (!id) return;
      link.addEventListener("click", (e) => {
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();

        scrollToEl(target.querySelector(".section-title") || target);
        history.replaceState(null, "", "#" + id);
      });
    });
  

  
    const SELECTOR = "h1, h2, h3, h4, .service, .orders li, .btn-pdf, .btn-more, .fb-btn, .feedback p, .updated";
  
    function normalize(text) {
      return text
        .toLowerCase()
        .replace(/[’`ʼ]/g, "'")
        .replace(/ё/g, "е")
        .replace(/[^a-zа-яіїєґ0-9']+/g, " ")
        .trim();
    }
  
    function entryWords(t) { const n = normalize(t); return n ? n.split(" ") : []; }
  
    const entries = [];
    document.querySelectorAll(SELECTOR).forEach((el) => {
      const text = el.textContent.replace(/\s+/g, " ").trim();
      if (!text) return;
      const keywords = el.dataset.keywords || "";

      const hash = el.tagName === "A" ? el.getAttribute("href") : "";
      const block = hash && hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
      entries.push({
        el: block ? block.querySelector(".section-title") || block : el,
        text: text,
        norm: normalize(text),
        words: entryWords(text),
        kw: entryWords(keywords),
        isHeading: /^(H[1-4])$/.test(el.tagName)
      });
    });
  

  
    function distance(a, b) {
      const prev = [];
      for (let j = 0; j <= b.length; j++) prev[j] = j;
      for (let i = 1; i <= a.length; i++) {
        let diagonal = prev[0];
        prev[0] = i;
        for (let j = 1; j <= b.length; j++) {
          const temp = prev[j];
          prev[j] = Math.min(
            prev[j] + 1,
            prev[j - 1] + 1,
            diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)
          );
          diagonal = temp;
        }
      }
      return prev[b.length];
    }
  

    function wordScore(q, w) {
      if (w === q) return 1;
      if (w.startsWith(q)) return 0.9;
      if (q.length >= 3 && w.includes(q)) return 0.75;
      if (q.length < 3) return 0;
  

      const allowed = q.length <= 4 ? 1 : q.length <= 7 ? 2 : 3;
      const stem = Math.min(w.length, q.length);
      let best = distance(q, w.slice(0, stem));
      if (w.length > q.length) best = Math.min(best, distance(q, w.slice(0, q.length + 1)));
      return best <= allowed ? 0.6 - best * 0.1 : 0;
    }
  
    function scoreEntry(entry, query, queryWords) {
      let total = 0;
      for (const q of queryWords) {
        let best = 0;
        for (const w of entry.words) {
          const s = wordScore(q, w);
          if (s > best) best = s;
          if (best === 1) break;
        }
        if (best < 1) {

          for (const w of entry.kw) best = Math.max(best, wordScore(q, w) * 0.6);
        }
        if (best === 0) return 0;
        total += best;
      }
      let score = total / queryWords.length;
      score += 0.2 * Math.min(1, queryWords.length / entry.norm.split(" ").length);
      if (entry.norm === query) score += 0.3;
      else if (entry.norm.includes(query)) score += 0.15;
      if (entry.isHeading) score += 0.05;
      return score - Math.min(entry.norm.length, 200) / 4000;
    }
  
    function search(text) {
      const query = normalize(text);
      if (!query) return [];
      const queryWords = query.split(" ");
  
      return entries
        .map((entry) => ({ entry: entry, score: scoreEntry(entry, query, queryWords) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .filter((r, i, arr) => arr.findIndex((x) => x.entry.norm === r.entry.norm) === i)
        .slice(0, MAX_RESULTS)
        .map((r) => r.entry);
    }
  

  
    let results = [];
    let activeIndex = -1;
  
    function closeList() {
      list.hidden = true;
      list.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
      activeIndex = -1;
    }
  
    function setActive(index) {
      activeIndex = index;
      Array.from(list.children).forEach((li, i) => li.classList.toggle("is-active", i === index));
    }
  
    function render() {
      list.innerHTML = "";
      if (!input.value.trim()) {
        closeList();
        return;
      }
  
      results = search(input.value);
  
      if (results.length === 0) {
        const li = document.createElement("li");
        li.className = "search-empty";
        li.textContent = "Нічого не знайдено";
        list.appendChild(li);
      } else {
        results.forEach((entry, i) => {
          const li = document.createElement("li");
          li.setAttribute("role", "option");
          li.textContent = entry.text;
          li.addEventListener("mousedown", (e) => {
            e.preventDefault();
            go(entry);
          });
          li.addEventListener("mouseenter", () => setActive(i));
          list.appendChild(li);
        });
      }
  
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      activeIndex = -1;
    }
  
    function go(entry) {
      closeList();
      input.blur();
      scrollToEl(entry.el);
    }
  
    input.addEventListener("input", render);
    input.addEventListener("focus", () => { if (input.value.trim()) render(); });
    input.addEventListener("blur", () => setTimeout(closeList, 120));
  
    input.addEventListener("keydown", (e) => {
      if (list.hidden || results.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((activeIndex + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((activeIndex - 1 + results.length) % results.length);
      } else if (e.key === "Escape") {
        closeList();
      }
    });
  

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!input.value.trim()) return;
      results = search(input.value);
      if (results.length === 0) {
        render();
        return;
      }
      go(results[activeIndex >= 0 ? activeIndex : 0]);
    });
  });
