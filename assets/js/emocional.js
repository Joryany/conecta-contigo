/* ====================================================================
   REGISTRO EMOCIONAL — Conecta Contigo
   ==================================================================== */

/* ====================================================================
   1. DATOS: EMOCIONES Y MATICES
   ==================================================================== */

const EMOTIONS = {
    alegria: {
        name: "Alegría",
        color: "#FFD700",
        nuances: ["Euforia", "Entusiasmo", "Jovialidad", "Regocijo", "Gratitud", "Serenidad"]
    },
    amor: {
        name: "Amor",
        color: "#FF7F7F",
        nuances: ["Afecto", "Ternura", "Cercanía", "Devoción", "Compasión", "Éxtasis"]
    },
    sorpresa: {
        name: "Sorpresa",
        color: "#FFA500",
        nuances: ["Asombro", "Curiosidad", "Maravilla", "Estupor", "Desconcierto", "Pasmo"]
    },
    ansiedad: {
        name: "Ansiedad",
        color: "#D95D27",
        nuances: ["Inquietud", "Aprehensión", "Nerviosismo", "Hipervigilancia", "Zozobra", "Desasosiego"]
    },
    estres: {
        name: "Estrés",
        color: "#5A5F69",
        nuances: ["Tensión", "Agotamiento", "Sobrecarga", "Frustración", "Irritabilidad", "Desgaste"]
    },
    miedo: {
        name: "Miedo",
        color: "#4B0082",
        nuances: ["Temor", "Inseguridad", "Pavor", "Pánico", "Terror", "Aprensión defensiva"]
    },
    tristeza: {
        name: "Tristeza",
        color: "#4682B4",
        nuances: ["Melancolía", "Soledad", "Pena", "Desconsuelo", "Nostalgia", "Desaliento"]
    },
    enojo: {
        name: "Enojo",
        color: "#CC0000",
        nuances: ["Fastidio", "Indignación", "Ira", "Hostilidad", "Resentimiento", "Cólera"]
    }
};

const EMOTION_ORDER = ["amor", "alegria", "ansiedad", "sorpresa", "estres", "miedo", "tristeza", "enojo"];

const LIMITE_DIARIO = 5;
const MAX_EMOCIONES_POR_REGISTRO = 3;
const MAX_MATICES_POR_EMOCION = 2;

/* ====================================================================
   2. DATOS: CUESTIONARIO PRINCIPAL DEL EXPLORADOR (5 preguntas)
   ==================================================================== */

const MAIN_QUESTIONS = [
    {
        prompt: "Piensa en las últimas horas. ¿Cómo describirías el nivel de energía o activación que sientes en tu cuerpo?",
        options: [
            { key: "a", texto: "Muy alta, como si estuviera 'eléctrico' o con mucha tensión.", scores: { ansiedad: 1, estres: 1 } },
            { key: "b", texto: "Alta, pero con una sensación de calma o emoción positiva.", scores: { alegria: 1, amor: 1 } },
            { key: "c", texto: "Normal, sin sentirme especialmente activo o cansado.", scores: {} },
            { key: "d", texto: "Baja, con sensación de agotamiento o falta de fuerzas.", scores: { tristeza: 1, alegria: -1, amor: -1, estres: -1 } }
        ]
    },
    {
        prompt: "¿Cómo describirías tu patrón de pensamiento en este momento?",
        options: [
            { key: "a", texto: "Mi mente está dando vueltas a lo que podría pasar, imaginando varios escenarios posibles.", scores: { ansiedad: 1, miedo: 1 } },
            { key: "b", texto: "Estoy pensando en algo o alguien que me importa mucho y me genera bienestar.", scores: { amor: 1, alegria: 1 } },
            { key: "c", texto: "Mis pensamientos se centran en una injusticia o en algo que me parece mal.", scores: { enojo: 1 } },
            { key: "d", texto: "Siento que mis pensamientos son lentos, y me cuesta concentrarme o ver el futuro con claridad.", scores: { tristeza: 1, alegria: -1, amor: -1, estres: -1 } }
        ]
    },
    {
        prompt: "Imagina que sucede algo inesperado a tu alrededor. ¿Cuál sería tu reacción más probable?",
        options: [
            { key: "a", texto: "Me sobresaltaría o me quedaría en blanco, sintiendo una breve descarga de adrenalina.", scores: { sorpresa: 1 } },
            { key: "b", texto: "Mi primera sensación sería de amenaza, preparándome para defenderme o huir.", scores: { miedo: 1 } },
            { key: "c", texto: "Me molestaría o enfadaría, sintiendo que es un obstáculo o una molestia.", scores: { enojo: 1 } },
            { key: "d", texto: "Me generaría curiosidad o una sensación de emoción, viéndolo como una oportunidad.", scores: { sorpresa: 1, alegria: 1 } }
        ]
    },
    {
        prompt: "Cuando piensas en cómo te sientes ahora, ¿qué sensación física es más predominante?",
        options: [
            { key: "a", texto: "Opresión en el pecho, nudo en la garganta o mariposas incómodas en el estómago.", scores: { ansiedad: 1, tristeza: 1 } },
            { key: "b", texto: "Calidez en el centro del pecho, una sensación de apertura o fluidez.", scores: { amor: 1, alegria: 1 } },
            { key: "c", texto: "Tensión o nudo en el estómago, mandíbula apretada o puños cerrados.", scores: { estres: 1, enojo: 1 } },
            { key: "d", texto: "No siento una sensación física destacable en estos momentos.", scores: {} }
        ]
    },
    {
        prompt: "En este momento, ¿cómo te sientes en relación con los demás o contigo mismo?",
        options: [
            { key: "a", texto: "Con ganas de conectar, de compartir y de sentirme cerca de alguien.", scores: { amor: 1, alegria: 1 } },
            { key: "b", texto: "Con ganas de estar solo/a, de no tener que interactuar con nadie, me siento desconectado/a.", scores: { tristeza: 1, amor: -1, alegria: -1 } },
            { key: "c", texto: "Con una sensación de que los demás no me entienden, o de que están en mi contra.", scores: { enojo: 1, amor: -1, alegria: -1 } },
            { key: "d", texto: "Sintiendo que necesito la aprobación o el apoyo de alguien para estar tranquilo/a.", scores: { ansiedad: 1, estres: 1 } }
        ]
    }
];

/* ====================================================================
   3. DATOS: PREGUNTAS DE DESEMPATE (D1-D5)
   ==================================================================== */

