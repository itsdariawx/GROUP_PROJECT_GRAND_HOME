(function () {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var root = document.documentElement;
  
    
    var SEL = ".stats-card, .polaroid-map, .faq-item, .benefit-card, .news-card, .calendar";
    var els = [].slice.call(document.querySelectorAll(SEL));
    if ("IntersectionObserver" in window && els.length) {
      root.classList.add("depth-on");
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      els.forEach(function (el, i) {
        el.classList.add("depth-reveal");
        el.style.setProperty("--d", (i % 4) * 70 + "ms");
        io.observe(el);
      });

      setTimeout(function () {
        els.forEach(function (el) { el.classList.add("in-view"); });
      }, 6000);
    }
  
  
    
    var promo = document.querySelector(".promo-content");
    if (promo && window.matchMedia("(hover:hover) and (pointer:fine)").matches) {
      var sec = promo.closest(".promo-section") || promo, raf = 0;
      sec.addEventListener("pointermove", function (e) {
        var r = promo.getBoundingClientRect();
        var x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
        var y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          promo.style.transform = "perspective(1100px) rotateX(" + (-y * 3.5).toFixed(2) + "deg) rotateY(" + (x * 5).toFixed(2) + "deg)";
        });
      });
      sec.addEventListener("pointerleave", function () {
        cancelAnimationFrame(raf);
        promo.style.transform = "";
      });
    }
  
  
    
    [].slice.call(document.querySelectorAll(".about-gallery .polaroid-frame")).forEach(function (f) {
      var base = "", active = false, dragging = false, sx = 0, sy = 0, timer = 0;
      var REST = "box-shadow 0.5s ease, background-color 0.5s ease";
      f.classList.add("tilt-ready");
      [].slice.call(f.querySelectorAll("img")).forEach(function (im) { im.draggable = false; });
  
      function clamp(v, m) { return Math.max(-m, Math.min(m, v)); }
      function apply(rx, ry) {
        f.style.transform = "perspective(900px) rotateX(" + rx.toFixed(1) + "deg) rotateY(" + ry.toFixed(1) + "deg) " + base;
      }
      function begin() {
        if (active) return;
        clearTimeout(timer);
        var cs = getComputedStyle(f).transform;
        base = cs && cs !== "none" ? cs : "";
        active = true;
        f.style.transition = REST + ", transform 0.12s ease-out";
        f.style.zIndex = 6;
        f.classList.add("is-tilting");
      }
      function glare(e) {
        var r = f.getBoundingClientRect();
        f.style.setProperty("--gx", ((e.clientX - r.left) / r.width * 100).toFixed(0) + "%");
        f.style.setProperty("--gy", ((e.clientY - r.top) / r.height * 100).toFixed(0) + "%");
      }
      function end() {
        if (!active) return;
        active = false;
        dragging = false;
        f.classList.remove("is-tilting");
        f.style.transition = REST + ", transform 0.7s cubic-bezier(0.2, 1.4, 0.4, 1)";
        apply(0, 0);
        timer = setTimeout(function () {
          if (!active) { f.style.transform = ""; f.style.transition = ""; f.style.zIndex = ""; }
        }, 740);
      }
  
      f.addEventListener("pointerdown", function (e) {
        if (e.button > 0) return;
        begin();
        dragging = true;
        sx = e.clientX; sy = e.clientY;
        f.style.transition = REST + ", transform 0.05s linear";
        try { f.setPointerCapture(e.pointerId); } catch (err) {}
        glare(e);
      });
      f.addEventListener("pointermove", function (e) {
        if (dragging) {
          apply(clamp(-(e.clientY - sy) * 0.5, 55), clamp((e.clientX - sx) * 0.5, 55));
          glare(e);
        } else if (e.pointerType === "mouse") {
          begin();
          var r = f.getBoundingClientRect();
          var x = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), 1);
          var y = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), 1);
          apply(-y * 14, x * 14);
          glare(e);
        }
      });
      f.addEventListener("pointerup", end);
      f.addEventListener("pointercancel", end);
      f.addEventListener("pointerleave", function () { if (!dragging) end(); });
    });
  
    
    var leaves = [].slice.call(document.querySelectorAll(".b-leaf, .faq-leaf, .page-leaf"));
    if (!leaves.length) return;
    var K = [0.06, -0.04, 0.09, -0.07, 0.05];
    var data = [];
    var ticking = false;
  
    function measure() {
      data = leaves.map(function (el, i) {
        el.style.translate = "";
        var r = el.getBoundingClientRect();
        return { el: el, y: r.top + window.scrollY + r.height / 2, k: K[i % K.length], on: r.width > 0 };
      });
      update();
    }
    function update() {
      ticking = false;
      var c = window.scrollY + window.innerHeight / 2;
      var lim = window.innerHeight * 1.4;
      for (var i = 0; i < data.length; i++) {
        var d = data[i];
        if (!d.on) continue;
        var p = d.y - c;
        if (Math.abs(p) > lim) continue;
        var s = Math.max(-70, Math.min(70, -p * d.k));
        d.el.style.translate = "0 " + s.toFixed(1) + "px";
      }
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    measure();
  })();
