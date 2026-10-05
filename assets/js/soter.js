/* ====================================================================
   SOTER — Motor de conversación (v2)
   ----------------------------------------------------------------------
   Este archivo NO contiene contenido (preguntas, respuestas, textos).
   Todo el contenido vive en data/soter-data.json.

   Si quieres cambiar textos, agregar temas, preguntas, herramientas o
   palabras clave: edita ese archivo. No necesitas tocar este JS.

   Tipos de nodo que entiende este motor:
     menu     -> mensaje + opciones (+ actions opcionales)
     topic    -> igual que menu; además participa en la búsqueda por keywords
     content  -> título + cuerpo (+ actions, + options propias opcionales)
     risk     -> muestra la tarjeta de seguridad (usa DATA.risk)
   Cualquier nodo con "keywords" puede aparecer como sugerencia cuando la
   persona escribe en el campo de texto.
==================================================================== */

(function () {
    "use strict";

    const DATA_URL = "data/soter-data.json";
    const TYPING_DELAY = 550;   // ms que "piensa" Soter antes de responder
    const MAX_MATCHES = 4;      // máximo de sugerencias por texto libre

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
    let kwIndex = [];         // índice de keywords normalizadas (búsqueda)
    let riskKeywords = [];    // keywords de riesgo normalizadas

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

        buildIndexes();
        validateData();

        if (els.form) els.form.addEventListener("submit", onSubmitQuestion);
        if (els.backBtn) els.backBtn.addEventListener("click", goBack);
        if (els.resetBtn) els.resetBtn.addEventListener("click", resetChat);

        renderWelcome();
        openTopicFromHash();
    }

    function renderLoadError() {
        const msg = (DATA && DATA.config && DATA.config.loadErrorMessage) ||
            "No pude cargar la información de Soter. Verifica que el sitio se esté ejecutando en un servidor local.";
        const div = document.createElement("div");
        div.className = "soter-error";
        div.textContent = msg;
        if (els.log) els.log.appendChild(div);
    }

    /* Prepara las keywords una sola vez (normalizadas) */
    function buildIndexes() {
        riskKeywords = ((DATA.risk && DATA.risk.keywords) || []).map(cleanText).filter(Boolean);

        kwIndex = [];
        Object.keys(DATA.nodes).forEach(function (id) {
            const node = DATA.nodes[id];
            if (!node.keywords || !node.keywords.length) return;
            kwIndex.push({
                id: id,
                title: node.title || id,
                priority: node.priority || 0,
                kws: node.keywords.map(cleanText).filter(Boolean)
            });
        });
    }

    /* Ayuda al editor del JSON: avisa en consola de referencias rotas */
    function validateData() {
        const problems = [];
        const links = (DATA.config && DATA.config.links) || {};

        function checkNext(next, where) {
            if (!next || next === "PARENT" || next === "main" || next === "fallback") return;
            if (next.indexOf("link:") === 0) {
                if (!links[next.slice(5)]) problems.push(where + " -> enlace inexistente: " + next);
                return;
            }
            if (!DATA.nodes[next]) problems.push(where + " -> nodo inexistente: " + next);
        }
        function checkActions(actions, where) {
            (actions || []).forEach(function (a) {
                if (!links[a.link]) problems.push(where + " -> action con enlace inexistente: " + a.link);
            });
        }

        (DATA.mainMenu.options || []).forEach(function (o) { checkNext(o.next, "mainMenu"); });
        (DATA.fallback.options || []).forEach(function (o) { checkNext(o.next, "fallback"); });
        (DATA.followUp.options || []).forEach(function (o) { checkNext(o.next, "followUp"); });
        checkActions(DATA.risk && DATA.risk.actions, "risk");

        Object.keys(DATA.nodes).forEach(function (id) {
            const n = DATA.nodes[id];
            (n.options || []).forEach(function (o) { checkNext(o.next, id); });
            checkActions(n.actions, id);
            if (n.parent && !DATA.nodes[n.parent]) problems.push(id + " -> parent inexistente: " + n.parent);
        });

        if (problems.length) console.warn("Soter: referencias a revisar en el JSON:\n" + problems.join("\n"));
    }

    /* ====================================================================
        NAVEGACIÓN ENTRE NODOS
    ==================================================================== */

    function renderWelcomeContent() {
        const cfg = DATA.config;
        appendBotMessage(cfg.welcomeTitle + "\n" + cfg.welcomeMessage);
        appendOptions(DATA.mainMenu.options, DATA.mainMenu.layout);
    }

    function renderWelcome() {
        stack = [];
        currentId = "main";
        updateBackButton();
        botSay(renderWelcomeContent);
    }

    function openTopicFromHash() {
        const hash = window.location.hash.replace("#", "");
        if (hash.indexOf("tema:") !== 0) return;

        const id = hash.slice(5);
        if (DATA.nodes[id]) {
            navigateTo(id, { pushToStack: false });
        }
    }

    function resolveLink(key) {
        return DATA.config.links && DATA.config.links[key];
    }

    function navigateTo(id, options) {
        options = options || {};
        const pushToStack = options.pushToStack !== false;

        if (id.indexOf("link:") === 0) {
            const url = resolveLink(id.slice(5));
            if (url) window.location.href = url;
            else console.warn("Soter: enlace no definido ->", id);
            return;
        }

        if (id === "main" || id === "fallback") {
            if (pushToStack && currentId) stack.push(currentId);
            currentId = id;
            updateBackButton();
            renderById(id);
            return;
        }

        const node = DATA.nodes[id];
        if (!node) {
            console.warn("Soter: nodo no encontrado ->", id);
            botSay(renderFallback);
            return;
        }

        if (pushToStack && currentId) stack.push(currentId);
        currentId = id;
        updateBackButton();

        /* La tarjeta de seguridad no se deja en la URL */
        if (node.type === "risk") {
            history.replaceState(null, "", window.location.pathname + window.location.search);
        } else {
            history.replaceState(null, "", "#tema:" + id);
        }
        renderNode(node);
    }

    /* Dibuja "main", "fallback" o un nodo por su id */
    function renderById(id) {
        if (id === "main") {
            history.replaceState(null, "", window.location.pathname + window.location.search);
            botSay(renderWelcomeContent);
        } else if (id === "fallback") {
            botSay(renderFallback);
        } else if (DATA.nodes[id]) {
            history.replaceState(null, "", "#tema:" + id);
            renderNode(DATA.nodes[id]);
        }
    }

    function renderNode(node) {
        if (node.type === "risk") {
            botSay(function () {
                disableAllOptions();
                appendRiskCard();
            });
        } else if (node.type === "menu" || node.type === "topic") {
            botSay(function () {
                appendBotMessage(node.botMessage);
                appendActions(node.actions);
                appendOptions(node.options, node.layout);
            });
        } else if (node.type === "content") {
            botSay(function () {
                appendContentMessage(node);
                appendActions(node.actions);
                if (node.options && node.options.length) {
                    if (node.optionsMessage) appendBotMessage(node.optionsMessage);
                    appendOptions(mapParent(node.options, node.parent));
                } else {
                    appendFollowUp(node.parent);
                }
            });
        } else {
            console.warn("Soter: tipo de nodo no reconocido ->", node.type);
            botSay(renderFallback);
        }
    }

    function mapParent(options, parentId) {
        return options.map(function (opt) {
            if (opt.next === "PARENT") {
                return Object.assign({}, opt, { next: parentId || "main" });
            }
            return opt;
        });
    }

    function appendFollowUp(parentId) {
        const fu = DATA.followUp;
        appendBotMessage(fu.botMessage);
        appendOptions(mapParent(fu.options, parentId));
    }

    function goBack() {
        if (!stack.length) return;
        const prevId = stack.pop();
        currentId = prevId;
        updateBackButton();
        renderById(prevId);
    }

    function updateBackButton() {
        if (els.backBtn) els.backBtn.disabled = stack.length === 0;
    }

    function resetChat() {
        if (els.log) els.log.innerHTML = "";
        history.replaceState(null, "", window.location.pathname + window.location.search);
        renderWelcome();
        if (els.input) els.input.value = "";
    }

    /* ====================================================================
        ENTRADA DE TEXTO LIBRE
    ==================================================================== */

    function onSubmitQuestion(event) {
        event.preventDefault();
        if (!els.input) return;

        const raw = els.input.value.trim();
        if (!raw) return;

        appendUserMessage(raw);
        els.input.value = "";

        const clean = cleanText(raw);

        /* 1. Seguridad primero: coincidencia por fragmento de frase */
        const riskHit = riskKeywords.some(function (k) {
            return clean.indexOf(k) !== -1;
        });
        if (riskHit) {
            stack = [];
            currentId = null;
            updateBackButton();
            disableAllOptions();
            botSay(appendRiskCard, TYPING_DELAY);
            return;
        }

        /* 2. Búsqueda por keywords con puntaje */
        const matches = findMatches(clean);

        if (currentId) stack.push(currentId);
        currentId = null;
        updateBackButton();

        if (matches.length) {
            botSay(function () {
                appendBotMessage("🌱 Encontré algunos temas que podrían estar relacionados con lo que cuentas. ¿Cuál se acerca más?");
                const opts = matches.map(function (m) {
                    return { label: m.title, next: m.id };
                });
                opts.push({ label: "Ninguno de estos", next: "fallback" });
                appendOptions(opts);
            });
        } else {
            botSay(renderFallback);
        }
    }

    /* Devuelve los nodos cuyas keywords aparecen en el texto, mejor puntaje primero.
       Regla de coincidencia (evita falsos positivos como "ira" dentro de "mirar"):
         - frases (con espacio) y palabras cortas (< 6 letras): palabra completa
         - palabras de 6+ letras: la palabra del texto puede empezar con la keyword
           (así "estres" también encuentra "estresado") */
    function findMatches(clean) {
        const padded = " " + clean + " ";
        const found = [];

        kwIndex.forEach(function (entry) {
            let score = 0;
            entry.kws.forEach(function (k) {
                const exactOnly = k.indexOf(" ") !== -1 || k.length < 6;
                const hit = exactOnly
                    ? padded.indexOf(" " + k + " ") !== -1
                    : padded.indexOf(" " + k) !== -1;
                if (hit) score += k.length;
            });
            if (score > 0) {
                found.push({ id: entry.id, title: entry.title, score: score + entry.priority });
            }
        });

        found.sort(function (a, b) { return b.score - a.score; });
        return found.slice(0, MAX_MATCHES);
    }

    function renderFallback() {
        appendBotMessage(DATA.fallback.botMessage);
        appendOptions(DATA.fallback.options);
    }

    /* Minúsculas, sin tildes, sin signos, espacios simples */
    function normalize(text) {
        return (text || "")
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
    }

    function cleanText(text) {
        return normalize(text)
            .replace(/[^a-z0-9\s-]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    /* ====================================================================
        AVATAR DE SOTER
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
            if (typingEl) typingEl.remove();
            renderFn();
            scrollToBottom();
        }, delay || TYPING_DELAY);
    }

    function appendTyping() {
        if (!els.log) return null;
        const row = document.createElement("div");
        row.className = "soter-msg soter-msg--bot";

        const avatar = createSoterAvatar();
        const bubble = document.createElement("div");
        bubble.className = "soter-bubble soter-typing";
        bubble.setAttribute("aria-label", "Soter está escribiendo");
        bubble.innerHTML = "<span></span><span></span><span></span>";

        row.appendChild(avatar);
        row.appendChild(bubble);
        els.log.appendChild(row);

        scrollToBottom();
        return row;
    }

    function appendBotMessage(text) {
        if (!els.log) return;
        const row = document.createElement("div");
        row.className = "soter-msg soter-msg--bot";

        const avatar = createSoterAvatar();
        const bubble = document.createElement("div");
        bubble.className = "soter-bubble";

        textToParagraphs(bubble, text);

        row.appendChild(avatar);
        row.appendChild(bubble);
        els.log.appendChild(row);

        scrollToBottom();
    }

    function appendContentMessage(node) {
        if (!els.log) return;
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
        if (!els.log) return;
        const row = document.createElement("div");
        row.className = "soter-msg soter-msg--user";

        const bubble = document.createElement("div");
        bubble.className = "soter-bubble";
        bubble.textContent = text;

        row.appendChild(bubble);
        els.log.appendChild(row);
        scrollToBottom();
    }

    /* Botones de opciones. "layout": "grid" -> cuadrícula (menú principal) */
    function appendOptions(options, layout) {
        if (!els.log || !options || !options.length) return;
        const wrap = document.createElement("div");
        wrap.className = "soter-options" + (layout === "grid" ? " soter-options--grid" : "");
        wrap.setAttribute("role", "group");
        wrap.setAttribute("aria-label", "Opciones de respuesta");

        options.forEach(function (opt) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "soter-chip";
            btn.textContent = (opt.icon ? opt.icon + " " : "") + opt.label;

            btn.addEventListener("click", function () {
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

    /* Enlaces directos a otras páginas de Conecta Contigo.
       Cada acción: { "label": "...", "link": "clave-de-config.links" } */
    function appendActions(actions) {
        if (!els.log || !actions || !actions.length) return;
        const wrap = document.createElement("div");
        wrap.className = "soter-actions";
        wrap.setAttribute("role", "group");
        wrap.setAttribute("aria-label", "Enlaces relacionados");

        actions.forEach(function (act) {
            const url = resolveLink(act.link);
            if (!url) {
                console.warn("Soter: enlace no definido ->", act.link);
                return;
            }
            const a = document.createElement("a");
            a.className = "soter-action";
            a.href = url;
            a.textContent = act.label + " →";
            wrap.appendChild(a);
        });

        if (wrap.children.length) {
            els.log.appendChild(wrap);
            scrollToBottom();
        }
    }

    function disableAllOptions() {
        if (!els.log) return;
        Array.prototype.forEach.call(els.log.querySelectorAll("button.soter-chip"), function (b) {
            b.disabled = true;
        });
    }

    function appendRiskCard() {
        if (!els.log) return;
        const risk = DATA.risk;
        const card = document.createElement("div");
        card.className = "soter-risk";
        card.setAttribute("role", "alert");
        card.tabIndex = -1;

        const title = document.createElement("p");
        title.className = "soter-risk__title";
        title.textContent = risk.title;
        card.appendChild(title);

        const msg = document.createElement("p");
        msg.textContent = risk.message;
        card.appendChild(msg);

        if (risk.steps && risk.steps.length) {
            const list = document.createElement("ol");
            list.className = "soter-risk__steps";
            risk.steps.forEach(function (s) {
                const li = document.createElement("li");
                li.textContent = s;
                list.appendChild(li);
            });
            card.appendChild(list);
        }

        if (risk.secondaryMessage) {
            const secondary = document.createElement("p");
            secondary.className = "soter-risk__secondary";
            secondary.textContent = risk.secondaryMessage;
            card.appendChild(secondary);
        }

        const actionsWrap = document.createElement("div");
        actionsWrap.className = "soter-risk__actions";

        if (risk.actions && risk.actions.length) {
            risk.actions.forEach(function (act) {
                const url = resolveLink(act.link);
                if (!url) return;
                const a = document.createElement("a");
                a.className = "soter-risk__action" + (act.primary ? "" : " soter-risk__action--secondary");
                a.href = url;
                a.textContent = act.label + " →";
                actionsWrap.appendChild(a);
            });
        }

        /* Compatibilidad con el formato anterior del JSON (v1) */
        if (!actionsWrap.children.length) {
            const a = document.createElement("a");
            a.className = "soter-risk__action";
            a.href = DATA.config.emergencyLink;
            a.textContent = (risk.actionLabel || "Ir a Contactos de ayuda") + " →";
            actionsWrap.appendChild(a);
        }
        card.appendChild(actionsWrap);

        els.log.appendChild(card);
        scrollToBottom();
        try { card.focus({ preventScroll: true }); } catch (e) { /* navegadores antiguos */ }
    }

    function scrollToBottom() {
        if (els.log) {
            els.log.scrollTop = els.log.scrollHeight;
        }
    }

}());

/* ====================================================================
   NAVEGACIÓN INTERNA DE SOTER (pestañas) — sin cambios
==================================================================== */

document.addEventListener("DOMContentLoaded", function () {

    const tabs = Array.prototype.slice.call(document.querySelectorAll(".soter-tab"));
    if (!tabs.length) return;

    const panels = {};
    tabs.forEach(function (tab) {
        const controlsId = tab.getAttribute("aria-controls");
        const panel = controlsId ? document.getElementById(controlsId) : null;
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

        if (key.indexOf("tema:") === 0) return false;

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