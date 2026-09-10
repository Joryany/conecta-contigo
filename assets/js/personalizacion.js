/* ====================================================================
   PERSONALIZACIÓN DEL CALENDARIO — Conecta Contigo
   ==================================================================== */

const TEMAS = [
    { id: "pastel", nombre: "Cielo pastel", emoji: "☁️" },
    { id: "bosque", nombre: "Bosque", emoji: "🌿" },
    { id: "noche", nombre: "Noche y estrellas", emoji: "🌙" },
    { id: "rosa", nombre: "Rosa minimalista", emoji: "🌷" },
    { id: "oceano", nombre: "Océano", emoji: "🌊" },
    { id: "lavanda", nombre: "Lavanda", emoji: "💜" }
];

// Un set de 8 colores por paleta, en el mismo orden que EMOTION_ORDER.
const PALETAS = {
    original: {
        nombre: "Original",
        colores: { amor: "#FF7F7F", alegria: "#FFD700", ansiedad: "#D95D27", sorpresa: "#FFA500", estres: "#5A5F69", miedo: "#4B0082", tristeza: "#4682B4", enojo: "#CC0000" }
    },
    calida: {
        nombre: "Cálida",
        colores: { amor: "#FF6F91", alegria: "#FFB347", ansiedad: "#E85D4A", sorpresa: "#FFD166", estres: "#C1440E", miedo: "#8B3A3A", tristeza: "#D98880", enojo: "#B22222" }
    },
    fria: {
        nombre: "Fría",
        colores: { amor: "#7FB3D5", alegria: "#5DADE2", ansiedad: "#48C9B0", sorpresa: "#85C1E9", estres: "#5D6D7E", miedo: "#34495E", tristeza: "#2E86C1", enojo: "#1B4F72" }
    },
    pastel: {
        nombre: "Pastel",
        colores: { amor: "#FFD1DC", alegria: "#FFF5BA", ansiedad: "#FFDAC1", sorpresa: "#E2F0CB", estres: "#C7CEEA", miedo: "#B5EAD7", tristeza: "#AEC6CF", enojo: "#F7CAC9" }
    },
    tierra: {
        nombre: "Tierra",
        colores: { amor: "#C97C5D", alegria: "#D9A441", ansiedad: "#8C6A4F", sorpresa: "#B08968", estres: "#6B4F3A", miedo: "#4B3621", tristeza: "#7C6A58", enojo: "#8B4513" }
    },
    nocturna: {
        nombre: "Nocturna",
        colores: { amor: "#B983FF", alegria: "#F6C177", ansiedad: "#EB6F92", sorpresa: "#9CCFD8", estres: "#3E4A61", miedo: "#26243A", tristeza: "#31748F", enojo: "#C4416B" }
    },
    personalizada: { nombre: "Personalizada", colores: null }
};

const FORMAS_DIA = [
    { id: "circulo", nombre: "Círculo" },
    { id: "corazon", nombre: "Corazón" },
    { id: "estrella", nombre: "Estrella" },
    { id: "nube", nombre: "Nube" },
    { id: "rombo", nombre: "Rombo" },
    { id: "flor", nombre: "Flor" },
    { id: "hexagono", nombre: "Hexágono" },
    { id: "cuadrado", nombre: "Cuadrado redondeado" }
];

const FORMAS_NUMERO = [
    { id: "circulo", nombre: "Círculo" },
    { id: "pastilla", nombre: "Pastilla" },
    { id: "estrella", nombre: "Estrella" },
    { id: "corazon", nombre: "Corazón" },
    { id: "cuadrado", nombre: "Cuadrado" },
    { id: "rombo", nombre: "Rombo" },
    { id: "ninguno", nombre: "Sin contenedor" }
];

const FUENTES = ["Poppins", "Montserrat", "Nunito", "Comic Neue", "Playfair Display", "Raleway"];

const ESTILOS_BORDE = [
    { id: "redondeado", nombre: "Redondeado" },
    { id: "ondas", nombre: "Wave / Ondas" },
    { id: "contorno", nombre: "Contorno" }
];

const SIMBOLO_FORMA = {
    circulo: "●", corazon: "♥", estrella: "★", nube: "☁",
    rombo: "◆", flor: "✿", hexagono: "⬡", cuadrado: "▢",
    pastilla: "▭", ninguno: "—"
};

let personalizacionActual = {
    tema: "pastel",
    paleta: "original",
    colores_personalizados: null,
    forma_dia: "circulo",
    forma_numero: "circulo",
    fuente: "Poppins",
    estilo_borde: "redondeado",
    sombras: true,
    decoraciones: true,
    animaciones: true
};

/* ====================================================================
   CARGAR / GUARDAR (Supabase)
   ==================================================================== */

