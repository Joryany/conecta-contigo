/* ====================================================================
   PERSONALIZACIÓN DEL CALENDARIO — Conecta Contigo
   ==================================================================== */


const TEMAS = [
    { id: "rosa-pastel", nombre: "Rosa pastel", iconoTitulo: "🌷", texto: "oscuro", colorFondo1: "#FFD9E8", colorFondo2: "#FFB6D1" },
    { id: "jardin-botanico", nombre: "Jardín botánico", iconoTitulo: "🌿", texto: "oscuro", colorFondo1: "#CDEBC3", colorFondo2: "#8FD694" },
    { id: "noche-estrellada", nombre: "Noche estrellada", iconoTitulo: "✨", texto: "oscuro", colorFondo1: "#1B2A4A", colorFondo2: "#3E4A78" },
    { id: "coral-romantico", nombre: "Coral romántico", iconoTitulo: "💗", texto: "oscuro", colorFondo1: "#FFD3C7", colorFondo2: "#FF8C7A" },
    { id: "oceano", nombre: "Océano", iconoTitulo: "🌊", texto: "oscuro", colorFondo1: "#BFE3F0", colorFondo2: "#3E8FB0" },
    { id: "atardecer", nombre: "Atardecer", iconoTitulo: "🌅", texto: "oscuro", colorFondo1: "#FFD79A", colorFondo2: "#FF8A5B" },
    { id: "lavanda", nombre: "Lavanda", iconoTitulo: "💜", texto: "oscuro", colorFondo1: "#E4D4F4", colorFondo2: "#B98CE0" },
    { id: "montanas", nombre: "Montañas", iconoTitulo: "⛰️", texto: "oscuro", colorFondo1: "#4A5A72", colorFondo2: "#7C93AC" },
    { id: "flores", nombre: "Flores", iconoTitulo: "🌸", texto: "oscuro", colorFondo1: "#FFDCEB", colorFondo2: "#FF9FC0" },
    { id: "galaxia", nombre: "Galaxia", iconoTitulo: "🌌", texto: "oscuro", colorFondo1: "#241B4E", colorFondo2: "#4B3B8C" },
    { id: "hojas-simple", nombre: "Hojas simple", iconoTitulo: "🍃", texto: "oscuro", colorFondo1: "#DCEFD2", colorFondo2: "#A8D48E" },
    { id: "cielo", nombre: "Cielo", iconoTitulo: "☁️", texto: "oscuro", colorFondo1: "#DCEEFB", colorFondo2: "#A9D2F0" },
    { id: "dorado", nombre: "Dorado", iconoTitulo: "✨", texto: "oscuro", colorFondo1: "#FCEBB6", colorFondo2: "#E8C26A" },
    { id: "paisaje-violeta", nombre: "Paisaje violeta", iconoTitulo: "🔮", texto: "oscuro", colorFondo1: "#3A2A5C", colorFondo2: "#6A4C93" },
    { id: "manchas-pastel", nombre: "Manchas pastel", iconoTitulo: "🎨", texto: "oscuro", colorFondo1: "#F6DCEA", colorFondo2: "#D7C4EE" },
    { id: "acuarela-azul", nombre: "Acuarela azul", iconoTitulo: "🖌️", texto: "oscuro", colorFondo1: "#BEE0EE", colorFondo2: "#5FA8C9" },
    { id: "olas", nombre: "Olas", iconoTitulo: "🌊", texto: "oscuro", colorFondo1: "#B8E0E6", colorFondo2: "#4396A6" },
    { id: "gatos", nombre: "Gatos", iconoTitulo: "🐱", texto: "oscuro", colorFondo1: "#F5E6CC", colorFondo2: "#E3B77D" },
    { id: "gato", nombre: "Gato Sentado", iconoTitulo: "🍕", texto: "oscuro", colorFondo1: "#cce5f5", colorFondo2: "#7dc3e3" }
];

// La ruta se calcula sola a partir del id (así no hay que repetirla a
// mano en las 18 entradas ni arriesgarse a un typo).
function rutaImagenTema(id) {
    return new URL(`assets/img/emocional/${id}.png`, document.baseURI).href;
}

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

// Formas del día. Las primeras 8 son las originales (con la flor ya
// corregida a nivel visual en CSS, ver personalizacion.css).
// Las 3 últimas son nuevas ("Más formas").
const FORMAS_DIA = [
    { id: "circulo", nombre: "Círculo" },
    { id: "corazon", nombre: "Corazón" },
    { id: "estrella", nombre: "Estrella" },
    { id: "nube", nombre: "Nube" },
    { id: "rombo", nombre: "Rombo" },
    { id: "flor", nombre: "Flor" },
    { id: "hexagono", nombre: "Hexágono" },
    { id: "cuadrado", nombre: "Cuadrado redondeado" },
    { id: "sol", nombre: "Sol" },
    { id: "triangulo", nombre: "Triángulo" },
    { id: "cuadrado_recto", nombre: "Cuadrado" }
];

