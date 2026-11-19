# -*- coding: utf-8 -*-
"""Guion de la serie "Historia del Antiguo Egipto".

Cada episodio tiene un título y una lista de escenas. Cada escena indica el
tipo de ilustración ("arte") y las frases que narra la voz en off.
"""

EPISODIOS = [
    {
        "id": "01",
        "titulo": "El don del Nilo",
        "subtitulo": "Orígenes y unificación de Egipto",
        "escenas": [
            ("nilo", [
                "Hace más de cinco mil años, a orillas del río Nilo, nació una de las civilizaciones más fascinantes de la historia.",
                "El historiador griego Heródoto llamó a Egipto el don del Nilo, y tenía razón.",
                "Sin el río, aquella tierra no sería más que un desierto inmenso.",
            ]),
            ("crecida", [
                "Cada verano, el Nilo se desbordaba y cubría los campos con un limo negro y muy fértil.",
                "Por eso los egipcios llamaban a su país Kemet, la tierra negra.",
                "El desierto que lo rodeaba era Deshret, la tierra roja.",
                "Gracias a las crecidas, los campesinos podían cultivar trigo, cebada y lino en abundancia.",
            ]),
            ("mapa", [
                "Al principio había dos reinos: el Alto Egipto, en el sur, y el Bajo Egipto, en el delta del norte.",
                "Hacia el año tres mil cien antes de Cristo, un rey llamado Narmer unió las dos tierras bajo una sola corona.",
                "Así comenzó la historia de los faraones, que duraría casi tres mil años.",
            ]),
            ("jeroglificos", [
                "En esa misma época apareció la escritura jeroglífica, una de las más antiguas del mundo.",
                "Los escribas la usaban para registrar cosechas, impuestos, leyes y oraciones a los dioses.",
                "Egipto acababa de nacer, y estaba a punto de construir maravillas.",
            ]),
        ],
    },
    {
        "id": "02",
        "titulo": "La era de las pirámides",
        "subtitulo": "El Imperio Antiguo",
        "escenas": [
            ("piramide_escalonada", [
                "Hacia el año dos mil seiscientos ochenta antes de Cristo comenzó el llamado Imperio Antiguo.",
                "El faraón Zoser encargó a su arquitecto Imhotep una tumba nunca vista: la pirámide escalonada de Saqqara.",
                "Era la primera gran construcción de piedra de la humanidad.",
            ]),
            ("piramides", [
                "Pocas generaciones después, el faraón Keops levantó en Guiza la Gran Pirámide.",
                "Medía unos ciento cuarenta y seis metros de altura y estaba formada por más de dos millones de bloques de piedra.",
                "Durante casi cuatro mil años fue la construcción más alta del mundo.",
                "Junto a ella se alzan las pirámides de sus sucesores, Kefrén y Micerino.",
            ]),
            ("esfinge", [
                "Frente a ellas, la Gran Esfinge, con cuerpo de león y cabeza humana, vigila el desierto desde hace milenios.",
                "Hoy sabemos que las pirámides no fueron construidas por esclavos, sino por miles de trabajadores organizados, que recibían comida, cerveza y atención médica.",
            ]),
            ("desierto", [
                "Con el tiempo, el poder de los faraones se debilitó y los gobernadores provinciales se hicieron más fuertes.",
                "Las sequías y el hambre trajeron una época de división conocida como el Primer Período Intermedio.",
                "Pero Egipto volvería a levantarse.",
            ]),
        ],
    },
    {
        "id": "03",
        "titulo": "Faraones guerreros",
        "subtitulo": "Del Imperio Medio al Imperio Nuevo",
        "escenas": [
            ("templo", [
                "Hacia el año dos mil cincuenta y cinco antes de Cristo, los reyes de Tebas reunificaron el país y comenzó el Imperio Medio.",
                "Fue una época de prosperidad, de grandes obras de riego y de una literatura brillante.",
            ]),
            ("carros", [
                "Más tarde, un pueblo extranjero, los hicsos, se apoderó del norte de Egipto.",
                "Trajeron consigo el carro de guerra tirado por caballos.",
                "Los egipcios aprendieron a usarlo, expulsaron a los invasores y fundaron el Imperio Nuevo, la época de mayor esplendor.",
            ]),
            ("faraon", [
                "En este período reinó Hatshepsut, una de las pocas mujeres que gobernaron como faraón.",
                "Después, Tutmosis tercero convirtió a Egipto en un gran imperio que llegaba desde Nubia hasta Siria.",
                "El faraón Akenatón intentó algo revolucionario: sustituir a los antiguos dioses por el culto a un único disco solar, Atón.",
            ]),
            ("mascara", [
                "Su hijo Tutankamón restauró los viejos dioses y murió muy joven.",
                "Su tumba, descubierta casi intacta en mil novecientos veintidós, guardaba una famosa máscara de oro.",
            ]),
            ("abu_simbel", [
                "Finalmente llegó Ramsés segundo, el gran constructor, que reinó durante sesenta y seis años.",
                "Mandó tallar los templos de Abu Simbel y firmó con los hititas uno de los primeros tratados de paz conocidos.",
            ]),
        ],
    },
    {
        "id": "04",
        "titulo": "Dioses y vida eterna",
        "subtitulo": "Religión y vida cotidiana",
        "escenas": [
            ("sol", [
                "Para los egipcios, el mundo estaba gobernado por cientos de dioses.",
                "Ra era el dios del sol, que cada día cruzaba el cielo en su barca.",
                "Osiris reinaba en el mundo de los muertos, Isis era la gran madre protectora y Horus, con cabeza de halcón, protegía al faraón.",
            ]),
            ("balanza", [
                "Creían que, al morir, el corazón del difunto se pesaba en una balanza frente a la pluma de Maat, la diosa de la verdad y la justicia.",
                "Si el corazón era ligero, el alma podía disfrutar de la vida eterna.",
            ]),
            ("momia", [
                "Para que el alma pudiera reconocer su cuerpo, había que conservarlo. Así nació la momificación.",
                "Los embalsamadores secaban el cuerpo con natrón, una sal especial, y lo envolvían en metros y metros de vendas de lino.",
            ]),
            ("aldea", [
                "Pero la vida cotidiana también era rica.",
                "La mayoría de los egipcios eran campesinos que vivían en casas de adobe, comían pan, cebolla y pescado, y bebían cerveza.",
                "Les encantaban los juegos de mesa, la música y las fiestas religiosas.",
                "Además, las mujeres egipcias podían tener propiedades, firmar contratos y pedir el divorcio, algo poco común en el mundo antiguo.",
            ]),
        ],
    },
    {
        "id": "05",
        "titulo": "El ocaso de los faraones",
        "subtitulo": "De Alejandro Magno a Cleopatra",
        "escenas": [
            ("desierto", [
                "Después de Ramsés, Egipto entró en un largo declive.",
                "Libios, nubios, asirios y persas gobernaron el país en distintos momentos.",
            ]),
            ("faro", [
                "En el año trescientos treinta y dos antes de Cristo llegó Alejandro Magno, que fue recibido como un libertador.",
                "Fundó la ciudad de Alejandría, que se convirtió en el gran centro del saber del mundo antiguo, con su famosa biblioteca y su faro, una de las siete maravillas.",
            ]),
            ("jeroglificos", [
                "A su muerte, su general Ptolomeo fundó una dinastía de reyes de origen griego que gobernó durante casi tres siglos.",
                "De esta época es la piedra de Rosetta, que siglos después permitió a Champollion descifrar los jeroglíficos.",
            ]),
            ("cleopatra", [
                "La última reina de esta dinastía fue Cleopatra séptima, inteligente y culta, que hablaba varios idiomas.",
                "Se alió con Julio César y después con Marco Antonio para proteger a Egipto de Roma.",
                "Pero en el año treinta antes de Cristo, tras la derrota de Marco Antonio, Egipto pasó a ser una provincia romana.",
            ]),
            ("piramides", [
                "Así terminó la era de los faraones, después de unos tres mil años de historia.",
                "Sin embargo, sus pirámides, sus templos y sus secretos siguen asombrando al mundo.",
                "El antiguo Egipto nunca ha dejado de vivir en nuestra imaginación.",
            ]),
        ],
    },
]
