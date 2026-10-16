# Palánk alatt / Below the Rim

Kétnyelvű, reszponzív kosárlabda-archívum magyar fordításokkal és eredeti angol cikkekkel. A webhely HTML, CSS és JavaScript alapú; a külön cikkoldalakat Node.js script generálja a cikkadatokból. A publikálás GitHub Pages-en történik.

Éles cím: https://www.palankalatt.hu/

## Az oldal működése

- A főoldal (`/`) az archívum belépőoldala. A keresést, címkeszűrést és a főoldali tartalom megjelenítését az `app.js` kezeli.
- Minden cikk önálló magyar és angol HTML-oldalt kap, ha az adott nyelvi tartalma rendelkezésre áll.
- A cikkoldalak teljes szövege, navigációja és SEO-metaadatai már a generált HTML-ben szerepelnek. A cikk és a linkek JavaScript nélkül is elérhetők.
- Az `article-page.js` a cikkoldali témaváltást, mobilmenüt, keresést és címkeszűrést kezeli.
- A cikklista keresése a cím, bevezető, szerző és címkék alapján működik; nem teljes szövegű keresés. A szöveges és címkeszűrés együtt is használható.
- A világos/sötét téma és a kézi nyelvválasztás a böngésző helyi tárolójába kerül.

### URL-ek

| Oldal | Útvonal |
| --- | --- |
| Főoldal | `/` |
| Magyar cikk | `/articles/hu/wennington-blocked-jordan-shot.html` |
| Angol cikk | `/articles/en/wennington-blocked-jordan-shot.html` |
| Webhelytérkép | `/sitemap.xml` |
| Keresőrobotok beállításai | `/robots.txt` |

A cikkfájlok `.html` végűek; nincs cikkenkénti külön mappa és `index.html`.

## Fájlszerkezet

```text
index.html
styles.css
app.js
article-page.js
legacy-links.js
favicon.svg
robots.txt
sitemap.xml
CNAME
README.md
articles/
  wennington-blocked-jordan-shot.js
  tovabbi-cikk.js
  hu/
    wennington-blocked-jordan-shot.html
    tovabbi-cikk.html
  en/
    wennington-blocked-jordan-shot.html
    tovabbi-cikk.html
assets/
  wennington/
    jordan-55-knicks.jpg
  tovabbi-cikk/
    kep.jpg
templates/
  article.html
scripts/
  build-articles.mjs
```

| Fájl vagy mappa | Szerep | Karbantartás |
| --- | --- | --- |
| `articles/*.js` | Cikkadatok mindkét nyelven | Kézzel szerkesztendő |
| `assets/` | Képek és egyéb média | Kézzel karbantartandó |
| `templates/article.html` | A cikkoldalak közös sablonja | Kézzel szerkesztendő, majd generálni kell |
| `scripts/build-articles.mjs` | Oldalak, menük, scriptlista és sitemap előállítása | Kézzel szerkesztendő |
| `articles/hu/*.html`, `articles/en/*.html` | Publikálható cikkoldalak | Generált; ne szerkeszd kézzel |
| `index.html` | Főoldal | Kézi tartalom és jelölt generált blokkok |
| `styles.css` | Közös megjelenés | Kézzel szerkesztendő |
| `app.js` | Főoldali működés | Csak a főoldal tölti be |
| `article-page.js` | Cikkoldali működés | A közös sablon tölti be |
| `legacy-links.js` | Régi hash-linkek kezelése | A főoldal tölti be |
| `sitemap.xml` | A főoldal és a cikkváltozatok URL-jei | Generált |
| `robots.txt` | Feltérképezési szabályok és sitemap címe | Kézzel karbantartandó |
| `CNAME` | GitHub Pages egyéni domainje | A választott éles domain |

A főoldali `app.js` fájlt ne add hozzá a cikkoldali sablonhoz: a főoldal cikktartalmát rendereli újra, ezért hibát vagy nem kívánt tartalomcserét okozhatna a statikus cikkoldalakon.

## Előfeltételek

- Modern Node.js, amely támogatja az ES-modulokat és az `Object.hasOwn()` függvényt; javasolt telepített LTS-verzió használata.
- Python 3 a helyi HTTP-kiszolgálóhoz, vagy VS Code Live Server.
- Git a változások publikálásához.