// Forma del número: ahora soporta el mismo repertorio que la forma del
// día (incluidas nube y flor, que antes solo existían para el día), más
// "pastilla" y "ninguno" que son exclusivas del número.
const FORMAS_NUMERO = [
    { id: "circulo", nombre: "Círculo" },
    { id: "pastilla", nombre: "Pastilla" },
    { id: "estrella", nombre: "Estrella" },
    { id: "corazon", nombre: "Corazón" },
    { id: "cuadrado", nombre: "Cuadrado redondeado" },
    { id: "rombo", nombre: "Rombo" },
    { id: "hexagono", nombre: "Hexágono" },
    { id: "nube", nombre: "Nube" },
    { id: "flor", nombre: "Flor" },
    { id: "sol", nombre: "Sol" },
    { id: "triangulo", nombre: "Triángulo" },
    { id: "cuadrado_recto", nombre: "Cuadrado" },
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
    pastilla: "▭", ninguno: "—", sol: "☀", triangulo: "▲",
    cuadrado_recto: "■"
};

// Íconos disponibles para el BOTÓN que abre el modal de personalización
// (el que vive en la esquina superior derecha de la tarjeta del
// calendario). Es independiente del emoji del título de cada tema: la
// persona puede elegir el que mejor combine con su fondo, ya que ese
// botón ya no lleva ningún círculo de color detrás (ver
// .btn-personalizar-icono en personalizacion.css), solo el símbolo con
// una sombra para que se lea sobre cualquier imagen o color.
const ICONOS_BOTON = [
    { id: "paleta", emoji: "🎨", nombre: "Paleta" },
    { id: "engranaje", emoji: "⚙️", nombre: "Engranaje" },
    { id: "rayas", emoji: "☰", nombre: "Tres rayas" },
    { id: "puntos", emoji: "⋮", nombre: "Puntos" },
    { id: "pincel", emoji: "🖌️", nombre: "Pincel" },
    { id: "estrella", emoji: "✨", nombre: "Estrella" }
];

let personalizacionActual = {
    tema: "rosa-pastel",
    paleta: "original",
    colores_personalizados: null,
    forma_dia: "circulo",
    forma_numero: "circulo",
    sincronizar_formas: true,
    fuente: "Poppins",
    estilo_borde: "redondeado",
    modo_minimalista: false,
    sombras: true,
    decoraciones: true,
    animaciones: true,
    // ── Ícono del botón que abre este mismo panel ────────────────────
    icono_boton: "paleta",
    // ── Degradado rápido ─────────────────────────────────────────────
    // Atajo simple: 2 colores elegidos por la persona, sin tener que
    // entrar a todos los controles del "Fondo / Tema avanzado". Estos
    // 2 colores son SIEMPRE el degradado de respaldo detrás de la foto
    // del tema (mientras esta cargue o si aún no existe), y además,
    // cuando "activo" es true, reemplazan por completo la foto del
    // tema. Ver aplicarImagenTema() más abajo.
    degradado_rapido: {
        activo: false,
        color1: "#FFD1DC",
        color2: "#B983FF"
    },
    // ── Fondo / Tema avanzado ───────────────────────────────────────
    // Cuando "activo" es true, este bloque REEMPLAZA por completo el
    // fondo del tema elegido en "Fondo / Tema" (incluido el degradado
    // rápido de arriba) por uno construido a partir de capas (textura +
    // patrón + brillo + degradado propio).
    avanzado: {
        activo: false,
        textura: "gradiente",        // papel | gradiente | nebulosa | seda
        opacidad_textura: 55,        // 0-100
        densidad_patron: 50,         // 0-100 (más alto = patrón más tupido)
        opacidad_capa: 80,           // 0-100, opacidad general de la capa de efectos
        iluminacion: "suave",        // cenital | suave | difusa
        efectos: { nubes: true, estrellas: false, brillo: true },
        difusion_color: 50,          // 0-100, qué tan difuminado se ve el brillo
        color_base: "#8FD694",
        color_secundario: "#FDF6EA",
        mezcla: 55                   // 0-100, punto donde se mezclan los 2 colores
    }
};

/* ====================================================================
   CARGAR / GUARDAR (Supabase)
   ==================================================================== */

// NOTA IMPORTANTE: se agregaron columnas nuevas al objeto que se
// guarda (sincronizar_formas, modo_minimalista, avanzado,
// degradado_rapido, icono_boton). Es necesario añadir esas columnas a
// la tabla "personalizacion_calendario" en Supabase:
//   sincronizar_formas   boolean
//   modo_minimalista     boolean
//   avanzado             jsonb
//   degradado_rapido     jsonb
//   icono_boton          text
// para que guardarPersonalizacion() no falle al hacer upsert.
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
            sincronizar_formas: data.sincronizar_formas ?? true,
            fuente: data.fuente,
            estilo_borde: data.estilo_borde,
            modo_minimalista: data.modo_minimalista ?? false,
            sombras: data.sombras,
            decoraciones: data.decoraciones,
            animaciones: data.animaciones,
            icono_boton: data.icono_boton || "paleta",
            degradado_rapido: data.degradado_rapido || personalizacionActual.degradado_rapido,
            avanzado: data.avanzado || personalizacionActual.avanzado
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
            sincronizar_formas: personalizacionActual.sincronizar_formas,
            fuente: personalizacionActual.fuente,
            estilo_borde: personalizacionActual.estilo_borde,
            modo_minimalista: personalizacionActual.modo_minimalista,
            sombras: personalizacionActual.sombras,
            decoraciones: personalizacionActual.decoraciones,
            animaciones: personalizacionActual.animaciones,
            icono_boton: personalizacionActual.icono_boton,
            degradado_rapido: personalizacionActual.degradado_rapido,
            avanzado: personalizacionActual.avanzado,
            updated_at: new Date().toISOString()
        });

    return !error;
}

