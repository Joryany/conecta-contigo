/* ====================================================================
   SOTER — Motor de conversación
   ----------------------------------------------------------------------
   Este archivo NO contiene contenido (preguntas, respuestas, textos).
   Todo el contenido vive en data/soter-data.json.

   Si quieres cambiar textos, agregar temas, preguntas, herramientas o
   palabras clave: edita ese archivo. No necesitas tocar este JS.
==================================================================== */

(function () {
    "use strict";

    const DATA_URL = "data/soter-data.json";
    const TYPING_DELAY = 550; // ms que "piensa" Soter antes de responder

    /* ---------- Referencias al DOM ---------- */
    const els = {
        log: document.getElementById("soter-chat-log"),
        form: document.getElementById("soter-form"),
        input: document.getElementById("soter-input"),
        backBtn: document.getElementById("soter-back"),
        resetBtn: document.getElementById("soter-reset")
    };

    /* ---------- Estado de la conversación ---------- */
    let DATA = null;          // contenido cargado desde el JSON
    let stack = [];           // historial de nodos para el botón "Atrás"
    let currentId = "main";   // nodo que se está mostrando actualmente

    init();

    /* ====================================================================
       INICIALIZACIÓN
    ==================================================================== */

    async function init() {
        try {
            const res = await fetch(DATA_URL, { cache: "no-store" });
            if (!res.ok) throw new Error("Respuesta no válida al cargar " + DATA_URL);
            DATA = await res.json();
        } catch (err) {
            console.error("Soter no pudo cargar su contenido:", err);
            renderLoadError();
            return;
        }

        els.form.addEventListener("submit", onSubmitQuestion);
        els.backBtn.addEventListener("click", goBack);
        els.resetBtn.addEventListener("click", resetChat);

        renderWelcome();
    }

    function renderLoadError() {
        const msg = (DATA && DATA.config && DATA.config.loadErrorMessage) ||
            "No pude cargar la información de Soter. Verifica que el sitio se esté ejecutando en un servidor local.";
        const div = document.createElement("div");
        div.className = "soter-error";
        div.textContent = msg;
        els.log.appendChild(div);
    }

    /* ====================================================================
       NAVEGACIÓN ENTRE NODOS
       Un "nodo" es cualquier entrada dentro de data.nodes (o el nodo
       virtual "main"). Cada nodo sabe qué mostrar y qué opciones ofrecer.
    ==================================================================== */

    /** Dibuja el mensaje de bienvenida + menú principal (sin tocar el estado). */
    function renderWelcomeContent() {
        const cfg = DATA.config;
        appendBotMessage(cfg.welcomeTitle + "\n" + cfg.welcomeMessage);
        appendOptions(DATA.mainMenu.options);
    }

    /** Primera pantalla al cargar la página: reinicia el estado y dibuja. */
    function renderWelcome() {
        stack = [];
        currentId = "main";
        updateBackButton();
        botSay(renderWelcomeContent);
    }

    /**
     * Navega hacia un nodo por su id.
     * Formatos especiales de id:
     *   "main"        -> vuelve al menú principal
     *   "link:xxx"    -> redirige a una URL definida en config.links.xxx
     *   "content:xxx" -> nodo de contenido (tipo "content")
     *   cualquier otro -> nodo normal dentro de data.nodes
     */
    function navigateTo(id, options) {
        options = options || {};
        const pushToStack = options.pushToStack !== false;

        if (id.indexOf("link:") === 0) {
            const key = id.slice(5);
            const url = DATA.config.links && DATA.config.links[key];
            if (url) window.location.href = url;
            return;
        }

        if (id === "main") {
            if (pushToStack && currentId) stack.push(currentId);
            currentId = "main";
            updateBackButton();
            botSay(renderWelcomeContent);
            return;
        }

        const node = DATA.nodes[id];
        if (!node) {
            console.warn("Soter: nodo no encontrado ->", id);
            renderFallback();
            return;
        }

        if (pushToStack && currentId) stack.push(currentId);
        currentId = id;
        updateBackButton();
        renderNode(node);
    }

    function renderNode(node) {
        if (node.type === "menu" || node.type === "topic") {
            botSay(function () {
                appendBotMessage(node.botMessage);
                appendOptions(node.options);
            });
        } else if (node.type === "content") {
            botSay(function () {
                appendContentMessage(node);
                appendFollowUp(node.parent);
            });
        }
    }

    function appendFollowUp(parentId) {
        const fu = DATA.followUp;
        appendBotMessage(fu.botMessage);
        const options = fu.options.map(function (opt) {
            if (opt.next === "PARENT") {
                return Object.assign({}, opt, { next: parentId || "main" });
            }
            return opt;
        });
        appendOptions(options);
    }

    function goBack() {
        if (!stack.length) return;
        const prevId = stack.pop();
        currentId = prevId;
        updateBackButton();

        if (prevId === "main") {
            botSay(renderWelcomeContent);
        } else {
            const node = DATA.nodes[prevId];
            if (node) renderNode(node);
        }
    }

    function updateBackButton() {
        els.backBtn.disabled = stack.length === 0;
    }

    function resetChat() {
        els.log.innerHTML = "";
        renderWelcome();
        els.input.value = "";
    }

    /* ====================================================================
       ENTRADA DE TEXTO LIBRE (búsqueda por palabras clave)
    ==================================================================== */

    function onSubmitQuestion(event) {
        event.preventDefault();
        const raw = els.input.value.trim();
        if (!raw) return;

        appendUserMessage(raw);
        els.input.value = "";

        const norm = normalize(raw);

        // 1) Ruta especial de seguridad: si hay coincidencia de riesgo,
        //    Soter NO continúa la conversación normal.
        const riskHit = DATA.risk.keywords.some(function (k) {
            return norm.indexOf(normalize(k)) !== -1;
        });
        if (riskHit) {
            stack = [];
            currentId = null;
            updateBackButton();
            botSay(appendRiskCard, TYPING_DELAY);
            return;
        }

        // 2) Búsqueda por palabras clave entre los temas disponibles.
        const matches = [];
        Object.keys(DATA.nodes).forEach(function (id) {
            const node = DATA.nodes[id];
            if (!node.keywords) return;
            const hit = node.keywords.some(function (k) {
                return norm.indexOf(normalize(k)) !== -1;
            });
            if (hit) matches.push({ id: id, title: node.title || id });
        });

        if (currentId) stack.push(currentId);
        currentId = null;
        updateBackButton();

        if (matches.length) {
            botSay(function () {
                appendBotMessage("🌱 Encontré algunos temas que podrían estar relacionados con tu pregunta.");
                appendOptions(matches.map(function (m) {
                    return { label: m.title, next: m.id };
                }));
            });
        } else {
            botSay(renderFallback);
        }
    }

    function renderFallback() {
        appendBotMessage(DATA.fallback.botMessage);
        appendOptions(DATA.fallback.options);
    }

    /**
     * Normaliza texto para comparar palabras clave sin depender de
     * mayúsculas, acentos o espacios extra.
     */
    function normalize(text) {
        return (text || "")
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }
        /* ====================================================================
        AVATAR DE SOTER
        Una única función para mantener el avatar consistente en todo el chat.
        ==================================================================== */

        function createSoterAvatar() {
            const avatar = document.createElement("span");

            avatar.className = "soter-msg__avatar";
            avatar.setAttribute("aria-hidden", "true");

            const img = document.createElement("img");

            img.src = "assets/img/soter/soter.png";
            img.alt = "";

            avatar.appendChild(img);

            return avatar;
        }
    /* ====================================================================
       RENDER DE MENSAJES EN EL CHAT
    ==================================================================== */

    function botSay(renderFn, delay) {
        const typingEl = appendTyping();
        window.setTimeout(function () {
            typingEl.remove();
            renderFn();
            scrollToBottom();
        }, delay || TYPING_DELAY);
    }

    function appendTyping() {
        const row = document.createElement("div");
        row.className = "soter-msg soter-msg--bot";

        const avatar = createSoterAvatar();

        const bubble = document.createElement("div");
        bubble.className = "soter-bubble soter-typing";
        bubble.setAttribute("aria-label", "Soter está escribiendo");

        bubble.innerHTML =
            "<span></span><span></span><span></span>";

        row.appendChild(avatar);
        row.appendChild(bubble);

        els.log.appendChild(row);

        scrollToBottom();

        return row;
    }

    function appendBotMessage(text) {
    const row = document.createElement("div");
    row.className = "soter-msg soter-msg--bot";

    const avatar = createSoterAvatar();

    const bubble = document.createElement("div");
    bubble.className = "soter-bubble";

    // El texto puede traer saltos de línea ("\n");
    // los convertimos en párrafos.
    textToParagraphs(bubble, text);

    row.appendChild(avatar);
    row.appendChild(bubble);

    els.log.appendChild(row);

    scrollToBottom();
}

    function appendContentMessage(node) {
    const row = document.createElement("div");
    row.className = "soter-msg soter-msg--bot";

    const avatar = createSoterAvatar();

    const bubble = document.createElement("div");
    bubble.className = "soter-bubble";

    const title = document.createElement("strong");
    title.textContent = node.title;

    bubble.appendChild(title);

    textToParagraphs(bubble, node.body);

    row.appendChild(avatar);
    row.appendChild(bubble);

    els.log.appendChild(row);

    scrollToBottom();
}

    function textToParagraphs(container, text) {
        (text || "").split("\n").forEach(function (line) {
            if (!line.trim()) return;
            const p = document.createElement("p");
            p.textContent = line;
            container.appendChild(p);
        });
    }

    function appendUserMessage(text) {
        const row = document.createElement("div");
        row.className = "soter-msg soter-msg--user";

        const bubble = document.createElement("div");
        bubble.className = "soter-bubble";
        bubble.textContent = text; // textContent: nunca se interpreta como HTML

        row.appendChild(bubble);
        els.log.appendChild(row);
        scrollToBottom();
    }

    function appendOptions(options) {
        const wrap = document.createElement("div");
        wrap.className = "soter-options";
        wrap.setAttribute("role", "group");
        wrap.setAttribute("aria-label", "Opciones de respuesta");

        options.forEach(function (opt) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "soter-chip";
            btn.textContent = (opt.icon ? opt.icon + " " : "") + opt.label;

            btn.addEventListener("click", function () {
                // Deshabilita todas las opciones de este grupo para evitar
                // dobles clics y deja marcada la elegida.
                Array.prototype.forEach.call(wrap.children, function (b) {
                    b.disabled = true;
                });
                btn.classList.add("is-chosen");

                appendUserMessage(opt.label);
                navigateTo(opt.next);
            });

            wrap.appendChild(btn);
        });

        els.log.appendChild(wrap);
        scrollToBottom();
    }

    function appendRiskCard() {
        const risk = DATA.risk;
        const card = document.createElement("div");
        card.className = "soter-risk";
        card.setAttribute("role", "alert");

        const title = document.createElement("p");
        title.className = "soter-risk__title";
        title.textContent = risk.title;

        const msg = document.createElement("p");
        msg.textContent = risk.message;

        const secondary = document.createElement("p");
        secondary.className = "soter-risk__secondary";
        secondary.textContent = risk.secondaryMessage;

        const action = document.createElement("a");
        action.className = "soter-risk__action";
        action.href = DATA.config.emergencyLink;
        action.textContent = risk.actionLabel + " →";

        card.appendChild(title);
        card.appendChild(msg);
        card.appendChild(secondary);
        card.appendChild(action);

        els.log.appendChild(card);
        scrollToBottom();
    }

    function scrollToBottom() {
        els.log.scrollTop = els.log.scrollHeight;
    }

}());

