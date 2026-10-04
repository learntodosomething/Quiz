# K-pop Kvíz (prototípus v2)

Helyi hálózaton futó zenefelismerős kvízjáték: a **gépeden** fut a
kezelőfelület (kérdés, visszaszámlálás, instrumentál lejátszása, videó
feloldás), a **telefonokról** egy QR kód beszkennelésével lehet
csatlakozni és válaszolni.

## Telepítés

Szükséges: [Node.js](https://nodejs.org) (18-as vagy újabb).

```bash
cd quiz-app
npm install
```

## Saját dalok hozzáadása

```
quiz-app/
  media/
    instrumental/   <- ide jönnek a zenei részletek (mp3)
    video/          <- ide jönnek a feloldáskor lejátszott videók (mp4)
  songs.js          <- itt add meg, melyik fájl melyik dalhoz tartozik
```

Nyisd meg a `songs.js` fájlt, és minden dalhoz add meg:

```js
{
  instrumental: 'song1.mp3',   // fájlnév a media/instrumental mappában
  video: 'song1.mp4',          // fájlnév a media/video mappában (vagy '' ha nincs)
  options: ['Előadó – Cím', 'Előadó – Cím', 'Előadó – Cím', 'Előadó – Cím'],
  correct: 0                   // a helyes válasz indexe (0-3)
}
```

Tetszőleges számú dalt felvehetsz, csak másold a mintát. A videókat nem
kell előre 16:9-re vágni — a kezelőfelület automatikusan kitöltve (cover)
jeleníti meg őket.

## Indítás

```bash
npm start
```

A terminálban két cím jelenik meg:

- **Kezelő (gépen):** `http://localhost:3000/host.html` — ezt nyisd meg a
  géped böngészőjében, ezt vetítsd ki / mutasd a kivetítőn, itt szól majd
  a zene is (a gép hangszóróján/hangrendszerén keresztül).
- **Csatlakozás (telefon):** a host oldalon megjelenő **QR kódot** kell
  beszkennelni a telefonokkal.

> A gépnek és a telefonoknak **ugyanazon a WiFi-hálózaton** kell lenniük.

## Egy kör menete

1. A telefonok csatlakoznak (QR kód → név megadása).
2. Gépen: **START** → elindul az első dal 8 másodperces visszaszámlálása,
   közben szól az instrumentál a gép hangszóróján. A csillagok fogynak,
   ahogy telik az idő.
3. A telefonokon 4 válaszgomb jelenik meg — egy koppintás rögzíti a
   választ (utólag nem módosítható).
4. Ha lejár az idő, a visszaszámlálás helyén megjelenik egy **"Újra
   lejátszás"** gomb — ezzel bármikor újra elindítható az instrumentál.
5. Gépen **"Megoldás megmutatása"** → megáll a zene, lejátszódik a dalhoz
   tartozó videó, kiemelve a helyes válasz, mindenki látja, eltalálta-e.
6. **"Következő dal"** → ismétlődik, amíg el nem fogynak a dalok.
7. A végén mindkét oldalon megjelenik a végeredmény/ranglista.
8. **"Új kvíz indítása"** — nullázza a pontokat, a csatlakozott játékosok
   megmaradnak.

## Design

A felület a Jersey 25 betűtípust és fehér izzás (glow) effektust
használja a címekhez, sötét, csillagos háttérrel — a `public/assets`
mappában lévő képek (a Word tervekből átvéve) szolgálnak alapként a
háttérhez és a dekorációhoz. Ha ezek nem pontosan azt az irányt adják,
amit elképzeltél, szólj, és finomhangolom (pl. az ezüst keret elemek
pontos elhelyezését, az intro-animációt, vagy a csillag-számlálás
stílusát).

## Következő lépések (a tervekből még nincs benne)

A feltöltött tervek több finomítást is említenek, amiket még nem
építettem be — szólj, ha ezek közül bármelyiket szeretnéd, és
hozzáadom:

- Intro képernyő "light-flickering" effektussal, majd átváltás a
  leírásra/QR kódra
- Az ezüst dekoráció pontos elhelyezése a videó/kérdés körül
- "Mindenki kész" gomb/jelzés, amikor minden játékos válaszolt
- Revamped START gomb egyedi grafikával (a te png-d alapján)

## Kérdések/dalok szerkesztése

Lásd fentebb — minden a `songs.js` fájlban van, tetszőlegesen bővíthető.
