/*==================================================
=              CONEXIÓN GOOGLE SHEETS               =
==================================================*/


const URL_SHEET_RESPUESTAS =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vSk2rN297uXJcKoa6JPoFSIzh2PAere1pPQRqUFGXCf1dxuU4EF1MO4WtX8BjR7L5EanuovtoEl-gdH/pub?single=true&output=csv';

// A partir de qué calificación (escala 1-5) contamos una respuesta como "positiva"
const ES_POSITIVO = 4;

/*==================================================
=      MAPA DE COLUMNAS DEL FORMULARIO ÚNICO       =
==================================================*/


const COL = {

    MARCA_TEMPORAL: 0,
    CONSENTIMIENTO: 1,
    CODIGO: 2,
    EDAD: 3,
    GENERO: 4,

    // Dimensiones iniciales (antes: formulario pretest, columnas 5-11)
    TRAUMA_PRE: 5,
    ANTISOCIAL_PRE: 6,
    RUTAS_PRE: 7,
    SALUD_PRE: 8,
    COMPRENSION_PRE: 9,
    SENALES_PRE: 10,
    AYUDA_PRE: 11,

    CONFIRMACION: 12, // confirmación de haber explorado la plataforma

    // Dimensiones finales (antes: formulario postest, columnas 3-9)
    TRAUMA_POST: 13,
    ANTISOCIAL_POST: 14,
    RUTAS_POST: 15,
    SALUD_POST: 16,
    COMPRENSION_POST: 17,
    SENALES_POST: 18,
    AYUDA_POST: 19,

    // Evaluación de la plataforma (antes: columnas 10-19 del postest)
    CALIFICACION: 20,
    HERRAMIENTA: 21,
    NAVEGACION: 22,
    CLARIDAD: 23,
    CONFIABILIDAD: 24,
    RECOMIENDA: 25,
    APRENDIO: 26,
    CONTRIBUYE: 27,
    COMENTARIO_POSITIVO: 28,
    SUGERENCIAS: 29

};

/*==================================================
=              VARIABLES GLOBALES                  =
==================================================*/

let graficos = {};

let datosRespuestas = [];

/*==================================================
=              PARSER CSV SEGURO                   =
==================================================*/

function parsearCSV(texto) {

    const filas = [];
    let fila = [];
    let valor = "";
    let comillas = false;

    for (let i = 0; i < texto.length; i++) {

        const caracter = texto[i];
        const siguiente = texto[i + 1];

        if (caracter === '"') {
            if (comillas && siguiente === '"') {
                valor += '"';
                i++;
            } else {
                comillas = !comillas;
            }
        }
        else if (caracter === "," && !comillas) {
            fila.push(valor.trim());
            valor = "";
        }
        else if ((caracter === "\n" || caracter === "\r") && !comillas) {
            if (caracter === "\r" && siguiente === "\n") i++;
            fila.push(valor.trim());
            filas.push(fila);
            fila = [];
            valor = "";
        }
        else {
            valor += caracter;
        }

    }

    if (valor !== "" || fila.length > 0) {
        fila.push(valor.trim());
        filas.push(fila);
    }

    return filas
        .map(f => f.map(dato => dato.replace(/^"|"$/g, "")))
        .filter(f => f.some(v => v !== ""));

}

/*==================================================
=              FUNCIONES AUXILIARES                =
==================================================*/

function numero(valor) {

    const n = parseFloat(valor);

    return isNaN(n) ? null : n;

}

function promedio(lista) {

    if (lista.length === 0) {

        return 0;

    }

    const suma =
        lista.reduce(
            (total, numero) =>
                total + numero,
            0
        );

    return Number(
        (suma / lista.length)
            .toFixed(1)
    );

}

function porcentaje(parte, total) {

    if (total === 0) {

        return "0%";

    }

    return Math.round(
        (parte / total) * 100
    ) + "%";

}

// Revisa si una respuesta de texto es un "Sí" (sin importar tildes/mayúsculas)
function esSi(valor) {

    if (!valor) {

        return false;

    }

    return valor
        .trim()
        .toLowerCase()
        .startsWith("s");

}

/*==================================================
=              CARGAR DATOS GOOGLE SHEETS          =
==================================================*/

async function cargarDatosRespuestas() {

    try {

        const respuesta = await fetch(URL_SHEET_RESPUESTAS);

        const texto = await respuesta.text();

        // Eliminamos encabezados
        datosRespuestas = parsearCSV(texto).slice(1);

        procesarDatos();

    }

    catch (error) {

        console.error(
            "Error cargando datos estadísticos:",
            error
        );

    }

}

