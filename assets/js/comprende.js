/* ====================================================================
   COMPRENDE.JS
   Lógica de la sección "Comprende" de Conecta Contigo.

   Resumen de arquitectura:
   - Los datos (condiciones, situaciones, herramientas) viven en JSON,
     separados por completo del HTML y del CSS.
   - Existe UNA sola plantilla HTML (comprende.html) que se rellena
     dinámicamente según el tema elegido: no hay una página por tema.
   - La navegación entre "inicio" y "detalle" se resuelve alternando
     la visibilidad de #comprende-home y #comprende-detalle, y se
     refleja en la URL con ?tipo=condicion&tema=depresion para poder
     compartir o recargar un enlace directo.
   - Toda interacción (abrir un tema, cambiar de pestaña, abrir un
     modal, reproducir audio...) pasa por un único listener de clics
     delegado que lee atributos data-action, en vez de asignar un
     listener distinto a cada botón cada vez que se vuelve a dibujar
     el contenido.
==================================================================== */

'use strict';

(function () {

    /* ----------------------------------------------------------------
       0. ESTADO Y REFERENCIAS
    ---------------------------------------------------------------- */

    const DATA_PATHS = {
        condiciones: 'data/condiciones.json',
        situaciones: 'data/situaciones.json',
        herramientas: 'data/herramientas.json'
    };

    // Elementos usados con frecuencia sin poder ser sustituidos por que están fuera de las vistas dinámicas.
    const el = {};

    const estado = {
        condiciones: [],
        situaciones: [],
        herramientas: null,
        categoriaActiva: 'Todas'
    };

    // Tema (condición o situación) que se está mostrando en el detalle actual.
    let detalleActual = null;
    let ultimoFoco = null;

    // Elementos/atributos que nunca deben leerse en voz alta aunque estén
    // dentro de un bloque marcado como "data-speak".
    const SELECTOR_EXCLUIR_LECTURA =
        'button, select, .audio-controles, .modo-toggle, .accion-tabs, .detalle__volver, a.boton-ayuda';

    document.addEventListener('DOMContentLoaded', iniciar);

    /* ----------------------------------------------------------------
       1. INICIO
    ---------------------------------------------------------------- */

    async function iniciar() {
        cachearElementos();
        await cargarDatos();

        renderGridCondiciones(estado.condiciones);
        renderGridSituaciones(estado.situaciones);
        renderHerramientasGenerales();
        configurarBuscador();
        configurarModal();

        document.addEventListener('click', manejarClicGlobal);
        document.addEventListener('change', manejarCambioGlobal);
        document.addEventListener('toggle', manejarToggleAcordeon, true);
        window.addEventListener('popstate', aplicarRutaDesdeURL);

        aplicarRutaDesdeURL();
    }

    function cachearElementos() {
        el.home = document.getElementById('comprende-home');
        el.detalle = document.getElementById('comprende-detalle');
        el.gridCondiciones = document.getElementById('grid-condiciones');
        el.gridSituaciones = document.getElementById('grid-situaciones');
        el.condicionesVacio = document.getElementById('condiciones-vacio');
        el.buscadorInput = document.getElementById('buscador-input');
        el.chipGroup = document.getElementById('chip-group');
        el.modal = document.getElementById('comprende-modal');
        el.modalPanel = document.getElementById('modal-panel');
        el.modalContenido = document.getElementById('modal-contenido');
    }

    async function cargarDatos() {
        try {
            const [rCond, rSit, rHer] = await Promise.all([
                fetch(DATA_PATHS.condiciones),
                fetch(DATA_PATHS.situaciones),
                fetch(DATA_PATHS.herramientas)
            ]);
            const [dCond, dSit, dHer] = await Promise.all([rCond.json(), rSit.json(), rHer.json()]);

            estado.condiciones = dCond.conditions || [];
            estado.situaciones = dSit.situations || [];
            estado.herramientas = dHer || {};
        } catch (error) {
            console.error('Comprende: no se pudieron cargar los datos.', error);
            if (el.gridCondiciones) {
                el.gridCondiciones.innerHTML =
                    '<p class="buscador-vacio">No fue posible cargar el contenido en este momento. Intenta recargar la página.</p>';
            }
        }
    }

    /* ----------------------------------------------------------------
       2. RUTEO (?tipo=condicion&tema=depresion)
    ---------------------------------------------------------------- */

    function aplicarRutaDesdeURL() {
        const params = new URLSearchParams(window.location.search);
        const tipo = params.get('tipo');
        const tema = params.get('tema');
        if (tipo && tema) {
            abrirDetalle(tipo, tema);
        } else {
            mostrarHome();
        }
    }

    function irADetalle(tipo, id) {
        const url = `${window.location.pathname}?tipo=${encodeURIComponent(tipo)}&tema=${encodeURIComponent(id)}`;
        history.pushState({ tipo, id }, '', url);
        abrirDetalle(tipo, id);
    }

    function volverAHome() {
        detenerAudio();
        history.pushState({}, '', window.location.pathname);
        mostrarHome();
    }

    function mostrarHome() {
        detenerAudio();
        el.detalle.hidden = true;
        el.detalle.innerHTML = '';
        el.home.hidden = false;
    }

    function abrirDetalle(tipo, id) {
        let item = null;
        if (tipo === 'condicion') {
            item = estado.condiciones.find(c => c.id === id);
        } else if (tipo === 'situacion') {
            item = estado.situaciones.find(s => s.id === id);
        }

        if (!item) {
            mostrarHome();
            return;
        }

        detenerAudio();
        el.home.hidden = true;
        el.detalle.hidden = false;

        if (tipo === 'condicion') {
            renderDetalleCondicion(item);
        } else {
            renderDetalleSituacion(item);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ----------------------------------------------------------------
       3. TARJETAS DE INICIO (condiciones y situaciones)
    ---------------------------------------------------------------- */

    function crearTarjetaCondicion(cond) {
        return `
            <article class="tarjeta-item">
                <span class="tarjeta-item__etiqueta">${escapeHtml(cond.category)}</span>
                <h3>${escapeHtml(cond.title)}</h3>
                <p>${escapeHtml(cond.shortDescription)}</p>
                <button type="button" class="tarjeta-item__boton" data-action="abrir-detalle" data-tipo="condicion" data-id="${cond.id}">
                    Comprender →
                </button>
            </article>`;
    }

    function crearTarjetaSituacion(sit) {
        return `
            <article class="tarjeta-item">
                <h3>${escapeHtml(sit.title)}</h3>
                <p>${escapeHtml(sit.shortDescription)}</p>
                <button type="button" class="tarjeta-item__boton" data-action="abrir-detalle" data-tipo="situacion" data-id="${sit.id}">
                    Comprender →
                </button>
            </article>`;
    }

    function renderGridCondiciones(lista) {
        el.gridCondiciones.innerHTML = lista.map(crearTarjetaCondicion).join('');
        el.condicionesVacio.hidden = lista.length !== 0;
    }

    function renderGridSituaciones(lista) {
        el.gridSituaciones.innerHTML = lista.map(crearTarjetaSituacion).join('');
    }

    /* ----------------------------------------------------------------
       4. BUSCADOR Y FILTRO POR CATEGORÍA
    ---------------------------------------------------------------- */

    function configurarBuscador() {
        const categorias = ['Todas', ...new Set(estado.condiciones.map(c => c.category))];
        el.chipGroup.innerHTML = categorias.map(cat => `
            <button type="button" class="chip" data-action="chip" data-categoria="${escapeAttr(cat)}"
                aria-pressed="${cat === 'Todas'}">${escapeHtml(cat)}</button>
        `).join('');

        el.buscadorInput.addEventListener('input', debounce(aplicarFiltros, 150));
    }

    function seleccionarCategoria(categoria) {
        estado.categoriaActiva = categoria;
        el.chipGroup.querySelectorAll('.chip').forEach(chip => {
            chip.setAttribute('aria-pressed', String(chip.dataset.categoria === categoria));
        });
        aplicarFiltros();
    }

    function aplicarFiltros() {
        const query = normalizarTexto(el.buscadorInput.value.trim());

        const filtradas = estado.condiciones.filter(c => {
            const coincideCategoria = estado.categoriaActiva === 'Todas' || c.category === estado.categoriaActiva;
            if (!coincideCategoria) return false;
            if (!query) return true;

            const bolsaTexto = normalizarTexto(
                [c.title, c.shortDescription, ...(c.keywords || [])].join(' ')
            );
            return bolsaTexto.includes(query);
        });

        renderGridCondiciones(filtradas);
    }

    /* ----------------------------------------------------------------
       5. DETALLE: CONDICIÓN
    ---------------------------------------------------------------- */

    function renderDetalleCondicion(cond) {
        detalleActual = cond;

        const faqHtml = (cond.faq && cond.faq.length) ? `
            <div class="bloque solo-completo">
                <h2>Preguntas frecuentes</h2>
                <div class="acordeon-grupo">
                    ${cond.faq.map((f, i) => accordionItem(`faq-${cond.id}-${i}`, f.question, f.answer)).join('')}
                </div>
            </div>` : '';

        const herramientasHtml = (cond.tools && cond.tools.length) ? `
            <div class="bloque solo-completo">
                <h2>Herramientas</h2>
                <div class="herramientas-grid">
                    ${cond.tools.map(toolCard).join('')}
                </div>
            </div>` : '';

        el.detalle.innerHTML = `
            <button type="button" class="detalle__volver" data-action="volver">← Volver a Comprende</button>

            <div class="detalle__hero" data-speak>
                <span class="detalle__categoria">${escapeHtml(cond.category)}</span>
                <h2>${escapeHtml(cond.title)}</h2>
                <p>${escapeHtml(cond.shortDescription)}</p>
                ${audioControlesHtml(cond.id)}
            </div>

            <div class="modo-toggle" role="group" aria-label="Nivel de detalle">
                <button type="button" data-action="modo" data-modo="completo" aria-pressed="true">Completo</button>
                <button type="button" data-action="modo" data-modo="resumen" aria-pressed="false">Resumen</button>
            </div>

            <div class="bloque bloque--card" data-speak>
                <h2>¿Qué es?</h2>
                <p>${escapeHtml(cond.description)}</p>
            </div>

            <div class="bloque bloque--card" data-speak>
                <h2>¿Cómo puede experimentarse?</h2>
                <div class="experiencia-grid">
                    ${cond.experience.columns.map(col => `
                        <div class="experiencia-col">
                            <h3>${escapeHtml(col.label)}</h3>
                            <ul>${col.items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="bloque bloque--card" data-speak>
                <h2>Señales de alerta</h2>
                <ul class="senales-lista">
                    ${cond.warningSigns.map(s => `
                        <li class="senal-item">
                            <span class="senal-item__icono" aria-hidden="true">⚠</span>
                            <span>${escapeHtml(s)}</span>
                        </li>
                    `).join('')}
                </ul>
                <p class="nota">Reconocer una señal no significa automáticamente tener un trastorno. Esta información es para comprender, no para autodiagnosticarte.</p>
            </div>

            <div class="bloque bloque--card" data-speak>
                <h2>¿Qué puedo hacer?</h2>
                <div class="accion-tabs" role="group" aria-label="Elige tu situación">
                    <button type="button" data-action="accion-tab" data-tab="self" aria-pressed="true">Me pasa a mí</button>
                    <button type="button" data-action="accion-tab" data-tab="other" aria-pressed="false">Le pasa a alguien cercano</button>
                </div>
                <div class="accion-panel" id="accion-panel">${escapeHtml(cond.actions.self)}</div>
            </div>

            ${faqHtml}
            ${herramientasHtml}

            <div class="bloque ayuda-bloque" data-speak>
                <h2>¿Cuándo buscar ayuda?</h2>
                <p>${escapeHtml(cond.whenToSeekHelp)}</p>
                ${cond.helpLink ? `<a class="boton-ayuda" style="display:inline-block;padding:var(--boton-y) var(--boton-x);border-radius:var(--radio-pill);text-decoration:none;" href="${cond.helpLink}">Buscar ayuda</a>` : ''}
            </div>

            ${renderRecursos(cond.resources)}
            ${renderFuentes(cond.sources)}
        `;

        cambiarModo('completo');
        ocultarAudioSiNoSoportado();
    }

    /* ----------------------------------------------------------------
       6. DETALLE: SITUACIÓN
    ---------------------------------------------------------------- */

    function renderDetalleSituacion(sit) {
        detalleActual = null;

        let cuerpo = '';
        if (sit.type === 'comparison') {
            cuerpo = renderComparacion(sit.comparison);
        } else if (sit.type === 'flow') {
            cuerpo = renderFlujo(sit.flow);
        }

        el.detalle.innerHTML = `
            <button type="button" class="detalle__volver" data-action="volver">← Volver a Comprende</button>

            <div class="detalle__hero" data-speak>
                <h2>${escapeHtml(sit.title)}</h2>
                <p>${escapeHtml(sit.intro)}</p>
                ${audioControlesHtml(sit.id)}
            </div>

            <div class="bloque bloque--card" data-speak>
                ${cuerpo}
            </div>

            ${renderRecursos(sit.resources)}
            ${renderFuentes(sit.sources)}
        `;

        ocultarAudioSiNoSoportado();
    }

    function renderComparacion(comp) {
        return `
            <h2>Comparación</h2>
            <div class="comparacion-grid">
                <div class="comparacion-fila comparacion-fila--encabezado">
                    <div class="comparacion-fila__etiqueta"></div>
                    <div class="comparacion-celda">${escapeHtml(comp.columns[0])}</div>
                    <div class="comparacion-celda comparacion-celda--persistente">${escapeHtml(comp.columns[1])}</div>
                </div>
                ${comp.rows.map(r => `
                    <div class="comparacion-fila">
                        <div class="comparacion-fila__etiqueta">${escapeHtml(r.label)}</div>
                        <div class="comparacion-celda" data-col-label="${escapeAttr(comp.columns[0])}">${escapeHtml(r.values[0])}</div>
                        <div class="comparacion-celda comparacion-celda--persistente" data-col-label="${escapeAttr(comp.columns[1])}">${escapeHtml(r.values[1])}</div>
                    </div>
                `).join('')}
            </div>
            ${comp.note ? `<p class="nota" style="margin-top:10px;">${escapeHtml(comp.note)}</p>` : ''}
        `;
    }

    function renderFlujo(flow) {
        return `
            <h2>${escapeHtml(flow.title)}</h2>
            <div class="flujo">
                ${flow.steps.map((s, i) => `
                    <div class="flujo__paso">
                        <span class="flujo__numero">${i + 1}</span>
                        <h3>${escapeHtml(s.step)}</h3>
                        <p>${escapeHtml(s.description)}</p>
                    </div>
                    ${i < flow.steps.length - 1 ? '<div class="flujo__flecha" aria-hidden="true">→</div>' : ''}
                `).join('')}
            </div>
        `;
    }

    /* ----------------------------------------------------------------
       7. MODO COMPLETO / RESUMEN Y TABS "¿QUÉ PUEDO HACER?"
    ---------------------------------------------------------------- */

    function cambiarModo(modo) {
        document.querySelectorAll('.modo-toggle button').forEach(b => {
            b.setAttribute('aria-pressed', String(b.dataset.modo === modo));
        });
        el.detalle.querySelectorAll('.solo-completo').forEach(sec => {
            sec.hidden = (modo === 'resumen');
        });
    }

    function cambiarAccionTab(tab) {
        if (!detalleActual || !detalleActual.actions) return;
        document.querySelectorAll('.accion-tabs button').forEach(b => {
            b.setAttribute('aria-pressed', String(b.dataset.tab === tab));
        });
        const panel = document.getElementById('accion-panel');
        if (panel) panel.textContent = detalleActual.actions[tab] || '';
    }

    /* ----------------------------------------------------------------
       8. FAQ / ACORDEONES (<details><summary>)
    ---------------------------------------------------------------- */

    function accordionItem(id, pregunta, respuesta) {
        return `
            <details class="acordeon-item" id="${id}">
                <summary aria-expanded="false">${escapeHtml(pregunta)}</summary>
                <div class="acordeon-item__contenido">${escapeHtml(respuesta)}</div>
            </details>`;
    }

    // El evento "toggle" de <details> no burbujea, pero sí pasa por la
    // fase de captura, así que un único listener en document (con el
    // tercer argumento "true") alcanza para todos los acordeones,
    // incluso los que todavía no existían cuando se registró.
    function manejarToggleAcordeon(e) {
        if (!(e.target instanceof HTMLElement)) return;
        if (!e.target.matches('details')) return;
        const resumen = e.target.querySelector(':scope > summary');
        if (resumen) resumen.setAttribute('aria-expanded', String(e.target.open));
    }

    /* ----------------------------------------------------------------
       9. HERRAMIENTAS (tarjetas de condición + sección general)
    ---------------------------------------------------------------- */

    function toolCard(tool) {
        const descripcion = tool.description ? `<p>${escapeHtml(tool.description)}</p>` : '';
        const boton = tool.description ? `
            <button type="button" data-action="abrir-modal-herramienta"
                data-nombre="${escapeAttr(tool.name)}" data-descripcion="${escapeAttr(tool.description)}">
                Ver herramienta
            </button>` : '';
        return `
            <div class="herramienta-card">
                <h3>${escapeHtml(tool.name)}</h3>
                ${descripcion}
                ${boton}
            </div>`;
    }

    function renderHerramientasGenerales() {
        const h = estado.herramientas;
        if (!h) return;

        // Ciclo de la mente
        document.getElementById('ciclo-titulo').textContent = h.cycle.title;
        document.getElementById('ciclo-descripcion').textContent = h.cycle.description;
        document.getElementById('ciclo-mente').innerHTML = h.cycle.steps.map((s, i) => `
            <div class="ciclo-mente__paso"><strong>${escapeHtml(s.label)}</strong><span>${escapeHtml(s.example)}</span></div>
            ${i < h.cycle.steps.length - 1 ? '<span class="ciclo-mente__flecha" aria-hidden="true">→</span>' : ''}
        `).join('');

        // Pilares del bienestar
        document.getElementById('pilares-titulo').textContent = h.pillars.title;
        document.getElementById('pilares-descripcion').textContent = h.pillars.description;
        document.getElementById('pilares-grid').innerHTML = h.pillars.items.map(p => `
            <div class="pilar-card">
                <h3>${escapeHtml(p.title)}</h3>
                <p>${escapeHtml(p.description)}</p>
                <span class="pilar-ganancia">${escapeHtml(p.gain)}</span>
            </div>
        `).join('');

        // Ayuda inmediata (autolesiones / riesgo suicida)
        const eh = h.emergencyHelp;
        document.getElementById('comprende-ayuda-inmediata').innerHTML = `
            <div class="emergencia-bloque" data-speak>
                <h2>${escapeHtml(eh.title)}</h2>
                <h3>${escapeHtml(eh.selfHarmNote.title)}</h3>
                <p>${escapeHtml(eh.selfHarmNote.text)}</p>
                <h3>${escapeHtml(eh.protocolTitle)}</h3>
                <p>${escapeHtml(eh.protocolIntro)}</p>
                <ol class="protocolo-pasos">
                    ${eh.protocolSteps.map(s => `
                        <li><div><strong>${escapeHtml(s.step)}</strong><span>${escapeHtml(s.description)}</span></div></li>
                    `).join('')}
                </ol>
                <h3>${escapeHtml(eh.directoryTitle)}</h3>
                <div class="emergencia-directorio">
                    ${eh.directory.map(d => `
                        <div class="emergencia-item">
                            <strong>${escapeHtml(d.entity)}</strong>
                            <span class="emergencia-contacto">${escapeHtml(d.contact)}</span>
                            <span class="emergencia-servicio">${escapeHtml(d.service)}</span>
                        </div>
                    `).join('')}
                </div>
                ${eh.helpLink ? `<a class="boton-ayuda" style="display:inline-block;margin-top:12px;padding:var(--boton-y) var(--boton-x);border-radius:var(--radio-pill);background:var(--resalte);color:#fff;font-weight:700;text-decoration:none;" href="${eh.helpLink}">Buscar ayuda</a>` : ''}
            </div>
        `;

        // FAQ general
        document.getElementById('faq-general').innerHTML = h.generalFaq
            .map((f, i) => accordionItem(`faq-general-${i}`, f.question, f.answer))
            .join('');

        // Fuentes generales
        document.getElementById('fuentes-generales').innerHTML = listaFuentesHtml(h.generalSources);
    }

    /* ----------------------------------------------------------------
       10. RECURSOS MULTIMEDIA (imagen / video / pdf / enlace)
    ---------------------------------------------------------------- */

    function renderRecursos(resources) {
        if (!resources || !resources.length) return '';
        return `
            <div class="bloque solo-completo">
                <h2>Recursos</h2>
                <div class="recursos-grid">
                    ${resources.map(recursoCard).join('')}
                </div>
            </div>`;
    }

    function recursoCard(r) {
        switch (r.type) {
            case 'image':
                return `
                    <div class="recurso-card recurso-imagen">
                        <img src="${r.src}" alt="${escapeAttr(r.alt || '')}"
                            data-action="abrir-modal-imagen" data-src="${r.src}" data-alt="${escapeAttr(r.alt || '')}">
                        <div class="recurso-card__cuerpo">
                            <h3>${escapeHtml(r.title || '')}</h3>
                            <p>${escapeHtml(r.description || '')}</p>
                        </div>
                    </div>`;
            case 'video':
                return `
                    <div class="recurso-card recurso-video">
                        <div class="recurso-video__envoltorio">${resolverVideoEmbed(r.src)}</div>
                        <div class="recurso-card__cuerpo">
                            <h3>${escapeHtml(r.title || '')}</h3>
                            <p>${escapeHtml(r.description || '')}</p>
                        </div>
                    </div>`;
            case 'pdf':
                return `
                    <div class="recurso-card">
                        <div class="recurso-card__cuerpo">
                            <h3>📄 ${escapeHtml(r.title || 'Documento')}</h3>
                            <p>${escapeHtml(r.description || '')}</p>
                            <a class="recurso-enlace" href="${r.src}" target="_blank" rel="noopener noreferrer">Ver PDF →</a>
                        </div>
                    </div>`;
            case 'link':
                return `
                    <div class="recurso-card">
                        <div class="recurso-card__cuerpo">
                            <h3>🔗 ${escapeHtml(r.title || '')}</h3>
                            <p>${escapeHtml(r.description || '')}</p>
                            <a class="recurso-enlace" href="${r.url}" target="_blank" rel="noopener noreferrer">Visitar recurso →</a>
                        </div>
                    </div>`;
            default:
                return '';
        }
    }

    function resolverVideoEmbed(src) {
        if (!src) return '';
        if (src.includes('youtube.com') || src.includes('youtu.be')) {
            const match = src.match(/(?:v=|youtu\.be\/)([\w-]{6,})/);
            const idVideo = match ? match[1] : '';
            return `<iframe src="https://www.youtube.com/embed/${idVideo}" title="Video" loading="lazy" allowfullscreen></iframe>`;
        }
        return `<video controls src="${src}"></video>`;
    }

    /* ----------------------------------------------------------------
       11. FUENTES
    ---------------------------------------------------------------- */

    function listaFuentesHtml(fuentes) {
        return `
            <ul style="list-style:disc;padding-left:20px;display:flex;flex-direction:column;gap:6px;">
                ${fuentes.map(s => `
                    <li>
                        ${escapeHtml(s.institution)}${s.title ? ' — ' + escapeHtml(s.title) : ''}
                        ${s.url ? ` (<a href="${s.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.url.replace(/^https?:\/\//, ''))}</a>)` : ''}
                    </li>
                `).join('')}
            </ul>`;
    }

    function renderFuentes(fuentes) {
        if (!fuentes || !fuentes.length) return '';
        return `
            <div class="bloque solo-completo">
                <details class="acordeon-item">
                    <summary aria-expanded="false">Fuentes y referencias</summary>
                    <div class="acordeon-item__contenido">${listaFuentesHtml(fuentes)}</div>
                </details>
            </div>`;
    }

    /* ----------------------------------------------------------------
       12. AUDIO (Web Speech API / SpeechSynthesis)
    ---------------------------------------------------------------- */

    function audioSoportado() {
        return 'speechSynthesis' in window;
    }

    function audioControlesHtml(idUnico) {
        return `
            <div class="audio-controles" id="audio-controles">
                <button type="button" data-action="audio-play" id="audio-play">▶ Escuchar esta página</button>
                <button type="button" class="secundario" data-action="audio-pause" id="audio-pause" hidden>⏸ Pausar</button>
                <button type="button" class="secundario" data-action="audio-stop" id="audio-stop" hidden>⏹ Detener</button>
                <label for="audio-rate-${idUnico}" class="nota" style="margin:0;">Velocidad</label>
                <select id="audio-rate-${idUnico}" data-audio-rate>
                    <option value="0.75">0.75x</option>
                    <option value="1" selected>1x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                </select>
            </div>`;
    }

    function ocultarAudioSiNoSoportado() {
        if (audioSoportado()) return;
        const controles = document.getElementById('audio-controles');
        if (controles) controles.hidden = true;
    }

    // Extrae solo el texto visible y "leíble" del contenido actual,
    // ignorando botones, navegación y bloques ocultos por el modo Resumen.
    function textoLegible() {
        const raiz = el.detalle.hidden
            ? document.getElementById('comprende-herramientas')
            : el.detalle;
        if (!raiz) return '';

        const nodos = raiz.querySelectorAll('[data-speak]');
        const partes = [];
        nodos.forEach(nodo => {
            if (nodo.closest('[hidden]')) return;
            const clon = nodo.cloneNode(true);
            clon.querySelectorAll(SELECTOR_EXCLUIR_LECTURA).forEach(x => x.remove());
            const texto = clon.textContent.replace(/\s+/g, ' ').trim();
            if (texto) partes.push(texto);
        });
        return partes.join('. ');
    }

    function iniciarOReanudarLectura() {
        if (!audioSoportado()) return;
        const synth = window.speechSynthesis;

        if (synth.speaking && synth.paused) {
            synth.resume();
            actualizarBotonesAudio('reproduciendo');
            return;
        }

        const texto = textoLegible();
        if (!texto) return;

        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        const selectorRate = document.querySelector('[data-audio-rate]');
        utterance.rate = selectorRate ? parseFloat(selectorRate.value) : 1;
        utterance.onend = () => actualizarBotonesAudio('detenido');
        utterance.onerror = () => actualizarBotonesAudio('detenido');

        synth.speak(utterance);
        actualizarBotonesAudio('reproduciendo');
    }

    function pausarLectura() {
        if (!audioSoportado()) return;
        window.speechSynthesis.pause();
        actualizarBotonesAudio('pausado');
    }

    function detenerAudio() {
        if (!audioSoportado()) return;
        window.speechSynthesis.cancel();
        actualizarBotonesAudio('detenido');
    }

    function actualizarBotonesAudio(estadoAudio) {
        const playBtn = document.getElementById('audio-play');
        const pauseBtn = document.getElementById('audio-pause');
        const stopBtn = document.getElementById('audio-stop');
        if (!playBtn) return;

        if (estadoAudio === 'reproduciendo') {
            playBtn.hidden = true;
            pauseBtn.hidden = false;
            stopBtn.hidden = false;
        } else if (estadoAudio === 'pausado') {
            playBtn.hidden = false;
            playBtn.textContent = '▶ Reanudar';
            pauseBtn.hidden = true;
            stopBtn.hidden = false;
        } else {
            playBtn.hidden = false;
            playBtn.textContent = '▶ Escuchar esta página';
            pauseBtn.hidden = true;
            stopBtn.hidden = true;
        }
    }

    /* ----------------------------------------------------------------
       13. MODAL GENÉRICO
    ---------------------------------------------------------------- */

    function configurarModal() {
        el.modal.addEventListener('click', (e) => {
            if (e.target === el.modal) cerrarModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !el.modal.hidden) cerrarModal();
        });
    }

    function abrirModal(html, opciones = {}) {
        ultimoFoco = document.activeElement;
        el.modalContenido.innerHTML = html;
        el.modalPanel.classList.toggle('modal-panel--imagen', !!opciones.imagen);
        el.modal.hidden = false;
        requestAnimationFrame(() => el.modal.classList.add('activo'));

        const focoInicial = el.modal.querySelector('#modal-cerrar');
        if (focoInicial) focoInicial.focus();
        document.addEventListener('keydown', atraparFoco);
    }

    function cerrarModal() {
        el.modal.classList.remove('activo');
        document.removeEventListener('keydown', atraparFoco);
        setTimeout(() => {
            el.modal.hidden = true;
            el.modalContenido.innerHTML = '';
        }, 200);
        if (ultimoFoco) ultimoFoco.focus();
    }

    function atraparFoco(e) {
        if (e.key !== 'Tab') return;
        const focosPosibles = el.modal.querySelectorAll('button, a[href]');
        if (!focosPosibles.length) return;
        const primero = focosPosibles[0];
        const ultimo = focosPosibles[focosPosibles.length - 1];

        if (e.shiftKey && document.activeElement === primero) {
            e.preventDefault();
            ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
            e.preventDefault();
            primero.focus();
        }
    }

    function abrirModalImagen(src, alt) {
        abrirModal(`<img src="${src}" alt="${escapeAttr(alt || '')}">`, { imagen: true });
    }

    function abrirModalHerramienta(nombre, descripcion) {
        abrirModal(`<h3 id="modal-titulo">${escapeHtml(nombre)}</h3><p>${escapeHtml(descripcion)}</p>`);
    }

    /* ----------------------------------------------------------------
       14. DELEGACIÓN DE EVENTOS (data-action)
    ---------------------------------------------------------------- */

    function manejarClicGlobal(e) {
        const boton = e.target.closest('[data-action]');
        if (!boton) return;

        switch (boton.dataset.action) {
            case 'abrir-detalle':
                irADetalle(boton.dataset.tipo, boton.dataset.id);
                break;
            case 'volver':
                volverAHome();
                break;
            case 'modo':
                cambiarModo(boton.dataset.modo);
                break;
            case 'accion-tab':
                cambiarAccionTab(boton.dataset.tab);
                break;
            case 'chip':
                seleccionarCategoria(boton.dataset.categoria);
                break;
            case 'audio-play':
                iniciarOReanudarLectura();
                break;
            case 'audio-pause':
                pausarLectura();
                break;
            case 'audio-stop':
                detenerAudio();
                break;
            case 'abrir-modal-imagen':
                abrirModalImagen(boton.dataset.src, boton.dataset.alt);
                break;
            case 'abrir-modal-herramienta':
                abrirModalHerramienta(boton.dataset.nombre, boton.dataset.descripcion);
                break;
            case 'cerrar-modal':
                cerrarModal();
                break;
        }
    }

    function manejarCambioGlobal(e) {
        if (e.target.matches('[data-audio-rate]')) {
            // La Web Speech API no permite cambiar la velocidad de una
            // lectura en curso, así que se reinicia con la nueva velocidad.
            if (audioSoportado() && window.speechSynthesis.speaking) {
                detenerAudio();
                iniciarOReanudarLectura();
            }
        }
    }

    // El botón de cerrar del modal vive fuera del contenido dinámico,
    // así que se conecta una sola vez al cargar la página.
    document.addEventListener('DOMContentLoaded', () => {
        const cerrar = document.getElementById('modal-cerrar');
        if (cerrar) cerrar.addEventListener('click', cerrarModal);
    });

    /* ----------------------------------------------------------------
       15. UTILIDADES
    ---------------------------------------------------------------- */

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function escapeAttr(str) {
        return escapeHtml(str).replace(/"/g, '&quot;');
    }

    function normalizarTexto(str) {
        return (str || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function debounce(fn, ms) {
        let temporizador;
        return (...args) => {
            clearTimeout(temporizador);
            temporizador = setTimeout(() => fn(...args), ms);
        };
    }

})();