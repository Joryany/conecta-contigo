/*==================================================
=        CONECTA CONTIGO - ESTADÍSTICA JS          =
=              Sistema de evaluación               =
==================================================*/

/*
  CAMBIOS EN ESTA VERSIÓN (resumen para que sepas qué se tocó):

  1) Se quitó un error de sintaxis: "textoPost" estaba declarado
     dos veces con "const" (eso rompía TODO el script y por eso
     nada funcionaba bien).

  2) Se corrigieron los números de columna del POSTEST. Tu
     formulario real tiene 3 columnas extra al inicio (Marca
     temporal, Código, Confirmación) que el código viejo no
     contaba, así que todo lo de después quedaba corrido.

  3) "Claridad", "Confiabilidad" y "Contribuye" en realidad son
     una calificación de 1 a 5 (no "Sí/No"). Se decidió contar
     como respuesta positiva las calificaciones de 4 o 5. Si tú
     quieres otro criterio (por ejemplo solo el 5), busca la
     palabra ES_POSITIVO más abajo y cambia el número.

  4) Se agregó la función que faltaba para dibujar la gráfica de
     "Herramienta considerada más útil" (pregunta de una sola
     opción).
*/

/*==================================================
=              CONEXIÓN GOOGLE SHEETS               =
==================================================*/

const URL_SHEET_PRETEST =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJktpVPDBSCbiLerfxEL3SDQ2Hg_voVFqfQyYxNhkc_oYmRFtWAlVcpke_VVTrdZMiDnS1ooKUR63O/pub?gid=338468623&single=true&output=csv';

const URL_SHEET_POSTEST =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJktpVPDBSCbiLerfxEL3SDQ2Hg_voVFqfQyYxNhkc_oYmRFtWAlVcpke_VVTrdZMiDnS1ooKUR63O/pub?gid=1555379758&single=true&output=csv';

// A partir de qué calificación (escala 1-5) contamos una respuesta como "positiva"
const ES_POSITIVO = 4;

/*==================================================
=              VARIABLES GLOBALES                  =
==================================================*/

let graficos = {};

let datosPretest = [];

let datosPostest = [];

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

async function cargarDatosSheets() {

    try {

        const [respuestaPre, respuestaPost] = await Promise.all([

            fetch(URL_SHEET_PRETEST),

            fetch(URL_SHEET_POSTEST)

        ]);

        const textoPre = await respuestaPre.text();
        const textoPost = await respuestaPost.text();

        // Eliminamos encabezados

        datosPretest = parsearCSV(textoPre).slice(1);

        datosPostest = parsearCSV(textoPost).slice(1);

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
        datosPostest.length;

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

    /*

    POSTEST (columnas reales confirmadas con los datos de prueba):

    0  Marca temporal
    1  Código
    2  Confirmación
    3  Trauma
    4  Antisocial
    5  Rutas
    6  Salud mental
    7  Comprensión
    8  Señales
    9  Ayuda
    10 Calificación general (1-5)
    11 Herramienta más útil (opción única)
    12 Navegación (1-5)
    13 Claridad (1-5)
    14 Confiabilidad (1-5)
    15 Recomienda (Sí/No)
    16 Aprendió (Sí/No)
    17 Contribuye (1-5)
    18 Comentario positivo
    19 Mejoras / sugerencias

    */

    let calificaciones = [];

    let navegacion = [];

    let claridad = [];

    let confiabilidad = [];

    let contribuyeRatings = [];

    let recomienda = 0;

    let aprendio = 0;

    datosPostest.forEach(fila => {

        if (numero(fila[10]) !== null) {

            calificaciones.push(
                numero(fila[10])
            );

        }

        if (numero(fila[12]) !== null) {

            navegacion.push(
                numero(fila[12])
            );

        }

        const valorClaridad = numero(fila[13]);

        if (valorClaridad !== null) {

            claridad.push(valorClaridad);

        }

        const valorConfiabilidad = numero(fila[14]);

        if (valorConfiabilidad !== null) {

            confiabilidad.push(valorConfiabilidad);

        }

        if (esSi(fila[15])) {

            recomienda++;

        }

        if (esSi(fila[16])) {

            aprendio++;

        }

        const valorContribuye = numero(fila[17]);

        if (valorContribuye !== null) {

            contribuyeRatings.push(valorContribuye);

        }

    });

    const total =
        datosPostest.length;

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

    datosPostest.forEach(fila => {

        const herramienta = fila[11] && fila[11].trim();

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

    datosPostest.forEach(fila => {

        // Comentario positivo (columna 18)

        if (
            fila[18] &&
            fila[18].trim().length > 2
        ) {

            comentarios.push(
                fila[18]
            );

        }

        // Mejoras / sugerencias (columna 19)

        if (
            fila[19] &&
            fila[19].trim().length > 2
        ) {

            sugerencias.push(
                fila[19]
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
=          COMPARACIÓN PRETEST VS POSTEST          =
==================================================*/

function procesarComparacion() {

    const dimensiones = {

        trauma: {

            pre: 5,

            post: 3,

            canvas: "chartTrauma",

            ids: [

                "preTrauma",

                "postTrauma",

                "incTrauma"

            ]

        },

        antisociales: {

            pre: 6,

            post: 4,

            canvas: "chartAntisociales",

            ids: [

                "preAntisociales",

                "postAntisociales",

                "incAntisociales"

            ]

        },

        rutas: {

            pre: 7,

            post: 5,

            canvas: "chartRutas",

            ids: [

                "preRutas",

                "postRutas",

                "incRutas"

            ]

        },

        saludMental: {

            pre: 8,

            post: 6,

            canvas: "chartSaludMental",

            ids: [

                "preSaludMental",

                "postSaludMental",

                "incSaludMental"

            ]

        },

        comprension: {

            pre: 9,

            post: 7,

            canvas: "chartComprension",

            ids: [

                "preComprension",

                "postComprension",

                "incComprension"

            ]

        },

        senales: {

            pre: 10,

            post: 8,

            canvas: "chartSenales",

            ids: [

                "preSenales",

                "postSenales",

                "incSenales"

            ]

        },

        ayuda: {

            pre: 11,

            post: 9,

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

            // PRETEST

            datosPretest.forEach(fila => {

                const valor =
                    numero(
                        fila[dimension.pre]
                    );

                if (valor !== null) {

                    valoresPre.push(valor);

                }

            });

            // POSTEST

            datosPostest.forEach(fila => {

                const valor =
                    numero(
                        fila[dimension.post]
                    );

                if (valor !== null) {

                    valoresPost.push(valor);

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

        cargarDatosSheets();

    }

);

/*==================================================
=           ACTUALIZACIÓN AUTOMÁTICA               =
==================================================*/

setInterval(

    () => {

        cargarDatosSheets();

    },

    30000

);