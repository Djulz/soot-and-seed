/* Production Hex Campaign — rendering only. Rules live in SootSeedHexLab. */
(function (root) {
  const hex = root.SootSeedHexLab,
    storageKey = "sootSeed.campaign.hex.v1",
    clone = (value) => JSON.parse(JSON.stringify(value));
  const cellKey = (q, r) => hex.key(q, r),
    radialCells = (radius) => {
      const cells = {};
      for (let q = -radius; q <= radius; q++)
        for (let r = -radius; r <= radius; r++)
          if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= radius)
            cells[cellKey(q, r)] = {
              q,
              r,
              terrain: "ground",
              object: null,
              fire: "normal",
            };
      return cells;
    };
  const authored = (
    id,
    number,
    title,
    lesson,
    moves,
    req,
    tools,
    radius,
    features = [],
    scheduledFires = [],
  ) => {
    const cells = radialCells(radius);
    for (const [q, r, object, fire = "normal"] of features)
      Object.assign(cells[cellKey(q, r)], { object, fire });
    return {
      id,
      number,
      title,
      chapter: "Lowlands",
      lesson,
      moves,
      req,
      tools,
      cells,
      scheduledFires,
    };
  };
  const levels = [
    authored(
      "lowlands-1",
      1,
      "First Cut",
      "Hold a Tree, drag along a hex direction, then release to cut.",
      1,
      { wood: 3 },
      ["woodcutter"],
      1,
      [
        [-1, 0, "tree"],
        [0, 0, "tree"],
        [1, 0, "tree"],
      ],
    ),
    authored(
      "lowlands-2",
      2,
      "Fireline",
      "Where you start the cut matters.",
      1,
      { wood: 2, charcoal: 3 },
      ["woodcutter"],
      2,
      [
        [-2, 0, "tree", "active"],
        [-1, 0, "tree"],
        [0, 0, "tree"],
        [1, 0, "tree"],
        [2, 0, "tree"],
      ],
    ),
    authored(
      "lowlands-3",
      3,
      "Field & Forest",
      "Sickle harvests the whole connected Wheat field.",
      2,
      { wood: 3, wheat: 4 },
      ["woodcutter", "sickle"],
      2,
      [
        [-2, 1, "tree"],
        [-1, 1, "tree"],
        [0, 1, "tree"],
        [0, -1, "wheat"],
        [1, -1, "wheat"],
        [0, 0, "wheat"],
        [1, 0, "wheat"],
      ],
    ),
    authored(
      "lowlands-4",
      4,
      "Waiting Spark",
      "WAIT advances the world without spending a move.",
      1,
      { wood: 3, charcoal: 2 },
      ["woodcutter", "wait"],
      2,
      [
        [-2, 2, "tree"],
        [-1, 2, "tree"],
        [0, 2, "tree"],
        [1, -1, "tree"],
        [2, -2, "tree"],
      ],
      [{ q: 2, r: -1, after: 2 }],
    ),
    authored(
      "lowlands-5",
      5,
      "Crossroads",
      "",
      3,
      { wood: 5, charcoal: 4, wheat: 4 },
      ["woodcutter", "sickle", "wait"],
      2,
      [
        [-2, 0, "tree", "active"],
        [-1, 0, "tree"],
        [0, 0, "tree"],
        [1, 0, "tree"],
        [2, 0, "tree"],
        [0, -1, "tree"],
        [1, -1, "tree"],
        [2, -1, "tree"],
        [1, 1, "tree"],
        [-2, 2, "wheat"],
        [-1, 2, "wheat"],
        [-1, 1, "wheat"],
        [0, 2, "wheat"],
      ],
    ),
  ];
  function progress() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(storageKey) ||
          '{"version":1,"completed":[],"lastPlayed":null}',
      );
      return {
        version: 1,
        completed: Array.isArray(saved.completed) ? saved.completed : [],
        lastPlayed: saved.lastPlayed || null,
      };
    } catch {
      return { version: 1, completed: [], lastPlayed: null };
    }
  }
  function save(value) {
    localStorage.setItem(storageKey, JSON.stringify({ ...value, version: 1 }));
  }
  const completed = (level, p = progress()) => p.completed.includes(level.id),
    unlocked = (level, p = progress()) =>
      level.number === 1 || p.completed.includes(levels[level.number - 2].id);
  function markComplete(level) {
    const p = progress();
    if (!p.completed.includes(level.id)) p.completed.push(level.id);
    p.lastPlayed = level.id;
    save(p);
  }
  /* Bounds contain full flat-top polygons: x ± S, y ± √3/2 S. */
  function hexBounds(cells, radius, gap = 0) {
    const g = hex.geometry(radius, gap),
      positioned = cells.map((cell) => {
        const centre = hex.point(cell.q, cell.r, radius, gap);
        return {
          cell,
          centre,
          left: centre.x - radius,
          top: centre.y - g.height / 2,
          right: centre.x + radius,
          bottom: centre.y + g.height / 2,
        };
      }),
      minX = Math.min(...positioned.map((x) => x.left)),
      maxX = Math.max(...positioned.map((x) => x.right)),
      minY = Math.min(...positioned.map((x) => x.top)),
      maxY = Math.max(...positioned.map((x) => x.bottom));
    return {
      positioned,
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
  function boardLayout(state, options = {}) {
    const cells = Object.values(state.cells),
      padding = options.padding ?? 12,
      maxWidth =
        options.maxWidth ??
        Math.max(260, Math.min(580, (root.innerWidth || 390) - 34)),
      maxHeight =
        options.maxHeight ??
        Math.max(250, Math.min(520, (root.innerHeight || 760) * 0.52)),
      maxRadius = options.maxRadius ?? 70,
      visualGap = options.visualGap ?? 3,
      fit = (radius) => {
        const b = hexBounds(cells, radius, visualGap);
        return (
          b.width <= maxWidth - padding * 2 &&
          b.height <= maxHeight - padding * 2
        );
      };
    let low = 4,
      high = maxRadius;
    for (let i = 0; i < 28; i++) {
      const mid = (low + high) / 2;
      if (fit(mid)) low = mid;
      else high = mid;
    }
    const radius = Math.max(4, Math.min(maxRadius, low)),
      g = hex.geometry(radius, visualGap),
      bounds = hexBounds(cells, radius, visualGap),
      byKey = new Map(
        bounds.positioned.map((x) => [cellKey(x.cell.q, x.cell.r), x]),
      );
    return {
      cells,
      radius,
      g,
      visualGap,
      visualScale: 1,
      bounds,
      width: Math.ceil(bounds.width + padding * 2),
      height: Math.ceil(bounds.height + padding * 2),
      positionFor(cell) {
        const item = byKey.get(cellKey(cell.q, cell.r));
        return {
          left: item.left - bounds.minX + padding,
          top: item.top - bounds.minY + padding,
          centerX: item.centre.x - bounds.minX + padding,
          centerY: item.centre.y - bounds.minY + padding,
        };
      },
    };
  }
  function mini(level) {
    const state = hex.createInitialState(level),
      l = boardLayout(state, {
        maxWidth: 76,
        maxHeight: 68,
        maxRadius: 13,
        padding: 3,
        visualGap: 1.4,
      });
    return `<div class="hex-mini" aria-hidden="true"><div class="hex-mini-scene" style="width:${l.width}px;height:${l.height}px">${l.cells
      .map((c) => {
        const p = l.positionFor(c),
          kind = c.fire === "active" ? "active" : c.object || "";
        return `<i class="${kind}" style="left:${p.left}px;top:${p.top}px;width:${l.g.width}px;height:${l.g.height}px"></i>`;
      })
      .join("")}</div></div>`;
  }
  function asset(kind, extra = "") {
    const svg = (body) =>
      `<svg class="hex-asset ${kind} ${extra}" viewBox="0 0 48 48" aria-hidden="true">${body}</svg>`;
    if (kind === "tree")
      return svg(
        '<path d="M22 31h5v11h-5z" fill="#815334"/><path d="M24.5 4 10 27h8L8 38h33L31 27h8z" fill="#355d42"/><path d="m24.5 7-10 18h8l-8 11h20l-8-11h8z" fill="#4e754d"/><path d="m24.5 7-6 11h12z" fill="#789268"/>',
      );
    if (kind === "wheat")
      return svg(
        '<path d="M23 11v29M27 11v29M19 15v25" stroke="#a86f28" stroke-width="2" stroke-linecap="round"/><g fill="#d5a440"><ellipse cx="16" cy="15" rx="3" ry="5" transform="rotate(-32 16 15)"/><ellipse cx="30" cy="14" rx="3" ry="5" transform="rotate(32 30 14)"/><ellipse cx="14" cy="23" rx="3" ry="5" transform="rotate(-35 14 23)"/><ellipse cx="33" cy="22" rx="3" ry="5" transform="rotate(35 33 22)"/><ellipse cx="17" cy="31" rx="3" ry="5" transform="rotate(-35 17 31)"/><ellipse cx="30" cy="30" rx="3" ry="5" transform="rotate(35 30 30)"/></g><path d="M16 15c2-2 4-2 5-1M30 14c-2-2-4-2-5-1" stroke="#f1cf6a" stroke-width="1.2" fill="none"/>',
      );
    if (kind === "ore" || kind === "iron")
      return svg(
        '<path d="m8 31 9-18 13 2 10 13-10 11-16-2z" fill="#69736f"/><path d="m17 13 13 2-5 10-13 6z" fill="#a8b3af"/><path d="m12 31 13-6 5 14-16-2z" fill="#818d89"/><path d="m25 25 15 3-10 11z" fill="#535c5a"/>',
      );
    if (kind === "charcoal")
      return svg(
        '<path d="m8 29 8-12 11 3 3 13-14 7z" fill="#353834"/><path d="m25 14 10 5 4 13-11 3-7-10z" fill="#222522"/><path d="m14 22 7-4 5 6-7 6z" fill="#54544a"/><path d="m29 19 5 2-3 6z" fill="#656256"/>',
      );
    if (kind === "wood")
      return svg(
        '<rect x="8" y="18" width="31" height="14" rx="6" fill="#9b6337" transform="rotate(-10 24 25)"/><path d="M11 21c5 1 8 5 7 10M35 18c-4 2-6 7-4 12" stroke="#d19a5b" stroke-width="2" fill="none"/><circle cx="37" cy="23" r="5" fill="#d9a56d"/><circle cx="37" cy="23" r="2.5" fill="none" stroke="#9b6337"/>',
      );
    if (kind === "woodcutter")
      return svg(
        '<path d="m15 37 18-25" stroke="#835236" stroke-width="4" stroke-linecap="round"/><path d="M20 11c9-5 15 1 14 9l-11 1z" fill="#6c7771"/><path d="m22 12 10 8" stroke="#bcc1b8" stroke-width="1.5"/>',
      );
    if (kind === "sickle")
      return svg(
        '<path d="M11 10c14 1 21 10 21 24" stroke="#8a5535" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M17 9c13 3 18 12 15 21-4-7-10-10-18-10z" fill="#a6b5a7"/><path d="M18 10c10 4 14 10 14 20" stroke="#e0e6dd" stroke-width="1.4" fill="none"/>',
      );
    if (kind === "wait")
      return svg(
        '<path d="M14 7h20M14 41h20M17 8c1 8 5 11 7 16-2 5-6 8-7 16M31 8c-1 8-5 11-7 16 2 5 6 8 7 16" fill="none" stroke="#75654f" stroke-width="3" stroke-linecap="round"/><path d="m19 14 10 10-10 10z" fill="#c58a42"/>',
      );
    if (kind === "fire")
      return svg(
        '<path d="M24 42c-10 0-15-7-13-16 2-8 9-10 10-20 7 5 4 12 8 15 3-3 4-7 3-11 8 7 9 14 6 22-2 6-7 10-14 10z" fill="#c85932"/><path d="M24 37c-5 0-8-4-6-9 2-4 5-5 6-10 4 4 5 7 4 11 3-1 4-4 4-6 3 7-1 14-8 14z" fill="#f0a34c"/>',
      );
    return "";
  }
  function statusText(level, state, shown = state.res) {
    return `<span class="move-token"><b>${state.moves}</b><small>MOVES</small></span>${Object.entries(
      level.req,
    )
      .map(
        ([name, amount]) =>
          `<span class="goal-token ${(shown[name] || 0) >= amount ? "done" : ""}" data-resource="${name}">${asset(name)}<span><small>${name}</small><b class="goal-value">${shown[name] || 0} / ${amount}</b></span></span>`,
      )
      .join("")}<span class="world-token">World ${state.worldSteps}</span>`;
  }
  function token(cell) {
    if (cell.fire === "active") return asset("fire", "active-fire-token");
    if (cell.fire === "dying") return asset("fire", "dying-fire-token");
    if (cell.fire === "burnt")
      return '<span class="burnt-ash" aria-hidden="true"></span>';
    return cell.object ? asset(cell.object) : "";
  }
  function showCampaign() {
    renderHome();
    root.SootSeedGame.showScreen("hexCampaignScreen");
  }
  function setMenu() {
    const begin = document.querySelector("#continueCampaign"),
      select = document.querySelector("#openPuzzles"),
      label = document.querySelector("#continueLabel"),
      sub = document.querySelector("#continueSub"),
      p = progress(),
      resume =
        levels.find((level) => unlocked(level, p) && !completed(level, p)) ||
        levels.at(-1);
    if (label) label.textContent = p.completed.length ? "Continue" : "Begin";
    if (sub) sub.textContent = `LOWLANDS · ${resume.number} · ${resume.title}`;
    if (begin) begin.onclick = () => launch(resume.id);
    if (select) select.onclick = showCampaign;
  }
  /* Presentation owns only what the player sees. The hex simulation remains authoritative. */
  const TIMING = Object.freeze({
    POINTER_RESPONSE: 70,
    DIRECTION_SNAP: 60,
    HARVEST_STAGGER: 150,
    LOCAL_HIT: 120,
    RESOURCE_POP: 120,
    RESOURCE_HOLD: 280,
    RESOURCE_FLY: 280,
    RESOURCE_FLY_STAGGER: 40,
    HUD_BOUNCE: 170,
    ACTION_WORLD_PAUSE: 180,
    WORLD_TICK: 120,
    FIRE_ANTICIPATION: 120,
    FIRE_TRAVEL: 180,
    FIRE_IGNITION: 140,
    FIRE_SETTLE: 160,
    SCHEDULED_IGNITION_PAUSE: 120,
    FINAL_WAVE_PAUSE: 150,
    STABLE_TO_RESULT: 350,
    RESULT_ENTER: 260,
  });
  class PresentationQueue {
    constructor() {
      this.cursor = 0;
      this.latest = 0;
    }
    at(time, fn) {
      this.latest = Math.max(this.latest, time);
      later(fn, time);
      return time;
    }
    after(delay, fn) {
      this.cursor += delay;
      return this.at(this.cursor, fn);
    }
    parallel(fn) {
      return this.at(this.cursor, fn);
    }
    finish(fn) {
      return this.at(this.latest, fn);
    }
  }
  let active = null,
    state = null,
    visualState = null,
    history = [],
    logs = [],
    tool = null,
    preview = [],
    gesture = null,
    ended = false,
    notice = "",
    shownRes = null,
    invalidInput = null,
    effectTimers = [],
    effectsLocked = false,
    pendingResult = false,
    resultReady = false,
    gestureBoard = null,
    recoveringPresentation = false;
  const reducedMotion = () =>
    root.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  function installTimingVariables() {
    const style = root.document?.documentElement?.style;
    if (!style) return;
    for (const [name, value] of Object.entries(TIMING))
      style.setProperty(
        `--ss-${name.toLowerCase().replaceAll("_", "-")}`,
        `${value}ms`,
      );
  }
  const later = (fn, delay) => {
    const timer = root.setTimeout(() => {
      effectTimers = effectTimers.filter((x) => x !== timer);
      try {
        fn();
      } catch (error) {
        recoverPresentation(error);
      }
    }, delay);
    effectTimers.push(timer);
    return timer;
  };
  function clearEffects() {
    effectTimers.forEach(root.clearTimeout);
    effectTimers = [];
    effectsLocked = false;
    pendingResult = false;
    resultReady = false;
    root.document
      ?.querySelectorAll(".hex-transient,.hex-flight,.hex-fire-travel")
      .forEach((node) => node.remove());
  }
  function clearGesture(board = gestureBoard) {
    const pointerId = gesture?.pointerId;
    if (board && pointerId !== undefined && board.hasPointerCapture?.(pointerId)) {
      board.releasePointerCapture(pointerId);
    }
    gesture = null;
    gestureBoard = null;
    preview = [];
  }
  function recoverPresentation(error, action = null) {
    if (recoveringPresentation) return;
    recoveringPresentation = true;
    console.error(
      "Hex action commit failed",
      { action, activeLevel: active?.id, gesture, preview, state },
      error,
    );
    clearGesture();
    clearEffects();
    visualState = state;
    shownRes = clone(state.res);
    effectsLocked = false;
    pendingResult = false;
    resultReady = false;
    notice = "Animation recovered.";
    try {
      renderPlay();
    } catch (renderError) {
      console.error("Hex recovery render failed", renderError);
    } finally {
      recoveringPresentation = false;
    }
  }
  function resourceIcon(kind) {
    return asset(kind, "effect-asset");
  }
  function boardForEffects() {
    return root.document?.querySelector("#hexCampaignBoard");
  }
  /* Effects use exactly one coordinate space: viewport coordinates in body. */
  function tileViewport(q, r) {
    const board = boardForEffects(),
      tile = board?.querySelector(`.hex-tile[data-q="${q}"][data-r="${r}"]`);
    if (!board || !tile) return null;
    const rect = tile.getBoundingClientRect();
    return {
      tile,
      rect,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      size: Math.min(76, Math.max(42, Math.min(rect.width, rect.height) * 0.68)),
    };
  }
  function fixedEffect(className, box, html, size = 28) {
    const node = root.document.createElement("span");
    node.className = className;
    node.innerHTML = html || "";
    node.style.left = `${box.x}px`;
    node.style.top = `${box.y}px`;
    node.style.width = `${size}px`;
    node.style.height = `${size}px`;
    root.document.body.append(node);
    return node;
  }
  function bumpResource(kind) {
    shownRes[kind] = (shownRes[kind] || 0) + 1;
    const target = root.document?.querySelector(
        `#hexCampaignPlay [data-resource="${kind}"]`,
      ),
      value = target?.querySelector(".goal-value"),
      amount = active.req[kind];
    if (value) value.textContent = `${shownRes[kind]} / ${amount}`;
    if (target) {
      target.classList.toggle("done", shownRes[kind] >= amount);
      target.classList.remove("hud-bump");
      void target.offsetWidth;
      target.classList.add("hud-bump");
    }
  }
  function flyResource(token, kind, onArrival) {
    const target = root.document?.querySelector(
      `#hexCampaignPlay [data-resource="${kind}"]`,
    );
    if (!target) {
      token.remove();
      onArrival?.();
      return;
    }
    const from = token.getBoundingClientRect(),
      to = target.getBoundingClientRect(),
      flight = root.document.createElement("span");
    flight.className = `hex-flight ${kind}`;
    flight.innerHTML = resourceIcon(kind);
    flight.style.left = `${from.left + from.width / 2}px`;
    flight.style.top = `${from.top + from.height / 2}px`;
    flight.style.setProperty("--flight-size", `${from.width}px`);
    flight.style.setProperty(
      "--flight-end-scale",
      `${Math.min(32, Math.max(26, from.width * 0.42)) / from.width}`,
    );
    flight.style.setProperty(
      "--flight-x",
      `${to.left + to.width / 2 - (from.left + from.width / 2)}px`,
    );
    flight.style.setProperty(
      "--flight-y",
      `${to.top + to.height / 2 - (from.top + from.height / 2)}px`,
    );
    root.document.body.append(flight);
    token.remove();
    if (reducedMotion()) {
      bumpResource(kind);
      flight.remove();
      onArrival?.();
      return;
    }
    requestAnimationFrame(() => flight.classList.add("flying"));
    later(() => {
      bumpResource(kind);
      flight.remove();
      onArrival?.();
    }, TIMING.RESOURCE_FLY);
  }
  /* A resource is always born at its exact tile, then reaches the matching HUD counter. */
  function showResource(q, r, kind, delay = 0, onArrival) {
    later(() => {
      const box = tileViewport(q, r);
      if (!box) {
        onArrival?.();
        return;
      }
      const token = fixedEffect(
        `hex-transient hex-result-token ${kind}`,
        box,
        resourceIcon(kind),
        box.size,
      );
      requestAnimationFrame(() => token.classList.add("visible"));
      later(
        () => flyResource(token, kind, onArrival),
        reducedMotion() ? 20 : TIMING.RESOURCE_POP + TIMING.RESOURCE_HOLD,
      );
    }, delay);
  }
  function clearVisualObject(q, r) {
    const tile = boardForEffects()?.querySelector(
      `.hex-tile[data-q="${q}"][data-r="${r}"]`,
    );
    if (tile) {
      tile.querySelector(".hex-object")?.replaceChildren();
      tile.classList.add("resolved-object");
    }
  }
  function hitTile(q, r, kind, delay = 0) {
    later(() => {
      const box = tileViewport(q, r);
      if (!box) return;
      box.tile.classList.remove("hit");
      void box.tile.offsetWidth;
      box.tile.classList.add("hit");
      const hit = fixedEffect(
        `hex-transient hex-hit ${kind}`,
        box,
        "",
        box.size,
      );
      later(() => hit.remove(), TIMING.LOCAL_HIT + 40);
    }, delay);
  }
  function igniteTile(q, r, delay = 0) {
    later(() => {
      const box = tileViewport(q, r);
      if (!box) return;
      box.tile.classList.remove("ignite");
      void box.tile.offsetWidth;
      box.tile.classList.add("ignite");
      const ember = fixedEffect(
        "hex-transient hex-ignite",
        box,
        "",
        Math.min(34, box.size * 0.55),
      );
      later(() => ember.remove(), TIMING.FIRE_IGNITION + 40);
    }, delay);
  }
  function advanceWorldCounter(value) {
    const world = root.document?.querySelector("#hexCampaignPlay .world-token");
    if (!world) return;
    world.textContent = `World ${value}`;
    world.classList.remove("world-punch");
    void world.offsetWidth;
    world.classList.add("world-punch");
  }
  function pulseFires(cells) {
    const board = boardForEffects();
    for (const cell of cells) {
      const tile = board?.querySelector(
        `.hex-tile[data-q="${cell.q}"][data-r="${cell.r}"]`,
      );
      if (tile) {
        tile.classList.remove("fire-anticipate");
        void tile.offsetWidth;
        tile.classList.add("fire-anticipate");
      }
    }
  }
  function showFireTravel(sources, targets) {
    const board = boardForEffects();
    if (!board || !sources.length || !targets.length) return;
    const lines = [];
    for (const source of sources) {
      const from = tileViewport(source.q, source.r);
      for (const target of targets) {
        if (
          !hex
            .neighbors(source.q, source.r)
            .some((n) => n.q === target.q && n.r === target.r)
        )
          continue;
        const to = tileViewport(target.q, target.r);
        if (from && to)
          lines.push(
            `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"/>`,
          );
      }
    }
    if (!lines.length) return;
    const svg = root.document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    svg.setAttribute("class", "hex-fire-travel");
    svg.setAttribute("viewBox", `0 0 ${root.innerWidth} ${root.innerHeight}`);
    svg.innerHTML = lines.join("");
    root.document.body.append(svg);
    requestAnimationFrame(() => svg.classList.add("travel"));
    later(() => svg.remove(), TIMING.FIRE_TRAVEL + 30);
  }
  function actionEffectCells(before, action) {
    if (action.tool === "woodcutter")
      return hex.cutLine(before, action.q, action.r, action.direction);
    if (action.tool === "sickle")
      return hex.connected(before, action.q, action.r, "wheat");
    if (action.tool === "forge")
      return hex.forgePlan(before, action.q, action.r)?.ore || [];
    return [];
  }
  const cellsWithFire = (stateLike) =>
    Object.values(stateLike.cells).filter(
      (cell) => cell.fire === "active" || cell.fire === "dying",
    );
  const newCharcoal = (from, to) =>
    Object.values(to.cells).filter(
      (cell) =>
        from.cells[cellKey(cell.q, cell.r)]?.object === "tree" &&
        cell.fire === "burnt",
    );
  function scheduledActivated(before, after) {
    return after.scheduledFires
      .filter(
        (fire, index) => fire.fired && !before.scheduledFires[index]?.fired,
      )
      .map((fire) => ({ q: fire.q, r: fire.r }));
  }
  function normalWorldState(before, after, scheduled) {
    if (!scheduled.length) return after;
    const view = clone(after);
    for (const source of scheduled) {
      const was = before.cells[cellKey(source.q, source.r)],
        cell = view.cells[cellKey(source.q, source.r)];
      if (was && cell) cell.fire = was.fire;
      const fire = view.scheduledFires.find(
        (x) => x.q === source.q && x.r === source.r,
      );
      if (fire) fire.fired = false;
    }
    return view;
  }
  function finalFireWaves(afterWorld) {
    const waves = [];
    let cursor = clone(afterWorld);
    while (cellsWithFire(cursor).length && !cursor.lost) {
      const next = clone(cursor);
      hex.resolveFire(active, next, false);
      waves.push({ before: cursor, after: next });
      cursor = next;
    }
    return waves;
  }
  function startResult(success) {
    ended = true;
    pendingResult = false;
    resultReady = false;
    notice = success
      ? "Land secured."
      : state.lost
        ? "The Farmstead burned."
        : "The resources do not meet the goal. Restart to try another line.";
    if (success) markComplete(active);
    renderPlay();
    later(
      () => {
        resultReady = true;
        renderPlay();
      },
      Math.round(TIMING.RESULT_ENTER * 0.78),
    );
  }
  function playPresentation(action, before, afterWorld, waves, finalState) {
    const queue = new PresentationQueue(),
      direct = actionEffectCells(before, action),
      kind =
        action.tool === "woodcutter"
          ? "wood"
          : action.tool === "sickle"
            ? "wheat"
            : action.tool === "forge"
              ? "iron"
              : null,
      stagger = reducedMotion() ? 0 : TIMING.HARVEST_STAGGER;
    let lastResourceArrival = 0;
    effectsLocked = true;
    pendingResult = false;
    if (action.tool === "wait")
      queue.after(90, () =>
        root.document?.querySelector("#hexWait")?.classList.add("wait-pressed"),
      );
    if (kind)
      direct.forEach((cell, index) => {
        const start = 50 + index * stagger,
          pop = start + TIMING.LOCAL_HIT;
        queue.at(start, () => hitTile(cell.q, cell.r, kind));
        queue.at(pop, () => {
          clearVisualObject(cell.q, cell.r);
          showResource(cell.q, cell.r, kind);
        });
        lastResourceArrival = Math.max(
          lastResourceArrival,
          pop +
            (reducedMotion()
              ? 20
              : TIMING.RESOURCE_POP +
                TIMING.RESOURCE_HOLD +
                TIMING.RESOURCE_FLY),
        );
      });
    const directDone = kind
      ? 50 + (direct.length - 1) * stagger + TIMING.LOCAL_HIT
      : 90;
    queue.cursor = Math.max(queue.cursor, directDone);
    queue.after(TIMING.ACTION_WORLD_PAUSE, () =>
      advanceWorldCounter(afterWorld.worldSteps),
    );
    queue.after(TIMING.WORLD_TICK);
    const sources = Object.values(before.cells).filter(
        (cell) => cell.fire === "active",
      ),
      hadNormalFire = cellsWithFire(before).length > 0,
      scheduled = scheduledActivated(before, afterWorld),
      scheduledKeys = new Set(scheduled.map((cell) => cellKey(cell.q, cell.r))),
      normalIgnitions = Object.values(afterWorld.cells).filter(
        (cell) =>
          cell.fire === "active" &&
          before.cells[cellKey(cell.q, cell.r)]?.fire !== "active" &&
          !scheduledKeys.has(cellKey(cell.q, cell.r)),
      ),
      normalView = normalWorldState(before, afterWorld, scheduled);
    if (hadNormalFire) {
      queue.parallel(() => pulseFires(sources));
      queue.after(TIMING.FIRE_ANTICIPATION, () =>
        showFireTravel(sources, normalIgnitions),
      );
      queue.after(TIMING.FIRE_TRAVEL, () => {
        visualState = normalView;
        renderPlay();
        normalIgnitions.forEach((cell, index) =>
          igniteTile(cell.q, cell.r, reducedMotion() ? 0 : index * 40),
        );
      });
      const normalImpactAt = queue.cursor;
      newCharcoal(before, normalView).forEach((cell, index) => {
        const at =
          normalImpactAt +
          TIMING.FIRE_IGNITION +
          index * TIMING.RESOURCE_FLY_STAGGER;
        queue.at(at, () => showResource(cell.q, cell.r, "charcoal"));
        lastResourceArrival = Math.max(
          lastResourceArrival,
          at +
            (reducedMotion()
              ? 20
              : TIMING.RESOURCE_POP +
                TIMING.RESOURCE_HOLD +
                TIMING.RESOURCE_FLY),
        );
      });
      queue.after(TIMING.FIRE_IGNITION + TIMING.FIRE_SETTLE);
    } else {
      queue.parallel(() => {
        visualState = normalView;
        renderPlay();
      });
    }
    if (scheduled.length) {
      queue.after(TIMING.SCHEDULED_IGNITION_PAUSE, () => {});
      queue.after(0, () => {
        visualState = afterWorld;
        renderPlay();
        scheduled.forEach((source) => igniteTile(source.q, source.r));
      });
    }
    for (const wave of waves) {
      queue.after(TIMING.FINAL_WAVE_PAUSE, () =>
        pulseFires(
          Object.values(wave.before.cells).filter(
            (cell) => cell.fire === "active",
          ),
        ),
      );
      const targets = Object.values(wave.after.cells).filter(
        (cell) =>
          cell.fire === "active" &&
          wave.before.cells[cellKey(cell.q, cell.r)]?.fire !== "active",
      );
      queue.after(reducedMotion() ? 20 : 90, () =>
        showFireTravel(
          Object.values(wave.before.cells).filter(
            (cell) => cell.fire === "active",
          ),
          targets,
        ),
      );
      queue.after(reducedMotion() ? 20 : 150, () => {
        visualState = wave.after;
        renderPlay();
        targets.forEach((cell, index) =>
          igniteTile(cell.q, cell.r, reducedMotion() ? 0 : index * 40),
        );
      });
      const waveImpactAt = queue.cursor;
      newCharcoal(wave.before, wave.after).forEach((cell, index) => {
        const at = waveImpactAt + 120 + index * TIMING.RESOURCE_FLY_STAGGER;
        queue.at(at, () => showResource(cell.q, cell.r, "charcoal"));
        lastResourceArrival = Math.max(
          lastResourceArrival,
          at +
            (reducedMotion()
              ? 20
              : TIMING.RESOURCE_POP +
                TIMING.RESOURCE_HOLD +
                TIMING.RESOURCE_FLY),
        );
      });
      queue.after(reducedMotion() ? 20 : TIMING.FIRE_IGNITION + 120);
    }
    queue.finish(() => {
      visualState = finalState;
      renderPlay();
      const terminal =
        finalState.lost || finalState.won || finalState.moves === 0;
      if (terminal) {
        pendingResult = true;
        const resultAt =
          Math.max(0, lastResourceArrival - queue.latest) +
          TIMING.STABLE_TO_RESULT;
        later(() => startResult(finalState.won && !finalState.lost), resultAt);
      } else {
        effectsLocked = false;
        renderPlay();
      }
    });
  }
  function resetPlay() {
    installTimingVariables();
    clearGesture();
    clearEffects();
    state = hex.createInitialState(active);
    visualState = state;
    shownRes = clone(state.res);
    history = [];
    logs = [];
    tool = null;
    ended = false;
    notice = "";
    invalidInput = null;
    renderPlay();
  }
  function commit(action) {
    if (ended || effectsLocked) return;
    let committed = false;
    try {
      const before = clone(state);
      history.push(before);
      const result = hex.applyAction(active, state, action),
        afterWorld = clone(result.state),
        waves = afterWorld.moves === 0 ? finalFireWaves(afterWorld) : [],
        finalState =
          afterWorld.moves === 0
            ? hex.settleFire(active, afterWorld)
            : afterWorld;
      state = finalState;
      committed = true;
      visualState = before;
      logs.push(result.log);
      tool = null;
      clearGesture();
      renderPlay();
      playPresentation(action, before, afterWorld, waves, finalState);
    } catch (error) {
      if (committed) recoverPresentation(error, action);
      else {
        console.error(
          "Hex action commit failed",
          { action, activeLevel: active?.id, gesture, preview, state },
          error,
        );
        clearGesture();
        notice = "That action could not be applied.";
        renderPlay();
      }
    }
  }
  function renderHome() {
    const p = progress(),
      home = document.querySelector("#hexCampaignHome");
    if (!home) return;
    home.hidden = false;
    document.querySelector("#hexCampaignPlay").hidden = true;
    home.innerHTML = `<p class="eyebrow">Chapter 1</p><h1>Lowlands</h1><p class="hex-campaign-lead">Learn how a cut changes what the Fire can reach.</p><div class="hex-level-list">${levels
      .map((level) => {
        const ready = unlocked(level, p),
          done = completed(level, p);
        return `<button class="hex-level-card ${ready ? "ready" : "locked"}" data-level="${level.id}" ${ready ? "" : "disabled"}>${mini(level)}<span class="hex-card-copy"><b>${level.number} · ${level.title}</b><small>${done ? "Secured" : ready ? "Ready" : "Locked"}</small></span></button>`;
      })
      .join(
        "",
      )}</div><details class="hex-dev-access"><summary>Developer controls</summary><p>Temporary test maps only. They do not affect Lowlands progress.</p><button id="openHexSandbox" type="button">Open Hex Lab sandbox</button></details><button id="hexCampaignBack" type="button">Back to menu</button>`;
    home
      .querySelectorAll("[data-level]")
      .forEach(
        (button) => (button.onclick = () => launch(button.dataset.level)),
      );
    home.querySelector("#openHexSandbox").onclick = () =>
      root.SootSeedGame.showScreen("hexLabScreen");
    home.querySelector("#hexCampaignBack").onclick = () =>
      root.SootSeedGame.showMenu();
  }
  function launch(id) {
    active = levels.find((level) => level.id === id);
    if (!active || !unlocked(active)) return;
    const p = progress();
    p.lastPlayed = id;
    save(p);
    document.querySelector("#hexCampaignHome").hidden = true;
    document.querySelector("#hexCampaignPlay").hidden = false;
    root.SootSeedGame.showScreen("hexCampaignScreen");
    resetPlay();
  }
  function resultPanel() {
    if (!ended) return "";
    const success = state.won && !state.lost,
      next = levels.find((level) => level.number === active.number + 1),
      disabled = resultReady ? "" : "disabled";
    return `<section class="hex-result ${success ? "success" : "failure"}" aria-live="polite"><p class="eyebrow">${success ? "LOWLANDS SECURED" : "TRY AGAIN"}</p><h2>${success ? "Land Secured" : "The land needs another path."}</h2><p>${success ? "Every goal is met." : notice || "Undo the last action or restart this puzzle."}</p><div>${success && next ? `<button id="hexNext" ${disabled}>Next Puzzle</button>` : ""}<button id="hexResultReplay" ${disabled}>Replay</button><button id="hexResultSelect" ${disabled}>Puzzle Select</button>${!success && history.length ? `<button id="hexResultUndo" ${disabled}>Undo</button>` : ""}</div></section>`;
  }
  function renderPlay() {
    const host = document.querySelector("#hexCampaignPlay");
    if (!host || !active) return;
    const display = visualState || state,
      l = boardLayout(display),
      scheduled = new Map(
        display.scheduledFires
          .filter((f) => !f.fired)
          .map((f) => [
            cellKey(f.q, f.r),
            Math.max(1, f.after - display.worldSteps),
          ]),
      ),
      centres = preview.map((cell) => {
        const p = l.positionFor(cell);
        return [p.centerX, p.centerY];
      }),
      sweep = centres.length
        ? `<svg class="hex-cut-sweep" viewBox="0 0 ${l.width} ${l.height}" aria-hidden="true"><path d="M ${centres.map((point) => point.join(" ")).join(" L ")}"/></svg>`
        : "",
      playControls = ended
        ? resultPanel()
        : `<div class="hex-campaign-tools">${active.tools.includes("woodcutter") ? `<div class="tool-card direct-tool">${asset("woodcutter")}<span><b>Woodcutter</b><small>Swipe Trees</small></span></div>` : ""}${active.tools.includes("sickle") ? `<div class="tool-card direct-tool">${asset("sickle")}<span><b>Sickle</b><small>Tap Wheat</small></span></div>` : ""}${active.tools.includes("forge") ? `<button class="tool-card ${tool === "forge" ? "selected" : ""}" data-tool="forge">${asset("forge")}<span><b>Forge</b><small>Place on a hex</small></span></button>` : ""}${active.tools.includes("wait") ? `<button id="hexWait" class="tool-card">${asset("wait")}<span><b>WAIT</b><small>0 moves · advance world</small></span></button>` : ""}</div><div class="hex-campaign-actions"><button id="hexUndo" ${history.length && !effectsLocked ? "" : "disabled"}>↶ Undo</button><button id="hexRestart">Restart</button></div><p class="hex-play-note">${gesture ? (gesture.direction ? `Release to cut ${preview.length} Tree${preview.length === 1 ? "" : "s"}.` : "Return to the centre to cancel.") : notice || " "}</p>`;
    const hudState = { ...display, moves: state.moves };
    host.innerHTML = `<header class="hex-play-head"><button id="hexPlayBack" type="button">‹ Puzzles</button><span><small>LEVEL ${active.number}</small>${active.title}</span></header>${active.lesson ? `<p class="hex-lesson">${active.lesson}</p>` : ""}<div class="hex-resources">${statusText(active, hudState, shownRes || state.res)}</div><div id="hexCampaignBoard" class="hex-board hex-campaign-board" aria-label="${active.title} hex board" style="width:${l.width}px;height:${l.height}px;--hex-gap:${l.visualGap}px">${sweep}<div class="hex-effect-layer" aria-hidden="true"></div>${l.cells
      .map((cell) => {
        const p = l.positionFor(cell),
          selected = preview.some((x) => x.q === cell.q && x.r === cell.r),
          grabbed = gesture?.q === cell.q && gesture?.r === cell.r,
          invalid = invalidInput === cellKey(cell.q, cell.r),
          previewClass = selected
            ? grabbed
              ? "preview preview-start"
              : "preview preview-follow"
            : grabbed
              ? "grabbed"
              : "",
          classes = [
            "hex-tile",
            cell.object || "",
            cell.fire === "active" ? "active" : "",
            cell.fire === "dying" ? "dying" : "",
            cell.fire === "burnt" ? "burnt" : "",
            previewClass,
            invalid ? "invalid-input" : "",
          ]
            .filter(Boolean)
            .join(" "),
          count = scheduled.get(cellKey(cell.q, cell.r));
        return `<button class="${classes}" data-q="${cell.q}" data-r="${cell.r}" style="left:${p.left}px;top:${p.top}px;width:${l.g.width}px;height:${l.g.height}px" aria-label="q ${cell.q} r ${cell.r}"><span class="hex-object">${token(cell)}</span>${count ? `<em class="scheduled-ember">${count}</em>` : ""}</button>`;
      })
      .join(
        "",
      )}</div>${playControls}<details class="hex-dev-trace"><summary>Developer details</summary><ol>${logs.map((item) => `<li>${item}</li>`).join("") || "<li>No completed turns.</li>"}</ol></details>`;
    host.querySelector("#hexPlayBack").onclick = () => {
      clearGesture();
      showCampaign();
    };
    host.querySelector("#hexRestart")?.addEventListener("click", resetPlay);
    host.querySelector("#hexUndo")?.addEventListener("click", () => {
      clearGesture();
      clearEffects();
      const prior = history.pop();
      if (prior) state = prior;
      visualState = state;
      shownRes = clone(state.res);
      logs.pop();
      tool = null;
      preview = [];
      gesture = null;
      ended = false;
      notice = "";
      renderPlay();
    });
    host.querySelectorAll("[data-tool]").forEach(
      (button) =>
        (button.onclick = () => {
          tool = tool === button.dataset.tool ? null : button.dataset.tool;
          preview = [];
          notice = "";
          renderPlay();
        }),
    );
    const wait = host.querySelector("#hexWait");
    if (wait) wait.onclick = () => commit({ tool: "wait" });
    host
      .querySelector("#hexResultReplay")
      ?.addEventListener("click", resetPlay);
    host
      .querySelector("#hexResultSelect")
      ?.addEventListener("click", showCampaign);
    host.querySelector("#hexResultUndo")?.addEventListener("click", () => {
      clearGesture();
      clearEffects();
      const prior = history.pop();
      if (prior) state = prior;
      visualState = state;
      shownRes = clone(state.res);
      logs.pop();
      tool = null;
      preview = [];
      gesture = null;
      ended = false;
      notice = "";
      renderPlay();
    });
    host
      .querySelector("#hexNext")
      ?.addEventListener("click", () =>
        launch(levels.find((level) => level.number === active.number + 1).id),
      );
    bindBoard(host.querySelector("#hexCampaignBoard"), l.radius, l.visualGap);
  }
  function flashInvalid(cell) {
    if (!cell) return;
    invalidInput = cellKey(cell.q, cell.r);
    renderPlay();
    later(
      () => {
        invalidInput = null;
        renderPlay();
      },
      reducedMotion() ? 50 : 190,
    );
  }
  function pulsePreview() {
    const board = boardForEffects();
    board?.querySelectorAll(".preview").forEach((tile) => {
      tile.classList.remove("direction-snap");
      void tile.offsetWidth;
      tile.classList.add("direction-snap");
    });
  }
  function bindBoard(board, radius, gap = 0) {
    const cellFromEvent = (event) => {
        const button = event.target.closest?.(".hex-tile");
        return button
          ? state.cells[cellKey(+button.dataset.q, +button.dataset.r)]
          : null;
      },
      canDirect = (name) => !tool && active.tools.includes(name);
    board.onpointerdown = (event) => {
      const cell = cellFromEvent(event);
      if (ended || effectsLocked || pendingResult || tool === "forge") return;
      if (
        canDirect("woodcutter") &&
        cell?.object === "tree" &&
        cell.fire === "normal"
      ) {
        const rect = board.getBoundingClientRect();
        gesture = {
          q: cell.q,
          r: cell.r,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          pointerId: event.pointerId,
          direction: null,
        };
        gestureBoard = board;
        board.setPointerCapture?.(event.pointerId);
        event.preventDefault();
      } else if (cell && cell.object !== "wheat") flashInvalid(cell);
    };
    board.onpointermove = (event) => {
      if (!gesture) return;
      const rect = board.getBoundingClientRect(),
        direction = hex.directionForDrag(
          event.clientX - rect.left - gesture.x,
          event.clientY - rect.top - gesture.y,
          radius,
          gap,
        );
      if (direction !== gesture.direction) {
        gesture.direction = direction;
        preview = direction
          ? hex.cutLine(state, gesture.q, gesture.r, direction)
          : [];
        renderPlay();
        if (direction) pulsePreview();
      }
    };
    board.onpointerup = (event) => {
      if (gesture && event.pointerId === gesture.pointerId) {
        const complete = gesture;
        const line = preview;
        clearGesture(board);
        if (complete.direction && line.length)
          commit({
            tool: "woodcutter",
            q: complete.q,
            r: complete.r,
            direction: complete.direction,
          });
        else {
          renderPlay();
        }
        return;
      }
      const cell = cellFromEvent(event);
      if (ended || effectsLocked || pendingResult || !cell) return;
      if (tool === "forge") {
        if (hex.forgePlan(state, cell.q, cell.r)?.count)
          commit({ tool: "forge", q: cell.q, r: cell.r });
        else flashInvalid(cell);
        return;
      }
      if (canDirect("sickle")) {
        if (cell.object === "wheat" && cell.fire === "normal")
          commit({ tool: "sickle", q: cell.q, r: cell.r });
        else if (cell.object !== "tree") flashInvalid(cell);
      }
    };
    board.onpointercancel = () => {
      clearGesture(board);
      renderPlay();
    };
  }
  function mount() {
    if (!root.document || document.querySelector("#hexCampaignScreen")) return;
    const screen = document.createElement("section");
    screen.id = "hexCampaignScreen";
    screen.className = "screen";
    screen.setAttribute("aria-label", "Lowlands Hex campaign");
    screen.innerHTML =
      '<main class="hex-campaign"><div id="hexCampaignHome"></div><div id="hexCampaignPlay" hidden></div></main>';
    document.body.append(screen);
    const style = document.createElement("style");
    style.textContent =
      ".hex-campaign{max-width:620px;margin:auto;padding:24px 12px 42px;color:#373b32}.hex-campaign h1{margin:.15em 0}.hex-campaign-lead,.hex-lesson{color:#6c6457;line-height:1.42}.hex-level-list{display:grid;gap:9px;margin:18px 0}.hex-level-card{display:flex;align-items:center;gap:12px;text-align:left;border:1px solid #cbb994;border-radius:13px;background:#fff9ed;padding:8px 12px;color:#373b32;font:inherit}.hex-level-card.locked{opacity:.46}.hex-card-copy{display:grid;gap:3px}.hex-card-copy small{color:#796f5d}.hex-mini{position:relative;flex:none;overflow:visible}.hex-mini i{position:absolute;clip-path:polygon(0% 50%,25% 0%,75% 0%,100% 50%,75% 100%,25% 100%);background:#a9bb91}.hex-mini i.tree{background:#769567}.hex-mini i.wheat{background:#d8b960}.hex-mini i.active{background:#d16b38}.hex-dev-access{margin:18px 0;padding:11px;border:1px solid #cdbb9e;border-radius:10px}.hex-campaign button{font:inherit;border:1px solid #aa916d;border-radius:10px;padding:9px 11px;background:#fff9ed;color:#3b4034}.hex-play-head{display:flex;justify-content:space-between;align-items:center;font-weight:800;margin-bottom:5px}.hex-play-head button{padding:6px 8px}.hex-lesson{min-height:2.6em;margin:5px 0}.hex-resources{display:flex;gap:6px;flex-wrap:wrap;margin:7px 0}.hex-resources span{padding:4px 7px;border-radius:7px;background:#f5efe2;border:1px solid #d8c9af;font-size:.76rem;font-weight:700}.hex-campaign-board{margin:8px auto 12px}.hex-campaign-board .hex-tile{font-size:clamp(1rem,5vw,1.35rem)}.hex-campaign-board em{position:absolute;right:16%;top:18%;font-style:normal;font-size:.65em;background:#4c3e30;color:#fff8d6;border-radius:50%;min-width:1.15em;line-height:1.15em}.hex-campaign-board .preview{filter:brightness(1.18) drop-shadow(0 0 0 #f4c85b)}.hex-campaign-tools,.hex-campaign-actions{display:flex;gap:8px;flex-wrap:wrap;margin:9px 0}.hex-campaign-tools button{display:grid;gap:2px}.hex-campaign-tools small{font-size:.67rem;color:#70695d}.hex-play-note{min-height:1.4em;color:#705e43;font-size:.88rem}.hex-play-history{margin:7px 0;padding-left:22px;font-size:.82rem;color:#5e594f}@media(max-width:390px){.hex-campaign{padding-left:8px;padding-right:8px}.hex-level-card{padding:7px 9px}}";
    document.head.append(style);
    const baseShowMenu = root.SootSeedGame.showMenu;
    root.SootSeedGame.showMenu = () => {
      baseShowMenu();
      setMenu();
    };
    root.addEventListener?.("resize", () => {
      if (active && !document.querySelector("#hexCampaignPlay").hidden)
        renderPlay();
    });
    setMenu();
    renderHome();
  }
  root.SootSeedHexCampaign = {
    storageKey,
    levels,
    progress,
    showCampaign,
    launch,
    mount,
    layoutHexes: boardLayout,
    presentationTiming: TIMING,
  };
  if (root.document) mount();
})(globalThis);