/* ====================================================================
   APLICAR VISUALMENTE
   ==================================================================== */

// Cambia los colores de las 8 emociones y vuelve a pintar todo lo que
// depende de ese color (lista de emociones, matices, calendario, panel
// del día, la LEYENDA del calendario y el modal educativo si está
// abierto).
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

    // ── FIX bug "la leyenda no cambia de color" ─────────────────────
    // La leyenda (#calendario-leyenda) muestra un punto de color por
    // emoción. Si esos puntos se generan una sola vez y no se vuelven
    // a pintar cuando cambia la paleta, se quedan con el color viejo.
    // 1) Si emocional.js expone una función dedicada para redibujar
    //    la leyenda, la usamos (esto es lo ideal).
    // 2) Si no existe esa función, forzamos manualmente el color de
    //    cualquier elemento de la leyenda que identifique la emoción
    //    por data-emocion, por una clase "emocion-<clave>" o por su
    //    texto, cubriendo los patrones de marcado más comunes.
    if (typeof window.renderLeyenda === "function") {
        window.renderLeyenda();
    } else if (typeof window.renderCalendarioLeyenda === "function") {
        window.renderCalendarioLeyenda();
    } else {
        actualizarLeyendaManualmente();
    }

    if (typeof modalEmocionActual !== "undefined" && document.getElementById("modal-emociones-tabs")) {
        renderModalTabs(modalEmocionActual);
        renderModalContenido(modalEmocionActual);
    }
}

function actualizarLeyendaManualmente() {
    const leyenda = document.getElementById("calendario-leyenda");
    if (!leyenda) return;

    EMOTION_ORDER.forEach(key => {
        const color = EMOTIONS[key].color;
        const nombre = EMOTIONS[key].name;

        // Patrón A: el propio contenedor o un hijo trae data-emocion="clave"
        leyenda.querySelectorAll(`[data-emocion="${key}"]`).forEach(el => {
            el.style.setProperty("--color-emocion", color);
            el.style.backgroundColor = color;
        });

        // Patrón B: clase "emocion-<clave>" en el punto de color
        leyenda.querySelectorAll(`.emocion-${key}`).forEach(el => {
            el.style.setProperty("--color-emocion", color);
            el.style.backgroundColor = color;
        });

        // Patrón C: buscar el .leyenda-item cuyo texto empieza con el
        // nombre de la emoción, y colorear su primer hijo (el punto).
        leyenda.querySelectorAll(".leyenda-item").forEach(item => {
            if (item.textContent.trim().toLowerCase().startsWith(nombre.toLowerCase())) {
                const punto = item.querySelector("span, .punto-color") || item.firstElementChild;
                if (punto) {
                    punto.style.setProperty("--color-emocion", color);
                    punto.style.backgroundColor = color;
                }
            }
        });
    });
}

async function aplicarPersonalizacionVisual() {
    const calendario = document.getElementById("calendario-emocional");
    const registro = document.getElementById("registro-emocional");
    if (!calendario) return;

    // ── FIX bug #10 ──────────────────────────────────────────────────
    // #registro-emocional recibe el mismo bloque de atributos que el
    // calendario para que la personalización también se note ahí.
    const objetivosPersonalizacionGeneral = [calendario, registro].filter(Boolean);

    objetivosPersonalizacionGeneral.forEach(el => {
        el.dataset.tema = personalizacionActual.tema;
        el.dataset.borde = personalizacionActual.estilo_borde;
        el.style.setProperty("--fuente-calendario", `'${personalizacionActual.fuente}', sans-serif`);
        el.classList.toggle("sin-sombras", !personalizacionActual.sombras);
        el.classList.toggle("sin-animaciones", !personalizacionActual.animaciones);
        el.classList.toggle("modo-minimalista", personalizacionActual.modo_minimalista);
    });

    calendario.dataset.formaDia = personalizacionActual.forma_dia;
    calendario.dataset.formaNumero = personalizacionActual.forma_numero;

    const coloresPaleta = personalizacionActual.paleta === "personalizada"
        ? (personalizacionActual.colores_personalizados || PALETAS.original.colores)
        : PALETAS[personalizacionActual.paleta].colores;

    // IMPORTANTE: aplicarPaleta() dispara renderCalendar()/renderPanelDia(),
    // que redibujan el CONTENIDO de .calendario-card y .panel-dia. Si
    // ponemos el tema ANTES de esto, queda pisado por el redibujo. Por
    // eso se aplica la paleta primero...
    await aplicarPaleta(coloresPaleta);

    // ...y DESPUÉS se vuelve a consultar el elemento (por si fue
    // reconstruido) y recién ahí se pinta la imagen del tema (o el
    // degradado rápido) y el fondo avanzado, para que sobrevivan al
    // redibujo del calendario.
    reaplicarTemaSobreCalendario();

    // El ícono del botón que abre este panel no depende del tema, así
    // que se aplica aparte y no necesita esperar al redibujo.
    aplicarIconoBotonPersonalizar();
}

