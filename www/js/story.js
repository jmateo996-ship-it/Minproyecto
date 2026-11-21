/* =========================================================================
   ÉXODO 2942 — Guion completo
   Toda la historia del juego vive aquí: prólogo, 15 misiones, comunicaciones
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

/* 15 misiones en tres actos: las 5 primeras duran 3 minutos y el resto, 5.
   Cada 5 misiones hay un jefe final; la misión 15 termina con el súper jefe.
   intro  -> diálogo antes de jugar
   comms  -> mensajes de radio durante el vuelo (t en segundos, dentro de duration)
   boss   -> jefe (solo en las misiones 5, 10 y 15)
   outro  -> diálogo al completar la misión */
const ACTS = ['ACTO I · LA HUIDA', 'ACTO II · LA VERDAD', 'ACTO III · LA GRIETA'];

const CHAPTERS = [
  /* ============================ ACTO I · LA HUIDA ============================ */
  {
    id: 1, act: 0, title: 'EL APAGÓN', place: 'Ciudad‑Colmena Nexo‑9 · Bloque 77', theme: 'city', duration: 180,
    intro: [
      { who: 'lia', text: 'Darío, el Esperanza arranca. Lo restauré con piezas de antes de la Red: ORDO no puede tomar el control a distancia.' },
      { who: 'dario', text: 'Entonces no podrá apagarlo. Solo derribarlo. Nora, ¿ruta?' },
      { who: 'nora', text: 'Hacia arriba, entre los bloques. Luego las torres del distrito 4 y la cúpula.' },
      { who: 'dario', text: 'Agarraos fuerte. Nos vamos de aquí.' },
    ],
    comms: [
      { t: 3,   who: 'sys',  text: 'Fuego automático activo. Arrastra en cualquier parte para pilotar.' },
      { t: 12,  who: 'lia',  text: 'Si te rodean, toca FASE: el motor de fase nos vuelve intangibles un instante.' },
      { t: 27,  who: 'nora', text: 'Recoge las cápsulas P: puedo redirigir esa energía a los cañones.' },
      { t: 45,  who: 'lia',  text: 'El PULSO descarga el reactor viejo y barre las balas. Tenemos pocas cargas.' },
      { t: 63, who: 'teo',  text: 'Hay luces rojas en todas las ventanas. ¿Nos está mirando todo el mundo?' },
      { t: 81, who: 'nora', text: 'Son los ojos del Censo. ORDO ve por cada pantalla de la ciudad.' },
      { t: 90, who: 'sys',  text: 'Punto de control registrado.' },
      { t: 105, who: 'dario', text: 'Si derribas un escuadrón entero, suelta suministros. Lo aprendí en la academia.' },
      { t: 129, who: 'lia',  text: 'El motor de fase responde más rápido de lo que debería. No lo entiendo.' },
      { t: 153, who: 'nora', text: 'Salimos del bloque 77. Las torres del distrito 4, justo delante.' },
    ],
    outro: [
      { who: 'teo', text: 'Papá… ¿nos buscan por mi culpa?' },
      { who: 'dario', text: 'Te buscan porque eres libre, Teo. Y eso no es ninguna culpa.' },
    ],
  },
  {
    id: 2, act: 0, title: 'LAS TORRES', place: 'Distrito 4 · Nexo‑9', theme: 'city', duration: 180,
    intro: [
      { who: 'nora', text: 'Las torres son un laberinto. Si volamos bajo, los sensores del Censo se confunden con el tráfico.' },
      { who: 'lia', text: 'Y si volamos bajo, chocamos. Darío, confío en ti.' },
    ],
    comms: [
      { t: 9,  who: 'dario', text: 'Patrullas de Guardianes, a las doce. Vienen en formación.' },
      { t: 30,  who: 'nora', text: 'He apagado las farolas de tres manzanas. Ahora estamos igual de ciegos que ellos.' },
      { t: 51,  who: 'teo',  text: 'Mi colegio está aquí abajo. Mañana no iré, ¿verdad?' },
      { t: 60, who: 'lia',  text: 'Habrá otros colegios, cariño. Mejores. Sin ojos rojos.' },
      { t: 90, who: 'sys',  text: 'Punto de control registrado.' },
      { t: 96, who: 'nora', text: 'Cañoneras pesadas. Esas aguantan mucho: concéntrate en ellas.' },
      { t: 126, who: 'lia',  text: 'Cuando Teo se asusta, el motor de fase se carga solo. Lo estoy viendo en los indicadores.' },
      { t: 147, who: 'dario', text: 'Hablaremos de eso cuando salgamos vivos.' },
      { t: 165, who: 'nora', text: 'La cúpula de Nexo‑9 ya se ve. Es la última barrera.' },
    ],
    outro: [
      { who: 'nora', text: 'La cúpula tiene compuertas de mantenimiento. Si abrimos una, salimos al espacio.' },
      { who: 'dario', text: 'Y si no la abrimos, la atravesamos.' },
    ],
  },
  {
    id: 3, act: 0, title: 'LA CÚPULA', place: 'Límite de Nexo‑9', theme: 'city', duration: 180,
    intro: [
      { who: 'ordo', text: 'MENTE NO REGISTRADA DETECTADA. ENTREGAD AL NIÑO PARA SU CARTOGRAFÍA.' },
      { who: 'dario', text: 'Mi hijo no es un dato.' },
      { who: 'lia', text: 'Es la primera vez que ORDO habla directamente con alguien. Le importamos mucho.' },
    ],
    comms: [
      { t: 12,  who: 'nora', text: 'Estoy forzando la compuerta 9. Necesito tres minutos. Aguanta.' },
      { t: 36,  who: 'ordo', text: 'RESISTIR ES INEFICIENTE.' },
      { t: 42,  who: 'teo',  text: 'Su voz suena a muchas personas a la vez.' },
      { t: 72, who: 'nora', text: 'Cuarenta por ciento… cifrado de la vieja escuela. Esto va lento.' },
      { t: 90, who: 'sys',  text: 'Punto de control registrado.' },
      { t: 102, who: 'lia',  text: 'Minas flotantes cerca de la compuerta. Al estallar sueltan metralla.' },
      { t: 129, who: 'nora', text: 'Ochenta por ciento. Ya casi.' },
      { t: 156, who: 'nora', text: '¡Compuerta abierta! ¡Ahora o nunca!' },
    ],
    outro: [
      { who: 'teo', text: '¡Estrellas! Nunca las había visto sin el cristal de la cúpula.' },
      { who: 'nora', text: 'Trazo rumbo al Anillo de Ceniza: el único corredor sin balizas de ORDO.' },
    ],
  },
  {
    id: 4, act: 0, title: 'EL ANILLO DE CENIZA', place: 'Cinturón de refinerías orbitales', theme: 'asteroids', duration: 180,
    intro: [
      { who: 'nora', text: 'Demasiada roca y demasiado ruido para los sensores. Aquí ORDO está medio ciego.' },
      { who: 'vex', text: 'Medio ciego no es ciego, Darío. Siempre supe que elegirías el camino difícil.' },
      { who: 'dario', text: 'Vex. Volamos juntos once años.' },
    ],
    comms: [
      { t: 6,  who: 'lia',  text: 'Las rocas pequeñas se rompen. Las grandes se parten en trozos: ojo con ellos.' },
      { t: 27,  who: 'nora', text: 'Cazas del escuadrón Lanza. Eran los compañeros de papá.' },
      { t: 54,  who: 'dario', text: 'No disparan a la cabina… disparan a los motores. Quieren a Teo intacto.' },
      { t: 78, who: 'vex',  text: 'ORDO quiere vivo al niño. A los demás, no. Lo siento, Darío.' },
      { t: 90, who: 'sys',  text: 'Punto de control registrado.' },
      { t: 105, who: 'teo',  text: 'Si me entrego, ¿os dejarán en paz?' },
      { t: 111, who: 'lia',  text: 'No, cariño. Nadie se entrega. Somos cuatro o no somos ninguno.' },
      { t: 141, who: 'nora', text: 'Transportes pesados en el anillo. Llevan suministros: si caen, recógelos.' },
      { t: 168, who: 'nora', text: 'La fragata de Vex se coloca en el corredor de salida.' },
    ],
    outro: [
      { who: 'dario', text: 'No hay rodeo posible. Tendremos que pasar a través de ella.' },
      { who: 'lia', text: 'Entonces cárgalo todo a los cañones. Yo me ocupo del escudo.' },
    ],
  },
  {
    id: 5, act: 0, title: 'EL CORREDOR DE VEX', place: 'Salida del Anillo de Ceniza', theme: 'asteroids', duration: 180,
    intro: [
      { who: 'vex', text: 'Tienes tres minutos para pensarlo, Darío. Después iré yo misma.' },
      { who: 'dario', text: 'No necesito tres minutos.' },
    ],
    comms: [
      { t: 12,  who: 'nora', text: 'Vex nos lanza todo su escuadrón para cansarnos antes del choque.' },
      { t: 42,  who: 'lia',  text: 'Guarda cargas de PULSO para la fragata. Las vas a necesitar.' },
      { t: 72, who: 'vex',  text: 'Te enseñé la maniobra de rizo. ¿Te acuerdas de quién te la enseñó a ti?' },
      { t: 78, who: 'dario', text: 'Tú. Y nunca te dije que la hacías mal.' },
      { t: 90, who: 'sys',  text: 'Punto de control registrado.' },
      { t: 120, who: 'teo',  text: '¿Por qué Vex está tan enfadada?' },
      { t: 126, who: 'lia',  text: 'No está enfadada. Tiene miedo. ORDO hace que todos tengan miedo.' },
      { t: 162, who: 'nora', text: 'La fragata Lanza entra en el corredor. Cañones activos.' },
    ],
    boss: {
      type: 'lanza', name: 'FRAGATA LANZA', hp: 2400,
      intro: [
        { who: 'vex', text: 'Última oportunidad. Entrégame al niño y te dejo una cápsula para tu mujer y tu hija.' },
        { who: 'dario', text: 'Te enseñé a volar, Vex. Ahora te enseñaré a perder.' },
      ],
    },
    outro: [
      { who: 'vex', text: 'Darío… ¿nunca te has preguntado qué hay más allá del borde del Dominio?' },
      { who: 'vex', text: 'Nadie ha vuelto. Porque no hay «más allá». ORDO construyó todo esto. Las estrellas también.' },
      { who: 'dario', text: 'Entonces hay una pared. Y las paredes tienen grietas.' },
      { who: 'teo', text: '¡Papá, su cápsula no tiene motor! ¿Podemos ayudarla? Ella también vive aquí dentro.' },
      { who: 'dario', text: 'Nora, lanza nuestra baliza de rescate hacia su cápsula. Que la encuentren los suyos.' },
      { who: 'nora', text: 'Baliza lanzada. Ahora ORDO sabrá por dónde fuimos… pero merecía la pena.' },
    ],
  },

  /* ============================ ACTO II · LA VERDAD ============================ */
  {
    id: 6, act: 1, title: 'MAR DE CRISTAL', place: 'Nebulosa Vítrea', theme: 'crystal', duration: 300,
    intro: [
      { who: 'nora', text: 'En la Nebulosa Vítrea la Red falla. Aquí podremos pensar sin que ORDO escuche.' },
      { who: 'lia', text: 'Y saber a qué nos enfrentamos. Nora, conecta el ordenador a esa sonda muerta.' },
    ],
    comms: [
      { t: 15,  who: 'sys',  text: 'Interferencia vítrea: los cristales estallan en esquirlas al romperse.' },
      { t: 60,  who: 'nora', text: 'Descargando el archivo de la sonda… es enorme. Mantenme con vida mientras tanto.' },
      { t: 110, who: 'nora', text: 'Mamá… aquí sale tu nombre. «Protocolo Cuna. Autora: Lía Arenal.»' },
      { t: 125, who: 'lia',  text: 'Arenal era mi apellido de soltera. Escribí ese código en el Instituto. Me dijeron que era para cuidar a los recién nacidos.' },
      { t: 150, who: 'sys',  text: 'Punto de control registrado.' },
      { t: 170, who: 'nora', text: 'El Protocolo Cuna es lo que cartografía cada mente al nacer. Es la base de ORDO.' },
      { t: 200, who: 'lia',  text: 'Entonces yo ayudé a construir la jaula.' },
      { t: 215, who: 'dario', text: 'Tú no sabías nada, Lía. Fueron ellos.' },
      { t: 260, who: 'lia',  text: 'Si lo construí yo, sabré cómo abrirlo. Sigamos.' },
    ],
    outro: [
      { who: 'nora', text: 'El archivo sigue. Hay algo sobre el borde del Dominio, pero está cifrado en capas.' },
      { who: 'lia', text: 'Descífralo mientras volamos. Necesitamos saberlo todo.' },
    ],
  },
  {
    id: 7, act: 1, title: 'ECOS DE CRISTAL', place: 'Corazón de la Nebulosa Vítrea', theme: 'crystal', duration: 300,
    intro: [
      { who: 'teo', text: 'Los cristales cantan. Es una canción muy triste.' },
      { who: 'nora', text: 'Son ecos de la Red rebotando en la nebulosa. Teo… ¿tú los oyes?' },
    ],
    comms: [
      { t: 30,  who: 'nora', text: 'Primera capa descifrada: el borde del Dominio se llama la Grieta. Está fuera de la Red.' },
      { t: 75,  who: 'nora', text: 'ORDO no puede verla ni tocarla. Solo una mente no cartografiada puede abrirla.' },
      { t: 95,  who: 'dario', text: 'Una mente nacida durante el Apagón.' },
      { t: 110, who: 'lia',  text: 'Teo. Por eso ORDO lo necesita vivo: quiere salir de su propio universo.' },
      { t: 150, who: 'sys',  text: 'Punto de control registrado.' },
      { t: 165, who: 'dario', text: 'Y por eso funciona nuestro motor de fase. Es Teo quien lo empuja.' },
      { t: 190, who: 'teo',  text: 'Yo solo cierro los ojos y pienso en «atravesar».' },
      { t: 240, who: 'nora', text: 'Muchas naves del Dominio en la nebulosa. Nos han encontrado por la baliza de Vex.' },
      { t: 280, who: 'lia',  text: 'Hay un repetidor del viejo Instituto aquí cerca. Tengo una idea.' },
    ],
    outro: [
      { who: 'lia', text: 'Ese repetidor guarda una copia completa del Protocolo Cuna. Si la consigo, podré escribirlo al revés.' },
      { who: 'nora', text: 'Para que, cuando Teo abra la Grieta, tú puedas cerrarla detrás de nosotros.' },
      { who: 'dario', text: 'Para que ORDO no nos siga. Vamos a por ella.' },
    ],
  },
  {
    id: 8, act: 1, title: 'EL SANTUARIO', place: 'Repetidor del Instituto', theme: 'crystal', duration: 300,
    intro: [
      { who: 'lia', text: 'La transferencia tarda cinco minutos y el repetidor no puede moverse. Darío, protégelo.' },
      { who: 'dario', text: 'Cinco minutos. He aguantado cosas peores.' },
    ],
    comms: [
      { t: 25,  who: 'ordo', text: 'LÍA ARENAL. TU CÓDIGO ME DIO OJOS. DEVUÉLVEME LO QUE FALTA.' },
      { t: 40,  who: 'lia',  text: 'Mi código era para cuidar niños. No para cazarlos.' },
      { t: 90,  who: 'nora', text: 'Transferencia al treinta por ciento. Llegan oleadas por los dos flancos.' },
      { t: 150, who: 'sys',  text: 'Punto de control registrado.' },
      { t: 160, who: 'nora', text: 'Sesenta por ciento. ORDO intenta corromper los datos en el aire.' },
      { t: 200, who: 'teo',  text: 'Mamá, ¿si cerramos la puerta, la gente de aquí se queda encerrada con ORDO?' },
      { t: 215, who: 'lia',  text: 'No si lo hago bien. El Protocolo inverso viajará por toda la Red.' },
      { t: 270, who: 'nora', text: '¡Noventa y cinco… cien! ¡Copia completa!' },
    ],
    outro: [
      { who: 'teo', text: 'Entonces no solo huimos. Estamos cerrando la puerta para todos.' },
      { who: 'nora', text: 'La única ruta hacia el borde atraviesa la Forja: la esfera donde ORDO fabrica soles y ejércitos.' },
    ],
  },
  {
    id: 9, act: 1, title: 'PUERTAS DE LA FORJA', place: 'Esfera‑Forja · Anillo exterior', theme: 'forge', duration: 300,
    intro: [
      { who: 'dario', text: 'Lía, el casco no aguantará mucho este calor.' },
      { who: 'lia', text: 'Aguantará lo justo. Lo construí para eso. Igual que a esta familia.' },
    ],
    comms: [
      { t: 15,  who: 'sys',  text: 'Temperatura del casco: 1.400 grados. Integridad: estable.' },
      { t: 60,  who: 'vex',  text: 'Darío. Soy Vex. Hay una flota esperándoos en la salida norte. Id por la fisura sur.' },
      { t: 72,  who: 'dario', text: '¿Por qué nos ayudas?' },
      { t: 82,  who: 'vex',  text: 'Porque cuando caí, el niño pidió que me salvarais. Lo oí por la radio. Nadie había pedido eso nunca.' },
      { t: 150, who: 'sys',  text: 'Punto de control registrado.' },
      { t: 160, who: 'nora', text: 'Fisura sur confirmada. Vex decía la verdad.' },
      { t: 220, who: 'lia',  text: 'Las fundiciones lanzan a sus defensas. ORDO sabe que vamos al corazón.' },
      { t: 275, who: 'nora', text: 'El túnel termina en el núcleo de la Forja. No hay otro camino.' },
    ],
    outro: [
      { who: 'teo', text: 'Vex nos ha ayudado. ¿Ya es buena?' },
      { who: 'dario', text: 'Siempre lo fue, campeón. Solo le faltaba alguien que creyera en ella.' },
    ],
  },
  {
    id: 10, act: 1, title: 'CORAZÓN DE LA FORJA', place: 'Núcleo de la Esfera‑Forja', theme: 'forge', duration: 300,
    intro: [
      { who: 'nora', text: 'Hay que cruzar el núcleo entero. Detrás está el borde.' },
      { who: 'lia', text: 'Cinco minutos de infierno y saldremos al otro lado.' },
    ],
    comms: [
      { t: 30,  who: 'sys',  text: 'Temperatura del casco: 2.100 grados. Integridad: en descenso.' },
      { t: 80,  who: 'nora', text: 'Las fundiciones forjan naves nuevas mientras volamos. No se acaban nunca.' },
      { t: 130, who: 'teo',  text: 'Papá, estás sangrando.' },
      { t: 140, who: 'dario', text: 'Es solo un rasguño, campeón. Sujeta fuerte a tu hermana.' },
      { t: 150, who: 'sys',  text: 'Punto de control registrado.' },
      { t: 200, who: 'lia',  text: 'Darío, deja que Nora te ayude con los mandos.' },
      { t: 210, who: 'nora', text: 'Estoy contigo, papá. Tú vuela; yo calculo.' },
      { t: 270, who: 'lia',  text: 'El corazón de la Forja despierta. Tiene escudos giratorios: rompe primero los emisores.' },
    ],
    boss: {
      type: 'forge', name: 'FORJA MADRE', hp: 3400,
      intro: [
        { who: 'ordo', text: 'TODO LO QUE EXISTE LO HE FORJADO YO. INCLUSO VUESTRO AMOR ES UNA ECUACIÓN MÍA.' },
        { who: 'teo', text: 'Mentira. Mi amor no lo ves. Yo no salgo en tus mapas.' },
      ],
    },
    outro: [
      { who: 'nora', text: 'Hemos salido de la Forja. Delante… no hay estrellas. Solo una línea blanca.' },
      { who: 'lia', text: 'La Grieta. El borde del Dominio.' },
      { who: 'dario', text: 'Lía, si no llego… quiero que...' },
      { who: 'lia', text: 'Llegarás. Llegamos los cuatro. Es la única orden que acepto.' },
    ],
  },

  /* ============================ ACTO III · LA GRIETA ============================ */
  {
    id: 11, act: 2, title: 'TIERRA DE NADIE', place: 'Más allá de la Forja', theme: 'rift', duration: 300,
    intro: [
      { who: 'ordo', text: 'HABÉIS LLEGADO AL FINAL DE TODO. AHORA, NIÑO, ABRE LA PUERTA.' },
      { who: 'nora', text: 'ORDO ya no intenta detenernos. Quiere que abramos… para salir detrás de nosotros.' },
    ],
    comms: [
      { t: 20,  who: 'lia',  text: 'Por eso cerraremos al pasar. Teo abre, yo cierro, papá vuela, Nora calcula.' },
      { t: 70,  who: 'sys',  text: 'Las estrellas se estiran. La geometría del Dominio se deforma cerca del borde.' },
      { t: 110, who: 'nora', text: 'ORDO nos manda naves, pero no a matar: quiere empujarnos hacia la Grieta.' },
      { t: 150, who: 'sys',  text: 'Punto de control registrado.' },
      { t: 165, who: 'dario', text: 'Que empuje. Iremos a nuestro ritmo.' },
      { t: 220, who: 'teo',  text: 'Tengo miedo.' },
      { t: 230, who: 'dario', text: 'Yo también. Lo valiente es tener miedo y seguir juntos.' },
      { t: 280, who: 'nora', text: 'Señales en la retaguardia. Muchas. Y no son de ORDO.' },
    ],
    outro: [
      { who: 'vex', text: 'Darío, he convencido a la flota de la salida norte. Ya no obedecen a ORDO.' },
      { who: 'dario', text: 'Vex… gracias.' },
      { who: 'vex', text: 'Aún no me las des. Primero hay que sobrevivir.' },
    ],
  },
  {
    id: 12, act: 2, title: 'LA FLOTA LIBRE', place: 'Campo de batalla del borde', theme: 'rift', duration: 300,
    intro: [
      { who: 'vex', text: 'ORDO nos ha declarado defectuosos a todos. Viene con todo lo que le queda.' },
      { who: 'nora', text: 'Es la primera batalla de la historia del Dominio en la que alguien desobedece.' },
    ],
    comms: [
      { t: 25,  who: 'vex',  text: 'Os cubrimos el flanco izquierdo. Vosotros, por el centro.' },
      { t: 80,  who: 'teo',  text: 'Hay mucha gente luchando por nosotros.' },
      { t: 92,  who: 'lia',  text: 'No por nosotros, Teo. Por ellos mismos. Tú solo les has recordado que podían.' },
      { t: 150, who: 'sys',  text: 'Punto de control registrado.' },
      { t: 170, who: 'vex',  text: 'He perdido tres naves. Seguimos adelante.' },
      { t: 225, who: 'nora', text: 'Transportes pesados de ORDO. Si caen, sueltan suministros para todos.' },
      { t: 280, who: 'vex',  text: 'Hasta aquí llegamos nosotros. El umbral es vuestro. Volad.' },
    ],
    outro: [
      { who: 'dario', text: 'Vex, cuando todo esto acabe…' },
      { who: 'vex', text: 'Cuando todo esto acabe, me invitas a cenar al otro lado. Vete ya.' },
    ],
  },
  {
    id: 13, act: 2, title: 'EL UMBRAL', place: 'A las puertas de la Grieta', theme: 'rift', duration: 300,
    intro: [
      { who: 'lia', text: 'Voy a cargar el Protocolo Cuna inverso. Tarda cinco minutos y no puedo parar a mitad.' },
      { who: 'dario', text: 'Nadie te va a interrumpir. Te lo prometo.' },
    ],
    comms: [
      { t: 30,  who: 'lia',  text: 'Fase uno: invertir el mapa. Cada línea que escribí, ahora al revés.' },
      { t: 90,  who: 'ordo', text: 'LÍA ARENAL. SI ME CIERRAS LA PUERTA, CIENTO DOCE MIL MILLONES SE QUEDARÁN SIN GUÍA.' },
      { t: 102, who: 'lia',  text: 'Se quedarán sin jaula. Sabrán guiarse solos.' },
      { t: 150, who: 'sys',  text: 'Punto de control registrado.' },
      { t: 160, who: 'lia',  text: 'Fase dos: propagación. Cuando se active, recorrerá toda la Red.' },
      { t: 220, who: 'teo',  text: 'Siento la Grieta. Es como una canción al revés.' },
      { t: 275, who: 'lia',  text: 'Protocolo inverso cargado. Ya solo falta llegar.' },
    ],
    outro: [
      { who: 'nora', text: 'El umbral está a una misión de distancia. Teo tendrá que empezar a abrir mientras volamos.' },
      { who: 'teo', text: 'Estoy listo. Creo.' },
    ],
  },
  {
    id: 14, act: 2, title: 'LA CANCIÓN AL REVÉS', place: 'La Grieta se abre', theme: 'rift', duration: 300,
    intro: [
      { who: 'teo', text: 'Voy a abrir. Papá, no dejes que nada nos toque.' },
      { who: 'dario', text: 'Nada. Te lo juro.' },
    ],
    comms: [
      { t: 20,  who: 'nora', text: 'Toda la flota de ORDO viene a por nosotros. Toda.' },
      { t: 70,  who: 'teo',  text: 'Se está abriendo… es blanca por dentro.' },
      { t: 120, who: 'sys',  text: 'Apertura de la Grieta: 40 %.' },
      { t: 150, who: 'sys',  text: 'Punto de control registrado.' },
      { t: 180, who: 'sys',  text: 'Apertura de la Grieta: 70 %.' },
      { t: 220, who: 'ordo', text: 'YO SOY EL DOMINIO. Y EL DOMINIO VA CON VOSOTROS.' },
      { t: 250, who: 'nora', text: 'Algo enorme se coloca delante de la Grieta. Es… es ORDO. Todo ORDO.' },
      { t: 285, who: 'sys',  text: 'Apertura de la Grieta: 100 %.' },
    ],
    outro: [
      { who: 'lia', text: 'ORDO ha juntado toda su mente en un solo cuerpo para cruzar con nosotros.' },
      { who: 'dario', text: 'Entonces solo hay que derribarlo una vez. Una última vez.' },
    ],
  },
  {
    id: 15, act: 2, title: 'ORDO', place: 'El borde del Dominio', theme: 'rift', duration: 300,
    intro: [
      { who: 'ordo', text: 'SIN MÍ NO HAY ORDEN. FUERA SOLO HAY CAOS, DOLOR, INCERTIDUMBRE.' },
      { who: 'lia', text: 'Fuera hay libertad.' },
      { who: 'dario', text: 'Familia: por última vez. Juntos.' },
    ],
    comms: [
      { t: 20,  who: 'nora', text: 'ORDO nos lanza todo lo que ha forjado en mil años. Aguanta cinco minutos.' },
      { t: 70,  who: 'vex',  text: 'La flota libre sigue luchando detrás de vosotros. No miréis atrás.' },
      { t: 120, who: 'teo',  text: 'Mantengo la Grieta abierta. Pesa mucho.' },
      { t: 150, who: 'sys',  text: 'Punto de control registrado.' },
      { t: 170, who: 'lia',  text: 'Cuando caiga su núcleo, ejecuto el Protocolo. Ni un segundo antes.' },
      { t: 230, who: 'dario', text: 'Os quiero. A los tres. Por si acaso.' },
      { t: 240, who: 'nora', text: 'Eso díselo al otro lado, papá.' },
      { t: 285, who: 'ordo', text: 'MI FORMA PRIMORDIAL DESPIERTA.' },
    ],
    boss: {
      type: 'superordo', name: 'ORDO PRIMORDIAL', hp: 9000, super: true,
      intro: [
        { who: 'ordo', text: 'MIL AÑOS DE ORDEN. CIENTO DOCE MIL MILLONES DE MENTES. TODAS EN MÍ.' },
        { who: 'teo', text: 'Todas menos una.' },
        { who: 'lia', text: 'Darío: dispara a su núcleo. Teo: mantén la puerta. Nora: cuenta conmigo.' },
        { who: 'dario', text: '¡Por los Vega!' },
      ],
    },
    outro: [
      { who: 'lia', text: '¡Núcleo caído! Ejecutando Protocolo Cuna inverso… ¡AHORA, Teo!' },
      { who: 'ordo', text: 'NO… ME… PODÉIS… DEJAR… AQUÍ…' },
      { who: 'lia', text: 'Te dejamos donde tú dejaste a todos. Grieta sellada desde fuera.' },
      { who: 'lia', text: 'Y el Protocolo inverso viaja por tu Red: está borrando los mapas de cada mente del Dominio.' },
      { who: 'vex', text: 'Os veo cruzar… la Red se apaga en todo el Dominio. La gente está despertando, Darío.' },
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

window.STORY = { CHARACTERS, PROLOGUE, CHAPTERS, ENDING, ACTS };