const TIEBREAK_QUESTIONS = [
    {
        prompt: "Si tuvieras que definir tu principal sensación de malestar, ¿cuál se acerca más a...?",
        options: [
            { key: "a", texto: "Una sensación de opresión o nudo en la garganta, como si algo estuviera atascado.", emotion: "tristeza" },
            { key: "b", texto: "Un estado de alerta constante, como si algo malo fuera a pasar en cualquier momento.", emotion: "ansiedad" },
            { key: "c", texto: "Una sensación de agobio, de que tengo demasiadas cosas y no puedo con todo.", emotion: "estres" },
            { key: "d", texto: "Una sensación de impotencia o de que he hecho algo mal.", emotion: "miedo" },
            { key: "e", texto: "Una sensación de injusticia o de que algo no está bien y debería cambiar.", emotion: "enojo" }
        ]
    },
    {
        prompt: "Si tu mente fuera una pantalla de televisión, ¿qué es lo que se está emitiendo?",
        options: [
            { key: "a", texto: "Un recuerdo de algo que perdí o que ya no está.", emotion: "tristeza" },
            { key: "b", texto: "Un anuncio de '¡Peligro!' o una advertencia sobre algo que debo evitar.", emotion: "miedo" },
            { key: "c", texto: "Un escenario de '¿Y si...?' sobre cosas que podrían salir mal en el futuro.", emotion: "ansiedad" },
            { key: "d", texto: "Un noticiero que habla de un problema que no puedo resolver y me genera presión.", emotion: "estres" },
            { key: "e", texto: "La repetición de una discusión o de un momento en el que me sentí tratado injustamente.", emotion: "enojo" }
        ]
    },
    {
        prompt: "¿Qué es lo que más te gustaría hacer ahora mismo?",
        options: [
            { key: "a", texto: "Escapar, desaparecer o evitar una situación o persona.", emotion: "miedo" },
            { key: "b", texto: "Estar solo/a, acostarme y no hacer nada.", emotion: "tristeza" },
            { key: "c", texto: "Gritar, romper algo o descargar la energía que tengo acumulada.", emotion: "enojo" },
            { key: "d", texto: "Controlar, organizar o planificar todo para sentir que tengo el control.", emotion: "ansiedad" },
            { key: "e", texto: "Dejar de pensar en todo y desconectar, aunque sea por un momento.", emotion: "estres" }
        ]
    },
    {
        prompt: "Comparado con cómo te sientes normalmente, ¿dirías que...?",
        options: [
            { key: "a", texto: "Siento que he perdido algo importante y no sé cómo recuperarlo.", emotion: "tristeza" },
            { key: "b", texto: "Todo me parece una amenaza o un riesgo.", emotion: "miedo" },
            { key: "c", texto: "Siento que todo se me viene encima y me sobrepasa.", emotion: "estres" },
            { key: "d", texto: "Siento que necesito asegurarme de que todo está bajo control para estar tranquilo.", emotion: "ansiedad" },
            { key: "e", texto: "Siento una rabia o irritación que no puedo quitarme de encima.", emotion: "enojo" }
        ]
    },
    {
        prompt: "¿Hay algo en tu entorno inmediato (personas, tareas, lugar) que esté generando este malestar?",
        options: [
            { key: "a", texto: "Sí, hay una tarea o responsabilidad que me supera.", emotion: "estres" },
            { key: "b", texto: "Sí, hay una persona o una relación que me está afectando profundamente.", dynamic: ["tristeza", "enojo", "miedo"] },
            { key: "c", texto: "No es algo externo, es mi propia cabeza la que no para.", emotion: "ansiedad" }
        ]
    }
];

/* ====================================================================
   4. ACCESO A DATOS (Supabase: base de datos + autenticación)
   ==================================================================== */
/* Este objeto reemplaza al antiguo `storage` de localStorage.
   `supabaseClient` viene de assets/js/supabase-config.js (cargado
   antes que este archivo en emocional.html).

   Formato interno que sigue usando el resto del archivo (igual que
   antes, para no tener que tocar los renders):
     { id, createdAt, emotions: [{ name, nuances }] }

   Ese formato se traduce desde/hacia las columnas reales de la tabla
   (id, created_at, emociones). */

function mapearFila(fila) {
    return { id: fila.id, createdAt: fila.created_at, emotions: fila.emociones };
}

const db = {
    // Trae TODOS los registros del usuario autenticado (RLS en el
    // servidor garantiza que nunca vengan registros de otro usuario).
    async getRecords() {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabaseClient
            .from("registros_emocionales")
            .select("id, created_at, emociones")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });

        if (error) {
            console.warn("No se pudieron cargar los registros:", error);
            return [];
        }
        return data.map(mapearFila);
    },

    // Crea un registro nuevo. El límite diario y la validación de
    // forma se verifican en la base de datos (ver database/schema.sql),
    // así que aquí solo interpretamos el resultado.
    async insertRecord(emocionesArray) {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return { ok: false, motivo: "sin-sesion" };

        const { data, error } = await supabaseClient
            .from("registros_emocionales")
            .insert({ user_id: user.id, emociones: emocionesArray })
            .select("id, created_at, emociones")
            .single();

        if (error) {
            if ((error.message || "").includes("LIMITE_DIARIO_ALCANZADO")) {
                return { ok: false, motivo: "limite" };
            }
            console.warn("No se pudo guardar el registro:", error);
            return { ok: false, motivo: "error" };
        }
        return { ok: true, registro: mapearFila(data) };
    },

    // Actualiza SOLO las emociones/matices. La política de RLS
    // "editar_mismo_dia" rechaza la operación si ya no es el mismo
    // día de creación, sin importar lo que haga el frontend.
    async updateRecord(id, emocionesArray) {
        const { error } = await supabaseClient
            .from("registros_emocionales")
            .update({ emociones: emocionesArray })
            .eq("id", id);

        if (error) console.warn("No se pudo actualizar el registro:", error);
        return !error;
    },

    // La política de RLS "eliminar_48h" rechaza la operación si ya
    // pasaron más de 48 horas desde la creación.
    async deleteRecord(id) {
        const { error } = await supabaseClient
            .from("registros_emocionales")
            .delete()
            .eq("id", id);

        if (error) console.warn("No se pudo eliminar el registro:", error);
        return !error;
    }
};

/* ====================================================================
   5. UTILIDADES DE FECHA Y HORA
   ==================================================================== */

function dateKeyFromDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function todayDateStr() {
    return dateKeyFromDate(new Date());
}

function dateKeyFromTimestamp(iso) {
    return dateKeyFromDate(new Date(iso));
}