A jelenlegi generálóhoz nincs szükség `npm install` futtatására vagy külső npm-csomagra.

```bash
node --version
python3 --version
```

## Helyi generálás és futtatás

A repository gyökerében:

```bash
node scripts/build-articles.mjs
python3 -m http.server 8000
```

Nyisd meg:

- http://localhost:8000/
- http://localhost:8000/articles/hu/wennington-blocked-jordan-shot.html
- http://localhost:8000/articles/en/wennington-blocked-jordan-shot.html

A kiszolgálót `Ctrl+C` állítja le. HTTP-n tesztelj; a fájl közvetlen, `file://` megnyitása a gyökérből induló assetútvonalak miatt nem megfelelő.

### Mit csinál a generáló?

1. Beolvassa az `articles/` közvetlenül benne lévő `.js` adatfájljait.
2. Ellenőrzi a cikkazonosítókat, a meglévő nyelvi tartalmakat és dátumokat.
3. A sablonból elkészíti az elérhető nyelvi változatokat.
4. Minden cikkoldalra beilleszti az adott nyelv teljes cikkmenüjét és szűrőit.
5. Frissíti a főoldal magyar statikus cikklistáját és adatfájl-betöltéseit.
6. Elkészíti a `sitemap.xml` fájlt.

A menü `dateAdded` szerint csökkenő sorrendű; egyezésnél az `id` dönt. A cikkadatfájlokat a generáló JavaScriptként futtatja, ezért csak saját, ellenőrzött adatfájlokat helyezz ebbe a mappába.

## Új cikk létrehozása

### 1. Adatfájl és azonosító

Másolj le egy működő adatfájlt az `articles/` mappában. A fájlnév és az `id` lehetőleg egyezzen:

```text
articles/uj-kosarlabda-tortenet.js
```

Egy adatfájl pontosan egy cikket adjon a listához:

```js
window.ARTICLES = window.ARTICLES || [];

window.ARTICLES.push({
  id: 'uj-kosarlabda-tortenet',
  date: '2009-08-24',
  dateAdded: '2026-10-17',
  author: 'Az eredeti szerző neve',
  source: 'Az eredeti forrás neve',
  tags: ['michael-jordan', 'chicago-bulls'],
  hu: {
    title: 'A cikk magyar címe',
    deck: 'Rövid magyar bevezető.',
    seoDescription: 'A magyar cikk egyedi keresési és megosztási leírása.',
    disclaimer: '',
    body: [
      { text: 'A cikk első bekezdése.' },
      { type: 'quote', paragraphs: ['Az idézet szövege.'] },
      { type: 'image', src: 'assets/uj-kosarlabda-tortenet/kep.jpg', alt: 'A kép tartalmának leírása.', caption: 'Képaláírás és fotóforrás.' }
    ]
  },
  en: {
    title: 'English article title',
    deck: 'A short introduction in English.',
    seoDescription: 'A unique description for the English article.',
    disclaimer: '',
    body: [
      { text: 'The first paragraph of the article.' },
      { type: 'quote', paragraphs: ['The quoted text.'] },
      { type: 'image', src: 'assets/uj-kosarlabda-tortenet/kep.jpg', alt: 'A description of the image.', caption: 'Image caption and photo credit.' }
    ]
  }
});
```

Az `id` legyen egyedi, kisbetűs, ékezet nélküli, kötőjellel tagolt. Csak `a–z`, szám és az elválasztó kötőjel használható. Publikálás után lehetőleg ne változtasd, mert az URL-ek ebből készülnek.

### 2. Mezők jelentése

| Mező | Jelentés |
| --- | --- |
| `id` | A cikk URL-azonosítója |
| `date` | Az eredeti cikk dátuma; opcionális, `YYYY-MM-DD` formátum |
| `dateAdded` | Archívumba kerülés dátuma; ez látszik a menüben |
| `author` | Eredeti szerző; közös a nyelvi változatokban |
| `source` | Forrás neve egyszerű szövegként |
| `tags` | Címkeazonosítók tömbje |
| `hu`, `en` | Nyelvi tartalmak; hiányzó változatból nem készül oldal |
| `title` | Látható cikkcím és a generált oldalcím alapja |
| `deck` | A cím alatti bevezető |
| `seoDescription` | Opcionális egyedi meta- és megosztási leírás; hiányában a `deck`, majd a cím használatos |
| `disclaimer` | Opcionális tájékoztató; üresen nem jelenik meg |
| `body` | Nem üres tömb a cikk tartalmi blokkjaival |