// Vuelve a pintar la imagen del tema (o el degradado que corresponda) y
// el fondo avanzado sobre los elementos ACTUALES de .calendario-card /
// .panel-dia / registro (los vuelve a buscar en el DOM en vez de
// reutilizar una referencia vieja, por si fueron reconstruidos). No
// toca la paleta de colores de las emociones.
function reaplicarTemaSobreCalendario() {
    const calendario = document.getElementById("calendario-emocional");
    const registro = document.getElementById("registro-emocional");
    if (!calendario) return;

    const tarjetaCalendario = calendario.querySelector(".calendario-card");
    const panelDia = calendario.querySelector(".panel-dia");
    const tema = TEMAS.find(t => t.id === personalizacionActual.tema) || TEMAS[0];

    aplicarImagenTema(tarjetaCalendario, tema);
    aplicarImagenTema(panelDia, tema);
    aplicarImagenTema(registro, tema);

    // El emoji del tema decora SOLO el título (no se esparcen íconos
    // por el resto de la tarjeta). No se muestra si el degradado
    // rápido o el modo avanzado están activos, porque en ese caso ya
    // no hay "tema" con foto, sino un fondo armado por la persona.
    const usaFondoPersonalizado = personalizacionActual.avanzado.activo ||
        (personalizacionActual.degradado_rapido && personalizacionActual.degradado_rapido.activo);
    aplicarIconoTitulo(calendario.querySelector("#titulo-calendario"), tema, usaFondoPersonalizado);
    aplicarIconoTitulo(registro.querySelector("#titulo-registro"), tema, usaFondoPersonalizado);

    // Contraste de texto: si el degradado rápido está activo, se
    // calcula a partir de sus 2 colores; si no, cada tema trae su
    // propio "texto" (claro/oscuro) definido a mano en TEMAS, porque no
    // hay forma confiable de calcularlo automáticamente sobre una foto
    // real.
    const rapido = personalizacionActual.degradado_rapido;
    const textoClaro = (rapido && rapido.activo)
        ? necesitaTextoClaroColores(rapido.color1, rapido.color2)
        : tema.texto === "claro";

    [calendario, registro].forEach(el => {
        el.classList.toggle("tema-texto-claro", textoClaro);
        el.classList.toggle("tema-texto-oscuro", !textoClaro);
    });

    [tarjetaCalendario, panelDia, registro].forEach(aplicarFondoAvanzado);
    calendario.classList.toggle("avanzado-activo", personalizacionActual.avanzado.activo);
    calendario.classList.toggle("avanzado-texto-claro", personalizacionActual.avanzado.activo && necesitaTextoClaro(personalizacionActual.avanzado));

    // El ícono del botón sobrevive a este redibujo también (por
    // ejemplo, al cambiar de mes el calendario se reconstruye).
    aplicarIconoBotonPersonalizar();
}

// El botón de mes anterior/siguiente vive en emocional.js y redibuja
// el calendario por su cuenta, sin pasar por personalizacion.js. Este
// observador detecta ese redibujo (cambios dentro de la cuadrícula o
// del panel del día) y vuelve a aplicar el tema automáticamente, para
// que no se pierda al cambiar de mes o de día.
function observarRedibujoCalendario() {
    const grid = document.getElementById("calendario-grid");
    const panelDia = document.getElementById("panel-dia");
    if (!grid && !panelDia) return;

    const observador = new MutationObserver(() => reaplicarTemaSobreCalendario());
    if (grid) observador.observe(grid, { childList: true });
    if (panelDia) observador.observe(panelDia, { childList: true });
}

/* ====================================================================
   IMAGEN / DEGRADADO DE FONDO POR TEMA + EMOJI DEL TÍTULO
   ==================================================================== */

