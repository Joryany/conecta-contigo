/* ====================================================================
   Boton Subir
==================================================================== */      

document.addEventListener("DOMContentLoaded", function () {
    const boton = document.getElementById("boton-subir");
    if (!boton) return;

    const UMBRAL = 320;

    function actualizarVisibilidad() {
        if (window.scrollY > UMBRAL) {
            boton.classList.add("visible");
        } else {
            boton.classList.remove("visible");
        }
    }

    boton.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", actualizarVisibilidad, { passive: true });
    actualizarVisibilidad();
});
/* ====================================================================
    Acordeon titulos
==================================================================== */
document.addEventListener("DOMContentLoaded", function () {
    function abrirYDesplazar(id) {
        const detalle = document.getElementById(id);
        if (!detalle || detalle.tagName !== "DETAILS") return;
        detalle.open = true;
        detalle.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (window.location.hash) {
        abrirYDesplazar(window.location.hash.substring(1));
    }

    window.addEventListener("hashchange", function () {
        abrirYDesplazar(window.location.hash.substring(1));
    });
});

/* ====================================================================
   Tarjetas links
==================================================================== */

document.addEventListener("DOMContentLoaded", function () {
    const tarjetas = document.querySelectorAll(".tarjeta[data-href]");

    tarjetas.forEach(function (tarjeta) {
        tarjeta.addEventListener("click", function (event) {
            // Si el clic fue directamente sobre el link del título,
            // dejamos que el navegador lo maneje normal (evita doble redirección)
            if (event.target.closest("a")) {
                return;
            }
            window.location.href = tarjeta.dataset.href;
        });
    });
});

/* ====================================================================
   Intercambiable
==================================================================== */


document.addEventListener("DOMContentLoaded", () => {
    const estilos = [
        "estilo-hojas-1",
        "estilo-hojas-2",
        "estilo-hojas-3",
        "estilo-hojas-4",
        "estilo-hojas-5", 
        "estilo-hojas-6", 
    ];

    const estiloAleatorio = estilos[Math.floor(Math.random() * estilos.length)];
    document.body.classList.add(estiloAleatorio);
});


/* ====================================================================
   Separadores de página: temas (líneas) + subtemas (puntos)
   Navegación única por flechas, incluyendo temas y subtemas
==================================================================== */

document.addEventListener("DOMContentLoaded", function () {
    const nav = document.getElementById("separadores-nav");
    const temas = Array.from(
        document.querySelectorAll("[data-separador]")
    );

    if (!nav || !temas.length) return;

    const flat = [];

    const grupos = temas.map(function (tema, tIdx) {
        tema.style.scrollMarginTop = "40px";

        flat.push({
            tipo: "tema",
            tIdx: tIdx,
            el: tema
        });

        const grupo = document.createElement("div");
        grupo.className = "separador-grupo";

        const linea = document.createElement("button");
        linea.type = "button";
        linea.className = "separador-item";
        linea.title =
            tema.dataset.separador ||
            "Tema " + (tIdx + 1);

        const listaSub = document.createElement("div");
        listaSub.className = "subseparador-lista";

        const subtemas = Array.from(
            tema.querySelectorAll("[data-subseparador]")
        );

        const ticks = subtemas.map(function (subtema, sIdx) {
            subtema.style.scrollMarginTop = "40px";

            flat.push({
                tipo: "sub",
                tIdx: tIdx,
                sIdx: sIdx,
                el: subtema
            });

            const tick = document.createElement("button");

            tick.type = "button";
            tick.className = "subseparador-tick";

            listaSub.appendChild(tick);

            return tick;
        });

        linea.addEventListener("click", function () {
            irAFlat(
                flat.findIndex(function (f) {
                    return (
                        f.tipo === "tema" &&
                        f.tIdx === tIdx
                    );
                })
            );
        });

        ticks.forEach(function (tick, sIdx) {
            tick.addEventListener("click", function () {
                irAFlat(
                    flat.findIndex(function (f) {
                        return (
                            f.tipo === "sub" &&
                            f.tIdx === tIdx &&
                            f.sIdx === sIdx
                        );
                    })
                );
            });
        });

        grupo.appendChild(linea);
        grupo.appendChild(listaSub);
        nav.appendChild(grupo);

        return {
            linea: linea,
            listaSub: listaSub,
            ticks: ticks
        };
    });

    /* ---------------------------------------------------------------
       Flechas de navegación
    --------------------------------------------------------------- */

    const flechasCont = document.createElement("div");

    flechasCont.className = "subtema-flechas";

    flechasCont.innerHTML =
        '<button type="button" class="subtema-flecha" data-dir="-1" aria-label="Anterior">‹</button>' +
        '<button type="button" class="subtema-flecha" data-dir="1" aria-label="Siguiente">›</button>';

    document.body.appendChild(flechasCont);

    const flechaAtras =
        flechasCont.querySelector('[data-dir="-1"]');

    const flechaAdelante =
        flechasCont.querySelector('[data-dir="1"]');

    let indiceActual = 0;
    let enNavegacionManual = false;

    /* ---------------------------------------------------------------
       Pintar estado
    --------------------------------------------------------------- */

    function pintarEstado() {
        grupos.forEach(function (g, tIdx) {
            const activo =
                flat[indiceActual].tIdx === tIdx;

            g.linea.classList.toggle(
                "activo",
                activo
            );

            g.listaSub.classList.toggle(
                "activo",
                activo && g.ticks.length > 0
            );

            g.ticks.forEach(function (t, sIdx) {
                const activaSub =
                    activo &&
                    flat[indiceActual].tipo === "sub" &&
                    flat[indiceActual].sIdx === sIdx;

                t.classList.toggle(
                    "activa",
                    activaSub
                );
            });
        });

        flechaAtras.disabled =
            indiceActual === 0;

        flechaAdelante.disabled =
            indiceActual === flat.length - 1;
    }

    /* ---------------------------------------------------------------
       Navegar
    --------------------------------------------------------------- */

    function irAFlat(index) {
        if (
            index < 0 ||
            index >= flat.length
        ) {
            return;
        }

        indiceActual = index;

        pintarEstado();

        enNavegacionManual = true;

        flat[index].el.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        window.clearTimeout(
            irAFlat._timeout
        );

        irAFlat._timeout =
            window.setTimeout(function () {
                enNavegacionManual = false;
            }, 700);
    }

    /* ---------------------------------------------------------------
       Flechas
    --------------------------------------------------------------- */

    flechaAtras.addEventListener(
        "click",
        function () {
            irAFlat(indiceActual - 1);
        }
    );

    flechaAdelante.addEventListener(
        "click",
        function () {
            irAFlat(indiceActual + 1);
        }
    );

/* ---------------------------------------------------------------
   Teclado
--------------------------------------------------------------- */

document.addEventListener(
    "keydown",
    function (evento) {
        const etiqueta = (
            document.activeElement.tagName || ""
        ).toLowerCase();

        if (
            etiqueta === "input" ||
            etiqueta === "textarea"
        ) {
            return;
        }

        if (evento.key === "ArrowRight") {
            evento.preventDefault();

            irAFlat(
                indiceActual + 1
            );

        } else if (evento.key === "ArrowLeft") {
            evento.preventDefault();

            irAFlat(
                indiceActual - 1
            );
        }
    }
);

    /* ---------------------------------------------------------------
       Detección por posición real
    --------------------------------------------------------------- */

    function calcularActivoPorScroll() {
        if (enNavegacionManual) return;

        const lineaY =
            window.innerHeight * 0.45;

        let idx = 0;

        for (
            let i = 0;
            i < flat.length;
            i++
        ) {
            const rect =
                flat[i].el.getBoundingClientRect();

            if (rect.top <= lineaY) {
                idx = i;
            } else {
                break;
            }
        }

        if (idx !== indiceActual) {
            indiceActual = idx;
            pintarEstado();
        }
    }

    let ticking = false;

    window.addEventListener(
        "scroll",
        function () {
            if (ticking) return;

            ticking = true;

            window.requestAnimationFrame(
                function () {
                    calcularActivoPorScroll();
                    ticking = false;
                }
            );
        },
        { passive: true }
    );

    pintarEstado();
    calcularActivoPorScroll();
});


/* ====================================================================
   Botón Soter
   Se posiciona respecto a los elementos flotantes.

   PRIORIDAD:
   1. Flechas de navegación (.subtema-flechas)
   2. Botón "subir"
   3. Evaluación

   IMPORTANTE:
   .separadores-nav NO mueve a Soter.
   
   Las flechas usan la separación NATURAL.
   El botón de subir tiene una separación MAYOR.
==================================================================== */

document.addEventListener("DOMContentLoaded", function () {
    const soter =
        document.querySelector(".soter-acceso");

    if (!soter) return;

    /* ---------------------------------------------------------------
       Separaciones
       
       SEPARACION_NATURAL:
       Distancia normal entre Soter y un elemento flotante.

       SEPARACION_SUBIR:
       Distancia específica entre Soter y el botón de subir.
       Es mayor para dejar más espacio visual.
    --------------------------------------------------------------- */

    const SEPARACION_NATURAL = 30;
    const SEPARACION_SUBIR = 10;

    const POSICION_NATURAL = 80;

    const subir =
        document.getElementById("boton-subir");

    /* ---------------------------------------------------------------
       Obtener flechas
    --------------------------------------------------------------- */

    function obtenerFlechas() {
        return document.querySelector(
            ".subtema-flechas"
        );
    }

    /* ---------------------------------------------------------------
       Obtener otros elementos que sí pueden mover a Soter
    --------------------------------------------------------------- */

    function obtenerOtros() {
        return [
            document.querySelector(
                ".evaluacion-flotante"
            )
        ].filter(Boolean);
    }

    /* ---------------------------------------------------------------
       Colocar Soter
    --------------------------------------------------------------- */

    function colocar() {
        const avatar =
            soter.querySelector(
                ".soter-acceso__avatar"
            ) || soter;

        const col =
            avatar.getBoundingClientRect();

        let valor = POSICION_NATURAL;

        /* ===========================================================
           1. FLECHAS
           
           Las flechas tienen prioridad.
           PERO usan solamente la separación natural.
        =========================================================== */

        const flechas =
            obtenerFlechas();

        if (flechas) {
            const estiloFlechas =
                window.getComputedStyle(
                    flechas
                );

            if (
                estiloFlechas.position === "fixed" &&
                estiloFlechas.display !== "none" &&
                estiloFlechas.visibility !== "hidden"
            ) {
                const r =
                    flechas.getBoundingClientRect();

                if (
                    r.width > 0 &&
                    r.height > 0 &&
                    r.right > col.left &&
                    r.left < col.right
                ) {
                    valor = Math.max(
                        valor,
                        window.innerHeight -
                        r.top +
                        SEPARACION_NATURAL
                    );
                }
            }
        }

        /* ===========================================================
           2. BOTÓN SUBIR
           
           Aquí sí usamos una separación mayor.
           
           Esto hace que Soter quede más arriba cuando el botón
           de subir está visible.
        =========================================================== */

        if (subir) {
            const estilo =
                window.getComputedStyle(
                    subir
                );

            if (
                estilo.position === "fixed" &&
                estilo.display !== "none"
            ) {
                const abajo =
                    parseFloat(
                        estilo.bottom
                    ) || 0;

                if (
                    subir.classList.contains(
                        "visible"
                    )
                ) {
                    valor = Math.max(
                        valor,
                        abajo +
                        subir.offsetHeight +
                        SEPARACION_SUBIR
                    );
                }
            }
        }

        /* ===========================================================
           3. EVALUACIÓN
           
           La evaluación usa la separación natural.
        =========================================================== */

        obtenerOtros().forEach(
            function (el) {
                const estilo =
                    window.getComputedStyle(
                        el
                    );

                if (
                    estilo.position !== "fixed" ||
                    estilo.display === "none" ||
                    estilo.visibility === "hidden"
                ) {
                    return;
                }

                const r =
                    el.getBoundingClientRect();

                if (
                    r.width === 0 ||
                    r.height === 0
                ) {
                    return;
                }

                /* No invade la columna de Soter */
                if (
                    r.right <= col.left ||
                    r.left >= col.right
                ) {
                    return;
                }

                valor = Math.max(
                    valor,
                    window.innerHeight -
                    r.top +
                    SEPARACION_NATURAL
                );
            }
        );

        /* -----------------------------------------------------------
           Aplicar posición
        ----------------------------------------------------------- */

        soter.style.setProperty(
            "--soter-bottom",
            valor + "px"
        );
    }

    /* ---------------------------------------------------------------
       Primera colocación
    --------------------------------------------------------------- */

    colocar();

    window.addEventListener(
        "resize",
        colocar
    );

    window.addEventListener(
        "load",
        colocar
    );

    /* ---------------------------------------------------------------
       Observar botón subir
    --------------------------------------------------------------- */

    if (
        subir &&
        "MutationObserver" in window
    ) {
        new MutationObserver(
            colocar
        ).observe(
            subir,
            {
                attributes: true,
                attributeFilter: ["class"]
            }
        );
    }

    /* ---------------------------------------------------------------
       Observar evaluación
    --------------------------------------------------------------- */

    obtenerOtros().forEach(
        function (el) {
            if (
                "ResizeObserver" in window
            ) {
                new ResizeObserver(
                    colocar
                ).observe(el);
            }

            if (
                "MutationObserver" in window
            ) {
                new MutationObserver(
                    colocar
                ).observe(
                    el,
                    {
                        childList: true,
                        subtree: true,
                        attributes: true
                    }
                );
            }
        }
    );

    /* ---------------------------------------------------------------
       Detectar las flechas cuando sean creadas por el primer script
    --------------------------------------------------------------- */

    if (
        "MutationObserver" in window
    ) {
        const observer =
            new MutationObserver(
                function () {
                    const flechas =
                        obtenerFlechas();

                    if (!flechas) return;

                    colocar();

                    if (
                        "ResizeObserver" in window
                    ) {
                        new ResizeObserver(
                            colocar
                        ).observe(
                            flechas
                        );
                    }

                    observer.disconnect();
                }
            );

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );
    }

    /* ---------------------------------------------------------------
       Activar transición después de la primera colocación
    --------------------------------------------------------------- */

    window.setTimeout(
        function () {
            soter.classList.add(
                "soter-acceso--lista"
            );

            colocar();
        },
        50
    );
});