Ha nincs eredeti dátum, hagyd ki a `date` mezőt. Ilyenkor a cikk tetején csak az olvasási idő jelenik meg. A forrás a szerző alatt látszik, ha meg van adva.

A kétnyelvű publikálás a szokásos munkamenet. Egyetlen nyelvi változat esetén a hiányzó fordítás objektumát hagyd ki; a főoldali cikkmegjelenítést és nyelvváltást külön is ellenőrizd.

### 3. Támogatott tartalmi blokkok

```js
{ text: 'Egy bekezdés szövege.' }
{ type: 'paragraph', text: 'Egy másik bekezdés.' }
{ type: 'quote', paragraphs: ['Első idézett bekezdés.', 'Második idézett bekezdés.'] }
{ type: 'image', src: 'assets/cikk/kep.jpg', alt: 'Képleírás', caption: 'Képaláírás' }
{ type: 'image', layout: 'portrait', src: 'assets/cikk/portre.jpg', alt: 'Portré leírása', caption: 'Képaláírás' }
```

A generáló a szöveget HTML-escape-eli. A szövegmezőkbe írt HTML nem formázásként, hanem szövegként jelenik meg. Új blokktípushoz a generálót és szükség esetén a főoldali renderelést is bővíteni kell.

Az olvasási idő a bekezdések és idézetek szavain alapul, 210 szó/perc sebességgel, felfelé kerekítve, minimum egy perc.

### 4. Képek és címkék

A képeket helyezd az `assets/<cikkazonosító>/` mappába. Az adatfájlban `assets/…` útvonalat használj; a generáló ebből `/assets/…` hivatkozást készít. A fájlnév kis- és nagybetűi egyezzenek a hivatkozással.

Minden nyelvnél adj megfelelő `alt` szöveget. A megosztási előnézethez és strukturált adatokhoz az adott változat első képe használatos.

Új címke megjelenítési nevét mindkét helyen add meg:

- `app.js`: `tagLabels` — főoldal;
- `scripts/build-articles.mjs`: `tagLabels` — generált cikkoldalak.

Példa:

```js
'new-york-knicks': { hu: 'Knicks', en: 'Knicks' }
```

Hiányzó címkefordítás esetén az azonosító jelenik meg.

### 5. Generálás

```bash
node scripts/build-articles.mjs
```

Nem kell kézzel `<script>` elemet hozzáadni az új cikkhez: a főoldali betöltési listát is a generáló frissíti.

Az `index.html` alábbi jelölőit ne töröld és ne duplikáld:

```html
<!-- GENERATED:ARTICLE-NAV:START -->
<!-- GENERATED:ARTICLE-NAV:END -->

<!-- GENERATED:ARTICLE-SCRIPTS:START -->
<!-- GENERATED:ARTICLE-SCRIPTS:END -->
```

A jelölők közötti tartalom felülíródik. A főoldali scriptbetöltések sorrendje:

```html
<!-- GENERATED:ARTICLE-SCRIPTS:START -->
<!-- A generált cikkadat-betöltések helye. -->
<!-- GENERATED:ARTICLE-SCRIPTS:END -->
<script src="/legacy-links.js"></script>
<script src="app.js"></script>
```

## Tesztelési ellenőrzőlista

### Tartalom és navigáció

- [ ] A generáló hiba nélkül lefut.
- [ ] A főoldalon és mindkét nyelvi cikkoldalon helyes a megjelenés.
- [ ] A cikkoldal közvetlen URL-ről és frissítés után is megnyílik.
- [ ] A teljes szöveg, idézetek, képek és képaláírások megjelennek.
- [ ] A menü `dateAdded`, a cikktető az opcionális `date` értéket mutatja.
- [ ] A szerző és az opcionális forrás megfelelő.
- [ ] A cikkválasztó linkjei és a nyelvváltó a megfelelő `.html` oldalra vezetnek.
- [ ] Új lapon megnyitás és böngésző-visszalépés működik.

