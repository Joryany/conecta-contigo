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
    let holdScroll = false;   // true mientras se dibuja una respuesta de Soter
    let talkIndex = [];       // saludos y charla breve (smallTalk)
    let talkMeta = { options: null, greeting: false }; // datos de la última coincidencia

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

        /* Diagnóstico: abre la consola (F12) para ver qué versiones se cargaron */
        const stCount = Array.isArray(DATA.smallTalk) ? DATA.smallTalk.length
            : ((DATA.smallTalk && DATA.smallTalk.entries) || []).length;
        console.info("Soter motor 2.2 · JSON v" + ((DATA.meta && DATA.meta.version) || "?") +
            " · nodos: " + Object.keys(DATA.nodes).length + " · saludos: " + stCount +
            " · explorador: " + (DATA.nodes["content:registro-explorador"] ? "sí" : "NO"));
        if (!stCount) console.warn("Soter: el JSON cargado no tiene 'smallTalk' (saludos). Revisa que data/soter-data.json sea el de la última entrega y que el navegador no use una copia en caché.");

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

        /* smallTalk admite dos formatos: lista de entradas (cada una con sus
           "options") o el objeto { entries, options, afterMessage } */
        const talkEntries = Array.isArray(DATA.smallTalk)
            ? DATA.smallTalk
            : ((DATA.smallTalk && DATA.smallTalk.entries) || []);
        talkIndex = talkEntries.map(function (e) {
            return {
                group: e.group || (Array.isArray(DATA.smallTalk) ? "talk" : "general"),   // lista: gana la primera coincidencia
                options: e.options,
                exclusive: !!e.exclusive,
                greeting: !!e.greeting,
                atStart: !!e.atStart,
                maxWords: e.maxWords || 0,
                patterns: (e.patterns || []).map(cleanText).filter(Boolean),
                exclude: (e.exclude || []).map(cleanText).filter(Boolean),
                responses: e.responses || []
            };
        });

        /* Sinónimos y expresiones coloquiales viven en DATA.searchExtras[idDelNodo] */
        const extras = DATA.searchExtras || {};
        kwIndex = [];
        Object.keys(DATA.nodes).forEach(function (id) {
            const node = DATA.nodes[id];
            if (!(node.keywords && node.keywords.length) && !(extras[id] && extras[id].length)) return;
            node.keywords = node.keywords || [];
            kwIndex.push({
                id: id,
                title: node.title || id,
                priority: node.priority || 0,
                kws: uniq(node.keywords.concat(extras[id] || []).map(cleanText).filter(Boolean))
            });
        });
    }

    function uniq(list) {
        const seen = {};
        return list.filter(function (k) { return seen[k] ? false : (seen[k] = true); });
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
        ((DATA.smallTalk && DATA.smallTalk.options) || []).forEach(function (o) { checkNext(o.next, "smallTalk"); });
        (Array.isArray(DATA.smallTalk) ? DATA.smallTalk : []).forEach(function (e) {
            if (Array.isArray(e.options)) e.options.forEach(function (o) { checkNext(o.next, "smallTalk:" + e.id); });
        });
        Object.keys(DATA.searchExtras || {}).forEach(function (id) {
            if (!DATA.nodes[id]) problems.push("searchExtras -> nodo inexistente: " + id);
        });

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
                if (node.widget === "breathing") appendBreathingWidget();
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

        /* 2. Saludos / charla breve y búsqueda por keywords con puntaje */
        const talk = findSmallTalk(clean);
        /* Entradas "exclusive" (mensajes especiales) se responden antes que la búsqueda */
        const matches = (talk && talkMeta.exclusive) ? [] : findMatches(clean);

        /* Nodos marcados "direct": true (p. ej. "no sé lo que siento") llevan
           a la respuesta de inmediato, sin lista de sugerencias */
        const top = matches[0];
        if (top && DATA.nodes[top.id] && DATA.nodes[top.id].direct) {
            navigateTo(top.id);
            return;
        }

        if (currentId) stack.push(currentId);
        currentId = null;
        updateBackButton();

        if (matches.length) {
            botSay(function () {
                /* Con un tema de por medio solo se conserva el saludo; "¿cómo estás?" se omite */
                const hello = talk && talkMeta.greeting ? (DATA.config.greetingPrefix || "") : "";
                appendBotMessage(hello +
                    "🌱 Encontré algunos temas que podrían estar relacionados con lo que cuentas. ¿Cuál se acerca más?");
                const opts = matches.map(function (m) {
                    return { label: m.title, next: m.id };
                });
                opts.push({ label: "Ninguno de estos", next: "fallback" });
                appendOptions(opts);
            });
        } else if (talk) {
            botSay(function () {
                appendBotMessage(talk);
                const own = talkMeta.options;
                if (own === "main") {
                    appendOptions(DATA.mainMenu.options, DATA.mainMenu.layout);
                } else if (Array.isArray(own)) {
                    appendOptions(own);
                } else if (!Array.isArray(DATA.smallTalk) && DATA.smallTalk) {
                    if (DATA.smallTalk.afterMessage) appendBotMessage(DATA.smallTalk.afterMessage);
                    appendOptions(DATA.smallTalk.options);
                }
            });
        } else {
            botSay(renderFallback);
        }
    }

    /* Saludos y preguntas como "¿cómo estás?". Por cada "group" responde una sola
       vez (la primera entrada que coincida). Devuelve texto o null. */
    function findSmallTalk(clean) {
        talkMeta = { options: null, greeting: false };
        if (!talkIndex.length || !clean) return null;
        clean = clean.replace(/(.)\1{2,}/g, "$1");   // "holaaaa" -> "hola"
        const padded = " " + clean + " ";
        const words = clean.split(" ").length;
        const used = {};
        const out = [];

        talkIndex.forEach(function (e) {
            if (used[e.group] || !e.responses.length) return;
            if (e.maxWords && words > e.maxWords) return;
            if (e.exclude.some(function (x) { return padded.indexOf(" " + x + " ") !== -1; })) return;

            const hit = e.patterns.some(function (p) {
                const pos = padded.indexOf(" " + p + " ");
                return e.atStart ? pos === 0 : pos !== -1;
            });
            if (hit) {
                used[e.group] = true;
                if (!out.length) talkMeta = { options: e.options, greeting: e.greeting, exclusive: e.exclusive };
                out.push(e.responses[Math.floor(Math.random() * e.responses.length)]);
            }
        });

        return out.length ? out.join("\n") : null;
    }

    /* Devuelve los nodos cuyas keywords aparecen en el texto, mejor puntaje primero.
       Regla de coincidencia (evita falsos positivos como "ira" dentro de "mirar"):
         - frases (con espacio) y palabras cortas (< 6 letras): palabra completa
         - palabras de 6+ letras: la palabra del texto puede empezar con la keyword
           (así "estres" también encuentra "estresado")
         - tolerancia a errores: una palabra de 6+ letras también coincide si el texto
           tiene una palabra casi igual (1 letra de más, de menos, distinta o
           intercambiada), p. ej. "ansiedd" o "tristesa" */
    function findMatches(clean) {
        const padded = " " + clean + " ";
        const tokens = clean ? clean.split(" ") : [];
        const found = [];

        kwIndex.forEach(function (entry) {
            let score = 0;
            entry.kws.forEach(function (k) {
                const single = k.indexOf(" ") === -1;
                const exactOnly = !single || k.length < 6;
                let hit = exactOnly
                    ? padded.indexOf(" " + k + " ") !== -1
                    : padded.indexOf(" " + k) !== -1;

                if (hit) {
                    score += k.length;
                } else if (single && k.length >= 6) {
                    const near = tokens.some(function (t) {
                        return t.length >= 5 && t.charAt(0) === k.charAt(0) && withinOneEdit(t, k);
                    });
                    if (near) score += k.length - 2;
                }
            });
            if (score > 0) {
                found.push({ id: entry.id, title: entry.title, score: score + entry.priority });
            }
        });

        found.sort(function (a, b) { return b.score - a.score; });
        return found.slice(0, MAX_MATCHES);
    }

    /* ¿Las dos palabras difieren como máximo en 1 edición (o 1 intercambio)? */
    function withinOneEdit(a, b) {
        if (a === b) return true;
        const la = a.length, lb = b.length;
        if (Math.abs(la - lb) > 1) return false;
        let i = 0, j = 0, edits = 0;
        while (i < la && j < lb) {
            if (a[i] === b[j]) { i++; j++; continue; }
            if (++edits > 1) return false;
            if (la === lb) {
                if (a[i] === b[j + 1] && a[i + 1] === b[j]) { i += 2; j += 2; }
                else { i++; j++; }
            } else if (la > lb) i++;
            else j++;
        }
        if (i < la || j < lb) edits++;
        return edits <= 1;
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
            .replace(/(.)\1{2,}/g, "$1")      // "holaaa" -> "hola"
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

            /* Se dibuja toda la respuesta sin mover el scroll y luego se
               muestra DESDE EL INICIO de lo nuevo (si es larga, el usuario
               lee el mensaje y baja a las opciones; no al revés). */
            const firstNewIndex = els.log ? els.log.children.length : 0;
            holdScroll = true;
            try {
                renderFn();
            } finally {
                holdScroll = false;
            }
            scrollToNewContent(firstNewIndex);
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

    /* Respiración guiada (node.widget = "breathing"). Ritmo y textos en
       DATA.config.breathing. No arranca sola: la persona pulsa "Comenzar".
       Las fases se marcan con data-phase y el CSS anima el círculo. */
    function appendBreathingWidget() {
        if (!els.log) return;
        const cfg = Object.assign({ inhale: 4, hold: 4, exhale: 6, cycles: 6 }, DATA.config.breathing || {});
        const L = Object.assign({
            inhale: "Inhala", hold: "Sostén", exhale: "Exhala",
            ready: "Cuando quieras, pulsa Comenzar",
            done: "Muy bien. Tómate un momento para notar cómo te sientes.",
            hint: "Si te mareas o te incomoda sostener el aire, detente y respira con normalidad.",
            start: "Comenzar", stop: "Detener", again: "Repetir", cycle: "Ciclo"
        }, cfg.labels || {});
        const steps = [["inhale", cfg.inhale], ["hold", cfg.hold], ["exhale", cfg.exhale]];

        const wrap = document.createElement("div");
        wrap.className = "soter-breath";
        wrap.dataset.phase = "rest";
        wrap.setAttribute("role", "group");
        wrap.setAttribute("aria-label", "Ejercicio de respiración guiada");

        const stage = document.createElement("div");
        stage.className = "soter-breath__stage";
        const circle = document.createElement("div");
        circle.className = "soter-breath__circle";
        circle.setAttribute("aria-hidden", "true");
        const countEl = document.createElement("span");
        countEl.className = "soter-breath__count";
        circle.appendChild(countEl);
        stage.appendChild(circle);

        const phaseEl = document.createElement("p");
        phaseEl.className = "soter-breath__phase";
        phaseEl.setAttribute("aria-live", "polite");
        phaseEl.textContent = L.ready;

        const progressEl = document.createElement("p");
        progressEl.className = "soter-breath__progress";
        progressEl.setAttribute("aria-hidden", "true");

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "soter-breath__btn";
        btn.textContent = L.start;

        const hint = document.createElement("p");
        hint.className = "soter-breath__hint";
        hint.textContent = L.hint;

        wrap.appendChild(stage);
        wrap.appendChild(phaseEl);
        wrap.appendChild(progressEl);
        wrap.appendChild(btn);
        wrap.appendChild(hint);

        let running = false, step = 0, timer = null, tick = null;

        function stop(finished) {
            running = false;
            window.clearTimeout(timer);
            window.clearInterval(tick);
            wrap.dataset.phase = "rest";
            countEl.textContent = "";
            progressEl.textContent = "";
            phaseEl.textContent = finished ? L.done : L.ready;
            btn.textContent = finished ? L.again : L.start;
        }

        function next() {
            if (!running || !wrap.isConnected) { stop(false); return; }
            if (step >= cfg.cycles * steps.length) { stop(true); return; }

            const name = steps[step % steps.length][0];
            const secs = steps[step % steps.length][1];
            progressEl.textContent = L.cycle + " " + (Math.floor(step / steps.length) + 1) + " / " + cfg.cycles;

            wrap.style.setProperty("--breath-dur", secs + "s");
            wrap.dataset.phase = name;
            phaseEl.textContent = L[name];

            let left = Math.round(secs);
            countEl.textContent = left > 0 ? left : "";
            window.clearInterval(tick);
            tick = window.setInterval(function () {
                left -= 1;
                countEl.textContent = left > 0 ? left : "";
            }, 1000);

            step += 1;
            timer = window.setTimeout(next, secs * 1000);
        }

        btn.addEventListener("click", function () {
            if (running) { stop(false); return; }
            running = true;
            step = 0;
            btn.textContent = L.stop;
            next();
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
        if (els.log && !holdScroll) {
            els.log.scrollTop = els.log.scrollHeight;
        }
    }

    /* Alinea el scroll con el inicio del primer elemento nuevo del chat.
       Si lo nuevo cabe en pantalla, queda al fondo como siempre. */
    function scrollToNewContent(firstNewIndex) {
        if (!els.log) return;
        const first = els.log.children[firstNewIndex];
        if (!first) { scrollToBottom(); return; }
        const top = first.getBoundingClientRect().top - els.log.getBoundingClientRect().top + els.log.scrollTop;
        els.log.scrollTop = Math.max(0, top - 12);
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