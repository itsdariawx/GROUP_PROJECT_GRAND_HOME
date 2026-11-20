const DESIGN_WIDTH = 1440;
const SCALE_MIN = 1181;
const root = document.documentElement;

function applyScale() {
  const w = root.clientWidth;

  root.style.setProperty("--page-w", w + "px");
  if (w >= SCALE_MIN && w < DESIGN_WIDTH) {
    root.style.setProperty("--ds", (w / DESIGN_WIDTH).toFixed(5));
    root.classList.add("is-scaled");
  } else {
    root.style.removeProperty("--ds");
    root.classList.remove("is-scaled");
  }
}

applyScale();
window.addEventListener("resize", applyScale);
window.addEventListener("load", applyScale);

document.addEventListener("DOMContentLoaded", () => {
  applyScale();

  const burgerBtn = document.getElementById("burgerBtn");
  const mainNav = document.getElementById("mainNav");

  if (burgerBtn && mainNav) {
    burgerBtn.setAttribute("aria-controls", "mainNav");

    const closeMenu = () => {
      mainNav.classList.remove("open");
      burgerBtn.setAttribute("aria-expanded", "false");
    };

    burgerBtn.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      burgerBtn.setAttribute("aria-expanded", String(isOpen));
    });

    mainNav.addEventListener("click", (e) => {
      if (e.target.closest("a")) closeMenu();
    });
    document.addEventListener("click", (e) => {
      if (!mainNav.contains(e.target) && !burgerBtn.contains(e.target)) closeMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    window.matchMedia("(min-width: 900px)").addEventListener("change", (e) => {
      if (e.matches) closeMenu();
    });
  }

  const faqItems = document.querySelectorAll(".faq-item");
  const noHover = window.matchMedia("(hover: none)");

  faqItems.forEach((item) => {
    item.tabIndex = 0;
    item.setAttribute("role", "button");

    const toggleFaq = () => {
      const wasOpen = item.classList.contains("open");
      faqItems.forEach((el) => {
        el.classList.remove("open");
        el.setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        item.classList.add("open");
        item.setAttribute("aria-expanded", "true");
      }
    };

    item.addEventListener("click", () => {
      if (noHover.matches) toggleFaq();
    });
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleFaq();
      }
    });
  });

  let remainingSeconds = 15 * 60;
  const minEl = document.getElementById("timerMinutes");
  const secEl = document.getElementById("timerSeconds");

  function setTile(el, value) {
    if (el.textContent === value) return;
    el.textContent = value;
    el.classList.remove("flip");
    void el.offsetWidth;
    el.classList.add("flip");
  }

  function tickTimer() {
    if (!minEl || !secEl) return;
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    setTile(minEl, String(m).padStart(2, "0"));
    setTile(secEl, String(s).padStart(2, "0"));
    if (remainingSeconds > 0) {
      remainingSeconds--;
    }
  }
  tickTimer();
  setInterval(tickTimer, 1000);

  document.querySelectorAll("[data-carousel]").forEach(initCarousel);

  function initCarousel(carousel) {
    const track = carousel.querySelector(".carousel-track");
    const prev = carousel.querySelector(".carousel-btn--prev");
    const next = carousel.querySelector(".carousel-btn--next");
    const dotsBox = carousel.querySelector(".carousel-dots");
    if (!track) return;

    let dots = [];
    let raf = 0;

    track.setAttribute("role", "region");
    track.setAttribute("aria-label", carousel.getAttribute("data-carousel-label") || "Слайдер");
    track.tabIndex = 0;

    function getSlides() {
      const list = [];
      (function collect(parent) {
        Array.from(parent.children).forEach((el) => {
          if (getComputedStyle(el).display === "contents") collect(el);
          else if (el.offsetWidth > 0) list.push(el);
        });
      })(track);
      return list;
    }

    const maxScroll = () => track.scrollWidth - track.clientWidth;
    const isScrollable = () => track.clientWidth > 0 && maxScroll() > 6;

    function pitch() {
      const list = getSlides();
      return list.length > 1 ? list[1].offsetLeft - list[0].offsetLeft : track.clientWidth;
    }
    const pages = () => Math.max(1, Math.round(maxScroll() / pitch()) + 1);

    function pageIndex() {
      if (track.scrollLeft >= maxScroll() - 2) return pages() - 1;
      return Math.min(pages() - 1, Math.round(track.scrollLeft / pitch()));
    }

    function toPage(i) {
      const left = Math.min(maxScroll(), Math.max(0, i * pitch()));
      track.scrollTo({ left: left, behavior: "smooth" });
    }

    function step(dir) {
      let i = pageIndex() + dir;
      if (i >= pages()) i = 0;
      if (i < 0) i = pages() - 1;
      toPage(i);
    }

    function buildDots() {
      if (!dotsBox) return;
      const n = pages();
      if (dots.length === n) return;
      dotsBox.innerHTML = "";
      dots = [];
      for (let i = 0; i < n; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "carousel-dot";
        b.setAttribute("aria-label", "Слайд " + (i + 1) + " з " + n);
        b.addEventListener("click", () => toPage(i));
        dotsBox.appendChild(b);
        dots.push(b);
      }
    }

    function update() {
      const scrollable = isScrollable();
      carousel.classList.toggle("is-scrollable", scrollable);
      if (!scrollable) return;
      buildDots();
      const idx = pageIndex();
      dots.forEach((d, k) => {
        if (k === idx) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });
    }

    function schedule() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    }

    if (prev) prev.addEventListener("click", () => step(-1));
    if (next) next.addEventListener("click", () => step(1));

    track.addEventListener("scroll", schedule, { passive: true });
    track.addEventListener("keydown", (e) => {
      if (!isScrollable()) return;
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    });

    window.addEventListener("resize", schedule);
    window.addEventListener("load", schedule);
    if ("ResizeObserver" in window) new ResizeObserver(schedule).observe(track);

    schedule();
  }

  initContactModal();

  initTimelineProgress();
});

