// ============================================================================
// PROTOCOLO CENIZA — guion y diseño de las 20 misiones
// Hablantes: SIL (Sílex, la agente), IBA (Cte. Ibarra), MAR (Dra. Maren),
//            NOV (Dr. Novak), VAR (Varek), SYS (sistema / megafonía)
// ============================================================================
const SPEAKERS = {
  SIL: { name: 'SÍLEX', role: 'Agente de campo · Sección Nueve', color: '#9fd3ff' },
  IBA: { name: 'CTE. IBARRA', role: 'Control de operación', color: '#ffd28a' },
  MAR: { name: 'DRA. MAREN', role: 'Asesora biológica', color: '#b6f0c2' },
  NOV: { name: 'DR. NOVAK', role: 'Investigador de Halden', color: '#f0c0a0' },
  VAR: { name: 'VAREK', role: 'Grupo Varek · Seguridad privada', color: '#ff8a7a' },
  SYS: { name: 'MEGAFONÍA', role: 'Complejo Thule-7', color: '#c9c9c9' },
};

const PROLOGUE = [
  'Noviembre de 2011. Isla Sólveig, Atlántico Norte, 190 km al oeste de la costa noruega.',
  'La isla está arrendada a Halden Biosystems, una farmacéutica que oficialmente investiga fungicidas agrícolas en el Complejo Thule-7.',
  'Hace 72 horas, el complejo dejó de transmitir. Seis horas después llegó una única señal de socorro, cifrada con una clave que solo conoce un hombre: el Dr. Aurel Novak.',
  'El mensaje decía: «Contención perdida. Varek se lo lleva. No mandéis a nadie que no esté dispuesto a quemarlo todo».',
  'Sección Nueve no existe en ningún presupuesto. Su agente tampoco. Esta noche, una lancha deja a SÍLEX en una playa de roca negra.',
];

