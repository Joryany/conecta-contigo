
    // -------------------------------------------------------------
    // 
    // -------------------------------------------------------------
    const URL_SHEET_FINAL_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJktpVPDBSCbiLerfxEL3SDQ2Hg_voVFqfQyYxNhkc_oYmRFtWAlVcpke_VVTrdZMiDnS1ooKUR63O/pub?gid=338468623&single=true&output=csv';
    const URL_SHEET_INICIAL_CSV   = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJktpVPDBSCbiLerfxEL3SDQ2Hg_voVFqfQyYxNhkc_oYmRFtWAlVcpke_VVTrdZMiDnS1ooKUR63O/pub?gid=1555379758&single=true&output=csv';

    // Parser seguro de CSV para manejar comas dentro de textos entre comillas
    function parsearCSV(texto) {
      const lineas = texto.split(/\r\n|\n/);
      return lineas.map(linea => {
        const valores = [];
        let dentroDeComillas = false;
        let valorActual = '';
        for (let i = 0; i < linea.length; i++) {
          const char = linea[i];
          if (char === '"') {
            dentroDeComillas = !dentroDeComillas;
          } else if (char === ',' && !dentroDeComillas) {
            valores.push(valorActual.trim().replace(/^"|"$/g, ''));
            valorActual = '';
          } else {
            valorActual += char;
          }
        }
        valores.push(valorActual.trim().replace(/^"|"$/g, ''));
        return valores;
      }).filter(fila => fila.some(campo => campo !== ''));
    }

    const calcularPromedio = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 0;

    let instanciasGraficas = {};

    async function cargarDatosSheets() {
      try {
        // Cargar ambas pestañas
        const [resInicial, resFinal] = await Promise.all([
          fetch(URL_SHEET_INICIAL_CSV),
          fetch(URL_SHEET_FINAL_CSV)
        ]);

        const textoInicial = await resInicial.text();
        const textoFinal = await resFinal.text();

        const filasInicial = parsearCSV(textoInicial).slice(1); // Post-test + Satisfacción
        const filasFinal = parsearCSV(textoFinal).slice(1);     // Pre-test

        // 1. PROCESAR DATOS DE SATISFACCIÓN Y COMENTARIOS (Pestaña Post-Test / Inicial)
        let calificaciones = [];
        let aprendioSi = 0;
        let recomiendaSi = 0;
        let comentarios = [];

        filasInicial.forEach(fila => {
          if (fila.length > 5) {
            // Columna K (10) -> Calificación
            if (fila[10] && !isNaN(parseFloat(fila[10]))) calificaciones.push(parseFloat(fila[10]));
            // Columna P (15) -> Recomienda
            if (fila[15] && fila[15].toLowerCase().includes('sí')) recomiendaSi++;
            // Columna Q (16) -> Aprendió
            if (fila[16] && fila[16].toLowerCase().includes('sí')) aprendioSi++;
            // Columna S (18) -> Comentarios
            if (fila[18] && fila[18].trim().length > 2) {
              comentarios.push(fila[18]);
            }
          }
        });

        // Actualizar KPIs de la parte superior
        const totalRespuestasInicial = filasInicial.length || 1;
        document.getElementById('kpiCalificacion').innerText = (calcularPromedio(calificaciones) || '5.0') + '/5';
        document.getElementById('kpiAprendio').innerText = Math.round((aprendioSi / totalRespuestasInicial) * 100) + '%';
        document.getElementById('kpiRecomienda').innerText = Math.round((recomiendaSi / totalRespuestasInicial) * 100) + '%';

        // Renderizar Comentarios
        const contenedorComentarios = document.getElementById('contenedorComentarios');
        contenedorComentarios.innerHTML = '';

        if (comentarios.length === 0) {
          contenedorComentarios.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">No hay comentarios registrados aún.</p>';
        } else {
          comentarios.slice(-5).forEach(comentario => {
            const card = document.createElement('div');
            card.className = 'comment-card';
            card.innerText = `💬 "${comentario}"`;
            contenedorComentarios.appendChild(card);
          });
        }

        // 2. PROCESAR PREGUNTAS PRE Y POST
        let preTrauma = [], preAnti = [], preRutas = [], preSalud = [], preComp = [];
        let postTrauma = [], postAnti = [], postRutas = [], postSalud = [], postComp = [];

        // DATOS PRE-TEST (Pestaña Final / gid=338468623)
        // Columnas F, G, H, I, J correspondientes a los índices 5, 6, 7, 8, 9
        filasFinal.forEach(fila => {
          if (fila[5] && !isNaN(parseFloat(fila[5]))) preTrauma.push(parseFloat(fila[5]));
          if (fila[6] && !isNaN(parseFloat(fila[6]))) preAnti.push(parseFloat(fila[6]));
          if (fila[7] && !isNaN(parseFloat(fila[7]))) preRutas.push(parseFloat(fila[7]));
          if (fila[8] && !isNaN(parseFloat(fila[8]))) preSalud.push(parseFloat(fila[8]));
          if (fila[9] && !isNaN(parseFloat(fila[9]))) preComp.push(parseFloat(fila[9]));
        });

        // DATOS POST-TEST (Pestaña Inicial)
        // Las preguntas evaluación Post-test también se responden en las Columnas F, G, H, I, J (índices 5, 6, 7, 8, 9)
        filasInicial.forEach(fila => {
          if (fila[5] && !isNaN(parseFloat(fila[5]))) postTrauma.push(parseFloat(fila[5]));
          if (fila[6] && !isNaN(parseFloat(fila[6]))) postAnti.push(parseFloat(fila[6]));
          if (fila[7] && !isNaN(parseFloat(fila[7]))) postRutas.push(parseFloat(fila[7]));
          if (fila[8] && !isNaN(parseFloat(fila[8]))) postSalud.push(parseFloat(fila[8]));
          if (fila[9] && !isNaN(parseFloat(fila[9]))) postComp.push(parseFloat(fila[9]));
        });

        // 3. DIBUJAR LAS 5 GRÁFICAS
        dibujarGrafica('chartTrauma', calcularPromedio(preTrauma), calcularPromedio(postTrauma), 'preTrauma', 'postTrauma', 'incTrauma');
        dibujarGrafica('chartAntisociales', calcularPromedio(preAnti), calcularPromedio(postAnti), 'preAntisociales', 'postAntisociales', 'incAntisociales');
        dibujarGrafica('chartRutas', calcularPromedio(preRutas), calcularPromedio(postRutas), 'preRutas', 'postRutas', 'incRutas');
        dibujarGrafica('chartSaludMental', calcularPromedio(preSalud), calcularPromedio(postSalud), 'preSaludMental', 'postSaludMental', 'incSaludMental');
        dibujarGrafica('chartComprension', calcularPromedio(preComp), calcularPromedio(postComp), 'preComprension', 'postComprension', 'incComprension');

      } catch (error) {
        console.error('Error al sincronizar con Google Sheets:', error);
      }
    }

    function dibujarGrafica(idCanvas, valPre, valPost, elPre, elPost, elInc) {
      document.getElementById(elPre).innerText = valPre;
      document.getElementById(elPost).innerText = valPost;

      const numPre = parseFloat(valPre);
      const numPost = parseFloat(valPost);
      const incremento = numPre > 0 ? (((numPost - numPre) / numPre) * 100).toFixed(0) : 0;
      
      document.getElementById(elInc).innerText = `${incremento >= 0 ? '+' : ''}${incremento}%`;

      if (instanciasGraficas[idCanvas]) {
        instanciasGraficas[idCanvas].destroy();
      }

      const ctx = document.getElementById(idCanvas).getContext('2d');
      instanciasGraficas[idCanvas] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Antes', 'Después'],
          datasets: [{
            data: [numPre, numPost],
            backgroundColor: ['#90CAF9', '#66BB6A'],
            borderRadius: 6
          }]
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, max: 5 } }
        }
      });
    }

    window.onload = cargarDatosSheets;
    setInterval(cargarDatosSheets, 30000);