function formatearFechaLarga(fechaStr) {
    const [y, m, d] = fechaStr.split("-").map(Number);
    const fecha = new Date(y, m - 1, d);
    return fecha.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

function formatearHora(iso) {
    return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

function obtenerClavePorNombre(nombre) {
    return EMOTION_ORDER.find(key => EMOTIONS[key].name === nombre) || null;
}

function obtenerColorPorNombre(nombre) {
    const key = obtenerClavePorNombre(nombre);
    return key ? EMOTIONS[key].color : "#999999";
}

// Un registro solo puede editarse mientras la fecha de HOY siga siendo
// la misma fecha calendario en la que fue creado (el servidor aplica
// la misma regla de forma independiente; ver política "editar_mismo_dia").
function esEditable(registro) {
    return dateKeyFromTimestamp(registro.createdAt) === todayDateStr();
}

// Un registro puede eliminarse durante exactamente 48 horas desde su
// creación (el servidor aplica la misma regla; ver "eliminar_48h").
function esEliminable(registro) {
    const creado = new Date(registro.createdAt).getTime();
    const limiteMs = 48 * 60 * 60 * 1000;
    return (Date.now() - creado) <= limiteMs;
}

/* ====================================================================
   6. REGISTRO MANUAL — estado y lógica
   ==================================================================== */

const seleccionActual = new Map();
let editingRecordId = null;

function toggleEmocion(key) {
    if (seleccionActual.has(key)) {
        seleccionActual.delete(key);
    } else if (seleccionActual.size < MAX_EMOCIONES_POR_REGISTRO) {
        seleccionActual.set(key, []);
    }
    renderListaEmociones();
    renderContenedorMatices();
}

function toggleMatiz(emoKey, matiz) {
    const actuales = seleccionActual.get(emoKey);
    if (!actuales) return;
    const idx = actuales.indexOf(matiz);
    if (idx >= 0) {
        actuales.splice(idx, 1);
    } else if (actuales.length < MAX_MATICES_POR_EMOCION) {
        actuales.push(matiz);
    }
    renderContenedorMatices();
}

// Crea un nuevo registro. El límite diario de 5 lo verifica el
// servidor; aquí solo interpretamos la respuesta.
async function crearRegistro(emocionesArray) {
    return db.insertRecord(emocionesArray);
}

async function actualizarRegistro(id, emocionesArray) {
    return db.updateRecord(id, emocionesArray);
}

async function eliminarRegistro(id) {
    return db.deleteRecord(id);
}

async function iniciarEdicion(id) {
    const registros = await db.getRecords();
    const registro = registros.find(r => r.id === id);
    if (!registro || !esEditable(registro)) return;

    seleccionActual.clear();
    registro.emotions.forEach(e => {
        const key = obtenerClavePorNombre(e.name);
        if (key) seleccionActual.set(key, [...e.nuances]);
    });
    editingRecordId = id;

    renderListaEmociones();
    renderContenedorMatices();
    await actualizarAvisoLimiteDiario();
    document.getElementById("aviso-edicion").classList.remove("oculto");
    document.getElementById("btn-guardar-registro").textContent = "Guardar cambios";
    document.getElementById("registro-emocional").scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelarEdicion() {
    editingRecordId = null;
    seleccionActual.clear();
    document.getElementById("aviso-edicion").classList.add("oculto");
    document.getElementById("btn-guardar-registro").textContent = "Guardar registro";
    renderListaEmociones();
    renderContenedorMatices();
    actualizarAvisoLimiteDiario();
}

async function manejarGuardarRegistro() {
    if (seleccionActual.size === 0) {
        mostrarMensajeRegistro("Selecciona al menos una emoción antes de guardar.", true);
        return;
    }

    const emociones = Array.from(seleccionActual.entries()).map(([key, matices]) => ({
        name: EMOTIONS[key].name,
        nuances: matices.slice(0, MAX_MATICES_POR_EMOCION)
    }));

    const btnGuardar = document.getElementById("btn-guardar-registro");
    btnGuardar.disabled = true;

    if (editingRecordId) {
        const ok = await actualizarRegistro(editingRecordId, emociones);
        mostrarMensajeRegistro(
            ok ? "Registro actualizado correctamente." : "No se pudo actualizar el registro. Puede que ya no esté disponible para editar.",
            !ok
        );
        cancelarEdicion();
    } else {
        const resultado = await crearRegistro(emociones);
        if (!resultado.ok) {
            const texto = resultado.motivo === "limite"
                ? `Ya alcanzaste el límite de ${LIMITE_DIARIO} registros para hoy. Puedes volver mañana.`
                : "No se pudo guardar el registro. Inténtalo nuevamente.";
            mostrarMensajeRegistro(texto, true);
            btnGuardar.disabled = false;
            return;
        }
        mostrarMensajeRegistro("Registro guardado correctamente.", false);
        seleccionActual.clear();
        renderListaEmociones();
        renderContenedorMatices();
    }

    btnGuardar.disabled = false;
    await actualizarAvisoLimiteDiario();
    await renderCalendar();
    await renderPanelDia();
}

function mostrarMensajeRegistro(texto, esError) {
    const el = document.getElementById("mensaje-registro");
    el.textContent = texto;
    el.classList.toggle("mensaje-estado--error", !!esError);
}

async function actualizarAvisoLimiteDiario() {
    const hoy = todayDateStr();
    const registrosHoy = (await db.getRecords())
        .filter(r => dateKeyFromTimestamp(r.createdAt) === hoy).length;
    const limiteAlcanzado = registrosHoy >= LIMITE_DIARIO;
    const aviso = document.getElementById("mensaje-limite-diario");

    if (limiteAlcanzado && !editingRecordId) {
        aviso.textContent = `Ya alcanzaste el límite de ${LIMITE_DIARIO} registros para hoy. Podrás crear uno nuevo mañana.`;
        aviso.classList.remove("oculto");
    } else {
        aviso.classList.add("oculto");
    }

    document.getElementById("btn-guardar-registro").disabled = limiteAlcanzado && !editingRecordId;
    document.getElementById("btn-no-se").disabled = limiteAlcanzado && !editingRecordId;
}

/* ====================================================================
   7. RENDER — Selector de emociones y matices (registro manual)
   ==================================================================== */

function renderListaEmociones() {
    const contenedor = document.getElementById("lista-emociones");
    const limiteAlcanzado = seleccionActual.size >= MAX_EMOCIONES_POR_REGISTRO;

    contenedor.innerHTML = EMOTION_ORDER.map(key => {
        const emocion = EMOTIONS[key];
        const activa = seleccionActual.has(key);
        const deshabilitada = !activa && limiteAlcanzado;
        return `
            <button type="button" class="emocion-boton${activa ? " seleccionada" : ""}"
                data-emocion="${key}"
                style="--color-emocion:${emocion.color}"
                aria-pressed="${activa}"
                ${deshabilitada ? 'disabled aria-disabled="true" title="Ya seleccionaste el máximo de 3 emociones"' : ""}>
                <span class="punto-color" aria-hidden="true"></span>
                <span>${emocion.name}</span>
                ${activa ? '<span class="marca-seleccion">✓ Seleccionada</span>' : ""}
            </button>
        `;
    }).join("");
}

function renderizarSelectorMatices(emoKey, seleccionadas) {
    const emocion = EMOTIONS[emoKey];
    const chips = emocion.nuances.map(matiz => {
        const activo = seleccionadas.includes(matiz);
        const deshabilitado = !activo && seleccionadas.length >= MAX_MATICES_POR_EMOCION;
        return `
            <button type="button" class="matiz-boton${activo ? " seleccionado" : ""}"
                data-emocion="${emoKey}" data-matiz="${matiz}"
                aria-pressed="${activo}"
                ${deshabilitado ? 'disabled aria-disabled="true" title="Ya seleccionaste 2 matices para esta emoción"' : ""}>
                ${matiz}
            </button>
        `;
    }).join("");

    return `
        <fieldset class="grupo-matiz">
            <legend><span class="punto-color" style="--color-emocion:${emocion.color}" aria-hidden="true"></span>${emocion.name}</legend>
            <div class="matices-opciones">${chips}</div>
        </fieldset>
    `;
}

function renderContenedorMatices() {
    const contenedor = document.getElementById("contenedor-matices");
    if (seleccionActual.size === 0) {
        contenedor.innerHTML = "";
        return;
    }
    contenedor.innerHTML = `
        <p class="intro-texto intro-texto--matices">Puedes elegir hasta dos matices por cada emoción (opcional).</p>
        ${Array.from(seleccionActual.entries()).map(([key, matices]) => renderizarSelectorMatices(key, matices)).join("")}
    `;
}

/* ====================================================================
   8. EXPLORADOR EMOCIONAL — cálculo de puntuaciones
   ==================================================================== */

function calcularPuntuacionesPrincipales(respuestas) {
    const puntuaciones = {};
    EMOTION_ORDER.forEach(k => puntuaciones[k] = 0);

    respuestas.forEach((opcionKey, idx) => {
        const pregunta = MAIN_QUESTIONS[idx];
        const opcion = pregunta.options.find(o => o.key === opcionKey);
        if (!opcion) return;
        Object.entries(opcion.scores).forEach(([emo, delta]) => {
            puntuaciones[emo] += delta;
        });
    });

    return puntuaciones;
}

function evaluarResultadoPrincipal(puntuaciones) {
    const ranking = Object.entries(puntuaciones).sort((a, b) => b[1] - a[1]);
    const maxPuntaje = ranking[0][1];

    if (maxPuntaje <= 0) {
        return { type: "sin-coincidencia" };
    }

    const empatados = ranking.filter(([, p]) => p === maxPuntaje).map(([k]) => k);

    if (empatados.length >= 2) {
        return { type: "empate", tied: empatados.slice(0, 2) };
    }

    const principal = empatados[0];
    const siguiente = ranking.find(([k, p]) => k !== principal && p > 0 && (maxPuntaje - p) <= 1);

    return { type: "resultado", principal, secundaria: siguiente ? siguiente[0] : null };
}

function elegirPreguntaDesempate() {
    const indice = Math.floor(Math.random() * TIEBREAK_QUESTIONS.length);
    return TIEBREAK_QUESTIONS[indice];
}

function resolverDesempate(tied, opcionKey, pregunta) {
    const puntuacionesDesempate = {};
    tied.forEach(k => puntuacionesDesempate[k] = 0);

    const opcion = pregunta.options.find(o => o.key === opcionKey);

    if (opcion.dynamic) {
        const candidatas = opcion.dynamic.filter(k => tied.includes(k));
        if (candidatas.length) {
            const maxVal = Math.max(...candidatas.map(k => puntuacionesDesempate[k]));
            const ganadoras = candidatas.filter(k => puntuacionesDesempate[k] === maxVal);
            if (ganadoras.length === 1) {
                puntuacionesDesempate[ganadoras[0]] += 1;
            }
        }
    } else if (opcion.emotion && tied.includes(opcion.emotion)) {
        puntuacionesDesempate[opcion.emotion] += 1;
    }

    const ranking = Object.entries(puntuacionesDesempate).sort((a, b) => b[1] - a[1]);
    const max = ranking[0][1];
    const ganadores = ranking.filter(([, p]) => p === max).map(([k]) => k);

    if (ganadores.length === 1) {
        return { type: "resultado", principal: ganadores[0] };
    }
    return { type: "empate-persistente", tied: ganadores.slice(0, 2) };
}

/* ====================================================================
   9. EXPLORADOR EMOCIONAL — estado y flujo
   ==================================================================== */

let explorerState = null;

function iniciarExplorador() {
    explorerState = {
        step: "intro",
        respuestas: [],
        tied: [],
        tieQuestion: null,
        resultado: null,
        emocionElegida: null,
        matices: []
    };
    mostrarSeccionExplorador(true);
    renderExplorador();
}

function salirExplorador() {
    explorerState = null;
    mostrarSeccionExplorador(false);
}

function mostrarSeccionExplorador(mostrar) {
    const seccion = document.getElementById("explorador-emocional");
    seccion.classList.toggle("oculto", !mostrar);
    if (mostrar) {
        seccion.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function responderPreguntaPrincipal(opcionKey) {
    explorerState.respuestas.push(opcionKey);

    if (explorerState.respuestas.length < MAIN_QUESTIONS.length) {
        renderExplorador();
        return;
    }

    const puntuaciones = calcularPuntuacionesPrincipales(explorerState.respuestas);
    const resultado = evaluarResultadoPrincipal(puntuaciones);

    if (resultado.type === "sin-coincidencia") {
        explorerState.step = "sin-coincidencia";
    } else if (resultado.type === "empate") {
        explorerState.tied = resultado.tied;
        explorerState.tieQuestion = elegirPreguntaDesempate();
        explorerState.step = "desempate";
    } else {
        explorerState.resultado = { principal: resultado.principal, secundaria: resultado.secundaria };
        explorerState.step = "resultado";
    }
    renderExplorador();
}

function responderDesempate(opcionKey) {
    const resolucion = resolverDesempate(explorerState.tied, opcionKey, explorerState.tieQuestion);
    if (resolucion.type === "resultado") {
        explorerState.resultado = { principal: resolucion.principal, secundaria: null };
        explorerState.step = "resultado";
    } else {
        explorerState.tied = resolucion.tied;
        explorerState.step = "empate-persistente";
    }
    renderExplorador();
}

async function finalizarExplorador() {
    const emocionKey = explorerState.emocionElegida;
    const resultado = await crearRegistro([{
        name: EMOTIONS[emocionKey].name,
        nuances: explorerState.matices.slice(0, MAX_MATICES_POR_EMOCION)
    }]);

    if (!resultado.ok) {
        explorerState.step = "limite-alcanzado";
        renderExplorador();
        return;
    }

    salirExplorador();
    mostrarMensajeRegistro("Registro guardado correctamente.", false);
    await actualizarAvisoLimiteDiario();
    await renderCalendar();
    await renderPanelDia();
}

/* ====================================================================
   10. EXPLORADOR EMOCIONAL — render
   ==================================================================== */

const DURACION_TRANSICION_EXPLORADOR = 320;

function renderExplorador() {
    const contenedor = document.getElementById("explorador-contenido");

    if (!explorerState) {
        contenedor.innerHTML = "";
        return;
    }

    const pintarPaso = () => {
        switch (explorerState.step) {
            case "intro":
                contenedor.innerHTML = `
                    <p class="explorador-texto">
                        Antes de empezar, queremos que sepas que esto no es un test clínico ni un diagnóstico.
                        Es una herramienta de exploración para ayudarte a poner palabras a lo que sientes.
                        Las preguntas se basan en cómo reacciona tu cuerpo y tu mente ante diferentes situaciones.
                        No hay respuestas correctas o incorrectas; solo tú puedes saber qué es lo que realmente
                        estás experimentando. Al final, te mostraremos algunas opciones para que tú valides y
                        elijas lo que mejor describa tu estado.
                    </p>
                    <div class="acciones-registro">
                        <button type="button" class="btn-secundario" data-salir-explorador>Salir</button>
                        <button type="button" class="btn-primario" data-comenzar-explorador>Comenzar</button>
                    </div>
                `;
                break;

            case "pregunta": {
                const idx = explorerState.respuestas.length;
                const pregunta = MAIN_QUESTIONS[idx];
                contenedor.innerHTML = `
                    <p class="explorador-progreso">Pregunta ${idx + 1} de ${MAIN_QUESTIONS.length}</p>
                    <h3 class="explorador-pregunta">${pregunta.prompt}</h3>
                    <div class="explorador-opciones">
                        ${pregunta.options.map(o => `
                            <button type="button" class="opcion-pregunta" data-opcion="${o.key}">${o.texto}</button>
                        `).join("")}
                    </div>
                    <button type="button" class="btn-enlace" data-salir-explorador>Salir del explorador</button>
                `;
                break;
            }

            case "desempate": {
                const pregunta = explorerState.tieQuestion;
                contenedor.innerHTML = `
                    <p class="explorador-progreso">Una última pregunta para ayudarte a distinguir mejor</p>
                    <h3 class="explorador-pregunta">${pregunta.prompt}</h3>
                    <div class="explorador-opciones">
                        ${pregunta.options.map(o => `
                            <button type="button" class="opcion-pregunta" data-tiebreak-opcion="${o.key}">${o.texto}</button>
                        `).join("")}
                    </div>
                `;
                break;
            }

            case "sin-coincidencia":
                contenedor.innerHTML = `
                    <p class="explorador-texto">
                        ¡Vaya! No hemos encontrado una coincidencia clara con nuestras preguntas. Esto es
                        completamente normal, ya que este es un proceso de exploración. El conocimiento de lo
                        que sientes solo está en ti. Te invitamos a navegar por las emociones y elegir aquella
                        que resuene más contigo en este momento.
                    </p>
                    <div class="acciones-registro">
                        <button type="button" class="btn-secundario" data-reiniciar-explorador>Volver a hacer el cuestionario</button>
                        <button type="button" class="btn-primario" data-salir-explorador>Elegir manualmente</button>
                    </div>
                `;
                break;

            case "resultado": {
                const { principal, secundaria } = explorerState.resultado;
                const opciones = [principal, secundaria].filter(Boolean);
                contenedor.innerHTML = `
                    <p class="explorador-texto">
                        Gracias por tomarte este tiempo para explorar. Recuerda: esto es solo una guía.
                        Respecto a tus respuestas, parece que podrías estar experimentando principalmente
                        ${opciones.length > 1 ? "estas emociones" : "esta emoción"}. Puedes elegir la que
                        más se acomode a ti.
                    </p>
                    <div class="explorador-opciones explorador-opciones--resultado">
                        ${opciones.map(key => `
                            <button type="button" class="resultado-emocion-boton" data-elegir-emocion="${key}"
                                style="--color-emocion:${EMOTIONS[key].color}">
                                ${EMOTIONS[key].name}
                            </button>
                        `).join("")}
                    </div>
                    <div class="acciones-registro">
                        <button type="button" class="btn-secundario" data-reiniciar-explorador>Volver a hacer el cuestionario</button>
                        <button type="button" class="btn-enlace" data-salir-explorador>Salir y elegir manualmente</button>
                    </div>
                `;
                break;
            }

            case "empate-persistente": {
                const opciones = explorerState.tied;
                contenedor.innerHTML = `
                    <p class="explorador-texto">
                        Tus respuestas señalan dos posibles emociones sin una diferencia clara entre ellas.
                        Puedes elegir la que consideres más adecuada para ti en este momento.
                    </p>
                    <div class="explorador-opciones explorador-opciones--resultado">
                        ${opciones.map(key => `
                            <button type="button" class="resultado-emocion-boton" data-elegir-emocion="${key}"
                                style="--color-emocion:${EMOTIONS[key].color}">
                                ${EMOTIONS[key].name}
                            </button>
                        `).join("")}
                    </div>
                    <div class="acciones-registro">
                        <button type="button" class="btn-secundario" data-reiniciar-explorador>Volver a hacer el cuestionario</button>
                        <button type="button" class="btn-enlace" data-salir-explorador>Salir y elegir manualmente</button>
                    </div>
                `;
                break;
            }

            case "matices": {
                const emoKey = explorerState.emocionElegida;
                contenedor.innerHTML = `
                    <p class="explorador-texto">
                        Elegiste <strong>${EMOTIONS[emoKey].name}</strong>. Si quieres, puedes añadir hasta dos
                        matices que describan mejor esta emoción, o continuar sin seleccionar ninguno.
                    </p>
                    ${renderizarSelectorMatices(emoKey, explorerState.matices)}
                    <div class="acciones-registro">
                        <button type="button" class="btn-primario" data-continuar-explorador>Guardar registro</button>
                    </div>
                `;
                break;
            }

            case "limite-alcanzado":
                contenedor.innerHTML = `
                    <p class="explorador-texto">
                        Ya alcanzaste el límite de ${LIMITE_DIARIO} registros para hoy, así que no podemos
                        guardar este registro por ahora. Podrás intentarlo de nuevo mañana.
                    </p>
                    <div class="acciones-registro">
                        <button type="button" class="btn-primario" data-salir-explorador>Entendido</button>
                    </div>
                `;
                break;
        }
    };

    if (contenedor.innerHTML.trim() === "") {
        pintarPaso();
    } else {
        contenedor.classList.add("transicion-saliendo");
        window.setTimeout(() => {
            pintarPaso();
            contenedor.classList.remove("transicion-saliendo");
        }, DURACION_TRANSICION_EXPLORADOR);
    }
}

async function manejarClicExplorador(e) {
    const target = e.target;

    if (target.closest("[data-comenzar-explorador]")) {
        explorerState.step = "pregunta";
        renderExplorador();
        return;
    }

    const btnOpcion = target.closest("[data-opcion]");
    if (btnOpcion) {
        responderPreguntaPrincipal(btnOpcion.dataset.opcion);
        return;
    }

    const btnTie = target.closest("[data-tiebreak-opcion]");
    if (btnTie) {
        responderDesempate(btnTie.dataset.tiebreakOpcion);
        return;
    }

    const btnElegir = target.closest("[data-elegir-emocion]");
    if (btnElegir) {
        explorerState.emocionElegida = btnElegir.dataset.elegirEmocion;
        explorerState.matices = [];
        explorerState.step = "matices";
        renderExplorador();
        return;
    }

    const btnMatiz = target.closest(".matiz-boton");
    if (btnMatiz && !btnMatiz.disabled) {
        const matiz = btnMatiz.dataset.matiz;
        const idx = explorerState.matices.indexOf(matiz);
        if (idx >= 0) {
            explorerState.matices.splice(idx, 1);
        } else if (explorerState.matices.length < MAX_MATICES_POR_EMOCION) {
            explorerState.matices.push(matiz);
        }
        renderExplorador();
        return;
    }

    if (target.closest("[data-continuar-explorador]")) {
        await finalizarExplorador();
        return;
    }

    if (target.closest("[data-reiniciar-explorador]")) {
        iniciarExplorador();
        return;
    }

    if (target.closest("[data-salir-explorador]")) {
        salirExplorador();
        document.getElementById("registro-emocional").scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

/* ====================================================================
   11. CALENDARIO EMOCIONAL
   ==================================================================== */

const NOMBRES_MES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const calendarioEstado = {
    anio: null,
    mes: null,
    fechaSeleccionada: null
};

let mostrarCompletosDia = false;

async function inicializarCalendario() {
    const hoy = new Date();
    calendarioEstado.anio = hoy.getFullYear();
    calendarioEstado.mes = hoy.getMonth();
    calendarioEstado.fechaSeleccionada = todayDateStr();
    await renderCalendar();
    await renderPanelDia();
}

async function cambiarMes(delta) {
    let { anio, mes } = calendarioEstado;
    mes += delta;
    if (mes < 0) { mes = 11; anio -= 1; }
    if (mes > 11) { mes = 0; anio += 1; }
    calendarioEstado.anio = anio;
    calendarioEstado.mes = mes;
    await renderCalendar();
}

function construirFechaStr(anio, mes, dia) {
    const mm = String(mes + 1).padStart(2, "0");
    const dd = String(dia).padStart(2, "0");
    return `${anio}-${mm}-${dd}`;
}

function calcularGradienteDia(registrosDia) {
    if (!registrosDia.length) return null;

    const frecuencia = {};
    registrosDia.forEach(r => {
        r.emotions.forEach(e => {
            const key = obtenerClavePorNombre(e.name);
            if (!key) return;
            frecuencia[key] = (frecuencia[key] || 0) + 1;
        });
    });

    const total = Object.values(frecuencia).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    let acumulado = 0;
    const paradas = [];
    EMOTION_ORDER.forEach(key => {
        if (!frecuencia[key]) return;
        const porcentaje = (frecuencia[key] / total) * 100;
        const inicio = acumulado;
        const fin = acumulado + porcentaje;
        paradas.push({ color: EMOTIONS[key].color, punto: (inicio + fin) / 2 });
        acumulado = fin;
    });

    if (paradas.length === 1) {
        return paradas[0].color;
    }

    paradas[0].punto = 0;
    paradas[paradas.length - 1].punto = 100;

    const segmentos = paradas.map(p => `${p.color} ${p.punto}%`).join(", ");
    return `linear-gradient(135deg, ${segmentos})`;
}

async function renderCalendar() {
    const { anio, mes } = calendarioEstado;
    const nombreMes = NOMBRES_MES[mes];
    document.getElementById("calendario-mes-actual").textContent =
        `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} de ${anio}`;

    const registros = await db.getRecords();
    const primerDiaSemana = (new Date(anio, mes, 1).getDay() + 6) % 7;
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const hoy = todayDateStr();

    let celdas = "";
    for (let i = 0; i < primerDiaSemana; i++) {
        celdas += `<div class="dia-celda dia-vacio" aria-hidden="true"></div>`;
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
        const fechaStr = construirFechaStr(anio, mes, dia);
        const registrosDia = registros.filter(r => dateKeyFromTimestamp(r.createdAt) === fechaStr);
        const gradiente = calcularGradienteDia(registrosDia);
        const esHoy = fechaStr === hoy;
        const esSeleccionado = fechaStr === calendarioEstado.fechaSeleccionada;

        celdas += `
            <button type="button"
                class="dia-celda${esHoy ? " dia-hoy" : ""}${esSeleccionado ? " dia-seleccionado" : ""}${!registrosDia.length ? " dia-sin-registro" : ""}"
                data-fecha="${fechaStr}"
                aria-pressed="${esSeleccionado}"
                aria-label="${dia} de ${nombreMes}${registrosDia.length ? ", " + registrosDia.length + " registro(s)" : ", sin registros"}">
                ${gradiente ? `<span class="dia-forma" style="background:${gradiente}" aria-hidden="true"></span>` : ""}
                <span class="dia-numero">${dia}</span>
            </button>
        `;
    }

    document.getElementById("calendario-grid").innerHTML = celdas;
    renderLeyendaCalendario();
}

function renderLeyendaCalendario() {
    const leyenda = document.getElementById("calendario-leyenda");
    if (leyenda.dataset.render === "hecho") return;
    leyenda.dataset.render = "hecho";
    leyenda.innerHTML = EMOTION_ORDER.map(key => `
        <span class="leyenda-item">
            <span class="punto-color" style="--color-emocion:${EMOTIONS[key].color}" aria-hidden="true"></span>
            ${EMOTIONS[key].name}
        </span>
    `).join("");
}

async function renderPanelDia() {
    const panel = document.getElementById("panel-dia");
    const fecha = calendarioEstado.fechaSeleccionada;

    const registros = (await db.getRecords())
        .filter(r => dateKeyFromTimestamp(r.createdAt) === fecha)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const fechaLegible = formatearFechaLarga(fecha);

    if (registros.length === 0) {
        panel.innerHTML = `
            <h3>${fechaLegible}</h3>
            <p class="mensaje-estado">No hubo registros este día.</p>
        `;
        return;
    }

    const frecuencia = {};
    const maticesDelDia = new Set();
    registros.forEach(r => {
        r.emotions.forEach(e => {
            const key = obtenerClavePorNombre(e.name);
            if (key) frecuencia[key] = (frecuencia[key] || 0) + 1;
            e.nuances.forEach(m => maticesDelDia.add(m));
        });
    });

    const frecuenciaHtml = EMOTION_ORDER
        .filter(key => frecuencia[key])
        .map(key => `
            <li class="frecuencia-item">
                <span class="punto-color" style="--color-emocion:${EMOTIONS[key].color}" aria-hidden="true"></span>
                ${EMOTIONS[key].name} ×${frecuencia[key]}
            </li>
        `).join("");

    const maticesHtml = maticesDelDia.size
        ? `<p class="matices-dia"><strong>Matices del día:</strong> ${Array.from(maticesDelDia).join(", ")}</p>`
        : "";

    panel.innerHTML = `
        <h3>${fechaLegible}</h3>
        <p>${registros.length} registro${registros.length === 1 ? "" : "s"} este día.</p>
        <ul class="frecuencia-lista">${frecuenciaHtml}</ul>
        ${maticesHtml}
        <button type="button" class="btn-enlace" data-action="ver-completos">
            ${mostrarCompletosDia ? "Ocultar registros completos" : "Ver registros completos"}
        </button>
        ${mostrarCompletosDia ? renderRegistrosCompletos(registros) : ""}
    `;
}

function renderRegistrosCompletos(registros) {
    return `
        <ul class="registros-completos">
            ${registros.map(r => `
                <li class="registro-item">
                    <div class="registro-hora">${formatearHora(r.createdAt)}</div>
                    <div class="registro-emociones">
                        ${r.emotions.map(e => `
                            <span class="etiqueta-emocion" style="--color-emocion:${obtenerColorPorNombre(e.name)}">
                                ${e.name}${e.nuances.length ? " · " + e.nuances.join(", ") : ""}
                            </span>
                        `).join("")}
                    </div>
                    <div class="registro-acciones">
                        <button type="button" data-action="editar" data-id="${r.id}"
                            ${esEditable(r) ? "" : 'disabled aria-disabled="true" title="Solo puede editarse el mismo día en que se creó"'}>
                            Editar
                        </button>
                        <button type="button" data-action="eliminar" data-id="${r.id}"
                            ${esEliminable(r) ? "" : 'disabled aria-disabled="true" title="El límite de 48 horas para eliminar ya pasó"'}>
                            Eliminar
                        </button>
                    </div>
                </li>
            `).join("")}
        </ul>
    `;
}

async function manejarClicPanelDia(e) {
    if (e.target.closest('[data-action="ver-completos"]')) {
        mostrarCompletosDia = !mostrarCompletosDia;
        await renderPanelDia();
        return;
    }

    const btnEditar = e.target.closest('[data-action="editar"]');
    if (btnEditar && !btnEditar.disabled) {
        await iniciarEdicion(btnEditar.dataset.id);
        return;
    }

    const btnEliminar = e.target.closest('[data-action="eliminar"]');
    if (btnEliminar && !btnEliminar.disabled) {
        const confirmado = window.confirm("¿Seguro que quieres eliminar este registro? Esta acción no se puede deshacer.");
        if (confirmado) {
            const ok = await eliminarRegistro(btnEliminar.dataset.id);
            if (!ok) {
                mostrarMensajeRegistro("Este registro ya no puede eliminarse.", true);
            }
            await renderCalendar();
            await renderPanelDia();
            await actualizarAvisoLimiteDiario();
        }
    }
}

/* ====================================================================
   12. INFORMACIÓN EMOCIONAL — ventana emergente "Conoce tus emociones"
   ==================================================================== */

const EMOTION_INFO = {
    alegria: {
        sensacion: "Es una sensación de bienestar y ligereza; el cuerpo se siente con energía y con ganas de sonreír o moverte.",
        identificacion: "Sueles identificarla porque te sientes optimista, con ganas de compartir lo que vives y de ver el lado positivo de las cosas.",
        matices: {
            Euforia: "Una alegría muy intensa y explosiva, como cuando algo te emociona muchísimo de golpe.",
            Entusiasmo: "Ganas fuertes de hacer o participar en algo porque te ilusiona.",
            Jovialidad: "Un buen humor ligero y espontáneo que te hace sentir relajado/a y sociable.",
            Regocijo: "Una alegría profunda que sientes al celebrar algo que te importa.",
            Gratitud: "La sensación cálida de valorar y agradecer algo o a alguien.",
            Serenidad: "Una alegría tranquila, sin sobresaltos, como una calma agradable."
        }
    },
    amor: {
        sensacion: "Se siente como una calidez en el pecho, una sensación de cercanía, cuidado y conexión con alguien o algo.",
        identificacion: "Lo notas cuando te preocupas genuinamente por el bienestar de otra persona o sientes ganas de estar cerca de ella.",
        matices: {
            Afecto: "Un cariño suave que sientes hacia alguien importante para ti.",
            Ternura: "Una sensación delicada de querer cuidar o proteger a alguien.",
            Cercanía: "La sensación de sentirte unido/a y en confianza con otra persona.",
            Devoción: "Un compromiso profundo y constante de cariño hacia alguien o algo.",
            Compasión: "El deseo de aliviar el sufrimiento de alguien porque te importa.",
            Éxtasis: "Un amor tan intenso que se siente casi desbordante."
        }
    },
    sorpresa: {
        sensacion: "Es una reacción breve e intensa ante algo que no esperabas; el cuerpo se activa de golpe.",
        identificacion: "La reconoces porque tu atención se concentra por completo en lo que acaba de pasar, casi sin pensarlo.",
        matices: {
            Asombro: "Una sorpresa acompañada de admiración por algo impresionante.",
            Curiosidad: "Ganas de saber más sobre algo que te llamó la atención de repente.",
            Maravilla: "Sorpresa mezclada con fascinación ante algo hermoso o extraordinario.",
            Estupor: "Una sorpresa tan fuerte que te deja momentáneamente sin reacción.",
            Desconcierto: "Sorpresa mezclada con confusión, cuando algo no encaja con lo que esperabas.",
            Pasmo: "Una sorpresa que te deja inmóvil por un instante."
        }
    },
    ansiedad: {
        sensacion: "Se siente como un estado de alerta constante, con tensión en el cuerpo y pensamientos acelerados sobre lo que podría pasar.",
        identificacion: "La identificas cuando anticipas problemas antes de que sucedan y te cuesta relajarte aunque no haya un peligro real inmediato.",
        matices: {
            Inquietud: "Una sensación de intranquilidad que no te deja estar del todo en calma.",
            Aprehensión: "El presentimiento de que algo malo podría pasar.",
            Nerviosismo: "Agitación física y mental antes de una situación que te importa.",
            Hipervigilancia: "Estar muy atento/a a cualquier señal de que algo pueda salir mal.",
            Zozobra: "Una sensación de inseguridad e inestabilidad frente a lo que viene.",
            Desasosiego: "Un malestar difuso que te impide sentirte tranquilo/a."
        }
    },
    estres: {
        sensacion: "Se siente como una sobrecarga física y mental, como si tuvieras más encima de lo que puedes manejar en ese momento.",
        identificacion: "Lo notas cuando te sientes agotado/a, con la mente saturada y con dificultad para concentrarte en una sola cosa.",
        matices: {
            Tensión: "Rigidez física o mental que aparece cuando sientes presión.",
            Agotamiento: "Sensación de cansancio profundo, físico o mental.",
            Sobrecarga: "La sensación de tener más responsabilidades de las que puedes manejar.",
            Frustración: "Malestar que aparece cuando algo no sale como esperabas a pesar de tu esfuerzo.",
            Irritabilidad: "Facilidad para molestarte por cosas pequeñas cuando estás bajo presión.",
            Desgaste: "Cansancio acumulado por mantener un esfuerzo sostenido durante mucho tiempo."
        }
    },
    miedo: {
        sensacion: "Es una reacción de alerta ante un peligro percibido, real o imaginado; el cuerpo se prepara para protegerte.",
        identificacion: "Lo identificas por la sensación de amenaza inminente y las ganas de escapar, evitar o protegerte de algo.",
        matices: {
            Temor: "Una preocupación centrada en algo específico que percibes como amenazante.",
            Inseguridad: "La sensación de no sentirte capaz o protegido/a ante una situación.",
            Pavor: "Un miedo muy intenso frente a algo que percibes como muy peligroso.",
            Pánico: "Un miedo repentino y abrumador que puede dificultar pensar con claridad.",
            Terror: "Un miedo extremo frente a una amenaza que sientes muy real.",
            "Aprensión defensiva": "Una alerta constante que te lleva a protegerte por si acaso."
        }
    },
    tristeza: {
        sensacion: "Se siente como un peso o vacío interno, con menos energía y ganas de estar solo/a o en silencio.",
        identificacion: "La reconoces cuando sientes desánimo, ganas de llorar o de aislarte, generalmente relacionado con una pérdida o decepción.",
        matices: {
            Melancolía: "Una tristeza suave y tranquila, a veces acompañada de nostalgia.",
            Soledad: "La sensación de sentirte desconectado/a de los demás.",
            Pena: "Un dolor emocional por algo que te afectó o lastimó.",
            Desconsuelo: "Una tristeza profunda difícil de calmar.",
            Nostalgia: "Tristeza suave al recordar algo o a alguien que ya no está presente.",
            Desaliento: "La sensación de perder las ganas o la motivación para seguir intentando algo."
        }
    },
    enojo: {
        sensacion: "Se siente como una activación intensa, con tensión física y ganas de reaccionar frente a algo que percibes como injusto.",
        identificacion: "Lo identificas cuando sientes que se ha cruzado un límite importante para ti o que algo no está bien.",
        matices: {
            Fastidio: "Una molestia leve ante algo que te incomoda.",
            Indignación: "Enojo que surge al percibir una injusticia.",
            Ira: "Un enojo intenso y de fuerte activación física.",
            Hostilidad: "Una actitud de rechazo o confrontación hacia algo o alguien.",
            Resentimiento: "Un enojo que permanece en el tiempo por algo que sentiste injusto.",
            Cólera: "Un enojo muy intenso, casi incontrolable en el momento."
        }
    }
};

let modalEmocionActual = "alegria";

function abrirModalEmociones() {
    renderModalTabs(modalEmocionActual);
    renderModalContenido(modalEmocionActual);
    document.getElementById("modal-emociones").showModal();
}

function renderModalTabs(activa) {
    const contenedor = document.getElementById("modal-emociones-tabs");
    contenedor.innerHTML = EMOTION_ORDER.map(key => {
        const emocion = EMOTIONS[key];
        const seleccionada = key === activa;
        return `
            <button type="button" class="modal-tab${seleccionada ? " activa" : ""}"
                data-emocion-modal="${key}"
                style="--color-emocion:${emocion.color}"
                role="tab" aria-selected="${seleccionada}">
                <span class="punto-color" aria-hidden="true"></span>${emocion.name}
            </button>
        `;
    }).join("");
}

function renderModalContenido(key) {
    const emocion = EMOTIONS[key];
    const info = EMOTION_INFO[key];
    const contenedor = document.getElementById("modal-emociones-contenido");
    contenedor.innerHTML = `
        <div class="modal-emocion-cabecera" style="--color-emocion:${emocion.color}">
            <span class="punto-color punto-color--grande" aria-hidden="true"></span>
            <h3>${emocion.name}</h3>
        </div>
        <p><strong>¿Cómo se siente?</strong><br>${info.sensacion}</p>
        <p><strong>¿Cómo identificarla?</strong><br>${info.identificacion}</p>
        <h4>Matices de ${emocion.name.toLowerCase()}</h4>
        <ul class="modal-matices-lista">
            ${emocion.nuances.map(nombre => `<li><strong>${nombre}</strong>${info.matices[nombre]}</li>`).join("")}
        </ul>
    `;
}

/* ====================================================================
   13. INICIALIZACIÓN
   ==================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    // Guarda de autenticación: esta página es privada. Si no hay
    // sesión activa, exigirSesion() (assets/js/auth.js) redirige a
    // cuenta.html y detenemos la inicialización.
    const sesion = await exigirSesion();
    if (!sesion) return;

    renderListaEmociones();
    renderContenedorMatices();
    await inicializarCalendario();
    await actualizarAvisoLimiteDiario();

    document.getElementById("lista-emociones").addEventListener("click", (e) => {
        const boton = e.target.closest("[data-emocion]");
        if (!boton || boton.disabled) return;
        toggleEmocion(boton.dataset.emocion);
    });

    document.getElementById("contenedor-matices").addEventListener("click", (e) => {
        const boton = e.target.closest(".matiz-boton");
        if (!boton || boton.disabled) return;
        toggleMatiz(boton.dataset.emocion, boton.dataset.matiz);
    });

    document.getElementById("btn-guardar-registro").addEventListener("click", manejarGuardarRegistro);
    document.getElementById("btn-no-se").addEventListener("click", iniciarExplorador);
    document.getElementById("btn-cancelar-edicion").addEventListener("click", cancelarEdicion);

    document.getElementById("mes-anterior").addEventListener("click", () => cambiarMes(-1));
    document.getElementById("mes-siguiente").addEventListener("click", () => cambiarMes(1));

    document.getElementById("calendario-grid").addEventListener("click", async (e) => {
        const boton = e.target.closest("[data-fecha]");
        if (!boton) return;
        calendarioEstado.fechaSeleccionada = boton.dataset.fecha;
        mostrarCompletosDia = false;
        await renderCalendar();
        await renderPanelDia();
    });

    document.getElementById("panel-dia").addEventListener("click", manejarClicPanelDia);
    document.getElementById("explorador-contenido").addEventListener("click", manejarClicExplorador);

    const modalEmociones = document.getElementById("modal-emociones");

    document.getElementById("btn-abrir-info-emociones").addEventListener("click", abrirModalEmociones);
    document.getElementById("btn-cerrar-modal-emociones").addEventListener("click", () => modalEmociones.close());

    modalEmociones.addEventListener("click", (e) => {
        if (e.target === modalEmociones) {
            modalEmociones.close();
        }
    });

    document.getElementById("modal-emociones-tabs").addEventListener("click", (e) => {
        const tab = e.target.closest("[data-emocion-modal]");
        if (!tab) return;
        modalEmocionActual = tab.dataset.emocionModal;
        renderModalTabs(modalEmocionActual);
        renderModalContenido(modalEmocionActual);
    });

    const btnHero = document.getElementById("btn-hero-registrar");
    if (btnHero) {
        btnHero.addEventListener("click", () => {
            document.getElementById("registro-emocional").scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }
});