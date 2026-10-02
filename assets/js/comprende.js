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
     delegado que lee atributos data-action.
   - El protocolo de crisis y el directorio de líneas de ayuda viven
     en este archivo (constante LINEAS_AYUDA) y se muestran en un modal
     que se abre desde el botón flotante SOS.
==================================================================== */

'use strict';

(function () {

    /* ----------------------------------------------------------------
       0. ESTADO, REFERENCIAS E ÍCONOS
    ---------------------------------------------------------------- */

    const DATA_PATHS = {
        condiciones: 'data/condiciones.json',
        situaciones: 'data/situaciones.json',
        herramientas: 'data/herramientas.json'
    };

    const el = {};

    const estado = {
        condiciones: [],
        situaciones: [],
        herramientas: null,
        categoriaActiva: 'Todas'
    };

    let detalleActual = null;
    let ultimoFoco = null;

    const SELECTOR_EXCLUIR_LECTURA =
        'button, select, .audio-controles, .modo-toggle, .accion-tabs, .detalle__volver, .migas, a.boton-primario, a.boton-secundario';

    // Íconos usados como referencia visual rápida (no reemplazan al texto,
    // solo lo acompañan). Cambiarlos aquí los cambia en toda la sección.
    const ICONOS = {
        entender: '🌿',
        reconocer: '🔎',
        actuar: '🛠️',
        recursos: '📚',
        queEs: '💡',
        experiencia: '🧭',
        alerta: '⚠️',
        accion: '🌱',
        faq: '❓',
        herramientas: '🧰',
        ayuda: '❤️',
        comparacion: '⚖️',
        flujo: '🔄'
    };

    const CTA_CONDICIONES = ['Comprender', 'Explorar', 'Conocer más', 'Descubrir'];
    const CTA_SITUACIONES = ['Explorar', 'Conocer más'];
    const TOOL_ICONOS = ['🧩', '🌙', '🫁', '🧘', '📘', '🛠️'];
    const PILAR_ICONOS = {
        'sueno': '😴',
        'actividad-fisica': '🏃',
        'relaciones': '🤝',
        'alimentacion': '🥗',
        'ocio': '🎨',
        'limites-digitales': '📱'
    };
    const CICLO_ICONOS = { 'Emoción': '❤️', 'Pensamiento': '💭', 'Conducta': '🏃' };

    /* ----------------------------------------------------------------
       ÍCONOS SVG (trazo, sin emojis) Y DIRECTORIO DE LÍNEAS DE AYUDA
    ---------------------------------------------------------------- */

    const SVG_ICONOS = {
        escuchar: '<path d="M6 8.5a6 6 0 0 1 12 0c0 3.5-3 4-3 7a3 3 0 0 1-6 0"/><path d="M9.5 8.5a2.5 2.5 0 0 1 5 0"/>',
        preguntar: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        usuarios: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
        proteger: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        llamar: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
        mensaje: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
        corazon: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
        reloj: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        alerta: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        evitar: '<circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/>',
        ninos: '<circle cx="12" cy="8" r="4"/><path d="M5 21v-1a7 7 0 0 1 14 0v1"/>'
    };

    function icono(nombre) {
        return `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG_ICONOS[nombre] || ''}</svg>`;
    }

    // Directorio único de líneas. "tel" = número para marcar; "wa" = número
    // internacional sin "+" para abrir WhatsApp (opcional).
    // IMPORTANTE: verifica periódicamente estos números con el Ministerio de Salud.
    const LINEAS_AYUDA = [
        { nombre: 'Emergencias', numero: '123', tel: '123', icono: 'alerta', urgente: true,
          servicio: 'Policía, ambulancia y bomberos. Todos los días, 24 h.' },
        { nombre: 'Línea Nacional de Salud Mental', numero: '106', tel: '106', icono: 'corazon',
          servicio: 'Orientación emocional y prevención del suicidio. Gratuita, 24 h.' },
        { nombre: 'Línea 106 · chat (Bogotá)', numero: '300 754 8933', tel: '+573007548933', wa: '573007548933', icono: 'mensaje',
          servicio: 'Chat de la Línea 106 por WhatsApp. 24 h.' },
        { nombre: 'Línea de la Vida (Barranquilla)', numero: '(605) 339 9999', tel: '+576053399999', icono: 'llamar',
          servicio: 'Atención en salud mental en Barranquilla y su área metropolitana.' },
        { nombre: 'ICBF · Línea 141', numero: '141', tel: '141', icono: 'ninos',
          servicio: 'Protección de niñas, niños y adolescentes. Gratuita, 24 h.' },
        { nombre: 'Línea 155', numero: '155', tel: '155', icono: 'usuarios',
          servicio: 'Orientación a mujeres víctimas de violencia. Gratuita, 24 h.' }
    ];

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
        el.hero = document.getElementById('comprende-hero');
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
        if (el.hero) el.hero.hidden = false;
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
        if (el.hero) el.hero.hidden = true;
        el.detalle.hidden = false;

        if (tipo === 'condicion') {
            renderDetalleCondicion(item);
        } else {
            renderDetalleSituacion(item);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ----------------------------------------------------------------
       3. MIGAS DE PAN (breadcrumb)
    ---------------------------------------------------------------- */

    // items: [{ label, href? , action?, dataCategoria? }]
    // El último elemento siempre se trata como la página actual (sin enlace).
    function renderBreadcrumb(items) {
        const partes = items.map((item, i) => {
            const esUltimo = i === items.length - 1;
            if (esUltimo) {
                return `<span aria-current="page">${escapeHtml(item.label)}</span>`;
            }
            if (item.href) {
                return `<a href="${item.href}">${escapeHtml(item.label)}</a>`;
            }
            if (item.action) {
                const dataCat = item.dataCategoria ? ` data-categoria="${escapeAttr(item.dataCategoria)}"` : '';
                return `<button type="button" data-action="${item.action}"${dataCat}>${escapeHtml(item.label)}</button>`;
            }
            return `<span>${escapeHtml(item.label)}</span>`;
        });
        return `<div class="migas" role="navigation" aria-label="Ruta de navegación">${partes.join('<span class="migas__separador" aria-hidden="true">/</span>')}</div>`;
    }

    /* ----------------------------------------------------------------
       4. ILUSTRACIONES: espacio reservado con alt genérico
    ---------------------------------------------------------------- */

    // Genera un marcador de posición visual (SVG embebido, nunca rompe el
    // layout con un ícono de "imagen no encontrada") con un alt ya escrito
    // de forma general. Cuando tengas la ilustración real, basta con
    // cambiar el atributo src de la etiqueta <img> resultante.
    function placeholderIlustracion(descripcionAlt, claseExtra) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="320" viewBox="0 0 400 320">
            <rect width="400" height="320" rx="28" fill="#e9f3f1"/>
            <text x="50%" y="46%" font-size="46" text-anchor="middle" dominant-baseline="middle">🖼️</text>
            <text x="50%" y="68%" font-size="13" fill="#8fa3ad" text-anchor="middle" font-family="sans-serif">Espacio para ilustración</text>
        </svg>`;
        const src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
        return `<img class="ilustracion-placeholder${claseExtra ? ' ' + claseExtra : ''}" src="${src}" alt="${escapeAttr(descripcionAlt)}" loading="lazy">`;
    }

    function altGenericoPara(titulo) {
        return `Ilustración conceptual sobre ${titulo}, estilo plano e ilustrativo, tonos azul y verde, sin texto incrustado.`;
    }

    /* ----------------------------------------------------------------
       5. TARJETAS DE INICIO (condiciones y situaciones)
    ---------------------------------------------------------------- */

    function crearTarjetaCondicion(cond, index) {
        const cta = CTA_CONDICIONES[index % CTA_CONDICIONES.length];
        return `
            <article class="tarjeta-item">
                <span class="tarjeta-item__etiqueta">${escapeHtml(cond.category)}</span>
                <h3>${escapeHtml(cond.title)}</h3>
                <p>${escapeHtml(cond.shortDescription)}</p>
                <button type="button" class="tarjeta-item__boton" data-action="abrir-detalle" data-tipo="condicion" data-id="${cond.id}">
                    ${cta} →
                </button>
            </article>`;
    }

    function crearTarjetaSituacion(sit, index) {
        const cta = CTA_SITUACIONES[index % CTA_SITUACIONES.length];
        return `
            <article class="tarjeta-item">
                <h3>${escapeHtml(sit.title)}</h3>
                <p>${escapeHtml(sit.shortDescription)}</p>
                <button type="button" class="tarjeta-item__boton" data-action="abrir-detalle" data-tipo="situacion" data-id="${sit.id}">
                    ${cta} →
                </button>
            </article>`;
    }

    function renderGridCondiciones(lista) {
        el.gridCondiciones.innerHTML = lista.map((c, i) => crearTarjetaCondicion(c, i)).join('');
        el.condicionesVacio.hidden = lista.length !== 0;
    }

    function renderGridSituaciones(lista) {
        el.gridSituaciones.innerHTML = lista.map((s, i) => crearTarjetaSituacion(s, i)).join('');
    }

    /* ----------------------------------------------------------------
       6. BUSCADOR Y FILTRO POR CATEGORÍA
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
       7. ENCABEZADOS AUXILIARES (grupo + ícono de sección)
    ---------------------------------------------------------------- */

    function grupoHeader(numero, icono, titulo) {
        return `
            <div class="grupo-header">
                <span class="grupo-header__numero" aria-hidden="true">${numero}</span>
                <h2>${icono} ${escapeHtml(titulo)}</h2>
            </div>`;
    }

    function tituloConIcono(icono, texto) {
        return `<span class="icono-seccion" aria-hidden="true">${icono}</span>${escapeHtml(texto)}`;
    }

    /* ----------------------------------------------------------------
       8. DETALLE: CONDICIÓN
    ---------------------------------------------------------------- */

    function renderDetalleCondicion(cond) {
        detalleActual = cond;

        const faqHtml = (cond.faq && cond.faq.length) ? `
            <div class="bloque bloque--card solo-completo">
                <h3>${tituloConIcono(ICONOS.faq, 'Preguntas frecuentes')}</h3>
                <div class="acordeon-grupo">
                    ${cond.faq.map((f, i) => accordionItem(`faq-${cond.id}-${i}`, f.question, f.answer)).join('')}
                </div>
            </div>` : '';

        const grupoActuarHtml = (cond.tools && cond.tools.length) ? `
            <div class="solo-completo">
                ${grupoHeader(3, ICONOS.actuar, 'Actuar')}
                <div class="bloque bloque--card">
                    <h3>${tituloConIcono(ICONOS.herramientas, 'Herramientas')}</h3>
                    <div class="herramientas-grid">
                        ${cond.tools.map((t, i) => toolCard(t, i)).join('')}
                    </div>
                </div>
            </div>` : '';

        el.detalle.innerHTML = `
            ${renderBreadcrumb([
                { label: 'Inicio', href: 'index.html' },
                { label: 'Comprende', action: 'volver' },
                { label: cond.category, action: 'ir-categoria', dataCategoria: cond.category },
                { label: cond.title }
            ])}

            <button type="button" class="detalle__volver" data-action="volver">← Volver a Comprende</button>

            <div class="detalle-header">
                <div class="detalle-header__texto" data-speak>
                    <h1>${escapeHtml(cond.title)}</h1>
                    <p>${escapeHtml(cond.shortDescription)}</p>
                </div>
                <div class="detalle-header__imagen">
                    ${placeholderIlustracion(altGenericoPara(cond.title))}
                </div>
            </div>

            <div class="detalle-controles">
                ${audioControlesHtml(cond.id)}
                <div class="modo-toggle" role="group" aria-label="Nivel de detalle">
                    <button type="button" data-action="modo" data-modo="completo" aria-pressed="true">Completo</button>
                    <button type="button" data-action="modo" data-modo="resumen" aria-pressed="false">Resumen</button>
                </div>
            </div>

            ${grupoHeader(1, ICONOS.entender, 'Entender')}

            <div class="bloque bloque--card" data-speak>
                <h3>${tituloConIcono(ICONOS.queEs, '¿Qué es?')}</h3>
                <p>${escapeHtml(cond.description)}</p>
            </div>

            <div class="bloque bloque--card" data-speak>
                <h3>${tituloConIcono(ICONOS.experiencia, '¿Cómo puede experimentarse?')}</h3>
                <div class="experiencia-grid">
                    ${cond.experience.columns.map(col => `
                        <div class="experiencia-col">
                            <h4>${escapeHtml(col.label)}</h4>
                            <ul>${col.items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${grupoHeader(2, ICONOS.reconocer, 'Reconocer')}

            <div class="bloque bloque--card" data-speak>
                <h3>${tituloConIcono(ICONOS.alerta, 'Señales de alerta')}</h3>
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
                <h3>${tituloConIcono(ICONOS.accion, '¿Qué puedo hacer?')}</h3>
                <div class="accion-tabs" role="group" aria-label="Elige tu situación">
                    <button type="button" data-action="accion-tab" data-tab="self" aria-pressed="true">Me pasa a mí</button>
                    <button type="button" data-action="accion-tab" data-tab="other" aria-pressed="false">Le pasa a alguien cercano</button>
                </div>
                <div class="accion-panel" id="accion-panel">${escapeHtml(cond.actions.self)}</div>
            </div>

            ${faqHtml}
            ${grupoActuarHtml}

            ${grupoHeader(4, ICONOS.recursos, 'Recursos y ayuda')}

            <div class="bloque ayuda-bloque" data-speak>
                <h3>${tituloConIcono(ICONOS.ayuda, '¿Cuándo buscar ayuda?')}</h3>
                <p>${escapeHtml(cond.whenToSeekHelp)}</p>
                ${cond.helpLink ? `<a class="boton-primario" href="${cond.helpLink}">Buscar ayuda</a>` : ''}
            </div>

            ${renderRecursos(cond.resources)}
            ${renderFuentes(cond.sources)}
        `;

        cambiarModo('completo');
        ocultarAudioSiNoSoportado();
    }

    /* ----------------------------------------------------------------
       9. DETALLE: SITUACIÓN
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
            ${renderBreadcrumb([
                { label: 'Inicio', href: 'index.html' },
                { label: 'Comprende', action: 'volver' },
                { label: 'Situaciones', action: 'ir-situaciones' },
                { label: sit.title }
            ])}

            <button type="button" class="detalle__volver" data-action="volver">← Volver a Comprende</button>

            <div class="detalle-header">
                <div class="detalle-header__texto" data-speak>
                    <h1>${escapeHtml(sit.title)}</h1>
                    <p>${escapeHtml(sit.intro)}</p>
                </div>
                <div class="detalle-header__imagen">
                    ${placeholderIlustracion(altGenericoPara(sit.title))}
                </div>
            </div>

            <div class="detalle-controles">
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
            <h3>${tituloConIcono(ICONOS.comparacion, 'Comparación')}</h3>
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
            ${comp.note ? `<p class="nota">${escapeHtml(comp.note)}</p>` : ''}
        `;
    }

    function renderFlujo(flow) {
        return `
            <h3>${tituloConIcono(ICONOS.flujo, flow.title)}</h3>
            <div class="flujo">
                ${flow.steps.map((s, i) => `
                    <div class="flujo__paso">
                        <span class="flujo__numero">${i + 1}</span>
                        <h4>${escapeHtml(s.step)}</h4>
                        <p>${escapeHtml(s.description)}</p>
                    </div>
                    ${i < flow.steps.length - 1 ? '<div class="flujo__flecha" aria-hidden="true">→</div>' : ''}
                `).join('')}
            </div>
        `;
    }

    /* ----------------------------------------------------------------
       10. MODO COMPLETO / RESUMEN Y TABS "¿QUÉ PUEDO HACER?"
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
       11. FAQ / ACORDEONES (<details><summary>)
    ---------------------------------------------------------------- */

    function accordionItem(id, pregunta, respuesta) {
        return `
            <details class="acordeon-item" id="${id}">
                <summary aria-expanded="false">${escapeHtml(pregunta)}</summary>
                <div class="acordeon-item__contenido">${escapeHtml(respuesta)}</div>
            </details>`;
    }

    function manejarToggleAcordeon(e) {
        if (!(e.target instanceof HTMLElement)) return;
        if (!e.target.matches('details')) return;
        const resumen = e.target.querySelector(':scope > summary');
        if (resumen) resumen.setAttribute('aria-expanded', String(e.target.open));
    }

    /* ----------------------------------------------------------------
       12. HERRAMIENTAS (tarjetas de condición + sección general)
    ---------------------------------------------------------------- */

    function toolCard(tool, index) {
        const icono = TOOL_ICONOS[index % TOOL_ICONOS.length];
        const descripcion = tool.description ? `<p>${escapeHtml(tool.description)}</p>` : '';
        const boton = tool.description ? `
            <button type="button" class="boton-texto" data-action="abrir-modal-herramienta"
                data-nombre="${escapeAttr(tool.name)}" data-descripcion="${escapeAttr(tool.description)}">
                Ver herramienta →
            </button>` : '';
        return `
            <div class="herramienta-card">
                <span class="herramienta-card__icono" aria-hidden="true">${icono}</span>
                <h4>${escapeHtml(tool.name)}</h4>
                ${descripcion}
                ${boton}
            </div>`;
    }

    function renderHerramientasGenerales() {
        const h = estado.herramientas;
        if (!h) return;

        // Ciclo de la mente (se respeta el orden original: Emoción → Pensamiento → Conducta)
        document.getElementById('ciclo-titulo').innerHTML = tituloConIcono('🔄', h.cycle.title);
        document.getElementById('ciclo-descripcion').textContent = h.cycle.description;
        document.getElementById('ciclo-mente').innerHTML = h.cycle.steps.map((s, i) => `
            <div class="ciclo-mente__paso">
                <span class="ciclo-mente__icono" aria-hidden="true">${CICLO_ICONOS[s.label] || '✨'}</span>
                <strong>${escapeHtml(s.label)}</strong>
                <span>${escapeHtml(s.example)}</span>
            </div>
            ${i < h.cycle.steps.length - 1 ? '<span class="ciclo-mente__flecha" aria-hidden="true">→</span>' : ''}
        `).join('');

        // Pilares del bienestar
        document.getElementById('pilares-titulo').innerHTML = tituloConIcono('🌈', h.pillars.title);
        document.getElementById('pilares-descripcion').textContent = h.pillars.description;
        document.getElementById('pilares-grid').innerHTML = h.pillars.items.map(p => `
            <div class="pilar-card">
                <span class="pilar-card__icono" aria-hidden="true">${PILAR_ICONOS[p.id] || '🌟'}</span>
                <h4>${escapeHtml(p.title)}</h4>
                <p class="pilar-card__detalle">${escapeHtml(p.description)} <strong>${escapeHtml(p.gain)}</strong></p>
            </div>
        `).join('');

        // FAQ general
        document.getElementById('faq-general').innerHTML = h.generalFaq
            .map((f, i) => accordionItem(`faq-general-${i}`, f.question, f.answer))
            .join('');

        // Fuentes generales
        document.getElementById('fuentes-generales').innerHTML = listaFuentesHtml(h.generalSources);
    }

    /* ----------------------------------------------------------------
       13. RECURSOS MULTIMEDIA
       Tipos admitidos: image, infographic, mindmap, video, pdf, link.
       Si el arreglo "resources" de un tema viene vacío, esta sección
       no se dibuja; si un tema no trae un tipo, ese bloque no aparece.
    ---------------------------------------------------------------- */

    function renderRecursos(resources) {
        if (!resources || !resources.length) return '';
        return `
            <div class="bloque solo-completo">
                <h2>${tituloConIcono('🎒', 'Recursos')}</h2>
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
                            <h4>${escapeHtml(r.title || '')}</h4>
                            <p>${escapeHtml(r.description || '')}</p>
                        </div>
                    </div>`;
            case 'infographic':
                return `
                    <div class="recurso-card recurso-imagen">
                        <img src="${r.src}" alt="${escapeAttr(r.alt || '')}"
                            data-action="abrir-modal-imagen" data-src="${r.src}" data-alt="${escapeAttr(r.alt || '')}">
                        <div class="recurso-card__cuerpo">
                            <h4>🖼️ ${escapeHtml(r.title || 'Infografía')}</h4>
                            <p>${escapeHtml(r.description || '')}</p>
                            <button type="button" class="recurso-enlace-boton" data-action="abrir-modal-imagen"
                                data-src="${r.src}" data-alt="${escapeAttr(r.alt || '')}">Ver infografía →</button>
                        </div>
                    </div>`;
            case 'mindmap':
                return `
                    <div class="recurso-card recurso-imagen">
                        <img src="${r.src}" alt="${escapeAttr(r.alt || '')}"
                            data-action="abrir-modal-imagen" data-src="${r.src}" data-alt="${escapeAttr(r.alt || '')}">
                        <div class="recurso-card__cuerpo">
                            <h4>🧠 ${escapeHtml(r.title || 'Mapa mental')}</h4>
                            <p>${escapeHtml(r.description || '')}</p>
                            <button type="button" class="recurso-enlace-boton" data-action="abrir-modal-imagen"
                                data-src="${r.src}" data-alt="${escapeAttr(r.alt || '')}">Ver mapa mental →</button>
                        </div>
                    </div>`;
            case 'video':
                return `
                    <div class="recurso-card recurso-video">
                        <div class="recurso-video__envoltorio">${resolverVideoEmbed(r.src)}</div>
                        <div class="recurso-card__cuerpo">
                            <h4>🎬 ${escapeHtml(r.title || '')}</h4>
                            <p>${escapeHtml(r.description || '')}</p>
                        </div>
                    </div>`;
            case 'pdf':
                return `
                    <div class="recurso-card">
                        <div class="recurso-card__cuerpo">
                            <h4>📄 ${escapeHtml(r.title || 'Documento')}</h4>
                            <p>${escapeHtml(r.description || '')}</p>
                            <a class="recurso-enlace" href="${r.src}" target="_blank" rel="noopener noreferrer">Ver PDF →</a>
                        </div>
                    </div>`;
            case 'link':
                return `
                    <div class="recurso-card">
                        <div class="recurso-card__cuerpo">
                            <h4>🔗 ${escapeHtml(r.title || '')}</h4>
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
       14. FUENTES (sin paréntesis visibles; el enlace es el propio texto)
    ---------------------------------------------------------------- */

    function listaFuentesHtml(fuentes) {
        return `
            <ul class="fuentes-lista">
                ${fuentes.map(s => {
                    const texto = `${escapeHtml(s.institution)}${s.title ? ' — ' + escapeHtml(s.title) : ''}`;
                    if (s.url) {
                        return `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${texto} <span aria-hidden="true">↗</span></a></li>`;
                    }
                    return `<li>${texto}</li>`;
                }).join('')}
            </ul>`;
    }

    function renderFuentes(fuentes) {
        if (!fuentes || !fuentes.length) return '';
        return `
            <div class="bloque solo-completo">
                <details class="acordeon-item">
                    <summary aria-expanded="false">${tituloConIcono('📖', 'Fuentes y referencias')}</summary>
                    <div class="acordeon-item__contenido">${listaFuentesHtml(fuentes)}</div>
                </details>
            </div>`;
    }

    /* ----------------------------------------------------------------
       15. AUDIO (Web Speech API / SpeechSynthesis)
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
       16. MODAL GENÉRICO
    ---------------------------------------------------------------- */

    function configurarModal() {
        el.modal.addEventListener('click', (e) => {
            if (e.target === el.modal) cerrarModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            if (!el.modal.hidden) cerrarModal();
            cerrarMenuAyuda();
        });
        const cerrar = document.getElementById('modal-cerrar');
        if (cerrar) cerrar.addEventListener('click', cerrarModal);
    }

    function abrirModal(html, opciones = {}) {
        ultimoFoco = document.activeElement;
        el.modalContenido.innerHTML = html;
        el.modalPanel.classList.toggle('modal-panel--imagen', !!opciones.imagen);
        el.modalPanel.classList.toggle('modal-panel--protocolo', !!opciones.protocolo);
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
       MENÚ FLOTANTE DE AYUDA + MODAL DE PROTOCOLO
    ---------------------------------------------------------------- */

    function alternarMenuAyuda() {
        const menu = document.getElementById('ayuda-menu');
        const boton = document.querySelector('.ayuda-flotante__boton');
        if (!menu || !boton) return;
        const abrir = !menu.classList.contains('activo');
        menu.classList.toggle('activo', abrir);
        boton.setAttribute('aria-expanded', String(abrir));
    }

    function cerrarMenuAyuda() {
        const menu = document.getElementById('ayuda-menu');
        const boton = document.querySelector('.ayuda-flotante__boton');
        if (menu) menu.classList.remove('activo');
        if (boton) boton.setAttribute('aria-expanded', 'false');
    }

    function flashHtml(item, indice, variante) {
        return `
            <div class="flash${variante ? ' flash--' + variante : ''}">
                <span class="flash__num" aria-hidden="true">${indice + 1}</span>
                <span class="flash__icono">${icono(item.icono)}</span>
                <h5>${escapeHtml(item.titulo)}</h5>
                <p>${escapeHtml(item.texto)}</p>
            </div>`;
    }

    function lineaHtml(l) {
        const wa = l.wa
            ? `<a class="linea__btn linea__btn--wa" href="https://wa.me/${l.wa}" target="_blank" rel="noopener noreferrer">${icono('mensaje')} WhatsApp</a>`
            : '';
        return `
            <div class="linea${l.urgente ? ' linea--urgente' : ''}">
                <span class="linea__nombre">${icono(l.icono)} ${escapeHtml(l.nombre)}</span>
                <span class="linea__numero">${escapeHtml(l.numero)}</span>
                <span class="linea__servicio">${escapeHtml(l.servicio)}</span>
                <div class="linea__acciones">
                    <a class="linea__btn linea__btn--llamar" href="tel:${l.tel}">${icono('llamar')} Llamar</a>
                    ${wa}
                </div>
            </div>`;
    }

    function abrirModalProtocolo() {
        const ayudar = [
            { icono: 'escuchar',   titulo: 'Escucha con calma',   texto: 'Deja que hable sin juzgar ni interrumpir.' },
            { icono: 'preguntar',  titulo: 'Pregunta directo',    texto: '«¿Estás pensando en hacerte daño?» Preguntar no lo provoca.' },
            { icono: 'usuarios',   titulo: 'No lo dejes solo/a',  texto: 'Quédate cerca o pide a alguien de confianza que lo haga.' },
            { icono: 'proteger',   titulo: 'Aleja el peligro',    texto: 'Retira objetos o medicamentos con los que podría hacerse daño.' },
            { icono: 'llamar',     titulo: 'Pide ayuda',          texto: 'Llama al 106 o al 123 si el riesgo es inminente.' },
            { icono: 'reloj',      titulo: 'Haz seguimiento',     texto: 'Escríbele o visítalo en los días siguientes.' }
        ];
        const yo = [
            { icono: 'mensaje',    titulo: 'Habla con alguien',    texto: 'Cuéntale a una persona de confianza cómo te sientes ahora.' },
            { icono: 'usuarios',   titulo: 'No te quedes a solas', texto: 'Ve a un lugar con gente o pide que te acompañen.' },
            { icono: 'proteger',   titulo: 'Ponte a salvo',        texto: 'Pide que guarden o retiren lo que podría hacerte daño.' },
            { icono: 'llamar',     titulo: 'Llama al 106',         texto: 'Es gratis y te atienden personas capacitadas, las 24 h.' }
        ];
        const evitar = [
            { icono: 'evitar', titulo: 'No minimices',        texto: 'Evita frases como «no es para tanto».' },
            { icono: 'evitar', titulo: 'No prometas secreto', texto: 'Su seguridad va primero.' },
            { icono: 'evitar', titulo: 'No discutas',         texto: 'No lo juzgues ni lo culpes.' },
            { icono: 'evitar', titulo: 'No lo dejes solo/a',  texto: 'Si hay riesgo, acompáñalo hasta que llegue ayuda.' }
        ];

        abrirModal(`
            <div class="protocolo">
                <div class="protocolo__encabezado">
                    <span class="protocolo__icono">${icono('proteger')}</span>
                    <div>
                        <h3 id="modal-titulo">Protocolo de crisis</h3>
                        <p>Qué hacer paso a paso si tú o alguien cercano piensa en hacerse daño.</p>
                    </div>
                </div>

                <div class="protocolo__cuerpo">
                    <div class="protocolo__alerta">
                        <span class="protocolo__alerta-icono">${icono('alerta')}</span>
                        <p><strong>Si hay peligro inmediato, no esperes:</strong> llama al 123.</p>
                        <a class="linea__btn linea__btn--llamar" href="tel:123">${icono('llamar')} Llamar al 123</a>
                    </div>

                    <h4 class="protocolo__subtitulo">${icono('usuarios')} Si ayudas a otra persona</h4>
                    <div class="flash-grid">${ayudar.map((c, i) => flashHtml(c, i)).join('')}</div>

                    <h4 class="protocolo__subtitulo">${icono('corazon')} Si eres tú quien lo siente</h4>
                    <div class="flash-grid">${yo.map((c, i) => flashHtml(c, i, 'yo')).join('')}</div>

                    <h4 class="protocolo__subtitulo">${icono('evitar')} Qué evitar</h4>
                    <div class="flash-grid">${evitar.map((c, i) => flashHtml(c, i, 'evitar')).join('')}</div>

                    <h4 class="protocolo__subtitulo">${icono('llamar')} Líneas de ayuda</h4>
                    <div class="linea-grid">${LINEAS_AYUDA.map(lineaHtml).join('')}</div>

                    <p class="nota">Esta guía orienta, pero no reemplaza la atención de un profesional de la salud.</p>
                </div>
            </div>
        `, { protocolo: true });
    }

    /* ----------------------------------------------------------------
       17. DELEGACIÓN DE EVENTOS (data-action)
    ---------------------------------------------------------------- */

    function manejarClicGlobal(e) {
        // Cierra el menú flotante si se hace clic fuera de él
        if (!e.target.closest('.ayuda-flotante')) cerrarMenuAyuda();

        const boton = e.target.closest('[data-action]');
        if (!boton) return;

        switch (boton.dataset.action) {
            case 'abrir-detalle':
                irADetalle(boton.dataset.tipo, boton.dataset.id);
                break;
            case 'volver':
                volverAHome();
                break;
            case 'ir-categoria':
                volverAHome();
                seleccionarCategoria(boton.dataset.categoria);
                requestAnimationFrame(() => {
                    const seccion = document.getElementById('comprende-condiciones');
                    if (seccion) seccion.scrollIntoView({ behavior: 'smooth' });
                });
                break;
            case 'ir-situaciones':
                volverAHome();
                requestAnimationFrame(() => {
                    const seccion = document.getElementById('comprende-situaciones');
                    if (seccion) seccion.scrollIntoView({ behavior: 'smooth' });
                });
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
            case 'alternar-menu-ayuda':
                alternarMenuAyuda();
                break;
            case 'abrir-protocolo':
                cerrarMenuAyuda();
                abrirModalProtocolo();
                break;
            case 'cerrar-modal':
                cerrarModal();
                break;
        }
    }

    function manejarCambioGlobal(e) {
        if (e.target.matches('[data-audio-rate]')) {
            if (audioSoportado() && window.speechSynthesis.speaking) {
                detenerAudio();
                iniciarOReanudarLectura();
            }
        }
    }

    /* ----------------------------------------------------------------
       18. UTILIDADES
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