async function cargarPersonalizacion() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { data, error } = await supabaseClient
        .from("personalizacion_calendario")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!error && data) {
        personalizacionActual = {
            tema: data.tema,
            paleta: data.paleta,
            colores_personalizados: data.colores_personalizados,
            forma_dia: data.forma_dia,
            forma_numero: data.forma_numero,
            fuente: data.fuente,
            estilo_borde: data.estilo_borde,
            sombras: data.sombras,
            decoraciones: data.decoraciones,
            animaciones: data.animaciones
        };
    }
}

async function guardarPersonalizacion() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return false;

    const { error } = await supabaseClient
        .from("personalizacion_calendario")
        .upsert({
            user_id: user.id,
            tema: personalizacionActual.tema,
            paleta: personalizacionActual.paleta,
            colores_personalizados: personalizacionActual.colores_personalizados,
            forma_dia: personalizacionActual.forma_dia,
            forma_numero: personalizacionActual.forma_numero,
            fuente: personalizacionActual.fuente,
            estilo_borde: personalizacionActual.estilo_borde,
            sombras: personalizacionActual.sombras,
            decoraciones: personalizacionActual.decoraciones,
            animaciones: personalizacionActual.animaciones,
            updated_at: new Date().toISOString()
        });

    return !error;
}

/* ====================================================================
   APLICAR VISUALMENTE
   ==================================================================== */

// Cambia los colores de las 8 emociones y vuelve a pintar todo lo que
// depende de ese color (lista de emociones, matices, calendario, panel
// del día y el modal educativo si está abierto).
async function aplicarPaleta(coloresPorClave) {
    EMOTION_ORDER.forEach(key => {
        if (coloresPorClave && coloresPorClave[key]) {
            EMOTIONS[key].color = coloresPorClave[key];
        }
    });

    renderListaEmociones();
    renderContenedorMatices();
    await renderCalendar();
    await renderPanelDia();

    if (typeof modalEmocionActual !== "undefined" && document.getElementById("modal-emociones-tabs")) {
        renderModalTabs(modalEmocionActual);
        renderModalContenido(modalEmocionActual);
    }
}

async function aplicarPersonalizacionVisual() {
    const calendario = document.getElementById("calendario-emocional");
    const registro = document.getElementById("registro-emocional");
    if (!calendario) return;

    // ── FIX bug #10 ──────────────────────────────────────────────────
    // Antes, aplicarPersonalizacionVisual() solo escribía los dataset
    // (tema, borde, fuente) y las clases sin-sombras/sin-decoraciones/
    // sin-animaciones en #calendario-emocional. La sección
    // #registro-emocional (el cuadro donde eliges tu emoción) nunca
    // recibía esos atributos, así que ningún selector de
    // personalizacion.css la alcanzaba: por eso parecía que "no
    // respondía". Ahora aplicamos ese mismo bloque de atributos a
    // AMBAS secciones. Las formas de día/número siguen siendo solo
    // del calendario, porque solo el calendario tiene celdas de día.
    const objetivosPersonalizacionGeneral = [calendario, registro].filter(Boolean);

    objetivosPersonalizacionGeneral.forEach(el => {
        el.dataset.tema = personalizacionActual.tema;
        el.dataset.borde = personalizacionActual.estilo_borde;
        el.style.setProperty("--fuente-calendario", `'${personalizacionActual.fuente}', sans-serif`);
        el.classList.toggle("sin-sombras", !personalizacionActual.sombras);
        el.classList.toggle("sin-decoraciones", !personalizacionActual.decoraciones);
        el.classList.toggle("sin-animaciones", !personalizacionActual.animaciones);
    });

    calendario.dataset.formaDia = personalizacionActual.forma_dia;
    calendario.dataset.formaNumero = personalizacionActual.forma_numero;

    const coloresPaleta = personalizacionActual.paleta === "personalizada"
        ? (personalizacionActual.colores_personalizados || PALETAS.original.colores)
        : PALETAS[personalizacionActual.paleta].colores;

    await aplicarPaleta(coloresPaleta);
}

/* ====================================================================
   CONSTRUIR EL PANEL DE CONTROLES
   ==================================================================== */

function construirBotonesOpcion(contenedorId, lista, campo, render) {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;

    cont.innerHTML = lista.map(op => `
        <button type="button" class="personalizacion-opcion${personalizacionActual[campo] === op.id ? " seleccionada" : ""}"
            data-valor="${op.id}">${render(op)}</button>
    `).join("");

    cont.addEventListener("click", (e) => {
        const btn = e.target.closest(".personalizacion-opcion");
        if (!btn) return;
        personalizacionActual[campo] = btn.dataset.valor;
        cont.querySelectorAll(".personalizacion-opcion").forEach(b => b.classList.toggle("seleccionada", b === btn));
        if (campo === "paleta") actualizarVisibilidadColoresCustom();
    });
}