### Interaktív funkciók és mobil

- [ ] Keresés, címkeszűrés, kombinált szűrés és törlés működik a főoldalon és a cikkoldalakon.
- [ ] Nincs találat esetén megjelenik a megfelelő üzenet.
- [ ] A témaváltás működik és frissítés után megmarad.
- [ ] Mobilon nincs vízszintes túlcsordulás; a menü megnyílik és bezáródik.
- [ ] A cikkcím és a nyelvváltó stílusa mindkét oldaltípuson megfelelő.
- [ ] A konzolban nincs JavaScript-hiba, a Network panelen nincs hiányzó kép vagy script.

### JavaScript nélkül és SEO

- [ ] Kikapcsolt JavaScript mellett, újratöltés után is olvasható a generált cikk.
- [ ] A főoldal statikus magyar cikkmenüje JavaScript nélkül is használható.
- [ ] A cikkoldal forrásában szerepel a megfelelő `lang`, title és description.
- [ ] A canonical a megnyitott cikk saját éles URL-je.
- [ ] A `hreflang` a létező nyelvi változatokra mutat.
- [ ] Az Open Graph kép és URL teljes, helyes HTTPS-cím.
- [ ] A JSON-LD cím, nyelv és szerző helyes.

A helyi HTML-ben a canonical és megosztási URL-ek szándékosan az éles domainre mutatnak.

## Nyelvválasztás és régi linkek

A főoldali nyelvválasztás sorrendje:

1. Korábbi kézi választás a `localStorage.language` értékében.
2. A `navigator.language` alapján magyar (`hu` vagy `hu-…`) böngészőnél magyar, minden más esetben angol.

A böngésző kezelőfelületének nyelve eltérhet a `navigator.language` értékétől. Ez nem helymeghatározás és nem országdetektálás.

A konkrét cikk-URL mindig elsőbbséget élvez: az `/articles/hu/…html` oldal magyar marad. A cikkoldali nyelvváltó ugyanannak a cikknek a másik változatát nyitja meg.

Tesztelés a böngésző konzoljában:

```js
console.log(navigator.language);
console.log(localStorage.getItem('language'));
localStorage.removeItem('language');
location.href = '/';
```

A `legacy-links.js` a főoldalra érkező régi `#cikkazonosító` hivatkozásokat az új cikk-URL-ekre navigálja. Csak létező cikket kezel, a `#about` és `#article` belső hivatkozásokat megtartja. Ez JavaScriptes navigáció, nem HTTP 301 átirányítás.

Próbák:

```text
http://localhost:8000/#wennington-blocked-jordan-shot
http://localhost:8000/index.html#wennington-blocked-jordan-shot
http://localhost:8000/#about
http://localhost:8000/#article
http://localhost:8000/#nem-letezo-cikk
```

## Publikálás GitHub Pages-re

A jelenlegi munkamenetben a generált HTML-eket és a sitemapet is commitoljuk. A generálást helyben kell futtatni; automatikus GitHub Actions-generálást ez a leírás nem feltételez.

1. Szerkeszd a cikkadatokat, képeket vagy sablont.
2. Futtasd a generálót.
3. Végezd el a helyi ellenőrzéseket.
4. Nézd át a változásokat:

```bash
git status
git diff --stat
git diff
```

5. Add hozzá a publikálandó fájlokat. Az alábbi parancs az oldal fő tartalmi útvonalait veszi fel; további módosított fájlokat külön adj hozzá, ha szükséges:

```bash
git add index.html articles/ assets/ sitemap.xml
```

Sablon vagy kód módosításakor például:

```bash
git add templates/article.html scripts/build-articles.mjs styles.css app.js article-page.js legacy-links.js
```

6. Ellenőrizd a commit tartalmát, majd commit és push:

```bash
git diff --cached --stat
git commit -m "Publish updated basketball archive"
git push
```

7. Ellenőrizd a GitHub Pages publikálás sikerét és az éles oldalt.

