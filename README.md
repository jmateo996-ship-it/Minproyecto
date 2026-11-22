# Minproyecto: 3 juegos para Google Play

| Juego | Género | Monetización | ID de paquete |
|---|---|---|---|
| 🚗 **Aparcamiento Imposible** | Puzle de atascos (hybrid-casual) | Intersticial entre niveles · recompensado (monedas x2, +vidas, grúa) | `com.minproyecto.aparcamiento` |
| 🧟 **Cocina Zombi** | Idle tycoon + defensa nocturna | Recompensado (turbo x2, botín x2, ganancias offline x2, revivir) · intersticial tras la noche | `com.minproyecto.cocinazombi` |
| 🔩 **Tornillos del Tiempo** | Puzle de tornillos con rebobinado | Recompensado (rebobinar, +hueco, monedas x2) · intersticial | `com.minproyecto.tornillos` |

Los tres están hechos en HTML5 Canvas, sin librerías ni archivos de arte. Se empaquetan como apps Android nativas con **Capacitor 8** y llevan anuncios **AdMob** con formulario de consentimiento GDPR (UMP). Funcionan sin conexión, en español o en inglés según el idioma del móvil. Los niveles se generan de forma procedimental y siempre tienen solución.

```
apps/<juego>/www/       ← código del juego (index.html, game.js, config.js)
apps/<juego>/android/   ← proyecto Android (ábrelo en Android Studio si quieres)
shared/                 ← núcleo común (sonido, guardado, anuncios, UI) → se copia a cada juego
store/                  ← iconos 512 px, gráficos destacados, capturas y FICHAS.md con todos los textos
scripts/                ← sincronización, parches de Android, generador de imágenes de tienda
.github/workflows/      ← compila APK + AAB de los 3 juegos en GitHub
```

## Probar en el navegador
```bash
npm install
npm run serve        # → http://localhost:8080/aparcamiento/www/  (y /cocina-zombi/www/, /tornillos/www/)
```
En el navegador, los anuncios se simulan con una pantalla negra de 1,5 s.

## Conseguir el APK / AAB
Cada `push` lanza **Actions → Android build** y deja como *artifacts* lo siguiente para cada juego:
- `app-debug.apk`: para instalar y probar directamente en tu móvil.
- `app-release.aab`: el archivo que se sube a Google Play. Solo sale **firmado** si configuras la clave (paso 2).

---

## Pasos para publicar (en orden)

### 1. Cambia el ID de paquete (opcional, pero hazlo ANTES de la primera subida)
El `applicationId` no se puede cambiar una vez publicado. Si quieres uno tuyo (p. ej. `com.tunombre.parking`), cámbialo en `apps/apps.json`, `apps/<juego>/capacitor.config.json` y `apps/<juego>/android/app/build.gradle` (`namespace` y `applicationId`).

### 2. Crea tu clave de subida y añádela a GitHub
```bash
keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 upload.jks > upload.b64     # en Mac: base64 -i upload.jks -o upload.b64
```
En GitHub, ve a **Settings → Secrets and variables → Actions → New repository secret** y crea estos secretos:
- `ANDROID_KEYSTORE_BASE64`: el contenido de `upload.b64`
- `ANDROID_KEYSTORE_PASSWORD`: la contraseña del keystore
- `ANDROID_KEY_ALIAS`: `upload`
- `ANDROID_KEY_PASSWORD`: la contraseña de la clave

⚠️ Guarda `upload.jks` y sus contraseñas en un lugar seguro y **nunca lo subas al repositorio** (ya está en `.gitignore`). Puedes usar la misma clave para los tres juegos.

### 3. Cuenta de Google Play Console
- Regístrate en https://play.google.com/console. Cuesta 25 USD una sola vez.
- Las **cuentas personales nuevas** deben hacer una **prueba cerrada con al menos 12 testers durante 14 días** antes de poder publicar en producción. Empieza esa prueba cuanto antes.

### 4. AdMob (para cobrar por los anuncios)
1. Crea una cuenta en https://admob.google.com y añade **3 apps** (una por juego).
2. En cada app crea 3 bloques: **Intersticial**, **Bonificado** y **Banner** (el banner es opcional).
3. Pon el **ID de app** (`ca-app-pub-…~…`) en `admobAppId` de `apps/apps.json` y ejecuta `node scripts/patch-android.mjs`.
4. Pon los **ID de bloque** (`ca-app-pub-…/…`) en `apps/<juego>/www/config.js` y cambia `production: true`.
5. En AdMob, ve a **Privacidad y mensajes** y crea un mensaje **RGPD** (europeo). El juego ya lo muestra automáticamente.
6. Cuando la app esté en Play, enlázala desde AdMob y publica tu `app-ads.txt` (AdMob te da el contenido).

> Mientras `production` sea `false`, se usan los anuncios de **prueba** de Google. Nunca toques tus propios anuncios reales: AdMob puede suspender tu cuenta.

### 5. Política de privacidad (obligatoria por llevar anuncios)
Cada juego incluye su `privacy.html`. Para publicarla:
```bash
DEVELOPER_NAME="Tu nombre" CONTACT_EMAIL="tu@email.com" npm run sync-shared
```
Después publícala en una URL pública. La forma más fácil es activar **GitHub Pages** en este repositorio; la URL quedará así: `https://<usuario>.github.io/Minproyecto/apps/aparcamiento/www/privacy.html`.

### 6. Crea la ficha de cada app en Play Console
Copia los títulos, descripciones y respuestas de los formularios (Seguridad de los datos, ID de publicidad, clasificación de contenido y público objetivo) de **`store/FICHAS.md`**. Sube las imágenes de `store/<juego>/`.

### 7. Sube el AAB
Haz `push`, descarga el *artifact* firmado de Actions y súbelo en **Prueba → Prueba cerrada → Crear versión**. El `versionCode` sube solo en cada compilación (es el número de ejecución del workflow).

---

## Comandos útiles
| Comando | Qué hace |
|---|---|
| `npm run serve` | Servidor local para jugar en el navegador |
| `npm run sync-shared` | Copia `shared/` a cada juego y regenera `privacy.html` |
| `npm run cap:sync` | Copia el juego web a los proyectos Android |
| `node scripts/patch-android.mjs` | Reaplica los ajustes de Android (orientación, AdMob, firma) |
| `npm run store-assets` | Regenera iconos, pantallas de carga y capturas (requiere Playwright) |

## Siguientes mejoras recomendadas (para subir ingresos)
- **Compra «Sin anuncios»** (2,99-4,99 €) con `@capacitor-community/in-app-purchases` o RevenueCat. El juego ya tiene el interruptor `noAds` en `shared/core.js`.
- **Firebase Analytics** para medir la retención D1/D7 y en qué nivel abandona la gente.
- **Música** de fondo con licencia libre.
- **Probar anuncios en TikTok/Meta** con 50-100 € por juego **antes** de invertir más: quédate con el que tenga el coste por instalación más bajo.