// Decide qué va en el fondo del tema, en orden de prioridad:
//   1) Modo avanzado activo → no pinta nada aquí (aplicarFondoAvanzado
//      se encarga de todo el fondo por capas).
//   2) Degradado rápido activo → un degradado simple con los 2 colores
//      que la persona eligió, sin foto de tema.
//   3) Tema normal → la foto real del tema (si existe el archivo y
//      carga bien) con un degradado de RESPALDO detrás, visible
//      mientras la foto no esté subida o mientras carga.
//
// FIX pedido: el degradado de respaldo YA NO usa los colores fijos de
// cada tema (tema.colorFondo1/colorFondo2). Ahora siempre usa los 2
// colores que la persona eligió en "Usar un degradado de colores en
// vez del tema" (personalizacionActual.degradado_rapido.color1/color2),
// tanto si ese interruptor está activo (reemplaza la foto) como si
// está apagado (queda solo de respaldo detrás de la foto). Así el
// degradado es siempre un gusto de la persona, nunca algo fijo por
// tema.
function aplicarImagenTema(el, tema) {
    if (!el || !tema) return;

    if (personalizacionActual.avanzado.activo) {
        el.style.setProperty("--tema-imagen", "none");
        el.style.setProperty("--tema-fondo-respaldo", "none");
        return;
    }

    const rapido = personalizacionActual.degradado_rapido;
    const gradienteElegido = `linear-gradient(160deg, ${rapido.color1}, ${rapido.color2})`;

    if (rapido && rapido.activo) {
        // El degradado reemplaza por completo la foto del tema.
        el.style.setProperty("--tema-imagen", "none");
        el.style.setProperty("--tema-fondo-respaldo", gradienteElegido);
        return;
    }

    // La foto del tema al frente, y el degradado ELEGIDO POR LA
    // PERSONA como respaldo (nunca los colores fijos del tema).
    el.style.setProperty("--tema-imagen", `url("${rutaImagenTema(tema.id)}")`);
    el.style.setProperty("--tema-fondo-respaldo", gradienteElegido);
}

// Coloca el emoji del tema a los lados del título (por ejemplo
// "🌊 Tu calendario emocional 🌊"), y NADA MÁS: ya no se esparcen
// íconos por el resto de la tarjeta. El interruptor "Iconos
// decorativos" del panel controla si este emoji se muestra o no; si la
// persona está usando un fondo personalizado (degradado rápido o modo
// avanzado) tampoco se muestra, porque ya no hay "tema" al que asociar
// el emoji.
function aplicarIconoTitulo(h2, tema, usaFondoPersonalizado) {
    if (!h2) return;
    const mostrar = personalizacionActual.decoraciones && tema.iconoTitulo && !usaFondoPersonalizado;
    h2.style.setProperty("--tema-icono", mostrar ? `"${tema.iconoTitulo}"` : "none");
}

// Pinta el símbolo elegido (paleta, engranaje, tres rayas, etc.) en el
// botón que abre este mismo modal de personalización. Es
// independiente del tema y del emoji del título: la idea es que la
// persona pueda elegir el que mejor se lea sobre su fondo, ya que ese
// botón ya no lleva ningún círculo de color detrás.
function aplicarIconoBotonPersonalizar() {
    const btn = document.getElementById("btn-abrir-personalizacion");
    if (!btn) return;
    const icono = ICONOS_BOTON.find(i => i.id === personalizacionActual.icono_boton) || ICONOS_BOTON[0];
    btn.textContent = icono.emoji;
}


/* ====================================================================
   FONDO / TEMA AVANZADO
   ==================================================================== */

