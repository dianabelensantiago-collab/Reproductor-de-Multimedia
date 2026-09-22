const media = document.getElementById('media');
const pantallaMedia = document.getElementById('pantallaMedia');
const portada = document.getElementById('portada');
const mensajeVacio = document.getElementById('mensajeVacio');
const tituloCancion = document.getElementById('tituloCancion');
const tipoArchivo = document.getElementById('tipoArchivo');
const tiempoActual = document.getElementById('tiempoActual');
const duracion = document.getElementById('duracion');
const barraProgreso = document.getElementById('barraProgreso');
const tiempoActualFull = document.getElementById('tiempoActualFull');
const duracionFull = document.getElementById('duracionFull');
const barraProgresoFull = document.getElementById('barraProgresoFull');
const btnAleatorio = document.getElementById('btnAleatorio');
const btnAnterior = document.getElementById('btnAnterior');
const btnReproducir = document.getElementById('btnReproducir');
const btnSiguiente = document.getElementById('btnSiguiente');
const btnRepetir = document.getElementById('btnRepetir');
const btnPantallaCompleta = document.getElementById('btnPantallaCompleta');
const btnSilenciar = document.getElementById('btnSilenciar');
const volumen = document.getElementById('volumen');
const selectorArchivos = document.getElementById('selectorArchivos');
const zonaArchivos = document.getElementById('zonaArchivos');
const listaCanciones = document.getElementById('listaCanciones');
const contador = document.getElementById('contador');
const btnLimpiar = document.getElementById('btnLimpiar');

let archivos = [];
let indiceActual = -1;
let indiceArrastrado = null;
let aleatorioActivo = false;
let repetirActivo = false;
let ultimoVolumen = 0.8;

media.volume = ultimoVolumen;
volumen.value = ultimoVolumen;

function formatoTiempo(segundos) {
  if (!Number.isFinite(segundos)) return '00:00';

  const minutos = Math.floor(segundos / 60);
  const segundosRestantes = Math.floor(segundos % 60).toString().padStart(2, '0');
  return `${minutos.toString().padStart(2, '0')}:${segundosRestantes}`;
}

function obtenerTipo(archivo) {
  if (archivo.type.startsWith('video/')) return 'video';
  if (archivo.type.startsWith('audio/')) return 'audio';
  return 'archivo';
}

function nombreSinExtension(nombre) {
  return nombre.replace(/\.[^/.]+$/, '');
}

function actualizarContador() {
  const total = archivos.length;
  contador.textContent = `${total} ${total === 1 ? 'archivo' : 'archivos'}`;
}

function mostrarEstadoActual(item) {
  const esVideo = item.tipo === 'video';

  media.style.display = esVideo ? 'block' : 'none';
  portada.style.display = esVideo ? 'none' : 'grid';
  mensajeVacio.style.display = 'none';
  tipoArchivo.textContent = esVideo ? 'Video en reproducción' : 'Audio en reproducción';
}

function reiniciarReproductor() {
  media.pause();
  media.removeAttribute('src');
  media.load();
  indiceActual = -1;
  tituloCancion.textContent = 'Ninguna canción';
  tipoArchivo.textContent = 'Selecciona una canción o video';
  tiempoActual.textContent = '00:00';
  duracion.textContent = '00:00';
  tiempoActualFull.textContent = '00:00';
  duracionFull.textContent = '00:00';
  barraProgreso.value = 0;
  barraProgresoFull.value = 0;
  btnReproducir.textContent = '▶';
  media.style.display = 'none';
  portada.style.display = 'none';
  mensajeVacio.style.display = 'grid';
}

function cargarArchivo(indice, reproducir = true) {
  if (!archivos[indice]) {
    reiniciarReproductor();
    pintarLista();
    return;
  }

  indiceActual = indice;
  const item = archivos[indiceActual];

  media.src = item.url;
  tituloCancion.textContent = item.nombre;
  mostrarEstadoActual(item);
  pintarLista();

  if (reproducir) {
    media.play();
  }
}

function reproducirOPausar() {
  if (!archivos.length) return;

  if (indiceActual === -1) {
    cargarArchivo(0, true);
    return;
  }

  if (media.paused) {
    media.play();
  } else {
    media.pause();
  }
}