/* ====================================================================
   NAVEGACIÓN INTERNA DE SOTER
   ----------------------------------------------------------------------
   Controla las 3 vistas de soter.html. Envuelto en su propio listener
   de DOMContentLoaded (no depende de que el <script> tenga "defer"),
   así que funciona sin importar dónde se cargue el archivo.
==================================================================== */

document.addEventListener("DOMContentLoaded", function () {

    const tabs = Array.prototype.slice.call(document.querySelectorAll(".soter-tab"));
    if (!tabs.length) {
        console.warn("Soter (nav interna): no se encontró ningún botón .soter-tab en el HTML.");
        return;
    }

    const panels = {};
    tabs.forEach(function (tab) {
        const controlsId = tab.getAttribute("aria-controls");
        const panel = controlsId ? document.getElementById(controlsId) : null;
        if (!panel) {
            console.warn('Soter (nav interna): el botón #' + tab.id +
                ' tiene aria-controls="' + controlsId + '" pero no existe ningún panel con ese id.');
        }
        panels[tab.id] = panel;
    });

    const HASH_TO_TAB = {
        chat: "soter-tab-chat",
        conoce: "soter-tab-conoce",
        "como-funciona": "soter-tab-como"
    };

    function activate(tab, opts) {
        opts = opts || {};
        tabs.forEach(function (t) {
            const selected = t === tab;
            t.classList.toggle("is-active", selected);
            t.setAttribute("aria-selected", selected ? "true" : "false");
            t.tabIndex = selected ? 0 : -1;
            const panel = panels[t.id];
            if (panel) panel.hidden = !selected;
        });
        if (opts.focus) tab.focus();
    }

    tabs.forEach(function (tab, index) {
        tab.addEventListener("click", function () {
            activate(tab);
        });

        tab.addEventListener("keydown", function (event) {
            let targetIndex = null;
            if (event.key === "ArrowRight") targetIndex = (index + 1) % tabs.length;
            else if (event.key === "ArrowLeft") targetIndex = (index - 1 + tabs.length) % tabs.length;
            else if (event.key === "Home") targetIndex = 0;
            else if (event.key === "End") targetIndex = tabs.length - 1;

            if (targetIndex !== null) {
                event.preventDefault();
                activate(tabs[targetIndex], { focus: true });
            }
        });
    });

    function activateFromHash() {
        const key = window.location.hash.replace("#", "");
        if (!key) return false;

        let tabId = HASH_TO_TAB[key];
        if (!tabId && key.indexOf("faq-") === 0) tabId = "soter-tab-como";

        const tab = tabId && document.getElementById(tabId);
        if (tab) {
            activate(tab);
            return true;
        }
        return false;
    }

    if (!activateFromHash()) {
        const defaultTab = document.getElementById("soter-tab-chat");
        if (defaultTab) activate(defaultTab);
    }

    window.addEventListener("hashchange", activateFromHash);

});