A GitHub Pages által publikált ágra és mappába kerüljenek a fájlok. A `CNAME` és a generáló `domain` beállítása ugyanazt az elsődleges domaint használja: `www.palankalatt.hu`. A HTTPS-kényszerítés legyen bekapcsolva.

### Éles ellenőrzés

- https://www.palankalatt.hu/
- https://www.palankalatt.hu/robots.txt
- https://www.palankalatt.hu/sitemap.xml
- Egy magyar és egy angol cikk közvetlen címe.

A cikkoldalak HTTP-státusza legyen 200; egy nem létező címé 404. A sitemapet a Google Search Console-ban kell beküldeni. Az URL-ellenőrzéssel és az élő teszttel ellenőrizhető a publikált változat.

Strukturált adatok ellenőrzése:

- https://search.google.com/test/rich-results
- https://validator.schema.org/

A sitemap és a strukturált adatok nem garantálják az indexelést vagy a bővített keresési megjelenést.

## SEO-adatok

A cikkoldalak generáláskor egyedi title-t, leírást, canonical és kölcsönös nyelvi hivatkozásokat, Open Graph és Twitter Card metaadatokat, valamint `Article` JSON-LD blokkot kapnak.

A JSON-LD jelenleg nem állít be automatikusan `datePublished` vagy `dateModified` értéket: az eredeti forrásdátum és az archívumba kerülés dátuma nem azonos feltétlenül az adott nyelvi változat publikálásával.

A sitemap a főoldalt és a meglévő nyelvi cikkoldalakat tartalmazza. Nem tartalmaz hash-linkeket, adatfájlokat vagy automatikusan frissített `lastmod` dátumot.

A `robots.txt` tartalma:

```text
User-agent: *
Allow: /

Sitemap: https://www.palankalatt.hu/sitemap.xml
```

## Gyakori hibák

| Tünet | Ellenőrzés vagy javítás |
| --- | --- |
| Cikkmódosítás nem látszik | Mentsd az adatfájlt, futtasd újra a generálót, majd frissíts gyorsítótár nélkül (`Cmd+Shift+R`) |
| Kép vagy CSS nem töltődik | A repository gyökeréből indíts HTTP-kiszolgálót; ellenőrizd az útvonalat és a fájlnév betűméretét |
| Új cikk nincs a főoldalon | Generálás után ellenőrizd a generált menüt és scriptlistát |
| Hiányzó sablonérték vagy felirat | Ellenőrizd a `values`, illetve a `labels.hu` és `labels.en` mezőit |
| Hiányzó vagy ismétlődő jelölő | Állítsd helyre az `index.html` generált blokkjelölőit |
| A cím nem formázott | A CSS a `.article #article-title` szelektort célozza, ne csak a régi `<h2>` elemet |
| Nyelvváltó linkjei eltérően néznek ki | A CSS a `.language-switch a` elemeket is formázza |
| Cikkoldali kereső hiányzik | Ellenőrizd a sablon keresőblokkját, az `article-page.js` betöltését és a konzolhibákat |
| Szűréskor nem tűnnek el a linkek | A `[hidden]` elemekhez tartozó `display: none` szabály legyen meg |
| Angol böngészőben magyar főoldal | Ellenőrizd a mentett nyelvet és a `navigator.language` tényleges értékét |
| Generált HTML kézi javítása eltűnik | A sablont vagy adatfájlt módosítsd, majd generálj újra |

A generáló jelenleg nem törli automatikusan a korábban előállított cikkoldalakat. Cikk törlése, azonosítóváltás vagy fordítás eltávolítása után a régi generált HTML-eket külön is rendezni kell, és a korábbi URL-ek sorsáról dönteni kell.

A jelenlegi képkezelés nem végez automatikus tömörítést, WebP/AVIF-konverziót vagy képméret-meghatározást. Ezek külön továbbfejlesztések.

## Külső szolgáltatások

Az oldalhoz nincs szükség frontend keretrendszerre vagy külső betűkészletre. A főoldal korábbi változatában Google Analytics-kód szerepelt; a cikkoldali sablon ezt nem örökli automatikusan. A mérés tényleges lefedettségét az `index.html` és a `templates/article.html` alapján ellenőrizd.