function initTimelineProgress() {
  const line = document.querySelector(".timeline-vertical");
  if (!line) return;

  const section = line.closest(".about-section") || document;

  const dots = Array.from(section.querySelectorAll(".tl-dot, .about-text, .about-gallery, .stats-card, .polaroid-map, .polaroid-frame"));
  let queued = false;

  function update() {
    queued = false;

    const rect = line.getBoundingClientRect();
    if (rect.height === 0) return;

    const focusY = window.innerHeight * 0.6;
    const progress = Math.min(1, Math.max(0, (focusY - rect.top) / rect.height));
    const reachedY = rect.top + rect.height * progress;

    line.style.setProperty("--tl-progress", progress.toFixed(4));
    line.style.setProperty("--tl-head", progress > 0 && progress < 1 ? "1" : "0");

    dots.forEach((dot) => {
      const r = dot.getBoundingClientRect();

      const centerY = r.top + r.height / 2;

      dot.classList.toggle("is-lit", progress > 0 && (progress >= 0.999 || centerY <= reachedY));
    });
  }

  function requestUpdate() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  window.addEventListener("load", requestUpdate);
  update();
}

function initContactModal() {
  const REQUESTS_KEY = "grandhome-requests";
  const MAX_SAVED = 20;
  const MAX_DAYS_AHEAD = 30;
  const MIN_HOURS_AHEAD = 1;
  const PROCESSING_MS = 1400;
  const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  const SATURDAY_SLOTS = ["10:00", "12:00", "14:00"];
  const WEEKDAY_SLOTS = ["09:00", "11:00", "13:00", "15:00", "17:00", "19:00"];
  const WEEKDAYS = ["неділя", "понеділок", "вівторок", "середа", "четвер", "п'ятниця", "субота"];

  const SUGGESTIONS = {
    flat: [
      "Які квартири зараз доступні?",
      "Хочу оглянути квартиру наживо",
      "Які є варіанти оплати та розстрочки?"
    ],
    pay: [
      "Як сплатити комунальні послуги?",
      "Не збігається сума заборгованості",
      "Де взяти квитанцію про оплату?"
    ],
    service: [
      "Потрібен майстер до квартири",
      "Проблема з ліфтом чи освітленням у під'їзді",
      "Як дізнатись статус моєї заявки?"
    ],
    cabinet: [
      "Не можу увійти в кабінет мешканця",
      "Як змінити дані профілю?"
    ],
    other: []
  };

  const modal = document.getElementById("contactModal");
  if (!modal) return;

  const closeBtn = document.getElementById("closeModalBtn");
  const modalTitle = document.getElementById("modalTitle");
  const form = document.getElementById("leadForm");
  const topicsBox = document.getElementById("contactTopics");
  const suggestBox = document.getElementById("contactSuggest");
  const question = document.getElementById("leadQuestion");
  const counter = document.getElementById("leadCounter");
  const nameInput = document.getElementById("leadName");
  const phoneInput = document.getElementById("leadPhone");
  const dateInput = document.getElementById("leadDate");
  const slotsBox = document.getElementById("contactSlots");
  const formError = document.getElementById("formError");
  const topicBtns = Array.from(topicsBox.querySelectorAll(".contact-chip"));

  const DEFAULT_TITLE = modalTitle.textContent;
  const FIELDS = ["topic", "question", "name", "phone", "date", "slot"];

  let topic = "";
  let slot = "";
  let lastFocus = null;

  function toIso(date) {
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + m + "-" + d;
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function parseIso(iso) {
    const parts = iso.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function formatDate(iso) {
    const date = parseIso(iso);
    const day = date.toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
    return day + " (" + WEEKDAYS[date.getDay()] + ")";
  }

  const PHONE_PREFIX = "+380 (";

  function formatPhone(raw) {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("380")) digits = digits.slice(3);
    else if (digits.startsWith("38")) digits = digits.slice(2);
    else if (digits.startsWith("0")) digits = digits.slice(1);
    if (digits.startsWith("0")) digits = digits.slice(1);
    digits = digits.slice(0, 9);
    if (digits === "") return PHONE_PREFIX;

    let out = "+380 (" + digits.slice(0, 2);
    if (digits.length > 2) out += ") " + digits.slice(2, 5);
    if (digits.length > 5) out += "-" + digits.slice(5, 7);
    if (digits.length > 7) out += "-" + digits.slice(7, 9);
    return out;
  }

  function makeRequestId() {
    let code = "";
    for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    return "GH-" + code;
  }

  function saveRequest(request) {
    try {
      const list = JSON.parse(localStorage.getItem(REQUESTS_KEY) || "[]");
      list.unshift(request);
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(list.slice(0, MAX_SAVED)));
    } catch (error) {

    }
  }

  function setState(state) {
    modal.setAttribute("data-state", state);
  }

  function getState() {
    return modal.getAttribute("data-state");
  }

  function closeModal() {
    if (getState() === "processing") return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  function fieldBox(key) {
    return modal.querySelector('[data-field="' + key + '"]');
  }

  function showError(key, text) {
    const box = fieldBox(key);
    box.classList.add("is-invalid");
    box.querySelector(".error-msg").textContent = text;
  }

  function clearError(key) {
    const box = fieldBox(key);
    box.classList.remove("is-invalid");
    box.querySelector(".error-msg").textContent = "";
  }

  function clearAllErrors() {
    FIELDS.forEach(clearError);
    formError.textContent = "";
  }

  function slotsFor(iso) {
    if (!iso) return [];
    const day = parseIso(iso).getDay();
    if (day === 0) return [];
    return day === 6 ? SATURDAY_SLOTS : WEEKDAY_SLOTS;
  }

  function slotMinutes(time) {
    const parts = time.split(":").map(Number);
    return parts[0] * 60 + parts[1];
  }

  function isSlotPast(time) {
    if (dateInput.value !== toIso(new Date())) return false;
    const now = new Date();
    return slotMinutes(time) < now.getHours() * 60 + now.getMinutes() + MIN_HOURS_AHEAD * 60;
  }

  function renderSlots() {
    const list = slotsFor(dateInput.value);
    slotsBox.innerHTML = "";

    if (!dateInput.value) {
      slotsBox.innerHTML = '<span class="contact-slots__hint">Спершу оберіть дату</span>';
      slot = "";
      return;
    }

    if (list.length === 0) {
      slotsBox.innerHTML = '<span class="contact-slots__hint">У неділю центр не працює – оберіть інший день</span>';
      slot = "";
      return;
    }

    if (slot && !list.includes(slot)) slot = "";

    list.forEach((time) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "contact-slot";
      btn.dataset.time = time;
      btn.textContent = time;
      btn.disabled = isSlotPast(time);
      if (btn.disabled && time === slot) slot = "";
      if (time === slot) btn.classList.add("is-active");
      slotsBox.appendChild(btn);
    });
  }

  const checks = {
    topic() {
      return topic ? "" : "Оберіть тему питання";
    },

    question() {
      return question.value.trim().length < 10 ? "Опишіть питання (мінімум 10 символів)" : "";
    },

    name() {
      const value = nameInput.value.trim();
      if (value.length < 2) return "Введіть ім'я (мінімум 2 літери)";
      if (!/^[A-Za-zА-Яа-яІіЇїЄєҐґ\s'’.-]+$/.test(value)) return "Ім'я може містити лише літери";
      return "";
    },

    phone() {

      const digits = phoneInput.value.replace(/\D/g, "");
      return digits.length === 12 && digits.startsWith("380")
        ? ""
        : "Введіть номер у форматі +380 (XX) XXX-XX-XX";
    },

    date() {
      if (!dateInput.value) return "Оберіть дату дзвінка";
      const today = toIso(new Date());
      const last = toIso(addDays(new Date(), MAX_DAYS_AHEAD));
      if (dateInput.value < today) return "Ця дата вже минула";
      if (dateInput.value > last) return "Не пізніше ніж за " + MAX_DAYS_AHEAD + " днів";
      if (parseIso(dateInput.value).getDay() === 0) return "У неділю центр не працює";
      return "";
    },

    slot() {
      if (!slot) return "Оберіть зручний час";
      if (isSlotPast(slot)) return "Цей час уже минув – оберіть інший";
      return "";
    }
  };

  function validate(key) {
    const message = checks[key]();
    if (message) showError(key, message);
    else clearError(key);
    return message === "";
  }

  function revalidate(key) {
    if (fieldBox(key).classList.contains("is-invalid")) validate(key);
  }

  function renderSuggestions() {
    const list = SUGGESTIONS[topic] || [];
    suggestBox.innerHTML = "";
    suggestBox.hidden = list.length === 0;

    list.forEach((text) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "contact-suggest__item";
      btn.textContent = text;
      suggestBox.appendChild(btn);
    });
  }

  function updateCounter() {
    counter.textContent = question.value.length;
  }

  topicBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      topic = btn.dataset.topic;
      topicBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      renderSuggestions();
      revalidate("topic");
    });
  });

  suggestBox.addEventListener("click", (e) => {
    const item = e.target.closest(".contact-suggest__item");
    if (!item) return;
    question.value = item.textContent;
    updateCounter();
    revalidate("question");
    question.focus();
  });

  question.addEventListener("input", () => {
    updateCounter();
    revalidate("question");
  });

  nameInput.addEventListener("input", () => revalidate("name"));

  phoneInput.addEventListener("input", () => {
    phoneInput.value = formatPhone(phoneInput.value);
    revalidate("phone");
  });

  function phoneCaretToEnd() {
    const end = phoneInput.value.length;
    phoneInput.setSelectionRange(end, end);
  }
  phoneInput.addEventListener("focus", () => setTimeout(phoneCaretToEnd, 0));
  phoneInput.addEventListener("click", () => {
    if (phoneInput.selectionStart < PHONE_PREFIX.length) phoneCaretToEnd();
  });
  phoneInput.addEventListener("keydown", (e) => {
    const atPrefix = phoneInput.selectionStart <= PHONE_PREFIX.length && phoneInput.selectionEnd <= PHONE_PREFIX.length;
    if (atPrefix && e.key === "Backspace") e.preventDefault();
  });

  function openCalendar() {
    try { if (dateInput.showPicker) dateInput.showPicker(); } catch (err) {  }
  }
  dateInput.addEventListener("keydown", (e) => {
    if (e.key === "Tab" || e.key === "Escape") return;
    e.preventDefault();
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") openCalendar();
  });
  dateInput.addEventListener("paste", (e) => e.preventDefault());
  dateInput.addEventListener("drop", (e) => e.preventDefault());
  dateInput.addEventListener("click", openCalendar);

  dateInput.addEventListener("input", () => {
    renderSlots();
    revalidate("date");
    revalidate("slot");
  });

  slotsBox.addEventListener("click", (e) => {
    const btn = e.target.closest(".contact-slot");
    if (!btn || btn.disabled) return;
    slot = btn.dataset.time;
    slotsBox.querySelectorAll(".contact-slot").forEach((b) => b.classList.toggle("is-active", b === btn));
    revalidate("slot");
  });

  function resetForm() {
    topic = "";
    slot = "";
    topicBtns.forEach((b) => b.classList.remove("is-active"));
    renderSuggestions();

    question.value = "";
    updateCounter();
    nameInput.value = "";
    phoneInput.value = PHONE_PREFIX;
    dateInput.value = "";

    dateInput.min = toIso(new Date());
    dateInput.max = toIso(addDays(new Date(), MAX_DAYS_AHEAD));

    renderSlots();
    clearAllErrors();
  }

  function openModal(title) {
    lastFocus = document.activeElement;
    modalTitle.textContent = title || DEFAULT_TITLE;
    resetForm();
    setState("form");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (topicBtns[0]) topicBtns[0].focus();
  }

  document.querySelectorAll(".btn-contact, .open-modal-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(btn.getAttribute("data-subject"));
    });
  });

  closeBtn.addEventListener("click", closeModal);
  document.getElementById("contactDone").addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const results = FIELDS.map((key) => ({ key: key, ok: validate(key) }));
    const firstBad = results.find((r) => !r.ok);

    if (firstBad) {
      formError.textContent = "Перевірте виділені поля";
      fieldBox(firstBad.key).scrollIntoView({ block: "nearest", behavior: "smooth" });
      return;
    }
    formError.textContent = "";

    const activeChip = topicBtns.find((b) => b.dataset.topic === topic);
    const request = {
      id: makeRequestId(),
      topic: activeChip ? activeChip.textContent : topic,
      question: question.value.trim(),
      name: nameInput.value.trim(),
      phone: phoneInput.value,
      date: dateInput.value,
      time: slot,
      createdAt: new Date().toISOString()
    };

    setState("processing");

    setTimeout(() => {
      saveRequest(request);
      document.getElementById("formSuccess").textContent =
        "Наш менеджер зв'яжеться з вами " + formatDate(request.date) +
        " о " + request.time + " за номером " + request.phone + ".";
      setState("success");
    }, PROCESSING_MS);
  });
}

