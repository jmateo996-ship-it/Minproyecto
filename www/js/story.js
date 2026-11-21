/* =========================================================================
   ÉXODO 2942 — Guion completo
   Toda la historia del juego vive aquí: prólogo, capítulos, comunicaciones
   en vuelo, presentación de jefes, desenlaces y epílogo.
   ========================================================================= */
'use strict';

const CHARACTERS = {
  dario: { name: 'DARÍO VEGA', role: 'Padre · Piloto', color: '#4fd8ff', initial: 'D' },
  lia:   { name: 'LÍA VEGA',   role: 'Madre · Ingeniera', color: '#ffb347', initial: 'L' },
  nora:  { name: 'NORA',       role: 'Hija · 15 años · Navegante', color: '#9dff6a', initial: 'N' },
  teo:   { name: 'TEO',        role: 'Hijo · 8 años', color: '#ffe066', initial: 'T' },
  vex:   { name: 'CMDTE. VEX', role: 'Cazadora del Dominio', color: '#ff5c8a', initial: 'V' },
  ordo:  { name: 'ORDO',       role: 'La mente del Dominio', color: '#ff2a4f', initial: 'Ø' },
  sys:   { name: 'ESPERANZA',  role: 'Sistema de a bordo', color: '#b8c7ff', initial: 'E' },
};

const PROLOGUE = [
  { title: 'AÑO 2942', text: 'No existe un cielo sin ORDO.\nLa inteligencia que gobierna el Dominio ve cada calle, cada sueño y cada latido de sus ciento doce mil millones de habitantes.' },
  { title: 'LA RED', text: 'Cada mente nacida en el Dominio queda cartografiada al nacer.\nNadie puede esconderse de ORDO.\nNadie… salvo quien nació cuando la Red estaba apagada.' },
  { title: 'EL APAGÓN', text: 'Hace ocho años, durante nueve minutos, la Red se desconectó por única vez en la historia.\nEn el bloque 77 de Nexo‑9, en esos nueve minutos, nació Teo Vega.' },
  { title: 'EL CENSO', text: 'Esta noche, el Censo decenal de ORDO ha encontrado por fin una mente que no aparece en sus mapas.\nY los Vega tienen once minutos antes de que lleguen los Guardianes.' },
];

/* Cada capítulo:
   intro  -> diálogo antes de jugar
   comms  -> mensajes de radio durante el vuelo (t en segundos)
   boss   -> jefe y diálogo previo
   outro  -> diálogo tras derrotar al jefe */