// Luminancia relativa (0 = negro, 1 = blanco) según WCAG, para decidir
// automáticamente si el texto debe ser claro u oscuro sobre un fondo
// que arme la persona (degradado rápido o modo avanzado).
function luminanciaRelativa(hex) {
    const limpio = (hex || "#ffffff").replace("#", "");
    const r = parseInt(limpio.substring(0, 2), 16) / 255;
    const g = parseInt(limpio.substring(2, 4), 16) / 255;
    const b = parseInt(limpio.substring(4, 6), 16) / 255;
    const canal = v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function necesitaTextoClaro(av) {
    const promedio = (luminanciaRelativa(av.color_base) + luminanciaRelativa(av.color_secundario)) / 2;
    return promedio < 0.45;
}

// Misma idea que necesitaTextoClaro(), pero para 2 colores sueltos (se
// usa con el degradado rápido, que no tiene el resto del objeto "av").
function necesitaTextoClaroColores(color1, color2) {
    const promedio = (luminanciaRelativa(color1) + luminanciaRelativa(color2)) / 2;
    return promedio < 0.45;
}

// Calcula las variables CSS a partir del estado "avanzado" y las
// escribe como custom properties + atributos/clases sobre un elemento
// (tarjeta del calendario, panel del día o cuadro de registro).
function aplicarFondoAvanzado(el) {
    if (!el) return;
    const av = personalizacionActual.avanzado;

    el.classList.toggle("fondo-avanzado", !!av.activo);
    if (!av.activo) return;

    // El modo avanzado reemplaza por completo el fondo: si el tema
    // elegido (o el degradado rápido) tenía su propia capa, se oculta
    // mientras esté activo (esto ya lo hace aplicarImagenTema, pero se
    // refuerza aquí por si este método se llama en otro orden).
    el.style.setProperty("--tema-imagen", "none");
    el.style.setProperty("--tema-fondo-respaldo", "none");

    el.dataset.textura = av.textura;
    el.dataset.iluminacion = av.iluminacion;

    const tamanoPatron = Math.round(160 - (av.densidad_patron * 1.1)); // 50-160px aprox.

    el.style.setProperty("--av-color-base", av.color_base);
    el.style.setProperty("--av-color-secundario", av.color_secundario);
    el.style.setProperty("--av-mezcla", `${av.mezcla}%`);
    el.style.setProperty("--av-opacidad-textura", (av.opacidad_textura / 100).toFixed(2));
    el.style.setProperty("--av-opacidad-capa", (av.opacidad_capa / 100).toFixed(2));
    el.style.setProperty("--av-patron-size", `${tamanoPatron}px`);
    el.style.setProperty("--av-difusion", `${40 + av.difusion_color * 0.4}%`);
    // Nubes/estrellas ahora son siluetas reales (SVG), no círculos
    // borrosos: se activan/desactivan intercambiando la imagen por
    // "none" en vez de variar una opacidad sobre una forma redonda.
    el.style.setProperty("--av-nubes-img", av.efectos.nubes
        ? `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 60'><path d='M22 50c-10 0-18-7-18-16 0-7 5-13 12-15 1-11 10-19 21-19 9 0 17 5 20 14 9 1 15 8 15 16 0 9-8 16-17 16H22z' fill='white' fill-opacity='0.5'/></svg>")`
        : "none");
    el.style.setProperty("--av-estrellas-img", av.efectos.estrellas
        ? `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><path d='M20 2 L24 16 L38 16 L27 25 L31 39 L20 30 L9 39 L13 25 L2 16 L16 16 Z' fill='white' fill-opacity='0.65'/></svg>")`
        : "none");
    el.style.setProperty("--av-brillo-opacidad", av.efectos.brillo ? "0.55" : "0");

    const claro = necesitaTextoClaro(av);
    el.classList.toggle("fondo-avanzado--texto-claro", claro);
    el.classList.toggle("fondo-avanzado--texto-oscuro", !claro);
}

// Actualiza la miniatura de previsualización del modal en vivo,
// mientras la persona mueve los controles (antes de pulsar "Aplicar").
function actualizarPreviewAvanzado() {
    const preview = document.getElementById("personalizacion-avanzado-preview");
    if (!preview) return;
    preview.classList.add("fondo-avanzado");
    aplicarFondoAvanzado(preview);
}

/* ====================================================================
   CONSTRUIR EL PANEL DE CONTROLES
   ==================================================================== */

// Bloquea visualmente el selector de "Fondo / Tema" (18 temas) cuando
// la persona está usando el degradado rápido o el modo avanzado, ya
// que en esos casos elegir un tema no tendría efecto hasta desactivar
// esa opción.
function actualizarBloqueoSelectorTemas() {
    const contTemas = document.getElementById("personalizacion-temas");
    if (!contTemas) return;
    const bloqueado = personalizacionActual.avanzado.activo ||
        (personalizacionActual.degradado_rapido && personalizacionActual.degradado_rapido.activo);
    contTemas.parentElement.classList.toggle("personalizacion-opciones--bloqueada", bloqueado);
}

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

        // Si la forma del día cambia y "sincronizar formas" está activo,
        // la forma del número se actualiza para que coincida (incluye
        // el fondo del número, no solo el color).
        if (campo === "forma_dia" && personalizacionActual.sincronizar_formas) {
            sincronizarFormaNumeroConDia(btn.dataset.valor);
        }

        // El ícono del botón se ve al instante en el propio botón real,
        // sin esperar a "Aplicar cambios" — así la persona compara
        // directamente sobre su fondo actual.
        if (campo === "icono_boton") {
            aplicarIconoBotonPersonalizar();
        }
    });
}