/* Production scale overrides: board objects are intentionally larger than HUD tokens. */
(function(root){if(!root.document)return;const style=document.createElement("style");style.textContent=`
  .hex-campaign-board .hex-object{width:86%;height:86%}
  .hex-campaign-board .hex-object .active-fire-token{width:92%;height:92%}
  .hex-campaign-board .hex-object .dying-fire-token{width:67%;height:67%}
  body .hex-flight{width:var(--flight-size,30px);height:var(--flight-size,30px);transform:translate(-50%,-50%) scale(1)}
  body .hex-flight.flying{transform:translate(calc(-50% + var(--flight-x)),calc(-50% + var(--flight-y))) scale(var(--flight-end-scale,.55))}
  .hex-result-token{transition:opacity .1s ease,transform .13s cubic-bezier(.2,.9,.3,1.2)}
`;document.head.append(style)})(globalThis);

/* Presentation timing skin. Durations are supplied as CSS variables from TIMING above. */
(function (root) {
  if (!root.document) return;
  const style = document.createElement("style");
  style.textContent = `
  .hex-campaign-board .hex-tile.direction-snap{animation-duration:var(--ss-direction-snap)}
  .hex-campaign-board .hex-tile.hit{animation-duration:var(--ss-local-hit)}
  .hex-campaign-board .hex-tile.ignite{animation-duration:var(--ss-fire-ignition)}
  .hex-result{animation:hex-result-enter var(--ss-result-enter) cubic-bezier(.2,.85,.25,1) both}
  .hex-result button:disabled{opacity:.58;pointer-events:none}
  .world-token.world-punch{animation:hex-world-punch var(--ss-world-tick) ease-out}
  .hex-campaign-board .hex-tile.fire-anticipate .active-fire-token{animation:hex-fire-anticipate var(--ss-fire-anticipation) ease-in-out both}
  .tool-card.wait-pressed{animation:hex-wait-press 90ms ease-out}
  .hex-hit{animation-duration:var(--ss-local-hit)}
  .hex-result-token{transition-duration:var(--ss-resource-pop)}
  .hex-flight{transition-duration:var(--ss-resource-fly)}
  .goal-token.hud-bump .goal-value,.goal-token.hud-bump>.hex-asset{animation-duration:var(--ss-hud-bounce)}
  .hex-fire-travel{position:fixed;inset:0;width:100vw;height:100vh;z-index:98;pointer-events:none;overflow:visible}
  .hex-fire-travel line{stroke:#f2a24a;stroke-width:3;stroke-linecap:round;opacity:0;stroke-dasharray:3 7;filter:drop-shadow(0 0 2px #b94b28);transition:opacity 40ms ease}
  .hex-fire-travel.travel line{opacity:.82;animation:hex-fire-travel var(--ss-fire-travel) ease-out both}
  @keyframes hex-result-enter{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
  @keyframes hex-world-punch{0%,100%{transform:scale(1)}45%{transform:scale(1.12);color:#8f5e2d}}
  @keyframes hex-fire-anticipate{0%,100%{transform:scale(1)}45%{transform:scale(1.17);filter:brightness(1.28) drop-shadow(0 0 4px #ffb252)}}
  @keyframes hex-wait-press{0%,100%{transform:scale(1)}45%{transform:scale(.96);background:#ead9b6}}
  @keyframes hex-fire-travel{from{stroke-dashoffset:22;opacity:.2}to{stroke-dashoffset:0;opacity:0}}
  @media(prefers-reduced-motion:reduce){.hex-fire-travel{display:none}.hex-result{animation-duration:1ms!important}}
`;
  document.head.append(style);
})(globalThis);