/*==================================================
=             PROCESAMIENTO GENERAL                =
==================================================*/

function procesarDatos() {

    const participantes =
        datosRespuestas.length;

    actualizarParticipantes(participantes);

    procesarEvaluacionPlataforma();

    procesarHerramientas();

    procesarComparacion();

    procesarComentarios();

}

/*==================================================
=             DATOS DE EVALUACIÓN FINAL            =
==================================================*/

function procesarEvaluacionPlataforma() {

    let calificaciones = [];

    let navegacion = [];

    let claridad = [];

    let confiabilidad = [];

    let contribuyeRatings = [];

    let recomienda = 0;

    let aprendio = 0;

    datosRespuestas.forEach(fila => {

        if (numero(fila[COL.CALIFICACION]) !== null) {

            calificaciones.push(
                numero(fila[COL.CALIFICACION])
            );

        }

        if (numero(fila[COL.NAVEGACION]) !== null) {

            navegacion.push(
                numero(fila[COL.NAVEGACION])
            );

        }

        const valorClaridad = numero(fila[COL.CLARIDAD]);

        if (valorClaridad !== null) {

            claridad.push(valorClaridad);

        }

        const valorConfiabilidad = numero(fila[COL.CONFIABILIDAD]);

        if (valorConfiabilidad !== null) {

            confiabilidad.push(valorConfiabilidad);

        }

        if (esSi(fila[COL.RECOMIENDA])) {

            recomienda++;

        }

        if (esSi(fila[COL.APRENDIO])) {

            aprendio++;

        }

        const valorContribuye = numero(fila[COL.CONTRIBUYE]);

        if (valorContribuye !== null) {

            contribuyeRatings.push(valorContribuye);

        }

    });

    const total =
        datosRespuestas.length;

    // Para claridad/confiabilidad/contribuye contamos como "positiva"
    // cualquier calificación mayor o igual a ES_POSITIVO (por defecto 4 de 5)
    const claridadPositiva =
        claridad.filter(v => v >= ES_POSITIVO).length;

    const confiabilidadPositiva =
        confiabilidad.filter(v => v >= ES_POSITIVO).length;

    const contribuyePositiva =
        contribuyeRatings.filter(v => v >= ES_POSITIVO).length;

    actualizarEvaluacion({

        calificacion:
            promedio(calificaciones),

        navegacion:
            promedio(navegacion),

        claridad:
            porcentaje(
                claridadPositiva,
                claridad.length
            ),

        confiabilidad:
            porcentaje(
                confiabilidadPositiva,
                confiabilidad.length
            ),

        recomienda:
            porcentaje(
                recomienda,
                total
            ),

        aprendio:
            porcentaje(
                aprendio,
                total
            ),

        contribuye:
            porcentaje(
                contribuyePositiva,
                contribuyeRatings.length
            )

    });

}

/*==================================================
=              ACTUALIZAR PARTICIPANTES            =
==================================================*/

function actualizarParticipantes(total) {

    const elemento =
        document.getElementById(
            "kpiParticipantes"
        );

    if (elemento) {

        elemento.innerText = total;

    }

}

/*==================================================
=             ACTUALIZAR EVALUACIÓN                =
==================================================*/

function actualizarEvaluacion(datos) {

    // ---- Sección "Indicadores principales" ----

    const calificacion =
        document.getElementById("kpiCalificacion");

    if (calificacion) {

        calificacion.innerText =
            datos.calificacion + " / 5";

    }

    const evaluacionAprendio =
        document.getElementById("kpiEvaluacionAprendio");

    if (evaluacionAprendio) {

        evaluacionAprendio.innerText =
            datos.aprendio;

    }

    const evaluacionRecomienda =
        document.getElementById("kpiEvaluacionRecomienda");

    if (evaluacionRecomienda) {

        evaluacionRecomienda.innerText =
            datos.recomienda;

    }

    const evaluacionContribuye =
        document.getElementById("kpiEvaluacionContribuye");

    if (evaluacionContribuye) {

        evaluacionContribuye.innerText =
            datos.contribuye;

    }

    // ---- Sección "Impacto percibido" (ids nuevos, distintos a los de arriba) ----

    const impactoAprendio =
        document.getElementById("kpiImpactoAprendio");

    if (impactoAprendio) {

        impactoAprendio.innerText =
            datos.aprendio;

    }

    const impactoRecomienda =
        document.getElementById("kpiImpactoRecomienda");

    if (impactoRecomienda) {

        impactoRecomienda.innerText =
            datos.recomienda;

    }

    const impactoContribuye =
        document.getElementById("kpiImpactoContribuye");

    if (impactoContribuye) {

        impactoContribuye.innerText =
            datos.contribuye;

    }

    // ---- Sección "Evaluación de la plataforma" ----

    const evaluacionCalificacion =
        document.getElementById("kpiEvaluacionCalificacion");

    if (evaluacionCalificacion) {

        evaluacionCalificacion.innerText =
            datos.calificacion + " / 5";

    }

    const navegacion =
        document.getElementById("kpiNavegacion");

    if (navegacion) {

        navegacion.innerText =
            datos.navegacion + " / 5";

    }

    const claridad =
        document.getElementById("kpiClaridad");

    if (claridad) {

        claridad.innerText =
            datos.claridad;

    }

    const confiabilidad =
        document.getElementById("kpiConfiabilidad");

    if (confiabilidad) {

        confiabilidad.innerText =
            datos.confiabilidad;

    }

}

