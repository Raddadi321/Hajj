(() => {
  const $ = (id) => document.getElementById(id);

  const state = {
    content: null,
    mode: "playlist",
    idx: 0,
    slideIdx: 0,
    timers: [],
  };

  const clearTimers = () => {
    state.timers.forEach(t => clearInterval(t));
    state.timers.forEach(t => clearTimeout(t));
    state.timers = [];
  };

  const setModePill = (txt) => $("modePill").textContent = (txt || "").toUpperCase();

  const parseMode = () => {
    const params = new URLSearchParams(location.search);
    const mode = (params.get("mode") || "playlist").toLowerCase();
    const valid = ["playlist", "ads", "numbers", "live", "static"];
    return valid.includes(mode) ? mode : "playlist";
  };

  const render = (sectionId) => {
    const c = state.content;
    if (!c) return;

    const sec = c.sections.find(s => s.id === sectionId);
    if (!sec) return;

    const panel = $("panel");
    panel.innerHTML = "";

    const view = document.createElement("div");
    view.className = "view";

    const titleRow = document.createElement("div");
    titleRow.className = "view__title";

    const h = document.createElement("h1");
    h.className = "h1";
    h.textContent = sec.title;

    const badge = document.createElement("div");
    badge.className = "badge";
    badge.textContent = c.brand?.name_en ? c.brand.name_en : "ALMASIAH";

    titleRow.appendChild(h);
    titleRow.appendChild(badge);

    view.appendChild(titleRow);

    // Render by type
    if (sec.type === "slideshow") {
      const slide = document.createElement("div");
      slide.className = "slide";

      const sh = document.createElement("div");
      sh.className = "h1";

      const ss = document.createElement("p");
      ss.className = "sub";

      const sb = document.createElement("div");
      sb.className = "badge";
      sb.style.alignSelf = "flex-start";

      const slides = sec.slides || [];
      const renderSlide = (i) => {
        const s = slides[i % slides.length] || { title: "", subtitle: "", badge: "" };
        sh.textContent = s.title || "";
        ss.textContent = s.subtitle || "";
        sb.textContent = s.badge || "";
        sb.style.display = s.badge ? "inline-flex" : "none";
      };

      renderSlide(state.slideIdx);
      const intervalMs = Math.max(3, sec.interval_seconds || 8) * 1000;
      const t = setInterval(() => {
        state.slideIdx = (state.slideIdx + 1) % Math.max(1, slides.length);
        renderSlide(state.slideIdx);
      }, intervalMs);

      state.timers.push(t);

      slide.appendChild(sh);
      slide.appendChild(ss);
      slide.appendChild(sb);

      view.appendChild(slide);
    }

    if (sec.type === "kpi") {
      const grid = document.createElement("div");
      grid.className = "grid";
      (sec.items || []).forEach(it => {
        const card = document.createElement("div");
        card.className = "card";

        const lab = document.createElement("div");
        lab.className = "kpi__label";
        lab.textContent = it.label || "";

        const val = document.createElement("div");
        val.className = "kpi__value";
        val.textContent = (it.value ?? "").toString();

        if (it.unit) {
          const unit = document.createElement("span");
          unit.className = "kpi__unit";
          unit.textContent = it.unit;
          val.appendChild(unit);
        }

        card.appendChild(lab);
        card.appendChild(val);
        grid.appendChild(card);
      });

      view.appendChild(grid);

      if (sec.note) {
        const note = document.createElement("div");
        note.className = "note";
        note.textContent = sec.note;
        view.appendChild(note);
      }
    }

    if (sec.type === "embed") {
      const wrap = document.createElement("div");
      wrap.className = "embedWrap";

      const iframe = document.createElement("iframe");
      iframe.allow = "autoplay; encrypted-media; picture-in-picture";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.src = sec.embed_url || "about:blank";

      wrap.appendChild(iframe);
      view.appendChild(wrap);

      if (sec.hint) {
        const hint = document.createElement("div");
        hint.className = "note";
        hint.textContent = sec.hint;
        view.appendChild(hint);
      }
    }

    if (sec.type === "poster") {
      const poster = document.createElement("div");
      poster.className = "poster";

      const ph = document.createElement("div");
      ph.className = "h1";
      ph.textContent = sec.headline || "";

      const pt = document.createElement("p");
      pt.className = "sub";
      pt.textContent = sec.text || "";

      const pf = document.createElement("div");
      pf.className = "note";
      pf.textContent = sec.footer || "";

      poster.appendChild(ph);
      poster.appendChild(pt);
      poster.appendChild(pf);

      view.appendChild(poster);
    }

    panel.appendChild(view);

    setModePill(sectionId);
  };

  const runPlaylist = () => {
    clearTimers();
    setModePill("playlist");

    const ids = state.content.sections.map(s => s.id);
    const seconds = Math.max(8, state.content.playlist_seconds || 20);

    const show = () => {
      const id = ids[state.idx % ids.length];
      state.slideIdx = 0;
      render(id);
      state.idx = (state.idx + 1) % ids.length;
    };

    show();
    const t = setInterval(show, seconds * 1000);
    state.timers.push(t);
  };

  const start = async () => {
    state.mode = parseMode();
    $("footerUrl").textContent = location.href;
const base = location.pathname.endsWith("/") ? location.pathname : location.pathname.replace(/[^/]+$/, "");
const res = await fetch(base + "content.json", { cache: "no-store" });
   
    state.content = await res.json();

    // brand
    document.documentElement.style.setProperty("--primary", state.content.brand?.primary || "#259A49");
    $("brandName").textContent = state.content.brand?.name_ar || "الماسية";
    $("brandSub").textContent = state.content.brand?.name_en || "almasiah";

    // clock
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      $("clock").textContent = `${hh}:${mm}`;
    };
    tick();
    state.timers.push(setInterval(tick, 1000));

    if (state.mode === "playlist") runPlaylist();
    else {
      clearTimers();
      render(state.mode);
    }
  };

  window.addEventListener("visibilitychange", () => {
    // in case TV suspends tabs
    if (!document.hidden) location.reload();
  });

  start().catch(err => {
    $("panel").innerHTML = `
      <div class="view">
        <h1 class="h1">تعذر تحميل المحتوى</h1>
        <p class="sub">تأكد أن ملفات GitHub Pages تعمل وأن content.json موجود.</p>
        <pre style="white-space:pre-wrap; color:#B8C7BC">${String(err)}</pre>
      </div>
    `;
  });
})();