(function initStatsCount() {
  const card = document.querySelector(".stats-card");
  if (!card) return;
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) return;

  const NBSP = "\u00a0";
  const TOTAL_MS = 2600;
  const SPIN_MS = 1100;
  const FRAME_MS = 60;

  const items = Array.from(card.querySelectorAll("strong")).map((el) => {
    const text = el.textContent.trim();
    const m = text.match(/^(\D*?)(\d[\d\s\u00a0]*)(.*)$/);
    if (!m) return null;
    const digits = m[2].replace(/\D/g, "");
    return {
      el, text,
      prefix: m[1],
      suffix: m[3],
      digits,
      grouped: /[\s\u00a0]/.test(m[2])
    };
  }).filter(Boolean);
  if (!items.length) return;

  function format(it, arr) {
    let s = arr.join("");
    if (it.grouped) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
    return it.prefix + s + it.suffix;
  }

  function run() {
    const start = performance.now();
    let last = 0;
    items.forEach((it) => it.el.setAttribute("aria-label", it.text));

    function frame(now) {
      const t = now - start;
      if (t - last >= FRAME_MS || t >= TOTAL_MS) {
        last = t;
        items.forEach((it) => {
          const n = it.digits.length;
          const arr = it.digits.split("").map((d, i) => {

            const lockAt = SPIN_MS + ((TOTAL_MS - SPIN_MS) * (i + 1)) / n;
            if (t >= lockAt) return d;
            let r = Math.floor(Math.random() * 10);
            if (i === 0 && n > 1 && r === 0) r = 1;
            return String(r);
          });
          it.el.textContent = t >= TOTAL_MS ? it.text : format(it, arr);
        });
      }
      if (t < TOTAL_MS) requestAnimationFrame(frame);
      else items.forEach((it) => { it.el.textContent = it.text; });
    }
    requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      io.disconnect();
      run();
    }
  }, { threshold: 0.5 });
  io.observe(card);
})();