// Aplica visualmente la misma forma elegida para el día también al
// contenedor del número, siempre que exista esa forma en la lista de
// formas de número (todas las formas "orgánicas" como nube y flor ya
// están soportadas también para el número).
function sincronizarFormaNumeroConDia(valorForma) {
    const disponibleParaNumero = FORMAS_NUMERO.some(f => f.id === valorForma);
    const valorFinal = disponibleParaNumero ? valorForma : "circulo";

    personalizacionActual.forma_numero = valorFinal;

    const contNumero = document.getElementById("personalizacion-formas-numero");
    if (contNumero) {
        contNumero.querySelectorAll(".personalizacion-opcion").forEach(b => {
            b.classList.toggle("seleccionada", b.dataset.valor === valorFinal);
        });
    }
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

// Conecta el checkbox + los 2 selectores de color del atajo de
// "degradado rápido" con personalizacionActual.degradado_rapido. Se
// apaga automáticamente el modo avanzado si estaba activo (y
// viceversa, ver inicializarControlesAvanzados), para que no compitan
// por el mismo fondo.
function inicializarControlDegradadoRapido() {
    const chk = document.getElementById("personalizacion-degradado-activo");
    const bloqueColores = document.getElementById("personalizacion-degradado-colores");
    const inputColor1 = document.getElementById("personalizacion-degradado-color1");
    const inputColor2 = document.getElementById("personalizacion-degradado-color2");

    if (!chk) return; // el HTML de este bloque no está presente

    const estado = personalizacionActual.degradado_rapido;

    chk.checked = estado.activo;
    bloqueColores.classList.toggle("oculto", !estado.activo);
    inputColor1.value = estado.color1;
    inputColor2.value = estado.color2;
    actualizarBloqueoSelectorTemas();

    chk.addEventListener("change", (e) => {
        estado.activo = e.target.checked;
        bloqueColores.classList.toggle("oculto", !estado.activo);

        if (estado.activo && personalizacionActual.avanzado.activo) {
            personalizacionActual.avanzado.activo = false;
            const chkAvanzado = document.getElementById("personalizacion-av-activo");
            const bloqueAvanzado = document.getElementById("personalizacion-av-controles");
            if (chkAvanzado) chkAvanzado.checked = false;
            if (bloqueAvanzado) bloqueAvanzado.classList.add("oculto");
        }
        actualizarBloqueoSelectorTemas();
    });

    inputColor1.addEventListener("input", () => { estado.color1 = inputColor1.value; });
    inputColor2.addEventListener("input", () => { estado.color2 = inputColor2.value; });
}

// Conecta todos los controles del panel "Fondo / Tema avanzado" con
// personalizacionActual.avanzado, y refresca la previsualización en
// vivo con cada cambio (sin necesidad de pulsar "Aplicar cambios").
function inicializarControlesAvanzados() {
    const av = personalizacionActual.avanzado;

    const chkActivo = document.getElementById("personalizacion-av-activo");
    const bloque = document.getElementById("personalizacion-av-controles");

    const selTextura = document.getElementById("personalizacion-av-textura");
    const rangoOpacidadTextura = document.getElementById("personalizacion-av-opacidad-textura");
    const rangoDensidadPatron = document.getElementById("personalizacion-av-densidad-patron");
    const rangoOpacidadCapa = document.getElementById("personalizacion-av-opacidad-capa");
    const radiosIluminacion = document.querySelectorAll("input[name='personalizacion-av-iluminacion']");
    const chkNubes = document.getElementById("personalizacion-av-efecto-nubes");
    const chkEstrellas = document.getElementById("personalizacion-av-efecto-estrellas");
    const chkBrillo = document.getElementById("personalizacion-av-efecto-brillo");
    const rangoDifusion = document.getElementById("personalizacion-av-difusion");
    const inputColorBase = document.getElementById("personalizacion-av-color-base");
    const inputColorSecundario = document.getElementById("personalizacion-av-color-secundario");
    const rangoMezcla = document.getElementById("personalizacion-av-mezcla");

    if (!chkActivo) return; // el HTML de este bloque no está presente

    const refrescar = () => actualizarPreviewAvanzado();

    chkActivo.checked = av.activo;
    if (bloque) bloque.classList.toggle("oculto", !av.activo);
    actualizarBloqueoSelectorTemas();
    chkActivo.addEventListener("change", (e) => {
        av.activo = e.target.checked;
        if (bloque) bloque.classList.toggle("oculto", !av.activo);

        // Si se activa el modo avanzado, se apaga el degradado rápido
        // para no competir por el mismo fondo.
        if (av.activo) {
            const chkDegradado = document.getElementById("personalizacion-degradado-activo");
            const bloqueDegradado = document.getElementById("personalizacion-degradado-colores");
            if (chkDegradado && chkDegradado.checked) {
                chkDegradado.checked = false;
                personalizacionActual.degradado_rapido.activo = false;
                if (bloqueDegradado) bloqueDegradado.classList.add("oculto");
            }
        }
        actualizarBloqueoSelectorTemas();
        refrescar();
    });

    if (selTextura) {
        selTextura.value = av.textura;
        selTextura.addEventListener("change", () => { av.textura = selTextura.value; refrescar(); });
    }
    if (rangoOpacidadTextura) {
        rangoOpacidadTextura.value = av.opacidad_textura;
        rangoOpacidadTextura.addEventListener("input", () => { av.opacidad_textura = Number(rangoOpacidadTextura.value); refrescar(); });
    }
    if (rangoDensidadPatron) {
        rangoDensidadPatron.value = av.densidad_patron;
        rangoDensidadPatron.addEventListener("input", () => { av.densidad_patron = Number(rangoDensidadPatron.value); refrescar(); });
    }
    if (rangoOpacidadCapa) {
        rangoOpacidadCapa.value = av.opacidad_capa;
        rangoOpacidadCapa.addEventListener("input", () => { av.opacidad_capa = Number(rangoOpacidadCapa.value); refrescar(); });
    }
    radiosIluminacion.forEach(r => {
        r.checked = r.value === av.iluminacion;
        r.addEventListener("change", () => { if (r.checked) { av.iluminacion = r.value; refrescar(); } });
    });
    if (chkNubes) {
        chkNubes.checked = av.efectos.nubes;
        chkNubes.addEventListener("change", () => { av.efectos.nubes = chkNubes.checked; refrescar(); });
    }
    if (chkEstrellas) {
        chkEstrellas.checked = av.efectos.estrellas;
        chkEstrellas.addEventListener("change", () => { av.efectos.estrellas = chkEstrellas.checked; refrescar(); });
    }
    if (chkBrillo) {
        chkBrillo.checked = av.efectos.brillo;
        chkBrillo.addEventListener("change", () => { av.efectos.brillo = chkBrillo.checked; refrescar(); });
    }
    if (rangoDifusion) {
        rangoDifusion.value = av.difusion_color;
        rangoDifusion.addEventListener("input", () => { av.difusion_color = Number(rangoDifusion.value); refrescar(); });
    }
    if (inputColorBase) {
        inputColorBase.value = av.color_base;
        inputColorBase.addEventListener("input", () => { av.color_base = inputColorBase.value; refrescar(); });
    }
    if (inputColorSecundario) {
        inputColorSecundario.value = av.color_secundario;
        inputColorSecundario.addEventListener("input", () => { av.color_secundario = inputColorSecundario.value; refrescar(); });
    }
    if (rangoMezcla) {
        rangoMezcla.value = av.mezcla;
        rangoMezcla.addEventListener("input", () => { av.mezcla = Number(rangoMezcla.value); refrescar(); });
    }

    refrescar();
}

function construirPanelPersonalizacion() {
    construirBotonesOpcion("personalizacion-temas", TEMAS, "tema", t => `
        <span class="personalizacion-swatch-imagen" style="background-image:url('${rutaImagenTema(t.id)}')"></span>
        <span>${t.nombre}</span>
    `);

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
    construirBotonesOpcion("personalizacion-icono-boton", ICONOS_BOTON, "icono_boton", i =>
        `<span class="personalizacion-simbolo">${i.emoji}</span><span>${i.nombre}</span>`
    );

    inicializarControlesAvanzados();
    inicializarControlDegradadoRapido();

    const selectFuente = document.getElementById("personalizacion-fuente");
    if (selectFuente) {
        // Cada opción del selector se muestra escrita en su propia
        // fuente, para poder comparar el estilo antes de elegir.
        selectFuente.innerHTML = FUENTES.map(f =>
            `<option value="${f}" style="font-family:'${f}', sans-serif" ${personalizacionActual.fuente === f ? "selected" : ""}>${f}</option>`
        ).join("");
        selectFuente.style.fontFamily = `'${personalizacionActual.fuente}', sans-serif`;
        selectFuente.addEventListener("change", () => {
            personalizacionActual.fuente = selectFuente.value;
            selectFuente.style.fontFamily = `'${selectFuente.value}', sans-serif`;
        });
    }

    const chkSombras = document.getElementById("personalizacion-sombras");
    const chkDecoraciones = document.getElementById("personalizacion-decoraciones");
    const chkAnimaciones = document.getElementById("personalizacion-animaciones");
    const chkSincronizar = document.getElementById("personalizacion-sincronizar-formas");
    const chkMinimalista = document.getElementById("personalizacion-minimalista");
    const contFormaNumero = document.getElementById("personalizacion-formas-numero");

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
    if (chkMinimalista) {
        chkMinimalista.checked = personalizacionActual.modo_minimalista;
        chkMinimalista.addEventListener("change", (e) => personalizacionActual.modo_minimalista = e.target.checked);
    }
    if (chkSincronizar) {
        chkSincronizar.checked = personalizacionActual.sincronizar_formas;
        if (contFormaNumero) contFormaNumero.classList.toggle("personalizacion-opciones--bloqueada", chkSincronizar.checked);
        chkSincronizar.addEventListener("change", (e) => {
            personalizacionActual.sincronizar_formas = e.target.checked;
            if (contFormaNumero) contFormaNumero.classList.toggle("personalizacion-opciones--bloqueada", e.target.checked);
            if (e.target.checked) sincronizarFormaNumeroConDia(personalizacionActual.forma_dia);
        });
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
   VENTANA EMERGENTE (MODAL)
   ==================================================================== */

function inicializarModalPersonalizacion() {
    const dialogo = document.getElementById("modal-personalizacion");
    const btnAbrir = document.getElementById("btn-abrir-personalizacion");
    const btnCerrar = document.getElementById("btn-cerrar-personalizacion");

    if (!dialogo || !btnAbrir) return;

    btnAbrir.addEventListener("click", () => {
        if (typeof dialogo.showModal === "function") {
            dialogo.showModal();
        } else {
            dialogo.setAttribute("open", "");
        }
    });

    if (btnCerrar) {
        btnCerrar.addEventListener("click", () => dialogo.close());
    }

    // Cerrar al hacer clic sobre el fondo (backdrop)
    dialogo.addEventListener("click", (e) => {
        if (e.target === dialogo) dialogo.close();
    });
}

/* ====================================================================
   INICIALIZACIÓN
   ==================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const panel = document.getElementById("personalizacion-temas");
    if (!panel) return; // esta página no tiene el panel de personalización

    await cargarPersonalizacion();
    construirPanelPersonalizacion();
    inicializarModalPersonalizacion();
    await aplicarPersonalizacionVisual();
    observarRedibujoCalendario();
});