const MISSIONS = [
// ---------------------------------------------------------------------------
{ id: 1, title: 'Desembarco', place: 'Playa norte · Perímetro exterior', time: 'Día 1 · 01:40',
  theme: 'snow', layout: 'open', w: 46, h: 34, seed: 101,
  guards: 4, infected: 0, runners: 0, brutes: 0,
  objectives: [ { type: 'reach', label: 'Llega a la escotilla de servicio del muelle' } ],
  docs: [ { title: 'Nota arrugada', body: 'Turno de noche, puesto 4.\n\nNadie contesta en la radio del complejo desde el martes. El coronel dice que es «una avería del repetidor» y que mantengamos la máscara puesta en todo momento, incluso fuera.\n\n¿Desde cuándo una avería de radio se cura con filtros de gas?\n\n— K.' } ],
  intro: [
    ['IBA', 'Sílex, aquí Ibarra. Te recibo claro. ¿Cómo está el agua?'],
    ['SIL', 'A dos grados. Ya no siento los pies. Estoy en la playa.'],
    ['IBA', 'Repaso rápido. Halden contrató al Grupo Varek para la seguridad del complejo. Unos ochenta hombres, ex militares. No son tus enemigos oficialmente, pero no saben que estás aquí, y prefiero que siga así.'],
    ['IBA', 'Objetivo: entrar en Thule-7, encontrar al Dr. Novak y averiguar qué se ha escapado de ese laboratorio. Si es lo que creemos, lo destruyes.'],
    ['MAR', 'Agente, soy la Dra. Ilse Maren. Trabajé para Halden hasta hace dos años. Lleve la máscara de filtro puesta en todo momento. Si en el aire hay esporas, no las verá hasta que sea tarde.'],
    ['IBA', 'Controles de sigilo: agáchate para moverte en silencio, apaga la linterna si quieres pasar desapercibida, y si te ven… rompe la línea de visión y espera. La escotilla del muelle está al este.'],
  ],
  outro: [
    ['SIL', 'Estoy en la escotilla. Los guardias llevan máscaras de gas. Al aire libre.'],
    ['MAR', 'Entonces Varek sabe lo que hay ahí dentro. Y tiene miedo.'],
  ] },
// ---------------------------------------------------------------------------
{ id: 2, title: 'Muelle de carga', place: 'Muelle sur · Almacenes', time: 'Día 1 · 02:25',
  theme: 'docks', layout: 'open', w: 50, h: 36, seed: 202,
  guards: 6, infected: 0, runners: 0, brutes: 0,
  objectives: [
    { type: 'collect', item: 'keycard', count: 1, label: 'Consigue la tarjeta de acceso N1 en la oficina del capataz' },
    { type: 'reach', label: 'Entra en el puesto de control' } ],
  docs: [ { title: 'Manifiesto de carga — Nordkapp', body: 'BUQUE: MV Nordkapp (bandera de Panamá)\nLLEGADA PREVISTA: Día 2, 07:00\nCARGA DE SALIDA: 1 unidad refrigerada, «muestras agrícolas», 4 kg\nAUTORIZA: D. Varek\n\nNota a mano: «Halden no debe ver este manifiesto. El comprador paga en Rotterdam».' } ],
  intro: [
    ['IBA', 'El muelle es el único punto de carga de la isla. Si Varek planea sacar algo, saldrá por aquí.'],
    ['IBA', 'Las puertas interiores van con tarjeta. El capataz del muelle guarda una en su oficina.'],
    ['SIL', 'Si la tarjeta está en una oficina, el capataz no la ha usado en días.'],
    ['IBA', 'Exacto. Busca también papeles. Necesitamos saber qué traman.'],
  ],
  stageRadio: { 1: [ ['IBA', 'Tienes la tarjeta. El puesto de control está al otro lado de los almacenes.'] ] },
  docRadio: [ ['SIL', 'Un manifiesto. Un barco, el Nordkapp, llega mañana a las siete. Carga refrigerada, cuatro kilos.'],
              ['MAR', 'Cuatro kilos de cultivo madre bastan para infectar un continente.'],
              ['IBA', 'Entonces tenemos un plazo. Hasta las siete de la mañana.'] ],
  outro: [ ['IBA', 'Buen trabajo. A partir de ahora no hay vuelta atrás, Sílex.'] ] },
// ---------------------------------------------------------------------------
{ id: 3, title: 'Puesto de control', place: 'Acceso principal · Seguridad', time: 'Día 1 · 03:05',
  theme: 'facility', layout: 'rooms', w: 44, h: 34, seed: 303,
  guards: 6, infected: 1, runners: 0, brutes: 0,
  objectives: [
    { type: 'interact', target: 'relay', count: 2, label: 'Sabotea los 2 relés de la alarma general' },
    { type: 'reach', label: 'Cruza hacia los barracones' } ],
  docs: [ { title: 'Parte de incidencias', body: 'Día −2. 23:50. Brecha de contención en Nivel B. Protocolo de cierre activado.\nDía −2. 23:58. Orden directa del coronel Varek: ignorar las llamadas de auxilio del personal científico. Las puertas de B permanecen selladas.\nDía −1. 04:10. El soldado Haller fue mordido por un técnico. Haller fue aislado en los vestuarios.\nDía −1. 04:30. Ya no responde.' } ],
  intro: [
    ['IBA', 'Cuando hay disparos, la alarma general avisa a todo el complejo. Si cortas sus relés, el puesto de control quedará ciego.'],
    ['SIL', '¿Y si me descubren antes?'],
    ['IBA', 'Entonces no estarás infiltrada. Estarás en guerra con ochenta hombres. Corta los relés.'],
  ],
  stageRadio: { 1: [ ['IBA', 'Alarma general fuera de servicio. Ahora pueden verte, pero no pueden avisar al resto del complejo.'] ] },
  docRadio: [ ['SIL', 'Varek selló el Nivel B con los científicos dentro. Les dejó morir.'],
              ['MAR', 'No es un accidente. Una brecha y una orden de sellado en ocho minutos… estaba preparado.'] ],
  outro: [ ['SIL', 'He visto algo en los vestuarios. Un soldado. Seguía de pie, pero ya no era un soldado.'],
           ['MAR', 'Le llamaban CENIZA. Mordedura o esporas. En horas, el hongo controla el sistema nervioso. Lo que queda solo quiere propagarlo.'] ] },
// ---------------------------------------------------------------------------
{ id: 4, title: 'Barracones', place: 'Ala oeste · Dormitorios del personal', time: 'Día 1 · 03:40',
  theme: 'facility', layout: 'rooms', w: 46, h: 36, seed: 404,
  guards: 3, infected: 5, runners: 0, brutes: 0,
  objectives: [
    { type: 'collect', item: 'tape', count: 1, label: 'Encuentra la grabación de radio de Novak' },
    { type: 'reach', label: 'Avanza hacia el ala médica' } ],
  docs: [ { title: 'Carta sin enviar', body: 'Marta:\n\nNos han cambiado los filtros dos veces esta semana. Dicen que es rutina. Moller se quitó la máscara para fumar en el patio y ahora tose una ceniza naranja.\n\nSi esta carta te llega, no creas lo que diga Halden. Te quiero.\n\n— Piet' } ],
  intro: [
    ['IBA', 'Interceptamos una baliza de radio en los barracones. Puede ser de Novak.'],
    ['MAR', 'Si hay infectados, tenga en cuenta lo siguiente: el ruido los atrae. Las armas sin silenciador, correr… todo les dice dónde está la comida.'],
    ['SIL', 'Y los soldados de Varek, ¿de qué lado están?'],
    ['IBA', 'Del suyo propio. Dispararán a lo que se mueva. Úsalo a tu favor.'],
  ],
  stageRadio: { 1: [
    ['NOV', '«…aquí Novak. Si alguien escucha esto: estoy vivo, en el laboratorio B-3. Me han mordido. Tengo un inhibidor experimental, me da tiempo… días, no semanas. Varek ha robado la cepa madre. No dejéis que salga de esta isla».'],
    ['IBA', 'Está vivo. Nivel B-3. Hay que bajar.'] ] },
  outro: [ ['MAR', 'Un inhibidor… Novak debió de terminar la fórmula que dejé a medias. Si funciona, puede seguir siendo él mismo un tiempo.'] ] },
// ---------------------------------------------------------------------------
{ id: 5, title: 'Ala médica', place: 'Enfermería · Cuarentena', time: 'Día 1 · 04:20',
  theme: 'medical', layout: 'rooms', w: 44, h: 36, seed: 505,
  guards: 0, infected: 8, runners: 1, brutes: 0,
  objectives: [
    { type: 'collect', item: 'keycard', count: 1, label: 'Recupera la tarjeta N2 del jefe médico' },
    { type: 'reach', label: 'Llega al ascensor de servicio' } ],
  docs: [ { title: 'Historia clínica — paciente 07', body: 'Fase 1 (0–2 h): fiebre, pupilas dilatadas.\nFase 2 (2–6 h): agresividad, insensibilidad al dolor. Brotes naranjas bajo la piel.\nFase 3 (+6 h): pérdida de la persona. El hongo dirige el cuerpo hacia el ruido y el calor.\nALGUNOS sujetos de fase 3 corren. No sabemos por qué.\n\nAnotación: el sedante no tiene efecto. Las balas en el torso, poco. Recomendado: distancia.' } ],
  intro: [
    ['IBA', 'Los ascensores al Nivel B necesitan acreditación N2. El jefe médico tenía una.'],
    ['MAR', 'Si el ala médica cayó, él estará allí… de un modo u otro.'],
    ['SIL', 'Entendido. Recoge los botiquines que encuentres, ¿verdad?'],
    ['MAR', 'Todos. Y no deje que la muerdan. Usted no tiene inhibidor.'],
  ],
  stageRadio: { 1: [ ['SIL', 'Tengo la N2. El doctor… ya no la va a necesitar.'] ] },
  outro: [ ['IBA', 'El ascensor de servicio no tiene corriente. Varek cortó la energía del sector.'] ] },
// ---------------------------------------------------------------------------
{ id: 6, title: 'Sala de máquinas', place: 'Subsuelo técnico · Generadores', time: 'Día 1 · 05:00',
  theme: 'industrial', layout: 'rooms', w: 46, h: 36, seed: 606,
  guards: 2, infected: 7, runners: 2, brutes: 0,
  objectives: [
    { type: 'interact', target: 'generator', count: 3, label: 'Arranca los 3 generadores auxiliares' },
    { type: 'reach', label: 'Sube al ascensor de servicio' } ],
  docs: [ { title: 'Orden de servicio', body: 'De: Coronel D. Varek\nA: Sgto. Brandt\n\nCorten la corriente de los ascensores B. Nadie sube, nadie baja. Si un científico aparece en la superficie, se le trata como infectado.\n\nSin excepciones. Sin informes.' } ],
  intro: [
    ['IBA', 'Hay tres generadores auxiliares. Arráncalos y el ascensor tendrá energía.'],
    ['MAR', 'Cuidado: un generador en marcha hace ruido. Mucho ruido.'],
    ['SIL', 'Entonces los arrancaré y me iré corriendo.'],
  ],
  stageRadio: { 1: [ ['IBA', 'Energía restablecida. Los infectados van a ir hacia ese ruido. Sal de ahí.'] ] },
  outro: [ ['SIL', 'Bajando al Nivel B. Ibarra… Varek ordenó tratar a los científicos como infectados.'],
           ['IBA', 'Lo sé. Lo documentaremos todo. Sigue.'] ] },
// ---------------------------------------------------------------------------
{ id: 7, title: 'Archivo B-1', place: 'Nivel B-1 · Registros', time: 'Día 1 · 05:35',
  theme: 'office', layout: 'rooms', w: 44, h: 34, seed: 707,
  guards: 4, infected: 4, runners: 1, brutes: 0,
  objectives: [
    { type: 'interact', target: 'terminal', count: 3, label: 'Descarga los datos de 3 terminales del programa ATLAS' },
    { type: 'reach', label: 'Continúa hacia la galería de cultivo' } ],
  docs: [ { title: 'Programa ATLAS — resumen', body: 'CLASIFICACIÓN: OMEGA\n\nObjetivo: agente biológico autopropagable con control conductual remoto.\nCepa: CENIZA (derivada de fungicida agrícola M-12, autora original: Dra. I. Maren).\nControl: sistema PASTOR (emisores de ultrasonidos, 19 kHz). Los sujetos en fase 3 permanecen latentes dentro del campo y se activan con ruido fuerte.\n\nFinanciación: Halden Biosystems (40 %), [CENSURADO] (60 %).\nEnlace gubernamental: [CENSURADO], Ministerio de [CENSURADO].' } ],
  intro: [
    ['IBA', 'Este archivo guarda los registros del programa que Halden ocultaba. Lo llamaban ATLAS.'],
    ['MAR', 'Descargue todo lo que pueda. Necesito saber qué hicieron con mi trabajo.'],
    ['SIL', '¿Su trabajo, doctora?'],
    ['MAR', 'Se lo explicaré. Ahora no.'],
  ],
  stageRadio: { 1: [
    ['SIL', 'Maren. Aquí pone que CENIZA deriva de un fungicida. Autora: I. Maren.'],
    ['MAR', 'Creé un hongo que mataba plagas de langosta. Halden lo convirtió en esto. Por eso me fui. Por eso estoy ayudando.'],
    ['IBA', 'Sesenta por ciento de la financiación está censurado. Alguien con mucho dinero quería esto. Sigue, Sílex.'] ] },
  outro: [ ['MAR', 'PASTOR… Los infectados latentes que ha visto, quietos, esperando. No están dormidos. Están en un corral.'] ] },
// ---------------------------------------------------------------------------
{ id: 8, title: 'Galería de cultivo', place: 'Nivel B-2 · Invernadero de esporas', time: 'Día 1 · 06:20',
  theme: 'spores', layout: 'rooms', w: 46, h: 36, seed: 808,
  guards: 0, infected: 9, runners: 2, brutes: 0, dormant: true,
  objectives: [
    { type: 'plant', target: 'tank', count: 3, label: 'Coloca C4 en los 3 tanques de esporas' },
    { type: 'reach', label: 'Baja al laboratorio B-3' } ],
  docs: [ { title: 'Diario de cultivo', body: 'Lote 41: crecimiento óptimo a 24 °C y 90 % de humedad.\nLos tanques liberan esporas cada 6 h para mantener la concentración del lote. Si los tanques se rompieran con el sistema de ventilación activo, la galería quedaría saturada.\n\nPor suerte, la ventilación de B-2 es independiente. Las esporas no pueden llegar a la superficie.\n\nSalvo que alguien abra las compuertas.' } ],
  intro: [
    ['MAR', 'La galería de cultivo produce las esporas. Si la destruye, CENIZA solo podrá propagarse por mordedura.'],
    ['IBA', 'Tienes C4. Coloca una carga en cada tanque. Explotarán poco después.'],
    ['MAR', 'Aquí funciona un campo PASTOR. Los infectados estarán latentes… hasta que haya ruido. Y una explosión es mucho ruido.'],
  ],
  stageRadio: { 1: [ ['IBA', 'Galería destruida. Y has despertado a todo el corral. Muévete.'] ] },
  outro: [ ['SIL', 'Una cosa menos. Bajo al B-3.'] ] },
// ---------------------------------------------------------------------------
{ id: 9, title: 'Laboratorio B-3', place: 'Nivel B-3 · Laboratorio sellado', time: 'Día 1 · 07:10',
  theme: 'lab', layout: 'rooms', w: 44, h: 34, seed: 909,
  guards: 2, infected: 7, runners: 2, brutes: 1,
  objectives: [
    { type: 'collect', item: 'code', count: 2, label: 'Encuentra los 2 códigos de apertura del laboratorio' },
    { type: 'reach', label: 'Abre el laboratorio sellado y encuentra a Novak' } ],
  docs: [ { title: 'Aviso en la puerta', body: 'DR. NOVAK — LAB B-3\n\nHe sellado la puerta desde dentro. El código está dividido: la mitad la tiene la jefa de turno, la otra mitad está en el armario de seguridad del pasillo este.\n\nSi lees esto y aún eres humano: date prisa.' } ],
  intro: [
    ['IBA', 'La señal de Novak viene de ese laboratorio. La puerta está sellada con un código de dos partes.'],
    ['MAR', 'Hay algo grande en el pasillo. Una firma térmica enorme. Tenga cuidado.'],
  ],
  stageRadio: { 1: [ ['SIL', 'Tengo el código completo. Voy a por él.'] ] },
  outro: [
    ['NOV', '¿Eres… real? Baja el arma. Todavía soy yo. El inhibidor aguanta.'],
    ['SIL', 'Dr. Novak. Me envía Sección Nueve. ¿Qué ha pasado aquí?'],
    ['NOV', 'Varek provocó la brecha. Abrió la galería mientras robaba la cepa madre. Necesitaba que no quedaran testigos. Y PASTOR… PASTOR le permite usar a los infectados como perros guardianes.'],
    ['NOV', 'Puedo demostrarlo todo. Los registros de PASTOR están en la sala de servidores. Llévame allí.'] ] },
// ---------------------------------------------------------------------------
{ id: 10, title: 'Escolta', place: 'Nivel B-3 · Corredores de servicio', time: 'Día 1 · 07:50',
  theme: 'lab', layout: 'rooms', w: 46, h: 34, seed: 1010,
  guards: 3, infected: 6, runners: 2, brutes: 0, escort: true,
  objectives: [ { type: 'reach', escort: true, label: 'Escolta al Dr. Novak hasta la sala de servidores' } ],
  docs: [ { title: 'Notas de Novak', body: 'Inhibidor N-4, dosis cada 6 horas. Me quedan tres dosis.\n\nDieciocho horas. Si al final de ese tiempo no hemos salido, no quiero ser uno de ellos. Que alguien se encargue.\n\n— A.N.' } ],
  intro: [
    ['NOV', 'Mantente cerca. Estoy débil, no puedo correr mucho.'],
    ['IBA', 'Si Novak cae, perdemos al único testigo. Protégelo.'],
    ['SIL', 'Doctor, quédese detrás de mí y no haga ruido.'],
  ],
  outro: [ ['NOV', 'La sala de servidores. Dame tiempo para descargar los registros de PASTOR.'] ] },
// ---------------------------------------------------------------------------
{ id: 11, title: 'Sala de servidores', place: 'Nivel B-3 · Núcleo de datos', time: 'Día 1 · 08:30',
  theme: 'server', layout: 'arena', w: 26, h: 20, seed: 1111,
  guards: 0, infected: 0, runners: 0, brutes: 0, survive: 90, waves: true,
  objectives: [ { type: 'survive', seconds: 90, label: 'Protege a Novak mientras descarga los registros (90 s)' } ],
  docs: [],
  intro: [
    ['NOV', 'La descarga tarda noventa segundos. El ruido de los servidores va a atraerlos.'],
    ['SIL', 'Pues que vengan.'],
    ['MAR', 'Agente, no se aleje de él.'],
  ],
  outro: [
    ['NOV', 'Ya está. Mira esto: Varek no solo robó la cepa. Se inyectó la versión estabilizada, CENIZA-Ω. Su máscara falló durante la brecha.'],
    ['NOV', 'Omega le mantiene consciente… y le hace resonar con PASTOR. Los infectados le obedecen. Pero también le está cambiando.'],
    ['IBA', 'Un hombre que comanda una horda. Esto escala, Sílex.'] ] },
// ---------------------------------------------------------------------------
{ id: 12, title: 'Interferencia', place: 'Azotea · Torre de antenas', time: 'Día 1 · 09:40',
  theme: 'snow', layout: 'open', w: 44, h: 32, seed: 1212,
  guards: 8, infected: 0, runners: 0, brutes: 0,
  objectives: [
    { type: 'interact', target: 'antenna', count: 1, label: 'Instala el inhibidor de señal en la antena principal' },
    { type: 'reach', label: 'Vuelve al interior por la escalera de servicio' } ],
  docs: [ { title: 'Mensaje interceptado', body: 'CANAL: Sección Nueve — Control\nDESTINATARIO: Cte. T. Ibarra\nASUNTO: Prioridad revisada\n\nLa destrucción de la cepa queda SUSPENDIDA. La agente deberá recuperar una muestra viable de CENIZA y del sistema PASTOR.\nEl Ministerio considera que ATLAS es una inversión estratégica.\nLa agente no debe ser informada.' } ],
  intro: [
    ['MAR', 'Agente, no hable. Esto no es el canal de Ibarra. Necesito que suba a la torre de antenas e instale un inhibidor. Solo así podré hablarle sin que nos escuchen.'],
    ['SIL', 'Maren, ¿qué pasa?'],
    ['MAR', 'Hágalo. Por favor. Luego lo entenderá.'],
  ],
  stageRadio: { 1: [
    ['MAR', 'Ya podemos hablar. Lea el mensaje que intercepté. Ibarra lo recibió hace cuatro horas.'],
    ['SIL', 'El sesenta por ciento censurado… era nuestro propio Ministerio.'],
    ['MAR', 'Le han cambiado la misión sin decírselo. Quieren CENIZA para ellos. Yo solo quiero que desaparezca.'],
    ['SIL', 'Ibarra me lo habría contado.'],
    ['MAR', 'Pregúnteselo. Cuando esté preparada.'] ] },
  outro: [ ['IBA', 'Sílex, he perdido tu señal unos minutos. ¿Todo bien?'],
           ['SIL', 'Interferencias por la nieve. Sigo adelante.'] ] },
// ---------------------------------------------------------------------------
{ id: 13, title: 'Cámara frigorífica', place: 'Nivel B-2 · Almacenamiento criogénico', time: 'Día 1 · 10:30',
  theme: 'cold', layout: 'rooms', w: 46, h: 34, seed: 1313,
  guards: 3, infected: 8, runners: 2, brutes: 0,
  objectives: [
    { type: 'collect', item: 'code', count: 3, label: 'Recupera los 3 fragmentos del código de la Bóveda' },
    { type: 'reach', label: 'Dirígete a la Bóveda' } ],
  docs: [ { title: 'Protocolo de la Bóveda', body: 'El acceso a la Bóveda requiere tres fragmentos de código, custodiados por tres investigadores principales: Lind, Okafor y Reyes.\n\nNinguno de los tres sobrevivió a la primera hora de la brecha. Varek lo sabía. Tal vez por eso aún no ha abierto la Bóveda.\n\nO tal vez ya no necesitaba hacerlo.' } ],
  intro: [
    ['NOV', 'Varek se jactó de llevarse la cepa, pero la Bóveda exige tres códigos, repartidos entre tres investigadores. Sus cuerpos deben de seguir en la cámara frigorífica.'],
    ['IBA', 'Si Varek no tenía los códigos, puede que la cepa siga dentro. Encuéntralos.'],
    ['SIL', '¿Y después, Ibarra? ¿Qué hago con ella?'],
    ['IBA', '…Destruirla. Como acordamos.'],
  ],
  stageRadio: { 1: [ ['SIL', 'Tengo los tres fragmentos. Ibarra ha tardado un segundo de más en responderme.'], ['MAR', 'Lo he oído.'] ] },
  outro: [ ['NOV', 'La Bóveda está al final del Nivel B-2. Ten cuidado: si Varek la vigila, no dejará entrar a nadie.'] ] },
// ---------------------------------------------------------------------------
{ id: 14, title: 'La Bóveda', place: 'Nivel B-2 · Bóveda de cepas', time: 'Día 1 · 11:45',
  theme: 'vault', layout: 'rooms', w: 44, h: 34, seed: 1414,
  guards: 9, infected: 0, runners: 0, brutes: 0, forceAlert: true,
  objectives: [
    { type: 'interact', target: 'vault', count: 1, label: 'Abre la Bóveda con el código' },
    { type: 'reach', label: '¡Emboscada! Escapa hacia los túneles de drenaje' } ],
  docs: [ { title: 'Registro de la Bóveda', body: 'ÚLTIMA APERTURA: Día −2, 23:41.\nAUTORIZACIÓN: código maestro de emergencia (Halden Corp.).\nCONTENIDO RETIRADO: Cepa madre CENIZA (4 kg), lote Ω (12 dosis).\n\nEl código maestro de Halden solo lo tenían dos personas fuera de la isla.' } ],
  intro: [
    ['SIL', 'Estoy ante la Bóveda. Introduzco el código.'],
    ['MAR', 'Algo no cuadra. El pasillo está demasiado limpio.'],
  ],
  stageRadio: { 1: [
    ['SIL', 'Está vacía. La abrieron nueve minutos antes de la brecha. Con un código maestro de Halden.'],
    ['VAR', 'Por fin. La sombra que se cuela en mi isla. ¿Buscabas esto? Llegas dos días tarde, agente.'],
    ['VAR', 'Halden me dio el código. Tu gobierno pagó la mitad. Y yo me quedo con todo. Matadla.'],
    ['IBA', '¡Sílex! Sal de ahí. Los túneles de drenaje, al norte. ¡Corre!'] ] },
  outro: [ ['SIL', 'Halden le dio el código. Ibarra, ¿mi gobierno pagó la mitad de esto?'],
           ['IBA', '…Hablaremos cuando estés a salvo.'] ] },
// ---------------------------------------------------------------------------
{ id: 15, title: 'Alcantarillas', place: 'Túneles de drenaje', time: 'Día 1 · 13:00',
  theme: 'sewer', layout: 'rooms', w: 50, h: 36, seed: 1515,
  guards: 0, infected: 12, runners: 4, brutes: 1,
  objectives: [
    { type: 'collect', item: 'tape', count: 1, label: 'Encuentra el diario de voz de Varek' },
    { type: 'reach', label: 'Llega al hangar' } ],
  docs: [ { title: 'Inventario Ω', body: 'Lote Ω — 12 dosis.\nDosis administradas: 1 (sujeto: D. Varek, día −2).\nEfectos observados: consciencia conservada, resonancia PASTOR (19 kHz), regeneración tisular.\nEfectos tardíos (estimados): hipertrofia, pérdida progresiva de la personalidad.\n\n«No es una cura. Es una correa con dos extremos».' } ],
  intro: [
    ['MAR', 'Los túneles conectan con el hangar. Varek tiene un helicóptero allí. Si se adelanta al Nordkapp, se lo llevará en el aire.'],
    ['IBA', 'No hay luz ahí abajo. Usa la linterna, pero recuerda que también la ven ellos.'],
  ],
  stageRadio: { 1: [
    ['VAR', '«Diario, día −1. La máscara se rompió durante la brecha. Me inyecté Omega. Oigo el zumbido de PASTOR dentro de la cabeza. Me obedecen. Vienen cuando los llamo. Esto no es una enfermedad. Es una corona».'],
    ['NOV', 'Está perdiendo la cabeza. Y tiene un ejército.'] ] },
  outro: [ ['IBA', 'Estás bajo el hangar. El helicóptero se está repostando. Tienes poco tiempo.'] ] },
// ---------------------------------------------------------------------------
{ id: 16, title: 'Hangar', place: 'Hangar este · Pista de helicópteros', time: 'Día 1 · 14:10',
  theme: 'hangar', layout: 'open', w: 46, h: 34, seed: 1616,
  guards: 9, infected: 0, runners: 0, brutes: 0,
  objectives: [
    { type: 'plant', target: 'fuel', count: 2, label: 'Coloca C4 en los 2 depósitos de combustible' },
    { type: 'plant', target: 'heli', count: 1, label: 'Inutiliza el helicóptero' },
    { type: 'reach', label: 'Huye a la torre PASTOR' } ],
  docs: [ { title: 'Plan de vuelo', body: 'Destino: plataforma Stord-4. Transbordo al MV Nordkapp.\nPasajeros: 1 (coronel).\nCarga: 1 contenedor refrigerado.\n\nNota: el resto del Grupo Varek NO ha sido informado de la evacuación.' } ],
  intro: [
    ['IBA', 'Sílex. Antes de que entres… tienes derecho a saberlo. Hace horas recibí nuevas órdenes. Recuperar una muestra de CENIZA. No destruirla.'],
    ['SIL', 'Lo sé. Maren lo interceptó.'],
    ['IBA', 'Las órdenes no han cambiado. Te pido que las cumplas.'],
    ['SIL', 'Y yo le pido que me diga qué haría usted en mi lugar.'],
    ['IBA', '…Sabotea el helicóptero. Lo demás, lo decidirás tú.'],
  ],
  stageRadio: { 1: [ ['SIL', 'Depósitos listos. Ahora el pájaro.'] ], 2: [ ['VAR', '¡Mi helicóptero! Muy bien, agente. Si no puedo irme, nadie saldrá de esta isla. Que despierte el rebaño.'] ] },
  outro: [ ['NOV', 'Está activando PASTOR a plena potencia. Va a lanzar a todos los infectados de la isla contra el muelle.'],
           ['MAR', 'Si apaga los emisores, perderá el control sobre ellos.'] ] },
// ---------------------------------------------------------------------------
{ id: 17, title: 'Pastor', place: 'Torre PASTOR · Campo de emisores', time: 'Día 1 · 15:30',
  theme: 'snow', layout: 'open', w: 46, h: 34, seed: 1717,
  guards: 2, infected: 14, runners: 5, brutes: 1,
  objectives: [
    { type: 'interact', target: 'emitter', count: 3, label: 'Desactiva los 3 emisores PASTOR' },
    { type: 'reach', label: 'Entra en el sector del reactor' } ],
  docs: [ { title: 'Esquema PASTOR', body: 'Tres emisores periféricos sincronizados por el núcleo central, ubicado en la sala de turbinas del reactor (alto consumo).\n\nSi se pierde la sincronización, los sujetos de fase 3 recuperan su comportamiento natural: dispersión y caza por ruido.\n\nEl núcleo no puede apagarse sin detener el reactor.' } ],
  intro: [
    ['MAR', 'Tres emisores alrededor de la torre. Apáguelos y Varek perderá la correa.'],
    ['NOV', 'Los infectados se dispersarán por la isla. Ya no actuarán como un ejército.'],
    ['IBA', 'Y el núcleo de PASTOR está en el reactor. Que es donde Varek se esconde.'],
  ],
  stageRadio: { 1: [ ['VAR', '¿Lo oyes, agente? Mis niños están confusos. Ven a por mí. Estoy en el corazón de la isla.'] ] },
  outro: [ ['IBA', 'Sílex. Si sobrecargas el reactor, el núcleo PASTOR y la cepa madre se volatilizarán. No quedará muestra.'],
           ['SIL', 'Ese es el plan.'],
           ['IBA', '…Entonces que sea rápido.'] ] },
// ---------------------------------------------------------------------------
{ id: 18, title: 'Núcleo', place: 'Sector del reactor · Control de refrigeración', time: 'Día 1 · 16:20',
  theme: 'reactor', layout: 'rooms', w: 46, h: 34, seed: 1818,
  guards: 4, infected: 9, runners: 3, brutes: 1,
  objectives: [
    { type: 'interact', target: 'console', count: 3, label: 'Desactiva las 3 bombas de refrigeración del reactor' },
    { type: 'reach', label: 'Entra en la sala de turbinas' } ],
  docs: [ { title: 'Último mensaje de Novak', body: 'Sílex:\n\nMe queda una dosis. No la voy a usar. Me quedo en la compuerta del sector y la mantendré cerrada mientras tú trabajas. Nada entrará detrás de ti.\n\nDile a Ilse que el inhibidor funcionó. Que su trabajo, al final, sirvió para algo bueno.\n\n— Aurel' } ],
  intro: [
    ['NOV', 'Sílex, escucha. La compuerta de este sector se cierra a mano, desde fuera. Alguien tiene que quedarse.'],
    ['SIL', 'No. Saldremos los dos.'],
    ['NOV', 'Mi inhibidor se acaba. Prefiero ser útil que ser uno de ellos. Ve. No mires atrás.'],
    ['MAR', 'Aurel…'],
  ],
  stageRadio: { 1: [ ['SYS', 'ATENCIÓN. REFRIGERACIÓN DEL REACTOR DESACTIVADA. TEMPERATURA DEL NÚCLEO EN AUMENTO.'], ['IBA', 'Está hecho. Varek está en la sala de turbinas. Y te espera.'] ] },
  outro: [ ['NOV', 'La compuerta aguanta. Te oigo, Sílex. Hazlo bien.'] ] },
// ---------------------------------------------------------------------------
{ id: 19, title: 'Varek', place: 'Sala de turbinas · Núcleo PASTOR', time: 'Día 1 · 17:00',
  theme: 'reactor', layout: 'arena', w: 26, h: 22, seed: 1919,
  guards: 0, infected: 2, runners: 2, brutes: 0, boss: true,
  objectives: [ { type: 'boss', label: 'Derrota a Varek' } ],
  docs: [],
  intro: [
    ['VAR', 'Aquí estás. Mírame, agente. Omega me ha hecho mejor. Ya no tengo miedo, no tengo frío, no tengo dueño.'],
    ['SIL', 'Tienes la cepa madre.'],
    ['VAR', 'La llevo encima. Si me quieres quitar la corona, tendrás que arrancármela.'],
    ['MAR', 'Agente: el tejido de Omega es débil al daño continuado. Dispare a los brotes cuando brillen y no deje de moverse.'],
  ],
  outro: [ ['VAR', 'Lo oigo… el zumbido… se apaga…'],
           ['SIL', 'Cepa madre recuperada. El contenedor se rompe con el calor. Se acabó, Varek.'],
           ['SYS', 'ALERTA. FUSIÓN DEL NÚCLEO EN CUATRO MINUTOS. EVACUEN EL COMPLEJO.'] ] },
// ---------------------------------------------------------------------------
{ id: 20, title: 'Ceniza', place: 'Complejo Thule-7 · Evacuación', time: 'Día 1 · 17:12',
  theme: 'burning', layout: 'rooms', w: 50, h: 36, seed: 2020,
  guards: 3, infected: 12, runners: 5, brutes: 1, escape: 240,
  objectives: [ { type: 'reach', label: 'Escapa al muelle antes de la fusión del núcleo' } ],
  docs: [ { title: 'Expediente ATLAS (copia)', body: 'Sílex conserva una copia de los registros de ATLAS y del sistema PASTOR descargados por el Dr. Novak.\n\nPruebas: brecha intencionada, abandono de personal civil, financiación ministerial de un arma biológica prohibida por la Convención de 1972.\n\nDestino de esta copia: a decidir por la agente.' } ],
  intro: [
    ['IBA', 'Sílex, escúchame bien. He cancelado la orden de recuperar la muestra. Asumo la responsabilidad.'],
    ['IBA', 'Hay un pesquero esperando en el muelle sur, el Hildur. Cuatro minutos. No tienes más.'],
    ['SIL', '¿Y usted, Ibarra?'],
    ['IBA', 'Yo tengo un informe que escribir. Y una dimisión que firmar. Corre.'],
  ],
  outro: [
    ['SIL', 'Estoy en el barco. Ibarra… el complejo se está hundiendo en el fuego.'],
    ['MAR', 'La cepa, la galería, PASTOR… todo se ha convertido en ceniza. Gracias, agente. Por Aurel. Por todos.'],
    ['IBA', 'Llevas en el bolsillo las pruebas de ATLAS. El Ministerio quiere que las destruyas.'],
    ['SIL', 'El Ministerio quería un arma. Va a tener un juicio.'],
  ] },
];