function actualizarVisibilidadColoresCustom() {
    const cont = document.getElementById("personalizacion-colores-custom");
    if (!cont) return;

    if (personalizacionActual.paleta !== "personalizada") {
        cont.classList.add("oculto");
        return;
    }

    const colores = personalizacionActual.colores_personalizados || { ...PALETAS.original.colores };

    cont.innerHTML = EMOTION_ORDER.map(key => `
        <label class="personalizacion-color-item">
            ${EMOTIONS[key].name}
            <input type="color" data-emocion="${key}" value="${colores[key]}">
        </label>
    `).join("");
    cont.classList.remove("oculto");

    cont.querySelectorAll("input[type=color]").forEach(input => {
        input.addEventListener("input", () => {
            if (!personalizacionActual.colores_personalizados) {
                personalizacionActual.colores_personalizados = { ...PALETAS.original.colores };
            }
            personalizacionActual.colores_personalizados[input.dataset.emocion] = input.value;
        });
    });
}

function construirPanelPersonalizacion() {
    construirBotonesOpcion("personalizacion-temas", TEMAS, "tema", t =>
        `<span class="personalizacion-swatch-emoji">${t.emoji}</span><span>${t.nombre}</span>`
    );

    const listaPaletas = Object.keys(PALETAS).map(id => ({ id, ...PALETAS[id] }));
    construirBotonesOpcion("personalizacion-paletas", listaPaletas, "paleta", p =>
        p.colores
            ? `${EMOTION_ORDER.slice(0, 5).map(k => `<span class="mini-dot" style="background:${p.colores[k]}"></span>`).join("")}<span>${p.nombre}</span>`
            : `<span class="personalizacion-swatch-emoji">🎨</span><span>${p.nombre}</span>`
    );

    construirBotonesOpcion("personalizacion-formas-dia", FORMAS_DIA, "forma_dia", f =>
        `<span class="personalizacion-simbolo">${SIMBOLO_FORMA[f.id]}</span><span>${f.nombre}</span>`
    );
    construirBotonesOpcion("personalizacion-formas-numero", FORMAS_NUMERO, "forma_numero", f =>
        `<span class="personalizacion-simbolo">${SIMBOLO_FORMA[f.id]}</span><span>${f.nombre}</span>`
    );
    construirBotonesOpcion("personalizacion-bordes", ESTILOS_BORDE, "estilo_borde", b =>
        `<span>${b.nombre}</span>`
    );

    const selectFuente = document.getElementById("personalizacion-fuente");
    if (selectFuente) {
        selectFuente.innerHTML = FUENTES.map(f =>
            `<option value="${f}" ${personalizacionActual.fuente === f ? "selected" : ""}>${f}</option>`
        ).join("");
        selectFuente.addEventListener("change", () => { personalizacionActual.fuente = selectFuente.value; });
    }

    const chkSombras = document.getElementById("personalizacion-sombras");
    const chkDecoraciones = document.getElementById("personalizacion-decoraciones");
    const chkAnimaciones = document.getElementById("personalizacion-animaciones");

    if (chkSombras) {
        chkSombras.checked = personalizacionActual.sombras;
        chkSombras.addEventListener("change", (e) => personalizacionActual.sombras = e.target.checked);
    }
    if (chkDecoraciones) {
        chkDecoraciones.checked = personalizacionActual.decoraciones;
        chkDecoraciones.addEventListener("change", (e) => personalizacionActual.decoraciones = e.target.checked);
    }
    if (chkAnimaciones) {
        chkAnimaciones.checked = personalizacionActual.animaciones;
        chkAnimaciones.addEventListener("change", (e) => personalizacionActual.animaciones = e.target.checked);
    }

    actualizarVisibilidadColoresCustom();

    const btnAplicar = document.getElementById("btn-aplicar-personalizacion");
    if (btnAplicar) {
        btnAplicar.addEventListener("click", async () => {
            const mensaje = document.getElementById("mensaje-personalizacion");
            btnAplicar.disabled = true;
            await aplicarPersonalizacionVisual();
            const ok = await guardarPersonalizacion();
            btnAplicar.disabled = false;
            if (mensaje) {
                mensaje.textContent = ok ? "Cambios aplicados y guardados." : "Se aplicaron los cambios, pero no se pudieron guardar.";
                mensaje.classList.toggle("mensaje-estado--error", !ok);
            }
        });
    }
}

/* ====================================================================
   INICIALIZACIÓN
   ==================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const panel = document.getElementById("personalizacion-temas");
    if (!panel) return; // esta página no tiene el panel de personalización

    await cargarPersonalizacion();
    construirPanelPersonalizacion();
    await aplicarPersonalizacionVisual();
});