function siguienteIndice() {
  if (!archivos.length) return -1;

  if (aleatorioActivo && archivos.length > 1) {
    let nuevoIndice = indiceActual;
    while (nuevoIndice === indiceActual) {
      nuevoIndice = Math.floor(Math.random() * archivos.length);
    }
    return nuevoIndice;
  }

  return indiceActual + 1 < archivos.length ? indiceActual + 1 : 0;
}

function siguiente() {
  if (!archivos.length) return;
  cargarArchivo(siguienteIndice(), true);
}

function anterior() {
  if (!archivos.length) return;

  const indiceAnterior = indiceActual - 1 >= 0 ? indiceActual - 1 : archivos.length - 1;
  cargarArchivo(indiceAnterior, true);
}

function agregarArchivos(lista) {
  const nuevosArchivos = Array.from(lista)
    .filter((archivo) => archivo.type.startsWith('audio/') || archivo.type.startsWith('video/'))
    .map((archivo) => ({
      archivo,
      nombre: nombreSinExtension(archivo.name),
      tipo: obtenerTipo(archivo),
      url: URL.createObjectURL(archivo)
    }));

  const debeIniciar = archivos.length === 0 && nuevosArchivos.length > 0;
  archivos = [...archivos, ...nuevosArchivos];
  pintarLista();
  actualizarContador();

  if (debeIniciar) cargarArchivo(0, true);
}

function quitarArchivo(indice) {
  const [archivoEliminado] = archivos.splice(indice, 1);
  if (archivoEliminado) URL.revokeObjectURL(archivoEliminado.url);

  if (!archivos.length) {
    reiniciarReproductor();
    pintarLista();
    actualizarContador();
    return;
  }

  if (indice === indiceActual) {
    cargarArchivo(Math.min(indice, archivos.length - 1), true);
  } else {
    if (indice < indiceActual) indiceActual -= 1;
    pintarLista();
  }

  actualizarContador();
}

function moverArchivo(indiceOrigen, indiceDestino) {
  if (indiceOrigen === indiceDestino || indiceOrigen === null) return;

  const archivoActual = archivos[indiceActual];
  const [archivoMovido] = archivos.splice(indiceOrigen, 1);
  archivos.splice(indiceDestino, 0, archivoMovido);
  indiceActual = archivos.indexOf(archivoActual);
  pintarLista();
}

function pintarLista() {
  listaCanciones.innerHTML = '';

  if (!archivos.length) {
    const vacio = document.createElement('div');
    vacio.className = 'lista-vacia';
    vacio.textContent = 'Todavía no hay canciones ni videos en la cola.';
    listaCanciones.appendChild(vacio);
    return;
  }

  archivos.forEach((item, indice) => {
    const fila = document.createElement('div');
    fila.className = `cancion${indice === indiceActual ? ' activa' : ''}`;
    fila.draggable = true;
    fila.dataset.indice = indice;

    fila.addEventListener('dragstart', (evento) => {
      indiceArrastrado = indice;
      fila.classList.add('arrastrando');
      evento.dataTransfer.effectAllowed = 'move';
      evento.dataTransfer.setData('text/plain', indice.toString());
    });

    fila.addEventListener('dragover', (evento) => {
      evento.preventDefault();
      fila.classList.add('sobre');
    });

    fila.addEventListener('dragleave', () => {
      fila.classList.remove('sobre');
    });

    fila.addEventListener('drop', (evento) => {
      evento.preventDefault();
      fila.classList.remove('sobre');
      moverArchivo(indiceArrastrado, indice);
    });

    fila.addEventListener('dragend', () => {
      indiceArrastrado = null;
      document.querySelectorAll('.cancion').forEach((elemento) => {
        elemento.classList.remove('arrastrando', 'sobre');
      });
    });

    const mover = document.createElement('button');
    mover.className = 'mover';
    mover.type = 'button';
    mover.title = 'Mover en la cola';
    mover.setAttribute('aria-label', `Mover ${item.nombre}`);
    mover.textContent = '☰';

    const icono = document.createElement('span');
    icono.className = 'icono-archivo';
    icono.textContent = item.tipo === 'video' ? '🎬' : '♪';

    const botonDatos = document.createElement('button');
    botonDatos.className = 'datos-cancion';
    botonDatos.type = 'button';
    botonDatos.addEventListener('click', () => cargarArchivo(indice, true));

    const nombre = document.createElement('span');
    nombre.className = 'nombre-cancion';
    nombre.textContent = item.nombre;

    const tipo = document.createElement('span');
    tipo.className = 'tipo-cancion';
    tipo.textContent = item.tipo === 'video' ? 'Video' : 'Audio';

    botonDatos.append(nombre, tipo);

    const quitar = document.createElement('button');
    quitar.className = 'quitar';
    quitar.type = 'button';
    quitar.title = 'Quitar de la cola';
    quitar.setAttribute('aria-label', `Quitar ${item.nombre}`);
    quitar.textContent = '×';
    quitar.addEventListener('click', () => quitarArchivo(indice));

    fila.append(mover, icono, botonDatos, quitar);
    listaCanciones.appendChild(fila);
  });
}