const EPILOGUE = [
  'El Complejo Thule-7 quedó destruido a las 17:16. Las autoridades noruegas lo atribuyeron a un fallo del reactor de investigación.',
  'Ningún infectado sobrevivió al invierno de la isla sin el campo PASTOR y sin las esporas de la galería.',
  'Tres semanas después, un tribunal de La Haya recibió un expediente anónimo sobre el programa ATLAS. Dos ministros dimitieron. Halden Biosystems fue intervenida.',
  'El comandante Tomás Ibarra testificó a puerta cerrada. Nunca volvió a dirigir una operación.',
  'La Dra. Ilse Maren utilizó la fórmula del inhibidor N-4 para desarrollar un tratamiento contra la cepa original. Lo bautizó «Novak».',
  'Sección Nueve sigue sin existir. Su agente, tampoco.',
];

// ============================================================================
// PUZLES — cerraduras, códigos, secuencias y fusibles integrados en el guion.
// Cada entrada sustituye los objetivos de la misión y añade diálogos/documentos.
//   door     → puerta con llave (where: 'choke' corta el camino; 'exit' en la salida)
//   keypad   → teclado numérico (code: 'doc' | 'fragments' | 'vault' | 'radio')
//   sequence → activar N elementos en el orden indicado en un documento
// ============================================================================
const PUZZLES = {
  1: {
    objectives: [
      { type: 'door', key: 'Llave de la escotilla', where: 'exit', label: 'La escotilla tiene candado: encuentra su llave y ábrela' },
      { type: 'reach', label: 'Entra por la escotilla de servicio' } ],
    introAdd: [['IBA', 'Un detalle: la escotilla tiene un candado de obra. Los guardias del perímetro guardan la llave en alguna de las garitas.']],
    stageRadio: { 1: [['SIL', 'Candado abierto. Bajo.']] },
  },
  2: {
    objectives: [
      { type: 'collect', item: 'keycard', count: 1, label: 'Consigue la tarjeta de acceso N1 en la oficina del capataz' },
      { type: 'keypad', where: 'choke', code: 'doc', doc: { title: 'Pósit en una taquilla', note: 'Puerta del almacén 3', body: 'Brandt:\n\nEl código de la puerta del almacén 3 es {CODE}.\nApréndetelo de una vez y deja de pegarlo en las taquillas.\n\n— El capataz' }, label: 'La puerta del almacén 3 va con código: averigua cuál es' },
      { type: 'reach', label: 'Entra en el puesto de control' } ],
    stageRadio: { 1: [['IBA', 'Tienes la tarjeta. Pero la puerta del almacén 3 va con código. Alguien lo tendrá apuntado.']], 2: [['IBA', 'Dentro. El puesto de control está al otro lado.']] },
  },
  3: {
    objectives: [
      { type: 'interact', target: 'relay', count: 2, label: 'Sabotea los 2 relés de la alarma general' },
      { type: 'keypad', where: 'choke', code: 'doc', doc: { title: 'Cuaderno del vigilante', note: 'Paso a barracones', body: 'Turno de noche.\n\nCódigo de paso a barracones (cambia cada día): {CODE}\n\nHaller sigue encerrado en los vestuarios. Golpea la puerta cada vez que alguien pasa.\nNo vamos a abrir.' }, label: 'Abre el paso a los barracones con el código del día' },
      { type: 'reach', label: 'Cruza hacia los barracones' } ],
    stageRadio: { 1: [['IBA', 'Alarma general fuera de servicio. Ahora pueden verte, pero no pueden avisar al resto del complejo.']], 2: [['SIL', 'Código aceptado.']] },
  },
  4: {
    objectives: [
      { type: 'collect', item: 'tape', count: 1, label: 'Encuentra la grabación de radio de Novak' },
      { type: 'door', key: 'Llave de la armería', where: 'choke', label: 'La armería corta el paso: encuentra la llave del sargento Brandt' },
      { type: 'reach', label: 'Avanza hacia el ala médica' } ],
    stageRadio: { 2: [['SIL', 'La armería. Hay una escopeta táctica. Me la llevo.'], ['IBA', 'Úsala con cabeza: no lleva silenciador.']] },
  },
  5: {
    objectives: [
      { type: 'collect', item: 'keycard', count: 1, label: 'Recupera la tarjeta N2 del jefe médico' },
      { type: 'keypad', where: 'choke', code: 'doc', doc: { title: 'Pizarra de enfermería', note: 'Puerta de aislamiento', body: 'TURNO C — CUARENTENA\n\n· Cama 3: la sedación no hace efecto.\n· Cama 7: trasladado a aislamiento.\n· Código de la puerta de aislamiento: {CODE}\n  (NO dárselo a seguridad).\n\nSi los pacientes de fase 3 se levantan, NO abráis.' }, label: 'Abre la puerta de aislamiento (el código está apuntado en la enfermería)' },
      { type: 'reach', label: 'Llega al ascensor de servicio' } ],
    stageRadio: { 2: [['MAR', 'Aislamiento abierto. Lo que hubiera dentro ya no está encerrado. Cuidado.']] },
  },
  6: {
    objectives: [
      { type: 'collect', item: 'fuse', count: 2, label: 'Encuentra 2 fusibles de repuesto para el cuadro del ascensor' },
      { type: 'interact', target: 'fusebox', count: 1, label: 'Coloca los fusibles en el cuadro eléctrico' },
      { type: 'interact', target: 'generator', count: 3, label: 'Arranca los 3 generadores auxiliares' },
      { type: 'reach', label: 'Sube al ascensor de servicio' } ],
    docsAdd: [{ title: 'Aviso de mantenimiento', body: 'Los fusibles del cuadro del ascensor B se fundieron con la sobrecarga del día −2.\n\nHay repuestos en el almacén técnico y en la taquilla del turno de noche.\nSin fusibles, los generadores no alimentan el ascensor.' }],
    introAdd: [['MAR', 'Y otra cosa: el cuadro del ascensor tiene los fusibles fundidos. Sin repuestos, los generadores no servirán de nada.']],
    stageRadio: { 1: [['IBA', 'Tienes los fusibles. Ahora, el cuadro eléctrico.']], 2: [['SIL', 'Cuadro reparado. Faltan los generadores.']], 3: [['IBA', 'Energía restablecida. Los infectados van a ir hacia ese ruido. Sal de ahí.']] },
  },
  7: {
    objectives: [
      { type: 'interact', target: 'terminal', count: 3, label: 'Descarga los datos de 3 terminales del programa ATLAS' },
      { type: 'door', key: 'Tarjeta del archivero', where: 'choke', label: 'El paso a la galería está cerrado: busca la tarjeta del archivero' },
      { type: 'reach', label: 'Continúa hacia la galería de cultivo' } ],
    stageRadio: { 1: [['SIL', 'Maren. Aquí pone que CENIZA deriva de un fungicida. Autora: I. Maren.'], ['MAR', 'Creé un hongo que mataba plagas de langosta. Halden lo convirtió en esto. Por eso me fui. Por eso estoy ayudando.'], ['IBA', 'Sesenta por ciento de la financiación está censurado. Alguien con mucho dinero quería esto. Sigue, Sílex.']] },
  },
  8: {
    objectives: [
      { type: 'sequence', target: 'valve', count: 3, noteLabel: 'Válvulas de ventilación B-2', doc: { title: 'Protocolo de ventilación B-2', body: 'En caso de incidente en la galería, cerrar las válvulas de ventilación en este orden EXACTO:\n\n{ORDER}\n\nUn orden incorrecto provoca una descarga de presión. Es ruidosa. Muy ruidosa.\n\nCon la ventilación cerrada, nada de lo que ocurra en la galería llegará a la superficie.' }, label: 'Cierra las 3 válvulas de ventilación en el orden del protocolo' },
      { type: 'plant', target: 'tank', count: 3, label: 'Coloca C4 en los 3 tanques de esporas' },
      { type: 'reach', label: 'Baja al laboratorio B-3' } ],
    introAdd: [['MAR', 'Antes de volar nada, cierre la ventilación. Si no, la explosión empujará las esporas a la superficie. Debe de haber un protocolo con el orden de las válvulas.']],
    stageRadio: { 1: [['MAR', 'Ventilación cerrada. Ahora sí: los tanques.']], 2: [['IBA', 'Galería destruida. Y has despertado a todo el corral. Muévete.']] },
    fail: 'La válvula silba con una descarga de presión. Todo el sector la ha oído.',
  },
  9: {
    objectives: [
      { type: 'collect', item: 'code', count: 2, label: 'Encuentra las 2 mitades del código del laboratorio' },
      { type: 'keypad', where: 'exit', code: 'fragments', label: 'Introduce el código en la puerta sellada del laboratorio B-3' },
      { type: 'reach', label: 'Entra y encuentra a Novak' } ],
    stageRadio: { 1: [['SIL', 'Tengo las dos mitades. Las he apuntado.']] },
  },
  12: {
    objectives: [
      { type: 'collect', item: 'fuse', count: 2, label: 'La antena no tiene corriente: encuentra 2 fusibles' },
      { type: 'interact', target: 'antenna', count: 1, label: 'Instala el inhibidor de señal en la antena principal' },
      { type: 'reach', label: 'Vuelve al interior por la escalera de servicio' } ],
    introAdd: [['MAR', 'La antena lleva apagada desde la brecha: necesitará dos fusibles. Los guardias de la azotea tienen material en sus casetas.']],
    stageRadio: { 1: [['MAR', 'Bien. Ahora instale el inhibidor en la antena.']], 2: [['MAR', 'Ya podemos hablar. Lea el mensaje que intercepté. Ibarra lo recibió hace cuatro horas.'], ['SIL', 'El sesenta por ciento censurado… era nuestro propio Ministerio.'], ['MAR', 'Le han cambiado la misión sin decírselo. Quieren CENIZA para ellos. Yo solo quiero que desaparezca.'], ['SIL', 'Ibarra me lo habría contado.'], ['MAR', 'Pregúnteselo. Cuando esté preparada.']] },
  },
  13: {
    objectives: [
      { type: 'collect', item: 'code', count: 3, label: 'Recupera los 3 fragmentos del código de la Bóveda' },
      { type: 'door', key: 'Tarjeta de criogenia', where: 'choke', label: 'La salida de la cámara está bloqueada: busca la tarjeta de criogenia' },
      { type: 'reach', label: 'Dirígete a la Bóveda' } ],
    saveCode: 'vaultCode',
    stageRadio: { 1: [['SIL', 'Tengo los tres fragmentos. Los he apuntado. Ibarra ha tardado un segundo de más en responderme.'], ['MAR', 'Lo he oído.']] },
  },
  14: {
    objectives: [
      { type: 'keypad', where: 'room', mesh: 'vault', code: 'vault', label: 'Abre la Bóveda con el código de seis cifras (consulta tus notas)' },
      { type: 'reach', label: '¡Emboscada! Escapa hacia los túneles de drenaje' } ],
  },
  15: {
    objectives: [
      { type: 'collect', item: 'tape', count: 1, label: 'Encuentra el diario de voz de Varek' },
      { type: 'sequence', target: 'floodgate', count: 3, noteLabel: 'Compuertas del colector', doc: { title: 'Plano del colector principal', body: 'Para vaciar el colector y pasar al hangar, abrir las compuertas en este orden:\n\n{ORDER}\n\nEn cualquier otro orden el agua retrocede de golpe. El estruendo se oye en todo el subsuelo.' }, label: 'Abre las 3 compuertas del colector en el orden correcto' },
      { type: 'reach', label: 'Llega al hangar' } ],
    stageRadio: { 2: [['IBA', 'El colector se vacía. El camino al hangar está libre.']] },
    fail: 'El agua retrocede con un estruendo. Algo ahí abajo lo ha oído.',
  },
  17: {
    objectives: [
      { type: 'interact', target: 'emitter', count: 3, label: 'Desactiva los 3 emisores PASTOR' },
      { type: 'door', key: 'Llave del sector del reactor', where: 'exit', label: 'El sector del reactor está cerrado: la llave la llevaba un técnico' },
      { type: 'reach', label: 'Entra en el sector del reactor' } ],
  },
  18: {
    objectives: [
      { type: 'sequence', target: 'console', count: 3, noteLabel: 'Bombas de refrigeración', doc: { title: 'Manual de emergencia — Reactor', body: 'PARADA DE REFRIGERACIÓN\n(solo personal autorizado)\n\nDesactivar las bombas en este orden:\n\n{ORDER}\n\nCualquier otro orden dispara el bloqueo de seguridad y reinicia las tres bombas.' }, label: 'Desactiva las 3 bombas de refrigeración en el orden del manual' },
      { type: 'reach', label: 'Entra en la sala de turbinas' } ],
    fail: 'Bloqueo de seguridad: las bombas se reinician con un estruendo.',
  },
  20: {
    objectives: [
      { type: 'keypad', where: 'exit', code: 'radio', label: 'Abre la puerta del muelle con el código que te da Ibarra' },
      { type: 'reach', label: 'Sube al pesquero antes de la fusión del núcleo' } ],
    radioCode: [['IBA', 'Sílex, la puerta del muelle tiene cierre de emergencia. Código: {CODE}. Repito: {CODE}. Está en tus notas.']],
  },
};
for (const [id, P] of Object.entries(PUZZLES)) {
  const M = MISSIONS[id - 1];
  M.objectives = P.objectives;
  if (P.introAdd) M.intro = M.intro.concat(P.introAdd);
  if (P.docsAdd) M.docs = (M.docs || []).concat(P.docsAdd);
  if (P.stageRadio) M.stageRadio = Object.assign({}, M.stageRadio, P.stageRadio);
  ['saveCode', 'radioCode', 'fail'].forEach(k => { if (P[k]) M[k] = P[k]; });
}
