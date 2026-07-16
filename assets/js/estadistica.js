/*==================================================
=        CONECTA CONTIGO - ESTADÍSTICA JS          =
=              Sistema de evaluación               =
==================================================*/


/*==================================================
=              CONEXIÓN GOOGLE SHEETS               =
==================================================*/


const URL_SHEET_PRETEST =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJktpVPDBSCbiLerfxEL3SDQ2Hg_voVFqfQyYxNhkc_oYmRFtWAlVcpke_VVTrdZMiDnS1ooKUR63O/pub?gid=338468623&single=true&output=csv';


const URL_SHEET_POSTEST =
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJktpVPDBSCbiLerfxEL3SDQ2Hg_voVFqfQyYxNhkc_oYmRFtWAlVcpke_VVTrdZMiDnS1ooKUR63O/pub?gid=1555379758&single=true&output=csv';



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

    const filas = texto.split(/\r?\n/);


    return filas.map(fila => {

        let columnas = [];

        let valor = "";

        let comillas = false;


        for (let i = 0; i < fila.length; i++) {

            const caracter = fila[i];


            if (caracter === '"') {

                comillas = !comillas;

            }

            else if (caracter === "," && !comillas) {

                columnas.push(valor.trim());

                valor = "";

            }

            else {

                valor += caracter;

            }

        }


        columnas.push(valor.trim());


        return columnas.map(dato =>
            dato.replace(/^"|"$/g, "")
        );


    })
        .filter(fila =>
            fila.some(valor => valor !== "")
        );

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

        console.log("Estado PRETEST:", respuestaPre.status, respuestaPre.url);
        console.log("TEXTO CRUDO PRETEST:", textoPre);


        // Eliminamos encabezados

        datosPretest = parsearCSV(textoPre).slice(1);

        datosPostest = parsearCSV(textoPost).slice(1);

        datosPretest = parsearCSV(textoPre).slice(1);
        datosPostest = parsearCSV(textoPost).slice(1);

        console.log("PRETEST fila 0:", datosPretest[0]);
        console.log("POSTEST fila 0:", datosPostest[0]);



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


    let recomienda = 0;

    let aprendio = 0;

    let contribuye = 0;



    datosPostest.forEach(fila => {


        /*
        
        POSTEST:

        0 Confirmación

        1 Trauma

        2 Antisocial

        3 Rutas

        4 Salud mental

        5 Comprensión

        6 Señales

        7 Ayuda

        8 Calificación

        9 Herramienta

        10 Navegación

        11 Claridad

        12 Confiabilidad

        13 Recomienda

        14 Aprendió

        15 Contribuye

        16 Comentario positivo

        17 Mejoras

        */



        if (numero(fila[8]) !== null) {

            calificaciones.push(
                numero(fila[8])
            );

        }



        if (numero(fila[10]) !== null) {

            navegacion.push(
                numero(fila[10])
            );

        }



        if (
            fila[11] &&
            fila[11].toLowerCase()
                .includes("sí")
        ) {

            claridad.push(1);

        }



        if (
            fila[12] &&
            fila[12].toLowerCase()
                .includes("sí")
        ) {

            confiabilidad.push(1);

        }



        if (
            fila[13] &&
            fila[13].toLowerCase()
                .includes("sí")
        ) {

            recomienda++;

        }



        if (
            fila[14] &&
            fila[14].toLowerCase()
                .includes("sí")
        ) {

            aprendio++;

        }



        if (
            fila[15] &&
            fila[15].toLowerCase()
                .includes("sí")
        ) {

            contribuye++;

        }



    });



    const total =
        datosPostest.length;



    actualizarEvaluacion({


        calificacion:
            promedio(calificaciones),


        navegacion:
            promedio(navegacion),


        claridad:
            porcentaje(
                claridad.length,
                total
            ),


        confiabilidad:
            porcentaje(
                confiabilidad.length,
                total
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
                contribuye,
                total
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



    // Calificación general

    const calificacion =
        document.getElementById(
            "kpiCalificacion"
        );


    if (calificacion) {

        calificacion.innerText =
            datos.calificacion + " / 5";

    }




    // Aprendizaje

    const aprendio =
        document.getElementById(
            "kpiAprendio"
        );


    if (aprendio) {

        aprendio.innerText =
            datos.aprendio;

    }





    // Recomendación

    const recomienda =
        document.getElementById(
            "kpiRecomienda"
        );


    if (recomienda) {

        recomienda.innerText =
            datos.recomienda;

    }





    // Contribución prevención

    const contribuye =
        document.getElementById(
            "kpiContribuye"
        );


    if (contribuye) {

        contribuye.innerText =
            datos.contribuye;

    }





    // Navegación

    const navegacion =
        document.getElementById(
            "kpiNavegacion"
        );


    if (navegacion) {

        navegacion.innerText =
            datos.navegacion + " / 5";

    }





    // Claridad

    const claridad =
        document.getElementById(
            "kpiClaridad"
        );


    if (claridad) {

        claridad.innerText =
            datos.claridad;

    }





    // Confiabilidad

    const confiabilidad =
        document.getElementById(
            "kpiConfiabilidad"
        );


    if (confiabilidad) {

        confiabilidad.innerText =
            datos.confiabilidad;

    }

    //==============================================
    // KPIs SEGUNDA SECCIÓN: EVALUACIÓN PLATAFORMA
    //==============================================


    const evaluacionCalificacion =
        document.getElementById(
            "kpiEvaluacionCalificacion"
        );


    if (evaluacionCalificacion) {

        evaluacionCalificacion.innerText =
            datos.calificacion + " / 5";

    }



    const evaluacionAprendio =
        document.getElementById(
            "kpiEvaluacionAprendio"
        );


    if (evaluacionAprendio) {

        evaluacionAprendio.innerText =
            datos.aprendio;

    }



    const evaluacionContribuye =
        document.getElementById(
            "kpiEvaluacionContribuye"
        );


    if (evaluacionContribuye) {

        evaluacionContribuye.innerText =
            datos.contribuye;

    }



    const evaluacionRecomienda =
        document.getElementById(
            "kpiEvaluacionRecomienda"
        );


    if (evaluacionRecomienda) {

        evaluacionRecomienda.innerText =
            datos.recomienda;

    }

    const impactoAprendio = document.getElementById("kpiImpactoAprendio");
    if (impactoAprendio) { impactoAprendio.innerText = datos.aprendio; }

    const impactoContribuye = document.getElementById("kpiImpactoContribuye");
    if (impactoContribuye) { impactoContribuye.innerText = datos.contribuye; }

    const impactoRecomienda = document.getElementById("kpiImpactoRecomienda");
    if (impactoRecomienda) { impactoRecomienda.innerText = datos.recomienda; }

}





/*==================================================
=              COMENTARIOS Y SUGERENCIAS           =
==================================================*/


function procesarComentarios() {



    const comentarios = [];

    const sugerencias = [];



    datosPostest.forEach(fila => {


        // Comentario positivo

        if (
            fila[16] &&
            fila[16].trim().length > 2
        ) {

            comentarios.push(
                fila[16]
            );

        }




        // Mejoras

        if (
            fila[17] &&
            fila[17].trim().length > 2
        ) {

            sugerencias.push(
                fila[17]
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

            pre: 0,

            post: 1,

            canvas: "chartTrauma",

            ids: [

                "preTrauma",

                "postTrauma",

                "incTrauma"

            ]

        },


        antisociales: {

            pre: 1,

            post: 2,

            canvas: "chartAntisociales",

            ids: [

                "preAntisociales",

                "postAntisociales",

                "incAntisociales"

            ]

        },


        rutas: {

            pre: 2,

            post: 3,

            canvas: "chartRutas",

            ids: [

                "preRutas",

                "postRutas",

                "incRutas"

            ]

        },


        saludMental: {

            pre: 3,

            post: 4,

            canvas: "chartSaludMental",

            ids: [

                "preSaludMental",

                "postSaludMental",

                "incSaludMental"

            ]

        },


        comprension: {

            pre: 4,

            post: 5,

            canvas: "chartComprension",

            ids: [

                "preComprension",

                "postComprension",

                "incComprension"

            ]

        },


        senales: {

            pre: 5,

            post: 6,

            canvas: "chartSenales",

            ids: [

                "preSenales",

                "postSenales",

                "incSenales"

            ]

        },


        ayuda: {

            pre: 6,

            post: 7,

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