selectorArchivos.addEventListener('change', (evento) => {
  agregarArchivos(evento.target.files);
  selectorArchivos.value = '';
});

zonaArchivos.addEventListener('dragover', (evento) => {
  evento.preventDefault();
  zonaArchivos.classList.add('arrastrando');
});

zonaArchivos.addEventListener('dragleave', () => {
  zonaArchivos.classList.remove('arrastrando');
});

zonaArchivos.addEventListener('drop', (evento) => {
  evento.preventDefault();
  zonaArchivos.classList.remove('arrastrando');
  agregarArchivos(evento.dataTransfer.files);
});

btnReproducir.addEventListener('click', reproducirOPausar);
btnSiguiente.addEventListener('click', siguiente);
btnAnterior.addEventListener('click', anterior);

btnAleatorio.addEventListener('click', () => {
  aleatorioActivo = !aleatorioActivo;
  btnAleatorio.classList.toggle('activo', aleatorioActivo);
});

btnRepetir.addEventListener('click', () => {
  repetirActivo = !repetirActivo;
  btnRepetir.classList.toggle('activo', repetirActivo);
});

btnPantallaCompleta.addEventListener('click', () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
    return;
  }

  pantallaMedia.requestFullscreen();
});

btnSilenciar.addEventListener('click', () => {
  media.muted = !media.muted;

  if (media.muted) {
    volumen.value = 0;
    btnSilenciar.textContent = '🔇';
  } else {
    volumen.value = ultimoVolumen;
    media.volume = ultimoVolumen;
    btnSilenciar.textContent = '🔊';
  }
});

volumen.addEventListener('input', () => {
  const valor = Number(volumen.value);
  media.volume = valor;
  media.muted = valor === 0;
  if (valor > 0) ultimoVolumen = valor;
  btnSilenciar.textContent = media.muted ? '🔇' : '🔊';
});

media.addEventListener('play', () => {
  btnReproducir.textContent = '⏸';
});

media.addEventListener('pause', () => {
  btnReproducir.textContent = '▶';
});

media.addEventListener('loadedmetadata', () => {
  const tiempoTotal = formatoTiempo(media.duration);
  duracion.textContent = tiempoTotal;
  duracionFull.textContent = tiempoTotal;
});

media.addEventListener('timeupdate', () => {
  const total = media.duration || 0;
  const progreso = total ? (media.currentTime / total) * 100 : 0;
  const tiempo = formatoTiempo(media.currentTime);

  barraProgreso.value = progreso;
  barraProgresoFull.value = progreso;
  tiempoActual.textContent = tiempo;
  tiempoActualFull.textContent = tiempo;
});

media.addEventListener('ended', () => {
  if (repetirActivo) {
    media.currentTime = 0;
    media.play();
    return;
  }

  siguiente();
});

barraProgreso.addEventListener('input', () => {
  if (!media.duration) return;
  media.currentTime = (barraProgreso.value / 100) * media.duration;
});

barraProgresoFull.addEventListener('input', () => {
  if (!media.duration) return;
  media.currentTime = (barraProgresoFull.value / 100) * media.duration;
});

btnLimpiar.addEventListener('click', () => {
  archivos.forEach((item) => URL.revokeObjectURL(item.url));
  archivos = [];
  reiniciarReproductor();
  pintarLista();
  actualizarContador();
});

pintarLista();
actualizarContador();
