/* ====================================================================
   MODO PRESENTACIÓN · Conecta Contigo
   Archivo: assets/js/presentacion.js
   - Independiente de tu general.js (no lo toca ni lo necesita).
   - PDF.js se descarga SOLO cuando el usuario abre la presentación.
   - Solo se dibuja la página actual; la siguiente se deja preparada.
==================================================================== */

(function () {
    "use strict";

    // Evita ejecutarse dos veces si el script se incluye por error dos veces.
    if (window.__ccPresentationLoaded) return;
    window.__ccPresentationLoaded = true;

    /* ================================================================
       CONFIGURACIÓN (lo único que quizá quieras cambiar)
    ================================================================ */
    const CONFIG = {
        // Ruta por defecto si el botón no trae data-pdf
        pdfPorDefecto: "Assets/Imágenes/conecta-contigo.pdf",

        // PDF.js (versión estable 3.11.174 desde cdnjs)
        pdfjsScript: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
        pdfjsWorker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",

        // Zoom (1 = página ajustada a la pantalla)
        zoomMin: 0.5,
        zoomMax: 4,
        zoomPaso: 0.25,

        // Límites de memoria del canvas
        maxPixelesCanvas: 12000000,
        maxRatioPixeles: 3,

        // Zonas de clic/tap: izquierda = anterior, derecha = siguiente
        zonaIzquierda: 0.35,
        zonaDerecha: 0.65
    };

    /* ================================================================
       ESTADO Y ELEMENTOS
    ================================================================ */
    const state = {
        open: false,
        session: 0,           // cambia en cada apertura/cierre (ignora respuestas viejas)
        url: "",
        opener: null,

        pdf: null,
        total: 0,
        page: 1,
        zoom: 1,

        docPromise: null,
        docUrl: "",
        pdfjsPromise: null,

        renderToken: 0,
        renderTask: null,
        renderTimer: null,
        base: null,           // tamaño original de la página mostrada
        fit: 1,               // escala que ajusta la página al área disponible

        pseudoFs: false,      // "pantalla completa" simulada (iPhone)
        lastFsChange: 0,
        lastSize: "",
        closeTimer: null,
        drag: null,
        pinch: null,
        swipe: null,
        gestureLock: false,
        scrollBackup: null
    };

    const els = {};
    let resizeObserver = null;

    const $ = (id) => document.getElementById(id);

    /* ================================================================
       INICIO
    ================================================================ */
    function init() {
        els.modal = $("presentation-modal");
        els.dialog = $("presentation-dialog");
        els.title = $("presentation-title");
        els.body = $("presentation-body");
        els.stage = $("presentation-stage");
        els.pageWrap = $("presentation-page");
        els.loading = $("presentation-loading");
        els.loadingText = $("presentation-loading-text");
        els.error = $("presentation-error");
        els.errorLink = $("presentation-error-link");
        els.retry = $("presentation-retry");
        els.newTab = $("presentation-newtab");
        els.close = $("presentation-close");
        els.prev = $("presentation-prev");
        els.next = $("presentation-next");
        els.counter = $("presentation-counter");
        els.zoomIn = $("presentation-zoom-in");
        els.zoomOut = $("presentation-zoom-out");
        els.zoomReset = $("presentation-zoom-reset");
        els.fs = $("presentation-fullscreen");
        els.fsText = $("presentation-fullscreen-text");
        els.progress = $("presentation-progress-bar");

        if (!els.modal || !els.dialog || !els.stage || !els.pageWrap) {
            console.warn("[Presentación] No se encontró el bloque HTML del modal. Revisa el Bloque 2.");
            return;
        }

        // Llevamos el modal al final del <body> para que ningún contenedor
        // de tu página (overflow, transform, z-index) pueda afectarlo.
        if (els.modal.parentElement !== document.body) {
            document.body.appendChild(els.modal);
        }

        // Abrir (delegado: funciona con cualquier botón [data-presentation-open])
        document.addEventListener("click", function (e) {
            const trigger = e.target.closest && e.target.closest("[data-presentation-open]");
            if (!trigger) return;
            e.preventDefault();
            openViewer(trigger);
        });

        // Botones
        els.close.addEventListener("click", closeViewer);
        els.prev.addEventListener("click", function () { goTo(state.page - 1); });
        els.next.addEventListener("click", function () { goTo(state.page + 1); });
        els.zoomIn.addEventListener("click", zoomIn);
        els.zoomOut.addEventListener("click", zoomOut);
        els.zoomReset.addEventListener("click", resetZoom);
        els.fs.addEventListener("click", toggleFullscreen);
        els.retry.addEventListener("click", function () {
            state.docPromise = null;
            startLoad();
        });

        // Cerrar haciendo clic en el overlay (solo si el clic empezó y terminó allí)
        let downOnOverlay = false;
        els.modal.addEventListener("pointerdown", function (e) {
            downOnOverlay = (e.target === els.modal);
        });
        els.modal.addEventListener("click", function (e) {
            if (e.target === els.modal && downOnOverlay) closeViewer();
            downOnOverlay = false;
        });

        // Interacción con el área de la página
        els.stage.addEventListener("click", onStageClick);
        els.stage.addEventListener("pointermove", onStageMove);
        els.stage.addEventListener("pointerleave", function () { setSide(""); });
        els.stage.addEventListener("pointerdown", onDragStart);
        els.stage.addEventListener("pointerup", onDragEnd);
        els.stage.addEventListener("pointercancel", onDragEnd);
        els.stage.addEventListener("wheel", onWheel, { passive: false });
        els.stage.addEventListener("touchstart", onTouchStart, { passive: true });
        els.stage.addEventListener("touchmove", onTouchMove, { passive: false });
        els.stage.addEventListener("touchend", onTouchEnd, { passive: true });
        els.stage.addEventListener("touchcancel", onTouchEnd, { passive: true });

        // Pantalla completa (siempre escuchando para mantener la interfaz sincronizada)
        document.addEventListener("fullscreenchange", onFullscreenChange);
        document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    }

    /* ================================================================
       ABRIR / CERRAR
    ================================================================ */
    function openViewer(trigger) {
        if (state.open) return;

        clearTimeout(state.closeTimer);

        const rawPath = (trigger && trigger.getAttribute("data-pdf")) || CONFIG.pdfPorDefecto;
        const url = resolveUrl(rawPath);

        state.open = true;
        state.session++;
        state.opener = trigger || null;
        state.url = url;
        state.page = 1;
        state.zoom = 1;
        state.base = null;

        if (state.docUrl !== url) {
            state.pdf = null;
            state.total = 0;
        }

        els.title.textContent = (trigger && trigger.getAttribute("data-title")) || "Conecta Contigo · Presentación";
        els.newTab.setAttribute("href", url);
        els.errorLink.setAttribute("href", url);
        els.stage.scrollLeft = 0;
        els.stage.scrollTop = 0;

        // Mostrar modal (primero quitamos hidden, luego animamos)
        els.modal.hidden = false;
        void els.modal.offsetWidth; // fuerza el recálculo para que la animación funcione
        els.modal.classList.add("is-open");

        lockScroll();
        document.addEventListener("keydown", onKeydown, true);
        window.addEventListener("resize", onWindowResize);
        window.addEventListener("orientationchange", onWindowResize);

        if ("ResizeObserver" in window) {
            state.lastSize = "";
            resizeObserver = new ResizeObserver(onStageResize);
            resizeObserver.observe(els.stage);
        }

        updateUI();
        try { els.stage.focus({ preventScroll: true }); } catch (err) { /* sin foco */ }

        startLoad();
    }

    function closeViewer() {
        if (!state.open) return;

        state.open = false;
        state.session++;

        clearTimeout(state.renderTimer);
        cancelRender();

        if (isNativeFullscreen()) exitNativeFullscreen();
        if (state.pseudoFs) setPseudoFullscreen(false);

        els.modal.classList.remove("is-open");
        setSide("");
        endDrag();
        state.pinch = null;
        state.swipe = null;
        state.gestureLock = false;

        document.removeEventListener("keydown", onKeydown, true);
        window.removeEventListener("resize", onWindowResize);
        window.removeEventListener("orientationchange", onWindowResize);

        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }

        unlockScroll();

        // Al terminar la animación: ocultar del todo y liberar memoria del canvas
        clearTimeout(state.closeTimer);
        state.closeTimer = setTimeout(function () {
            if (state.open) return;
            els.modal.hidden = true;
            els.pageWrap.replaceChildren();
        }, 300);

        // Devolver el foco al botón que abrió la presentación
        const opener = state.opener;
        state.opener = null;
        if (opener && document.contains(opener)) {
            try { opener.focus({ preventScroll: true }); } catch (err) { /* sin foco */ }
        }
    }

    /* ================================================================
       BLOQUEO DE SCROLL DEL BODY
    ================================================================ */
    function lockScroll() {
        if (state.scrollBackup) return;
        const html = document.documentElement;
        const body = document.body;
        const scrollbar = window.innerWidth - html.clientWidth;

        state.scrollBackup = {
            htmlOverflow: html.style.overflow,
            bodyOverflow: body.style.overflow,
            bodyPaddingRight: body.style.paddingRight
        };

        html.style.overflow = "hidden";
        body.style.overflow = "hidden";
        if (scrollbar > 0) {
            const actual = parseFloat(getComputedStyle(body).paddingRight) || 0;
            body.style.paddingRight = (actual + scrollbar) + "px";
        }
    }

    function unlockScroll() {
        if (!state.scrollBackup) return;
        const html = document.documentElement;
        const body = document.body;
        html.style.overflow = state.scrollBackup.htmlOverflow;
        body.style.overflow = state.scrollBackup.bodyOverflow;
        body.style.paddingRight = state.scrollBackup.bodyPaddingRight;
        state.scrollBackup = null;
    }

    /* ================================================================
       PDF.js: CARGA BAJO DEMANDA
    ================================================================ */
    function loadPdfJs() {
        if (window.pdfjsLib) {
            if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.pdfjsWorker;
            }
            return Promise.resolve(window.pdfjsLib);
        }
        if (state.pdfjsPromise) return state.pdfjsPromise;

        state.pdfjsPromise = new Promise(function (resolve, reject) {
            const script = document.createElement("script");
            script.src = CONFIG.pdfjsScript;
            script.async = true;
            script.onload = function () {
                if (window.pdfjsLib) {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = CONFIG.pdfjsWorker;
                    resolve(window.pdfjsLib);
                } else {
                    state.pdfjsPromise = null;
                    reject(new Error("PDF.js se descargó pero no está disponible."));
                }
            };
            script.onerror = function () {
                state.pdfjsPromise = null;
                reject(new Error("No se pudo descargar PDF.js."));
            };
            document.head.appendChild(script);
        });

        return state.pdfjsPromise;
    }

    function ensureDocument(url) {
        if (state.docPromise && state.docUrl === url) return state.docPromise;

        state.docUrl = url;
        state.docPromise = loadPdfJs()
            .then(function (lib) {
                const task = lib.getDocument({ url: url });
                task.onProgress = function (p) {
                    if (state.open && p && p.total > 0 && !els.loading.hidden) {
                        const pct = Math.min(100, Math.round((p.loaded / p.total) * 100));
                        els.loadingText.textContent = "Cargando presentación… " + pct + "%";
                    }
                };
                return task.promise;
            })
            .then(function (pdf) {
                state.pdf = pdf;
                state.total = pdf.numPages;
                return pdf;
            })
            .catch(function (err) {
                state.docPromise = null;
                state.docUrl = "";
                state.pdf = null;
                state.total = 0;
                throw err;
            });

        return state.docPromise;
    }

    async function startLoad() {
        const session = state.session;
        showLoading("Cargando presentación…");
        els.pageWrap.replaceChildren();
        updateUI();

        try {
            await ensureDocument(state.url);
            if (session !== state.session || !state.open) return;
            if (!state.total) throw new Error("El PDF no tiene páginas.");

            hideLoading();
            state.page = 1;
            updateUI();
            renderCurrent();
            prefetch(2);
            try { els.stage.focus({ preventScroll: true }); } catch (err) { /* sin foco */ }
        } catch (err) {
            console.error("[Presentación] Error al cargar el PDF:", err);
            if (session === state.session && state.open) showError();
        }
    }

    /* ================================================================
       DIBUJAR LA PÁGINA ACTUAL
    ================================================================ */
    function getAvailable() {
        const cs = getComputedStyle(els.stage);
        const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
        const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
        return {
            w: Math.floor(els.stage.offsetWidth - padX),
            h: Math.floor(els.stage.offsetHeight - padY)
        };
    }

    function cancelRender() {
        state.renderToken++;
        if (state.renderTask) {
            try { state.renderTask.cancel(); } catch (err) { /* ya terminó */ }
            state.renderTask = null;
        }
    }

    function scheduleRender(delay) {
        if (!state.open || !state.pdf) return;
        cancelRender();
        clearTimeout(state.renderTimer);
        state.renderTimer = setTimeout(renderCurrent, delay);
    }

    async function renderCurrent() {
        if (!state.open || !state.pdf) return;

        cancelRender();
        const token = state.renderToken;
        const session = state.session;
        const pageNumber = state.page;
        const zoom = state.zoom;

        try {
            const page = await state.pdf.getPage(pageNumber);
            if (token !== state.renderToken || session !== state.session) return;

            const avail = getAvailable();
            if (avail.w < 20 || avail.h < 20) return;

            const base = page.getViewport({ scale: 1 });
            const fit = Math.min(avail.w / base.width, avail.h / base.height);
            const cssScale = fit * zoom;
            const cssW = Math.max(1, Math.floor(base.width * cssScale));
            const cssH = Math.max(1, Math.floor(base.height * cssScale));

            // Nitidez: usamos la densidad de píxeles del dispositivo, con tope de memoria
            let ratio = Math.min(window.devicePixelRatio || 1, CONFIG.maxRatioPixeles);
            const pixels = cssW * cssH * ratio * ratio;
            if (pixels > CONFIG.maxPixelesCanvas) {
                ratio *= Math.sqrt(CONFIG.maxPixelesCanvas / pixels);
            }

            const viewport = page.getViewport({ scale: cssScale * ratio });
            const canvas = document.createElement("canvas");
            canvas.className = "presentation-canvas";
            canvas.width = Math.max(1, Math.floor(viewport.width));
            canvas.height = Math.max(1, Math.floor(viewport.height));
            canvas.style.width = cssW + "px";
            canvas.style.height = cssH + "px";
            canvas.setAttribute("role", "img");
            canvas.setAttribute("aria-label", "Página " + pageNumber + " de " + state.total);

            const ctx = canvas.getContext("2d", { alpha: false });
            const task = page.render({ canvasContext: ctx, viewport: viewport });
            state.renderTask = task;
            await task.promise;

            if (token !== state.renderToken || session !== state.session) return;
            state.renderTask = null;

            // Cambio limpio: el canvas viejo se reemplaza solo cuando el nuevo ya está listo
            state.base = { w: base.width, h: base.height };
            state.fit = fit;
            els.pageWrap.replaceChildren(canvas);
            hideLoading();
            els.error.hidden = true;

            try { page.cleanup(); } catch (err) { /* nada */ }
        } catch (err) {
            if (err && err.name === "RenderingCancelledException") return;
            console.error("[Presentación] Error al dibujar la página:", err);
            if (token === state.renderToken && session === state.session && state.open) showError();
        }
    }

    function prefetch(n) {
        if (!state.pdf || n < 1 || n > state.total) return;
        state.pdf.getPage(n).catch(function () { /* no es crítico */ });
    }

    /* ================================================================
       NAVEGACIÓN
    ================================================================ */
    function goTo(n) {
        if (!state.open || !state.pdf) return;
        const target = Math.min(Math.max(1, Math.round(n)), state.total);
        if (target === state.page && els.pageWrap.firstElementChild) return;

        state.page = target;
        updateUI();
        els.stage.scrollLeft = 0;
        els.stage.scrollTop = 0;
        clearTimeout(state.renderTimer);
        renderCurrent();
        prefetch(target + 1);
    }

    function updateUI() {
        const hasPdf = !!state.pdf && state.total > 0;

        els.counter.textContent = hasPdf
            ? "Página " + state.page + " de " + state.total
            : "Página – de –";

        els.prev.disabled = !hasPdf || state.page <= 1;
        els.next.disabled = !hasPdf || state.page >= state.total;
        els.zoomOut.disabled = !hasPdf || state.zoom <= CONFIG.zoomMin + 0.001;
        els.zoomIn.disabled = !hasPdf || state.zoom >= CONFIG.zoomMax - 0.001;
        els.zoomReset.disabled = !hasPdf;

        els.zoomReset.textContent = Math.round(state.zoom * 100) + "%";
        els.stage.classList.toggle("is-zoomed", state.zoom > 1.001);

        const pct = hasPdf && state.total > 1 ? ((state.page - 1) / (state.total - 1)) * 100 : (hasPdf ? 100 : 0);
        els.progress.style.width = pct + "%";

        // Si el botón enfocado quedó desactivado, devolvemos el foco al área de la página
        const active = document.activeElement;
        if (active && active.disabled && els.dialog.contains(active)) {
            try { els.stage.focus({ preventScroll: true }); } catch (err) { /* sin foco */ }
        }
    }

    /* ================================================================
       ZOOM
    ================================================================ */
    function clamp(v, min, max) {
        return Math.min(Math.max(v, min), max);
    }

    function setZoom(next) {
        if (!state.open || !state.pdf) return;
        next = clamp(next, CONFIG.zoomMin, CONFIG.zoomMax);
        if (Math.abs(next - state.zoom) < 0.0005) return;

        const s = els.stage;
        const rx = s.scrollWidth ? (s.scrollLeft + s.clientWidth / 2) / s.scrollWidth : 0.5;
        const ry = s.scrollHeight ? (s.scrollTop + s.clientHeight / 2) / s.scrollHeight : 0.5;

        state.zoom = next;
        updateUI();

        // Vista previa inmediata (estira el canvas actual) y nitidez después
        const canvas = els.pageWrap.firstElementChild;
        if (canvas && state.base) {
            const scale = state.fit * state.zoom;
            canvas.style.width = Math.floor(state.base.w * scale) + "px";
            canvas.style.height = Math.floor(state.base.h * scale) + "px";
            s.scrollLeft = rx * s.scrollWidth - s.clientWidth / 2;
            s.scrollTop = ry * s.scrollHeight - s.clientHeight / 2;
        }

        scheduleRender(140);
    }

    function zoomIn() {
        const p = CONFIG.zoomPaso;
        setZoom(Math.floor(state.zoom / p + 1e-6) * p + p);
    }

    function zoomOut() {
        const p = CONFIG.zoomPaso;
        setZoom(Math.ceil(state.zoom / p - 1e-6) * p - p);
    }

    function resetZoom() {
        setZoom(1);
        els.stage.scrollLeft = 0;
        els.stage.scrollTop = 0;
    }

    function onWheel(e) {
        if (!(e.ctrlKey || e.metaKey)) return; // sin Ctrl, la rueda hace scroll normal
        e.preventDefault();
        const unidad = e.deltaMode === 1 ? 16 : 1;
        setZoom(state.zoom * Math.exp(-e.deltaY * unidad * 0.0025));
    }

    /* ================================================================
       PANTALLA COMPLETA
    ================================================================ */
    function fullscreenElement() {
        return document.fullscreenElement || document.webkitFullscreenElement || null;
    }

    function isNativeFullscreen() {
        return fullscreenElement() === els.dialog;
    }

    function isFullscreen() {
        return isNativeFullscreen() || state.pseudoFs;
    }

    async function enterFullscreen() {
        const el = els.dialog;
        const request = el.requestFullscreen || el.webkitRequestFullscreen;

        if (request) {
            try {
                await request.call(el);
                return;
            } catch (err) {
                console.warn("[Presentación] Pantalla completa nativa no disponible:", err);
            }
        }
        // Respaldo (por ejemplo iPhone): el visor ocupa toda la ventana
        setPseudoFullscreen(true);
    }

    function exitNativeFullscreen() {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (!exit) return;
        try {
            const result = exit.call(document);
            if (result && result.catch) result.catch(function () { /* nada */ });
        } catch (err) { /* nada */ }
    }

    function exitFullscreen() {
        if (isNativeFullscreen()) exitNativeFullscreen();
        if (state.pseudoFs) setPseudoFullscreen(false);
    }

    function toggleFullscreen() {
        if (isFullscreen()) exitFullscreen();
        else enterFullscreen();
    }

    function setPseudoFullscreen(on) {
        state.pseudoFs = on;
        els.modal.classList.toggle("is-expanded", on);
        syncFullscreenUI();
        scheduleRender(80);
    }

    function syncFullscreenUI() {
        const on = isFullscreen();
        const label = on ? "Salir de pantalla completa" : "Pantalla completa";
        const path = els.fs.querySelector("svg path");

        els.dialog.classList.toggle("is-fullscreen", on);
        els.fs.setAttribute("aria-pressed", on ? "true" : "false");
        els.fs.setAttribute("aria-label", label);
        els.fs.setAttribute("title", label + " (F)");
        if (els.fsText) els.fsText.textContent = on ? "Salir" : "Pantalla completa";
        if (path) {
            path.setAttribute("d", on
                ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
                : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5");
        }
    }

    function onFullscreenChange() {
        state.lastFsChange = Date.now();
        syncFullscreenUI();
        if (state.open) scheduleRender(100);
    }

    /* ================================================================
       TECLADO
    ================================================================ */
    function onKeydown(e) {
        if (!state.open) return;
        if (e.altKey || e.ctrlKey || e.metaKey) return;

        const key = e.key;

        if (key === "Tab") {
            trapFocus(e);
            return;
        }

        // Si el foco está en un botón/enlace, Enter y Espacio deben activarlo a él
        const enControl = e.target && e.target.closest && e.target.closest("button, a[href]");

        switch (key) {
            case "ArrowRight":
            case "ArrowDown":
            case "PageDown":
                goTo(state.page + 1);
                break;
            case "ArrowLeft":
            case "ArrowUp":
            case "PageUp":
                goTo(state.page - 1);
                break;
            case "Enter":
            case " ":
                if (enControl) return;
                goTo(state.page + 1);
                break;
            case "Home":
                goTo(1);
                break;
            case "End":
                goTo(state.total);
                break;
            case "+":
            case "=":
                zoomIn();
                break;
            case "-":
            case "_":
                zoomOut();
                break;
            case "0":
                resetZoom();
                break;
            case "f":
            case "F":
                toggleFullscreen();
                break;
            case "Escape":
                // Si el navegador acaba de salir de pantalla completa con Esc, no cerramos el modal
                if (Date.now() - state.lastFsChange < 300) break;
                if (state.pseudoFs) setPseudoFullscreen(false);
                else if (isNativeFullscreen()) exitNativeFullscreen();
                else closeViewer();
                break;
            default:
                return; // tecla no manejada: no interferimos con el resto de la página
        }

        e.preventDefault();
        e.stopPropagation();
    }

    function trapFocus(e) {
        const candidates = els.dialog.querySelectorAll("button:not([disabled]), a[href]");
        const focusables = Array.prototype.filter.call(candidates, function (el) {
            return el.getClientRects().length > 0;
        });
        if (!focusables.length) {
            e.preventDefault();
            return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        const fuera = !els.dialog.contains(active) || active === els.stage || active === els.dialog;

        if (e.shiftKey) {
            if (active === first || fuera) {
                e.preventDefault();
                last.focus();
            }
        } else if (active === last || !els.dialog.contains(active)) {
            e.preventDefault();
            first.focus();
        }
    }

    /* ================================================================
       CLIC / TÁCTIL SOBRE LA PÁGINA
    ================================================================ */
    function sideFromEvent(e) {
        const r = els.stage.getBoundingClientRect();
        if (!r.width) return "";
        const x = (e.clientX - r.left) / r.width;
        if (x < CONFIG.zonaIzquierda) return "prev";
        if (x > CONFIG.zonaDerecha) return "next";
        return "";
    }

    function setSide(side) {
        if (els.body.getAttribute("data-side") !== side) {
            if (side) els.body.setAttribute("data-side", side);
            else els.body.removeAttribute("data-side");
        }
    }

    function onStageClick(e) {
        if (!state.pdf || state.zoom > 1.001) return; // con zoom se usa arrastrar, no navegar
        if (e.target.closest("a, button")) return;

        const side = sideFromEvent(e);
        if (side === "prev") goTo(state.page - 1);
        else if (side === "next") goTo(state.page + 1);
    }

    function onStageMove(e) {
        if (e.pointerType === "touch" || state.drag) return;

        let side = "";
        if (state.pdf && state.zoom <= 1.001) {
            side = sideFromEvent(e);
            if (side === "prev" && state.page <= 1) side = "";
            if (side === "next" && state.page >= state.total) side = "";
        }
        setSide(side);
    }

    /* Arrastrar con el mouse cuando hay zoom */
    function onDragStart(e) {
        if (e.pointerType !== "mouse" || e.button !== 0 || state.zoom <= 1.001) return;
        state.drag = {
            id: e.pointerId,
            x: e.clientX,
            y: e.clientY,
            left: els.stage.scrollLeft,
            top: els.stage.scrollTop
        };
        try { els.stage.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
        els.stage.classList.add("is-dragging");
        els.stage.addEventListener("pointermove", onDragMove);
    }

    function onDragMove(e) {
        if (!state.drag) return;
        els.stage.scrollLeft = state.drag.left - (e.clientX - state.drag.x);
        els.stage.scrollTop = state.drag.top - (e.clientY - state.drag.y);
    }

    function onDragEnd() {
        endDrag();
    }

    function endDrag() {
        if (!state.drag) return;
        try { els.stage.releasePointerCapture(state.drag.id); } catch (err) { /* nada */ }
        state.drag = null;
        els.stage.classList.remove("is-dragging");
        els.stage.removeEventListener("pointermove", onDragMove);
    }

    /* Táctil: deslizar para cambiar de página y pellizcar para hacer zoom */
    function touchDistance(t) {
        const dx = t[0].clientX - t[1].clientX;
        const dy = t[0].clientY - t[1].clientY;
        return Math.hypot(dx, dy);
    }

    function onTouchStart(e) {
        if (e.touches.length === 2) {
            state.gestureLock = true;
            state.swipe = null;
            state.pinch = { dist: touchDistance(e.touches), zoom: state.zoom };
        } else if (e.touches.length === 1 && !state.gestureLock) {
            const t = e.touches[0];
            state.swipe = { x: t.clientX, y: t.clientY, time: Date.now() };
        }
    }

    function onTouchMove(e) {
        if (state.pinch && e.touches.length === 2) {
            if (e.cancelable) e.preventDefault();
            const dist = touchDistance(e.touches);
            if (state.pinch.dist > 0) setZoom(state.pinch.zoom * (dist / state.pinch.dist));
        }
    }

    function onTouchEnd(e) {
        if (e.touches.length < 2) state.pinch = null;
        if (e.touches.length > 0) return;

        if (!state.gestureLock && state.swipe && state.zoom <= 1.001 && e.changedTouches.length) {
            const t = e.changedTouches[0];
            const dx = t.clientX - state.swipe.x;
            const dy = t.clientY - state.swipe.y;
            const rapido = Date.now() - state.swipe.time < 800;

            if (rapido && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                if (dx < 0) goTo(state.page + 1);
                else goTo(state.page - 1);
            }
        }

        state.swipe = null;
        state.gestureLock = false;
    }

    /* ================================================================
       REDIMENSIONAMIENTO / ORIENTACIÓN
    ================================================================ */
    function onStageResize() {
        const key = els.stage.offsetWidth + "x" + els.stage.offsetHeight;
        if (key === state.lastSize) return;
        state.lastSize = key;
        scheduleRender(150);
    }

    function onWindowResize() {
        // Respaldo por si el navegador no tiene ResizeObserver o tarda al girar el móvil
        scheduleRender(250);
    }

    /* ================================================================
       ESTADOS VISUALES: CARGANDO / ERROR
    ================================================================ */
    function showLoading(text) {
        els.error.hidden = true;
        els.loading.hidden = false;
        els.loadingText.textContent = text || "Cargando presentación…";
    }

    function hideLoading() {
        els.loading.hidden = true;
    }

    function showError() {
        els.loading.hidden = true;
        els.error.hidden = false;
        els.pageWrap.replaceChildren();
        updateUI();
    }

    /* ================================================================
       UTILIDADES
    ================================================================ */
    function resolveUrl(path) {
        let limpio = String(path || "").trim();
        // Codifica acentos y espacios (Imágenes → Im%C3%A1genes) sin doble codificar
        if (!/%[0-9a-f]{2}/i.test(limpio)) limpio = encodeURI(limpio);
        try {
            return new URL(limpio, document.baseURI).href;
        } catch (err) {
            return limpio;
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();