/*==================================================
=       HERRAMIENTA CONSIDERADA MÁS ÚTIL           =
==================================================*/

function procesarHerramientas() {

    const canvas =
        document.getElementById("chartHerramientas");

    if (!canvas) {

        return;

    }

    const conteo = {};

    datosRespuestas.forEach(fila => {

        const herramienta = fila[COL.HERRAMIENTA] && fila[COL.HERRAMIENTA].trim();

        if (!herramienta) {

            return;

        }

        conteo[herramienta] =
            (conteo[herramienta] || 0) + 1;

    });

    const etiquetas = Object.keys(conteo);

    const valores = Object.values(conteo);

    if (graficos["chartHerramientas"]) {

        graficos["chartHerramientas"].destroy();

    }

    const contexto = canvas.getContext("2d");

    graficos["chartHerramientas"] = new Chart(

        contexto,

        {

            type: "bar",

            data: {

                labels: etiquetas,

                datasets: [{

                    label: "Participantes",

                    data: valores,

                    backgroundColor: "#95C883",

                    borderRadius: 8

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: true,

                plugins: {

                    legend: {

                        display: false

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            stepSize: 1

                        }

                    }

                }

            }

        }

    );

}

/*==================================================
=              COMENTARIOS Y SUGERENCIAS           =
==================================================*/

function procesarComentarios() {

    const comentarios = [];

    const sugerencias = [];

    datosRespuestas.forEach(fila => {

        // Comentario positivo

        if (
            fila[COL.COMENTARIO_POSITIVO] &&
            fila[COL.COMENTARIO_POSITIVO].trim().length > 2
        ) {

            comentarios.push(
                fila[COL.COMENTARIO_POSITIVO]
            );

        }

        // Mejoras / sugerencias

        if (
            fila[COL.SUGERENCIAS] &&
            fila[COL.SUGERENCIAS].trim().length > 2
        ) {

            sugerencias.push(
                fila[COL.SUGERENCIAS]
            );

        }

    });

    mostrarLista(

        "contenedorComentarios",

        comentarios,

        "💬"

    );

    mostrarLista(

        "contenedorSugerencias",

        sugerencias,

        "📝"

    );

}

function mostrarLista(id, lista, icono) {

    const contenedor =
        document.getElementById(id);

    if (!contenedor) {

        return;

    }

    contenedor.innerHTML = "";

    if (lista.length === 0) {

        contenedor.innerHTML =
            "<p>No hay respuestas registradas aún.</p>";

        return;

    }

    lista.slice(0, 5)
        .forEach(texto => {

            const tarjeta =
                document.createElement("div");

            tarjeta.className =
                "comment-card";

            tarjeta.innerText =
                `${icono} "${texto}"`;

            contenedor.appendChild(
                tarjeta
            );

        });

}

/*==================================================
=          COMPARACIÓN INICIAL VS FINAL            =
==================================================*/

function procesarComparacion() {

    const dimensiones = {

        trauma: {

            pre: COL.TRAUMA_PRE,

            post: COL.TRAUMA_POST,

            canvas: "chartTrauma",

            ids: [

                "preTrauma",

                "postTrauma",

                "incTrauma"

            ]

        },

        antisociales: {

            pre: COL.ANTISOCIAL_PRE,

            post: COL.ANTISOCIAL_POST,

            canvas: "chartAntisociales",

            ids: [

                "preAntisociales",

                "postAntisociales",

                "incAntisociales"

            ]

        },

        rutas: {

            pre: COL.RUTAS_PRE,

            post: COL.RUTAS_POST,

            canvas: "chartRutas",

            ids: [

                "preRutas",

                "postRutas",

                "incRutas"

            ]

        },

        saludMental: {

            pre: COL.SALUD_PRE,

            post: COL.SALUD_POST,

            canvas: "chartSaludMental",

            ids: [

                "preSaludMental",

                "postSaludMental",

                "incSaludMental"

            ]

        },

        comprension: {

            pre: COL.COMPRENSION_PRE,

            post: COL.COMPRENSION_POST,

            canvas: "chartComprension",

            ids: [

                "preComprension",

                "postComprension",

                "incComprension"

            ]

        },

        senales: {

            pre: COL.SENALES_PRE,

            post: COL.SENALES_POST,

            canvas: "chartSenales",

            ids: [

                "preSenales",

                "postSenales",

                "incSenales"

            ]

        },

        ayuda: {

            pre: COL.AYUDA_PRE,

            post: COL.AYUDA_POST,

            canvas: "chartAyuda",

            ids: [

                "preAyuda",

                "postAyuda",

                "incAyuda"

            ]

        }

    };

    Object.values(dimensiones)
        .forEach(dimension => {

            const valoresPre = [];

            const valoresPost = [];

            // Antes había que recorrer dos hojas distintas (pretest y
            // postest) por separado. Ahora cada fila del formulario único
            // trae ambos valores (inicial y final), así que basta un solo
            // recorrido sobre "datosRespuestas".

            datosRespuestas.forEach(fila => {

                const valorPre =
                    numero(
                        fila[dimension.pre]
                    );

                if (valorPre !== null) {

                    valoresPre.push(valorPre);

                }

                const valorPost =
                    numero(
                        fila[dimension.post]
                    );

                if (valorPost !== null) {

                    valoresPost.push(valorPost);

                }

            });

            const mediaPre =
                promedio(valoresPre);

            const mediaPost =
                promedio(valoresPost);

            actualizarResultado(

                dimension.ids[0],

                dimension.ids[1],

                dimension.ids[2],

                mediaPre,

                mediaPost

            );

            crearGrafica(

                dimension.canvas,

                mediaPre,

                mediaPost

            );

        });

}

/*==================================================
=          ACTUALIZAR RESULTADOS TEXTO             =
==================================================*/

function actualizarResultado(

    idPre,

    idPost,

    idIncremento,

    pre,

    post

) {

    const elementoPre =
        document.getElementById(idPre);

    const elementoPost =
        document.getElementById(idPost);

    const elementoIncremento =
        document.getElementById(idIncremento);

    if (elementoPre) {

        elementoPre.innerText =
            pre;

    }

    if (elementoPost) {

        elementoPost.innerText =
            post;

    }

    if (elementoIncremento) {

        let aumento = 0;

        if (pre > 0) {

            aumento =
                (((post - pre) / pre) * 100)
                    .toFixed(0);

        }

        elementoIncremento.innerText =
            `${aumento >= 0 ? "+" : ""}${aumento}%`;

    }

}

/*==================================================
=              CREAR GRÁFICAS CHART.JS             =
==================================================*/

function crearGrafica(

    idCanvas,

    valorPre,

    valorPost

) {

    const canvas =
        document.getElementById(idCanvas);

    // Si el canvas no existe, evita errores

    if (!canvas) {

        return;

    }

    // Eliminar gráfica anterior

    if (graficos[idCanvas]) {

        graficos[idCanvas].destroy();

    }

    const contexto =
        canvas.getContext("2d");

    graficos[idCanvas] = new Chart(

        contexto,

        {

            type: "bar",

            data: {

                labels: [

                    "Antes",

                    "Después"

                ],

                datasets: [{

                    label: "Promedio",

                    data: [

                        valorPre,

                        valorPost

                    ],

                    backgroundColor: [

                        "#90CAF9",

                        "#95C883"

                    ],

                    borderRadius: 8

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: true,

                plugins: {

                    legend: {

                        display: false

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        max: 5,

                        ticks: {

                            stepSize: 1

                        }

                    }

                }

            }

        }

    );

}

/*==================================================
=              CARGA INICIAL                       =
==================================================*/

document.addEventListener(

    "DOMContentLoaded",

    () => {

        cargarDatosRespuestas();

    }

);

/*==================================================
=           ACTUALIZACIÓN AUTOMÁTICA               =
==================================================*/

setInterval(

    () => {

        cargarDatosRespuestas();

    },

    30000

);