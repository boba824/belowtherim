# Palánk alatt

Reszponzív, kétnyelvű statikus cikkoldal. Az alapértelmezett nyelv magyar; a kiválasztott nyelvet és a világos/sötét témát a böngésző megjegyzi.

## Futtatás

A mappában indíts egy egyszerű webszervert:

```bash
python3 -m http.server 8080
```

Ezután nyisd meg a `http://localhost:8080` címet. Az oldal közvetlenül az `index.html` fájl megnyitásával is működik.

## Új cikk hozzáadása

1. Másold le az egyik fájlt az `articles` mappából, és módosítsd benne az azonosítót, dátumot, szerzőt, valamint a magyar és angol tartalmat.
2. Az új fájlt az `index.html` alján, az `app.js` előtt töltsd be egy új `<script>` elemmel.
3. A navigáció és az olvasási idő automatikusan frissül.

Az oldal nem használ külső keretrendszert, betűkészletet vagy követőkódot.
