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
            const etiqueta =
                (
                    document.activeElement.tagName ||
                    ""
                ).toLowerCase();

            if (
                etiqueta === "input" ||
                etiqueta === "textarea"
            ) {
                return;
            }

            if (
                evento.key === "ArrowRight" ||
                evento.key === "ArrowDown"
            ) {
                evento.preventDefault();

                irAFlat(
                    indiceActual + 1
                );
            } else if (
                evento.key === "ArrowLeft" ||
                evento.key === "ArrowUp"
            ) {
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