/* ====================================================================
   Menú principal: botón de navegación
   Escritorio: fija o suelta el header completo al desplazarse.
   Pantallas pequeñas: botón flotante que despliega el menú.
   Los estilos están en style.css (secciones 7 y 16).
==================================================================== */
(function () {

    "use strict";


    const PUNTO_CORTE = "(max-width: 992px)";

    function iniciarMenuMovil() {

        const nav = document.querySelector(
            "body > header .top-nav-container nav"
        );

        // Si la página no tiene navegador principal, no hace nada
        if (!nav || document.getElementById("boton-menu")) {

            return;

        }

        if (!nav.id) {

            nav.id = "menu-principal";

        }

        const boton = document.createElement("button");

        boton.id = "boton-menu";
        boton.className = "boton-menu";
        boton.type = "button";
        boton.setAttribute("aria-controls", nav.id);
        boton.innerHTML =
            '<span class="boton-menu__barras" aria-hidden="true"></span>' +
            '<svg class="boton-menu__pin" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
            '<path d="M12 17v5"></path>' +
            '<path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path>' +
            '</svg>';

        // En pantallas grandes queda en la barra; en pequeñas es flotante (CSS)
        nav.parentElement.appendChild(boton);

        document.body.classList.add("tiene-menu-movil");

        const consulta = window.matchMedia(PUNTO_CORTE);

        const esMovil = () => consulta.matches;

        // Móvil: el menú está cerrado por defecto (clase menu-movil-abierto).
        // Escritorio: el header está fijo por defecto; el botón lo suelta
        // (clase menu-escritorio-suelto) o lo vuelve a fijar.
        function estaAbierto() {

            return esMovil()
                ? document.body.classList.contains("menu-movil-abierto")
                : !document.body.classList.contains("menu-escritorio-suelto");

        }

        function pintar() {

            const activo = estaAbierto();

            let etiqueta;

            if (esMovil()) {

                boton.removeAttribute("aria-pressed");
                boton.setAttribute("aria-expanded", String(activo));
                boton.setAttribute("aria-controls", nav.id);

                etiqueta = activo
                    ? "Cerrar menú de navegación"
                    : "Abrir menú de navegación";

            } else {

                boton.removeAttribute("aria-expanded");
                boton.removeAttribute("aria-controls");
                boton.setAttribute("aria-pressed", String(activo));

                etiqueta = activo
                    ? "Dejar de fijar el menú de navegación"
                    : "Fijar el menú de navegación";

            }

            boton.setAttribute("aria-label", etiqueta);
            boton.title = etiqueta;

        }

        function abrir() {

            if (esMovil()) {

                document.body.classList.add("menu-movil-abierto");

            } else {

                document.body.classList.remove("menu-escritorio-suelto");

            }

            pintar();

        }

        function cerrar() {

            if (esMovil()) {

                document.body.classList.remove("menu-movil-abierto");

            } else {

                document.body.classList.add("menu-escritorio-suelto");

            }

            pintar();

        }

        pintar();

        boton.addEventListener("click", () => {

            estaAbierto() ? cerrar() : abrir();

        });

        // Solo en móvil: cierra al elegir un enlace
        nav.addEventListener("click", evento => {

            if (esMovil() && evento.target.closest("a")) {

                cerrar();

            }

        });

        // Solo en móvil: cierra al tocar fuera del menú
        document.addEventListener("click", evento => {

            if (
                esMovil() &&
                estaAbierto() &&
                !nav.contains(evento.target) &&
                !boton.contains(evento.target)
            ) {

                cerrar();

            }

        });

        // Solo en móvil: Escape cierra y devuelve el foco al botón
        document.addEventListener("keydown", evento => {

            if (evento.key === "Escape" && esMovil() && estaAbierto()) {

                cerrar();

                boton.focus();

            }

        });

        // Al cambiar de tamaño, cada modo conserva su propio estado
        const alCambiarTamano = () => {

            document.body.classList.remove("menu-movil-abierto");

            pintar();

        };

        if (consulta.addEventListener) {

            consulta.addEventListener("change", alCambiarTamano);

        } else {

            consulta.addListener(alCambiarTamano);

        }

    }

    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", iniciarMenuMovil);

    } else {

        iniciarMenuMovil();

    }

})();