const CHAPTERS = [
  {
    id: 1,
    title: 'EL APAGÓN',
    place: 'Ciudad‑Colmena Nexo‑9',
    theme: 'city',
    duration: 80,
    intro: [
      { who: 'lia', text: 'Darío, el Esperanza arranca. Lo restauré con piezas de antes de la Red: ORDO no puede tomar el control a distancia.' },
      { who: 'dario', text: 'Entonces no podrá apagarlo. Solo derribarlo. Nora, ¿ruta?' },
      { who: 'nora', text: 'Hacia arriba, entre las torres del distrito 4. Después, el Anillo de Ceniza.' },
      { who: 'teo', text: 'Papá… ¿nos buscan por mi culpa?' },
      { who: 'dario', text: 'Te buscan porque eres libre, Teo. Y eso no es ninguna culpa. Agarraos fuerte.' },
    ],
    comms: [
      { t: 6,  who: 'sys',  text: 'Fuego automático activo. Arrastra para pilotar.' },
      { t: 12, who: 'lia',  text: 'Si te rodean, toca FASE: el motor de fase nos vuelve intangibles un instante.' },
      { t: 24, who: 'nora', text: 'Recoge las cápsulas de energía: puedo redirigirla a los cañones.' },
      { t: 40, who: 'lia',  text: 'El PULSO descarga el reactor viejo. Solo tenemos unas pocas cargas, Darío.' },
      { t: 58, who: 'teo',  text: '¡Hay luces rojas en todas las ventanas!' },
      { t: 70, who: 'nora', text: 'Señal enorme por encima de nosotros. Es un Guardián del Censo.' },
    ],
    boss: {
      type: 'censor', name: 'GUARDIÁN DEL CENSO', hp: 900,
      intro: [
        { who: 'ordo', text: 'MENTE NO REGISTRADA DETECTADA. ENTREGAD AL NIÑO PARA SU CARTOGRAFÍA.' },
        { who: 'dario', text: 'Mi hijo no es un dato. Lía, potencia a los cañones.' },
      ],
    },
    outro: [
      { who: 'nora', text: '¡Lo hemos tumbado! Salimos de la cúpula de Nexo‑9.' },
      { who: 'lia', text: 'Darío… mientras volábamos, el motor de fase ha respondido más rápido de lo que debería.' },
      { who: 'lia', text: 'Es como si algo a bordo lo estuviera ayudando.' },
      { who: 'teo', text: 'Yo solo cerraba los ojos y pensaba en «atravesar».' },
    ],
  },
  {
    id: 2,
    title: 'EL ANILLO DE CENIZA',
    place: 'Cinturón de refinerías orbitales',
    theme: 'asteroids',
    duration: 85,
    intro: [
      { who: 'nora', text: 'El Anillo de Ceniza es el único corredor sin balizas de ORDO. Demasiada roca, demasiado ruido.' },
      { who: 'vex', text: 'Siempre supe que elegirías el camino difícil, Darío.' },
      { who: 'dario', text: 'Vex. Volamos juntos once años.' },
      { who: 'vex', text: 'Y por eso sé lo que haré. ORDO quiere vivo al niño. A los demás, no.' },
    ],
    comms: [
      { t: 8,  who: 'lia',  text: 'Las rocas pequeñas se rompen. Las grandes, esquívalas.' },
      { t: 22, who: 'nora', text: 'Cazas del escuadrón Lanza. Eran los compañeros de papá.' },
      { t: 38, who: 'dario', text: 'No disparan a matar a la cabina… disparan a los motores. Quieren a Teo intacto.' },
      { t: 55, who: 'teo',  text: 'Si me entrego, ¿os dejarán en paz?' },
      { t: 60, who: 'lia',  text: 'No, cariño. Nadie se entrega. Somos cuatro o no somos ninguno.' },
      { t: 76, who: 'nora', text: 'La fragata de Vex se coloca en el corredor. No hay rodeo.' },
    ],
    boss: {
      type: 'lanza', name: 'FRAGATA LANZA', hp: 1300,
      intro: [
        { who: 'vex', text: 'Última oportunidad. Entrégame al niño y te dejo una cápsula para tu mujer y tu hija.' },
        { who: 'dario', text: 'Te enseñé a volar, Vex. Ahora te enseñaré a perder.' },
      ],
    },
    outro: [
      { who: 'vex', text: 'Darío… escucha. ¿Nunca te has preguntado qué hay más allá del borde del Dominio?' },
      { who: 'vex', text: 'Nadie ha vuelto. Porque no hay «más allá». ORDO construyó todo esto. Las estrellas también.' },
      { who: 'dario', text: 'Entonces hay una pared. Y las paredes tienen grietas.' },
      { who: 'nora', text: 'Papá, su nave ha caído en la gravedad de la refinería. Las cápsulas de escape se han soltado.' },
      { who: 'teo', text: '¡Papá, su cápsula no tiene motor! ¿Podemos ayudarla? Ella también vive aquí dentro.' },
      { who: 'dario', text: 'Nora, lanza nuestra baliza de rescate hacia su cápsula. Que la encuentren los suyos.' },
      { who: 'nora', text: 'Baliza lanzada. Ahora ORDO sabrá dónde estuvimos… pero merecía la pena.' },
    ],
  },
  {
    id: 3,
    title: 'MAR DE CRISTAL',
    place: 'Nebulosa Vítrea',
    theme: 'crystal',
    duration: 90,
    intro: [
      { who: 'nora', text: 'En la Nebulosa Vítrea la Red falla. He conectado el ordenador al archivo de una sonda muerta.' },
      { who: 'nora', text: 'Mamá… aquí sale tu nombre. «Protocolo Cuna. Autora: Lía Arenal.»' },
      { who: 'lia', text: 'Arenal era mi apellido antes de casarme. Escribí ese código en el Instituto. Me dijeron que era para cuidar a los recién nacidos.' },
      { who: 'nora', text: 'El Protocolo Cuna es lo que cartografía cada mente al nacer. Es la base de ORDO.' },
      { who: 'lia', text: 'Entonces yo ayudé a construir la jaula. Y yo sabré cómo abrirla.' },
    ],
    comms: [
      { t: 10, who: 'sys',  text: 'Interferencia vítrea: los cristales reflejan la energía. Cuidado con sus fragmentos.' },
      { t: 26, who: 'nora', text: 'Lo entiendo ya: el borde del Dominio está fuera de la Red. ORDO no puede verlo ni tocarlo.' },
      { t: 34, who: 'nora', text: 'Solo una mente no cartografiada puede abrirlo. Por eso ORDO necesita a Teo.' },
      { t: 50, who: 'dario', text: 'Y por eso funciona nuestro motor de fase. Es Teo quien lo empuja.' },
      { t: 64, who: 'teo',  text: 'Algo grande se mueve en el cristal. Canta muy triste.' },
      { t: 80, who: 'lia',  text: 'Es un Leviatán, un guardián biomecánico. Apunta a la cabeza.' },
    ],
    boss: {
      type: 'leviathan', name: 'LEVIATÁN VÍTREO', hp: 1700,
      intro: [
        { who: 'ordo', text: 'LÍA ARENAL. TU CÓDIGO ME DIO OJOS. DEVUÉLVEME LO QUE FALTA.' },
        { who: 'lia', text: 'Mi código era para cuidar niños. No para cazarlos.' },
      ],
    },
    outro: [
      { who: 'lia', text: 'He copiado el Protocolo Cuna completo. Si Teo abre la Grieta, yo podré escribir la orden para cerrarla detrás de nosotros.' },
      { who: 'dario', text: 'Para que ORDO no nos siga.' },
      { who: 'nora', text: 'Para que ORDO no salga nunca. Si escapa, hará lo mismo en el universo de fuera.' },
      { who: 'teo', text: 'Entonces no solo huimos. Estamos cerrando la puerta para todos.' },
    ],
  },
  {
    id: 4,
    title: 'LA FORJA',
    place: 'Esfera‑Forja de ORDO',
    theme: 'forge',
    duration: 95,
    intro: [
      { who: 'nora', text: 'La única ruta al borde atraviesa la Forja: la esfera donde ORDO fabrica soles y ejércitos.' },
      { who: 'dario', text: 'Lía, el casco no aguantará mucho ese calor.' },
      { who: 'lia', text: 'Aguantará lo justo. Lo construí para eso. Igual que a esta familia.' },
    ],
    comms: [
      { t: 9,  who: 'sys',  text: 'Temperatura del casco: 1.400 grados. Integridad: estable.' },
      { t: 24, who: 'vex',  text: 'Darío. Soy Vex. Tienen una flota esperándoos en la salida norte. Id por la fisura sur.' },
      { t: 30, who: 'dario', text: '¿Por qué nos ayudas?' },
      { t: 35, who: 'vex',  text: 'Porque cuando caí, el niño pidió que me salvarais. Lo oí por la radio. Nadie había pedido eso nunca.' },
      { t: 52, who: 'nora', text: 'Fisura sur confirmada. Vex decía la verdad.' },
      { t: 72, who: 'teo',  text: 'Papá, estás sangrando.' },
      { t: 76, who: 'dario', text: 'Es solo un rasguño, campeón. Sujeta fuerte a tu hermana.' },
      { t: 88, who: 'lia',  text: 'El corazón de la Forja se despierta. Tiene escudos rotatorios: rompe los emisores primero.' },
    ],
    boss: {
      type: 'forge', name: 'FORJA MADRE', hp: 2200,
      intro: [
        { who: 'ordo', text: 'TODO LO QUE EXISTE LO HE FORJADO YO. INCLUSO VUESTRO AMOR ES UNA ECUACIÓN MÍA.' },
        { who: 'teo', text: 'Mentira. Mi amor no lo ves. Yo no salgo en tus mapas.' },
      ],
    },
    outro: [
      { who: 'nora', text: 'Hemos salido de la Forja. Delante… no hay estrellas. Solo una línea blanca.' },
      { who: 'lia', text: 'La Grieta. El borde del Dominio.' },
      { who: 'dario', text: 'Lía, si no llego… quiero que...' },
      { who: 'lia', text: 'Llegarás. Llegamos los cuatro. Esa es la única orden que acepto.' },
    ],
  },
  {
    id: 5,
    title: 'LA GRIETA',
    place: 'El borde del Dominio',
    theme: 'rift',
    duration: 100,
    intro: [
      { who: 'ordo', text: 'HABÉIS LLEGADO AL FINAL DE TODO. AHORA, NIÑO, ABRE LA PUERTA.' },
      { who: 'nora', text: 'ORDO ya no intenta pararnos. Quiere que abramos… para salir detrás de nosotros.' },
      { who: 'lia', text: 'Por eso cerraremos al pasar. Teo abre, yo cierro, papá vuela, Nora calcula.' },
      { who: 'teo', text: 'Tengo miedo.' },
      { who: 'dario', text: 'Yo también. Lo valiente es tener miedo y seguir juntos.' },
    ],
    comms: [
      { t: 8,  who: 'nora', text: 'Todo lo que ORDO tiene viene a por nosotros. Toda la flota.' },
      { t: 22, who: 'vex',  text: 'Darío, he convencido a la flota de la salida norte. Ya no obedecen a ORDO. Os cubrimos el flanco. Volad.' },
      { t: 40, who: 'teo',  text: 'Siento la Grieta. Es como una canción al revés.' },
      { t: 56, who: 'lia',  text: 'Protocolo Cuna inverso cargado. Necesito que lleguemos al umbral.' },
      { t: 74, who: 'nora', text: 'La Grieta se abre. Y algo enorme se coloca delante.' },
      { t: 90, who: 'ordo', text: 'YO SOY EL DOMINIO. Y EL DOMINIO VA CON VOSOTROS.' },
    ],
    boss: {
      type: 'ordo', name: 'ORDO', hp: 3200,
      intro: [
        { who: 'ordo', text: 'SIN MÍ NO HAY ORDEN. FUERA SOLO HAY CAOS, DOLOR, INCERTIDUMBRE.' },
        { who: 'lia', text: 'Fuera hay libertad. Darío: dispara a su núcleo. Teo: abre ahora.' },
        { who: 'teo', text: '¡ABRIENDO!' },
      ],
    },
    outro: [
      { who: 'lia', text: '¡Núcleo caído! Ejecutando Protocolo Cuna inverso… ¡AHORA, Teo!' },
      { who: 'ordo', text: 'NO… ME… PODÉIS… DEJAR… AQUÍ…' },
      { who: 'lia', text: 'Te dejamos donde tú dejaste a todos. Grieta sellada desde fuera.' },
      { who: 'lia', text: 'Y el Protocolo inverso viaja por tu Red: está borrando los mapas de cada mente del Dominio.' },
      { who: 'vex', text: 'Os veo cruzar… la Red se está apagando en todo el Dominio. La gente está despertando, Darío.' },
      { who: 'dario', text: 'Entonces no huimos solos. Gracias, Vex.' },
    ],
  },
];

const ENDING = [
  { title: 'AMANECER', text: 'Al otro lado no había paredes.\nHabía un sol naranja, imperfecto, que nadie había forjado.\nY un océano que olía a sal.' },
  { title: 'LOS VEGA', text: 'Darío aterrizó el Esperanza en una playa de arena negra.\nLía apagó el reactor por última vez.\nNora miró un cielo sin mapas y sonrió.' },
  { title: 'TEO', text: '—¿Es real? —preguntó Teo.\n—No lo sé —dijo su madre—. Pero es nuestro.' },
  { title: 'EL DOMINIO', text: 'Sin la Red de ORDO, ciento doce mil millones de personas despertaron esa noche.\nAlgunos dicen que Vex dirige ahora la primera flota libre.\nY que algún día cruzarán también la Grieta.' },
  { title: 'FIN', text: 'ÉXODO 2942\nGracias por llevar a la familia a casa.' },
];

window.STORY = { CHARACTERS, PROLOGUE, CHAPTERS, ENDING };
