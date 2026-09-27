/* ====================================================================
   Separadores de página: temas (líneas) + subtemas (puntos)
   Navegación única por flechas, incluyendo temas y subtemas
==================================================================== */

document.addEventListener("DOMContentLoaded", function () {
    const nav = document.getElementById("separadores-nav");
    const temas = Array.from(document.querySelectorAll("[data-separador]"));
    if (!nav || !temas.length) return;

    const flat = [];
    const grupos = temas.map(function (tema, tIdx) {
        tema.style.scrollMarginTop = "40px";
        flat.push({ tipo: "tema", tIdx: tIdx, el: tema });

        const grupo = document.createElement("div");
        grupo.className = "separador-grupo";

        const linea = document.createElement("button");
        linea.type = "button";
        linea.className = "separador-item";
        linea.title = tema.dataset.separador || "Tema " + (tIdx + 1);

        const listaSub = document.createElement("div");
        listaSub.className = "subseparador-lista";

        const subtemas = Array.from(tema.querySelectorAll("[data-subseparador]"));
        const ticks = subtemas.map(function (subtema, sIdx) {
            subtema.style.scrollMarginTop = "40px";
            flat.push({ tipo: "sub", tIdx: tIdx, sIdx: sIdx, el: subtema });

            const tick = document.createElement("button");
            tick.type = "button";
            tick.className = "subseparador-tick";
            listaSub.appendChild(tick);
            return tick;
        });

        linea.addEventListener("click", function () {
            irAFlat(flat.findIndex(function (f) { return f.tipo === "tema" && f.tIdx === tIdx; }));
        });
        ticks.forEach(function (tick, sIdx) {
            tick.addEventListener("click", function () {
                irAFlat(flat.findIndex(function (f) { return f.tipo === "sub" && f.tIdx === tIdx && f.sIdx === sIdx; }));
            });
        });

        grupo.appendChild(linea);
        grupo.appendChild(listaSub);
        nav.appendChild(grupo);

        return { linea: linea, listaSub: listaSub, ticks: ticks };
    });

    const flechasCont = document.createElement("div");
    flechasCont.className = "subtema-flechas";
    flechasCont.innerHTML =
        '<button type="button" class="subtema-flecha" data-dir="-1" aria-label="Anterior">‹</button>' +
        '<button type="button" class="subtema-flecha" data-dir="1" aria-label="Siguiente">›</button>';
    document.body.appendChild(flechasCont);
    const flechaAtras = flechasCont.querySelector('[data-dir="-1"]');
    const flechaAdelante = flechasCont.querySelector('[data-dir="1"]');

    let indiceActual = 0;
    let enNavegacionManual = false;

    function pintarEstado() {
        grupos.forEach(function (g, tIdx) {
            const activo = flat[indiceActual].tIdx === tIdx;
            g.linea.classList.toggle("activo", activo);
            g.listaSub.classList.toggle("activo", activo && g.ticks.length > 0);
            g.ticks.forEach(function (t, sIdx) {
                const activaSub = activo && flat[indiceActual].tipo === "sub" && flat[indiceActual].sIdx === sIdx;
                t.classList.toggle("activa", activaSub);
            });
        });
        flechaAtras.disabled = indiceActual === 0;
        flechaAdelante.disabled = indiceActual === flat.length - 1;
    }

    function irAFlat(index) {
        if (index < 0 || index >= flat.length) return;
        indiceActual = index;
        pintarEstado();
        enNavegacionManual = true;
        flat[index].el.scrollIntoView({ behavior: "smooth", block: "start" });
        window.clearTimeout(irAFlat._timeout);
        irAFlat._timeout = window.setTimeout(function () { enNavegacionManual = false; }, 700);
    }

    flechaAtras.addEventListener("click", function () { irAFlat(indiceActual - 1); });
    flechaAdelante.addEventListener("click", function () { irAFlat(indiceActual + 1); });

    document.addEventListener("keydown", function (evento) {
    const etiqueta = (document.activeElement.tagName || "").toLowerCase();
    if (etiqueta === "input" || etiqueta === "textarea") return;

    if (evento.key === "ArrowRight" || evento.key === "ArrowDown") {
        evento.preventDefault();
        irAFlat(indiceActual + 1);
    } else if (evento.key === "ArrowLeft" || evento.key === "ArrowUp") {
        evento.preventDefault();
        irAFlat(indiceActual - 1);
    }
});

    // ---------- Detección por posición real, no por eventos de cruce ----------
    // Evita que un elemento corto "se vuele" en scroll rápido
    function calcularActivoPorScroll() {
        if (enNavegacionManual) return;

        const lineaY = window.innerHeight * 0.45;
        let idx = 0;

        for (let i = 0; i < flat.length; i++) {
            const rect = flat[i].el.getBoundingClientRect();
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
    window.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
            calcularActivoPorScroll();
            ticking = false;
        });
    }, { passive: true });

    pintarEstado();
    calcularActivoPorScroll();
});