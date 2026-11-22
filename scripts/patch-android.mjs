// Ajusta los proyectos Android generados por Capacitor (idempotente):
// orientación vertical, ID de app de AdMob, firma release, versión y color de la pantalla de carga.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const apps = JSON.parse(fs.readFileSync(path.join(root, 'apps/apps.json'), 'utf8'));

for (const a of apps) {
  const app = path.join(root, 'apps', a.dir, 'android/app');
  if (!fs.existsSync(app)) { console.log('… sin android:', a.dir); continue; }

  // AndroidManifest
  const mf = path.join(app, 'src/main/AndroidManifest.xml');
  let m = fs.readFileSync(mf, 'utf8');
  if (!m.includes('screenOrientation')) m = m.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="portrait"');
  m = m.replace(/\s*<meta-data\s+android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"[^>]*\/>/, '');
  m = m.replace('<application', '<application').replace(/(<application[^>]*>)/, `$1\n        <meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="${a.admobAppId}"/>`);
  if (!m.includes('com.google.android.gms.permission.AD_ID')) m = m.replace('<uses-permission android:name="android.permission.INTERNET" />', '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="com.google.android.gms.permission.AD_ID" />');
  fs.writeFileSync(mf, m);

  // build.gradle: versión por variables de entorno + firma release
  const bg = path.join(app, 'build.gradle');
  let g = fs.readFileSync(bg, 'utf8');
  g = g.replace(/versionCode .*$/m, 'versionCode(Integer.parseInt(System.getenv("VERSION_CODE") ?: "1"))')
       .replace(/versionName .*$/m, 'versionName(System.getenv("VERSION_NAME") ?: "1.0.0")');
  if (!g.includes('signingConfigs')) {
    g = g.replace('    buildTypes {', `    // Firma: variables de entorno (CI) o archivo android/keystore.properties (local)
    def ksProps = new Properties()
    def ksFile = rootProject.file('keystore.properties')
    if (ksFile.exists()) ksFile.withInputStream { ksProps.load(it) }
    def ks = { k, e -> System.getenv(e) ?: ksProps.getProperty(k) }
    signingConfigs {
        release {
            if (ks('storeFile', 'ANDROID_KEYSTORE_PATH')) {
                storeFile file(ks('storeFile', 'ANDROID_KEYSTORE_PATH'))
                storePassword ks('storePassword', 'ANDROID_KEYSTORE_PASSWORD')
                keyAlias ks('keyAlias', 'ANDROID_KEY_ALIAS')
                keyPassword ks('keyPassword', 'ANDROID_KEY_PASSWORD')
            }
        }
    }
    buildTypes {`);
    g = g.replace("            minifyEnabled false\n", "            minifyEnabled false\n            if (signingConfigs.release.storeFile) signingConfig signingConfigs.release\n");
  }
  fs.writeFileSync(bg, g);

  // Pantalla de carga (Android 12+) con el color del juego
  const st = path.join(app, 'src/main/res/values/styles.xml');
  let s = fs.readFileSync(st, 'utf8');
  if (!s.includes('windowSplashScreenBackground')) s = s.replace('<item name="android:background">@drawable/splash</item>',
    `<item name="android:background">@drawable/splash</item>\n        <item name="windowSplashScreenBackground">${a.bg}</item>\n        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>`);
  fs.writeFileSync(st, s);
  const colors = path.join(app, 'src/main/res/values/colors.xml');
  if (!fs.existsSync(colors)) fs.writeFileSync(colors, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="colorPrimary">${a.bg}</color>\n    <color name="colorPrimaryDark">${a.bg}</color>\n    <color name="colorAccent">${a.accent}</color>\n</resources>\n`);
  console.log('✔ android parcheado:', a.dir);
}