/* Production visual layer: regular geometry remains owned by the hex renderer. */
(function (root) {
  if (!root.document) return;
  const style = document.createElement("style");
  style.textContent = `
  .hex-campaign{padding-top:14px;background:linear-gradient(180deg,#f7f0df 0%,#f3ead7 100%);min-height:100vh;font-family:ui-rounded,"Avenir Next",system-ui,sans-serif}
  .hex-campaign .eyebrow,.hex-play-head small{font-size:.67rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#82755f}
  .hex-campaign h1{font-family:Georgia,serif;font-size:2.15rem;letter-spacing:-.04em;color:#39382e}
  .hex-campaign-lead{margin:.2rem 0 1rem;font-size:.95rem}.hex-level-card{background:#fff9ed;border-color:#dac9ad;box-shadow:0 3px 9px #725a3518}.hex-level-card.ready{box-shadow:0 3px 9px #725a3518,inset 0 1px #fffdf6}.hex-level-card.ready:active{background:#edf3e4}.hex-mini{position:relative;width:82px;height:74px;flex:0 0 82px;overflow:hidden;border-radius:10px;background:#79915f;isolation:isolate}.hex-mini-scene{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}.hex-mini i{background:#92a774}.hex-mini i.tree{background:#5e814d}.hex-mini i.wheat{background:#d6af4d}.hex-mini i.active{background:#d26a34}
  .hex-play-head{min-height:30px;color:#3e3c32;font-family:Georgia,serif;font-size:1.24rem}.hex-play-head>span{display:grid;justify-items:end;line-height:1.05}.hex-play-head button{background:#fffaf0;border-color:#d4c2a4;color:#675b4b;font-family:inherit;font-weight:700}.hex-lesson{min-height:0;margin:3px 0 8px;padding:7px 9px;border-left:3px solid #b58d4f;background:#fbf5e8;color:#706650;font-size:.83rem;font-weight:650}
  .hex-resources{display:grid;grid-template-columns:repeat(2,minmax(0,1fr)) auto;gap:6px;margin:6px 0 9px}.hex-resources .goal-token,.hex-resources .move-token,.hex-resources .world-token{min-height:43px;box-sizing:border-box;border:1px solid #ded2bd;border-radius:11px;background:#fffaf0;box-shadow:0 2px 5px #715c3e18;display:flex;align-items:center;gap:5px;padding:5px 7px;color:#716757}.hex-resources .goal-token.done{background:#edf4e6;border-color:#a8c28d}.goal-token .hex-asset{width:25px;height:25px;flex:none}.goal-token span{display:grid;gap:1px;line-height:1}.goal-token small,.move-token small{font-size:.57rem;font-weight:900;letter-spacing:.09em;text-transform:uppercase}.goal-token b{font-size:.83rem;color:#3c4037}.move-token{display:grid!important;justify-items:center;align-content:center;gap:1px;min-width:54px;color:#7e694d!important}.move-token b{font-size:1.24rem;line-height:1;color:#a06d30}.world-token{grid-column:1/-1;min-height:0!important;justify-content:center;padding:3px 7px!important;border:0!important;background:transparent!important;box-shadow:none!important;color:#998e7d!important;font-size:.62rem!important}
  .hex-campaign-board{border:7px solid #8a633d;box-shadow:inset 0 0 0 2px #c49a66,0 3px 9px #51371938;background:#6f875e!important;border-radius:18px}.hex-campaign-board .hex-tile{background:linear-gradient(135deg,#8fa66f,#819a66)!important;filter:none;border:0;overflow:visible;color:inherit;transition:filter .12s ease,transform .12s ease,background .12s ease}.hex-campaign-board .hex-tile::after{content:"";position:absolute;inset:6%;clip-path:inherit;background:radial-gradient(circle at 34% 26%,#c4d0a544,transparent 39%);pointer-events:none}.hex-campaign-board .hex-tile.active{background:linear-gradient(135deg,#a94d31,#c96836)!important}.hex-campaign-board .hex-tile.dying{background:linear-gradient(135deg,#77583e,#6b5946)!important}.hex-campaign-board .hex-tile.burnt{background:linear-gradient(135deg,#5e6152,#70715d)!important}.hex-object{position:relative;z-index:2;display:grid;place-items:center;width:74%;height:74%;margin:auto}.hex-object .hex-asset{width:100%;height:100%;filter:drop-shadow(0 2px 1px #2d3b2d55)}.hex-object .active-fire-token{width:82%;height:82%;filter:drop-shadow(0 2px 4px #762712aa)}.hex-object .dying-fire-token{width:57%;height:57%;opacity:.7;filter:grayscale(.18) drop-shadow(0 1px 2px #452e21aa)}.burnt-ash{width:45%;height:23%;border-radius:50%;background:radial-gradient(ellipse,#2d302c 0 25%,#4a4b41 27% 48%,transparent 51%);opacity:.75}.scheduled-ember{z-index:3;position:absolute;right:12%;top:10%;font-style:normal;font-weight:900;font-size:.58em;background:#563b2e;color:#ffe9ad;border:1px solid #ce8044;border-radius:50%;min-width:1.35em;line-height:1.35em;box-shadow:0 1px 3px #47231399}.hex-cut-sweep{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:visible}.hex-cut-sweep path{fill:none;stroke:#f6d474;stroke-width:5;stroke-linecap:round;filter:drop-shadow(0 1px 1px #5d432299)}.hex-campaign-board .hex-tile.preview{background:linear-gradient(135deg,#a8bd83,#8fa76d)!important;filter:brightness(1.08)!important;transform:translateY(-2px) scale(1.025);z-index:4}.hex-campaign-board .hex-tile.preview .hex-asset{filter:drop-shadow(0 4px 2px #40502b66)}
  .hex-campaign-board .hex-tile{transform:scale(var(--hex-scale,1));transform-origin:center}.hex-mini i{transform:scale(var(--hex-scale,1));transform-origin:center}.hex-campaign-board .hex-tile.preview{transform:translateY(-2px) scale(calc(var(--hex-scale,1) + .025))!important}.hex-campaign-board .hex-tile.preview-start,.hex-campaign-board .hex-tile.grabbed{filter:brightness(1.15) drop-shadow(0 3px 3px #34472d77)!important;z-index:5}.hex-campaign-board .hex-tile.preview-follow{z-index:4}.hex-campaign-board .hex-tile.direction-snap{animation:hex-direction-snap .14s ease-out}.hex-campaign-board .hex-tile.hit{animation:hex-hit .16s ease-out}.hex-campaign-board .hex-tile.ignite{animation:hex-ignite .22s ease-out}.hex-campaign-board .hex-tile.invalid-input{animation:hex-invalid .18s ease-in-out}.hex-effect-layer{position:absolute;inset:0;z-index:8;pointer-events:none}.hex-transient{position:fixed;pointer-events:none;z-index:99;transform:translate(-50%,-50%)}.hex-hit{border-radius:50%;box-sizing:border-box;transform:translate(-50%,-50%) rotate(-35deg) scale(.38);opacity:0;animation:hex-hit-mark .17s ease-out}.hex-hit::after{content:"";position:absolute;left:47%;top:-8%;width:5px;height:116%;border-radius:6px;background:#fffdf0;box-shadow:7px 8px 0 -1px #e2bb7c,-8px 19px 0 -2px #c58448}.hex-result-token{display:grid;place-items:center;opacity:0;transform:translate(-50%,-50%) scale(.65);filter:drop-shadow(0 2px 2px #2b261c66);transition:opacity .1s ease,transform .13s cubic-bezier(.2,.9,.3,1.2)}.hex-result-token.visible{opacity:1;transform:translate(-50%,-50%) scale(1)}.hex-result-token .hex-asset{width:100%;height:100%}.hex-ignite{border-radius:50%;background:radial-gradient(circle,#ffe197 0 12%,#ef8b3c 16% 36%,#b84e32 40%,transparent 68%);animation:hex-ember .23s ease-out}.hex-flight{position:fixed;z-index:99;width:28px;height:28px;pointer-events:none;transform:translate(-50%,-50%) scale(.8);opacity:1;transition:transform .28s cubic-bezier(.2,.75,.25,1),opacity .28s ease}.hex-flight .hex-asset{width:100%;height:100%;filter:drop-shadow(0 2px 2px #392f2266)}.hex-flight.flying{transform:translate(calc(-50% + var(--flight-x)),calc(-50% + var(--flight-y))) scale(.55);opacity:.4}.goal-token.hud-bump .goal-value,.goal-token.hud-bump>.hex-asset{animation:hex-hud-bump .18s ease-out}.hex-campaign-tools{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px;margin-top:12px}.hex-campaign-tools .tool-card{min-height:64px;display:flex;align-items:center;justify-content:flex-start;gap:8px;text-align:left;border:1px solid #ded2bd;border-radius:13px;background:#fffaf0;box-shadow:0 2px 6px #715c3e18,inset 0 1px #fffdf6;padding:8px 10px}.tool-card .hex-asset{width:36px;height:36px;flex:none;filter:drop-shadow(0 2px 1px #59463144)}.tool-card span{display:grid;gap:2px}.tool-card b{font-size:.87rem;color:#464035}.tool-card small{font-size:.67rem;color:#807568}.tool-card.selected{background:#e5efda;border-color:#96ac82;box-shadow:inset 0 -2px #7890672e,0 2px 6px #5f71451c}.hex-campaign-actions{justify-content:center;margin:10px 0 3px}.hex-campaign-actions button{border-color:#d4c4ab;background:#fffaf0;color:#6d6356}.hex-play-note{margin:3px 0;min-height:1.25em;text-align:center;color:#776343;font-size:.78rem;font-weight:700}.hex-dev-trace{margin:12px 0 0;color:#8b8173;font-size:.72rem}.hex-dev-trace ol{margin:6px 0;padding-left:18px}
  .hex-result{position:relative;margin:13px 0 4px;padding:18px;border:1px solid #d8c6a8;border-radius:15px;background:#fff9ed;box-shadow:0 8px 24px #59452c22;text-align:center}.hex-result.success{border-color:#a7bd88;background:#f1f6e9}.hex-result h2{margin:2px 0 5px;font-family:Georgia,serif;color:#3d4938}.hex-result p{margin:0 0 12px;color:#706555;font-size:.85rem}.hex-result>div{display:flex;justify-content:center;gap:7px;flex-wrap:wrap}.hex-result button{background:#fffaf0;border-color:#cdb58e;color:#544a3c}.hex-result.success button:first-child{background:#70885a;border-color:#60774d;color:#fffdf3}
  @keyframes hex-direction-snap{0%{filter:brightness(1.32)}100%{filter:brightness(1.08)}}@keyframes hex-hit{0%,100%{transform:scale(var(--hex-scale,1))}45%{transform:scale(.91) translateY(2px)}}@keyframes hex-hit-mark{0%{opacity:1;transform:translate(-50%,-50%) rotate(-35deg) scale(.32)}100%{opacity:0;transform:translate(-50%,-50%) rotate(-35deg) scale(1.14)}}@keyframes hex-ignite{0%{filter:brightness(1)}45%{filter:brightness(1.35) saturate(1.35)}100%{filter:brightness(1)}}@keyframes hex-ember{0%{transform:scale(.2);opacity:0}35%{opacity:1}100%{transform:scale(1.35);opacity:0}}@keyframes hex-invalid{0%,100%{transform:scale(var(--hex-scale,1))}28%{transform:translateX(-3px) scale(var(--hex-scale,1))}70%{transform:translateX(3px) scale(var(--hex-scale,1))}}@keyframes hex-hud-bump{0%,100%{transform:scale(1)}45%{transform:scale(1.18)}}@media(prefers-reduced-motion:reduce){.hex-campaign-board .hex-tile,.hex-result-token,.hex-flight{transition-duration:.01ms!important;animation-duration:.01ms!important}.hex-cut-sweep path{transition:none}.hex-hit,.hex-ignite{display:none}}
  @media(max-width:390px){.hex-campaign{padding-left:8px;padding-right:8px}.hex-resources{gap:5px}.hex-resources .goal-token{padding:5px}.hex-campaign-tools{grid-template-columns:1fr}.hex-campaign-board{border-width:6px}}
`;
  document.head.append(style);
})(globalThis);
