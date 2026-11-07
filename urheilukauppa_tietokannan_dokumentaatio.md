# Urheilukaupan tietokannan dokumentaatio

**Projekti:** Web-projekti TX00EY24-3014\
**Tietokanta:** Urheilukaupan verkkokauppa\
**Skeeman versio:** 1.0\
**Kohdetietokanta:** MariaDB / MySQL, InnoDB\
**Dokumentin tarkoitus:** Kuvata jokaisen tietokantataulun sarakkeet,
avaimet, käyttötarkoitus ja liittyminen verkkokaupan toimintoihin.

---

## 1. Yleiskuvaus

Tietokanta on suunniteltu urheilutarvikkeiden verkkokaupalle, jossa
asiakas voi selata tuotteita, valita tuotevariantin, lisätä tuotteita
ostoskoriin, maksaa tilauksen etukäteen ja noutaa tilauksen
valitsemastaan noutopisteestä.

Järjestelmässä on yksi tai useampi keskusvarasto sekä useita
noutopisteitä. Tuotteet toimitetaan noutopisteisiin vasta asiakkaan
tekemän tilauksen perusteella. Jos asiakas ei nouda tilausta määräajan
kuluessa, tilaus palautetaan keskusvarastoon ja asiakkaalle tehdään
hyvitys.

Tietokanta tukee lisäksi käyttäjätilejä, vierastilauksia,
kanta-asiakaspisteitä, maksutapahtumia, hyvityksiä, tuotekuvia,
tuotevariantteja ja tilausten tilahistoriaa. HSL:n reititystiedot
haetaan ulkoisesta rajapinnasta. Tietokantaan tallennetaan
noutopisteiden osoitteet ja koordinaatit, ei varsinaisia reittituloksia.

Tietokannassa on 26 taulua:

1.  `users`
2.  `user_credentials`
3.  `user_addresses`
4.  `brands`
5.  `categories`
6.  `products`
7.  `product_variants`
8.  `product_images`
9.  `attributes`
10. `attribute_values`
11. `variant_attribute_values`
12. `variant_prices`
13. `locations`
14. `inventory`
15. `carts`
16. `cart_items`
17. `orders`
18. `order_items`
19. `inventory_reservations`
20. `payments`
21. `refunds`
22. `shipments`
23. `inventory_movements`
24. `loyalty_holds`
25. `loyalty_transactions`
26. `order_status_history`

## 2. Keskeiset suunnitteluperiaatteet

### 2.1 Tuote ja tuotevariantti ovat eri asioita

`products` kuvaa yleistä tuotetta eli tuoteperhettä. Esimerkiksi Nike
Air Force 1 on yksi tuote, vaikka siitä myydään useita värejä ja kokoja.

`product_variants` kuvaa yksittäistä myytävää versiota. Esimerkiksi Nike
Air Force 1, musta, koko 42 on oma varianttinsa. Jokaisella variantilla
on oma tunniste (`id`) ja varastotunniste (`sku`).

Variantin ominaisuudet tallennetaan joustavasti tauluihin `attributes`,
`attribute_values` ja `variant_attribute_values`. Näin eri
tuotetyypeille ei tarvitse tehdä omia kokoon, makuun tai painoon
liittyviä sarakkeita.

### 2.2 Hinnat ja rahasummat

Rahasummat tallennetaan sentteinä kokonaislukuina. Esimerkiksi 19,90
euroa tallennetaan arvona `1990`.

`variant_prices` sisältää variantin tämänhetkisen hinnan. Tilaushetken
hinta kopioidaan lisäksi `order_items`-tauluun, jotta myöhempi
hinnanmuutos ei muuta vanhojen tilausten tietoja.

### 2.3 Vierasasiakkaat ja rekisteröityneet käyttäjät

Rekisteröityneellä asiakkaalla on `users`-taulussa käyttäjätili ja
`user_credentials`-taulussa kirjautumistiedot.

Vierastilaus tallennetaan `orders`-tauluun siten, että `user_id` on
`NULL`. Vierasasiakkaan yhteystiedot tallennetaan tilaukselle aivan
kuten rekisteröityneen käyttäjän yhteystiedot.

Myös rekisteröityneen käyttäjän tilaukselle tallennetaan tilaushetken
nimi, sähköposti, puhelinnumero ja osoite. Näin vanhan tilauksen tiedot
eivät muutu, jos käyttäjä päivittää myöhemmin profiilinsa osoitteen.

### 2.4 Varaston varaaminen ja fyysinen varastosaldo

`inventory.quantity_on_hand` kuvaa fyysisesti varastossa olevaa määrää.
`inventory.quantity_reserved` kuvaa siitä maksuprosessin tai jo
vahvistetun tilauksen vuoksi varattua määrää.

Vapaasti tilattava määrä lasketaan näin:

`quantity_on_hand - quantity_reserved`

Maksuprosessin aikana tuotteelle luodaan `inventory_reservations`-rivi.
Varaus estää saman tuotteen myymisen kahdelle asiakkaalle
samanaikaisesti. Varaus ei vielä vähennä fyysistä varastosaldoa.

Kun tuote lähtee keskusvarastosta, fyysistä saldoa ja varattua määrää
pienennetään. Kun palautunut tuote vastaanotetaan takaisin
keskusvarastoon, fyysistä saldoa kasvatetaan.

Tietokanta ei yksin toteuta näitä varastotoimintoja. Backendin tulee
suorittaa niihin liittyvät muutokset SQL-transaktioissa.

### 2.5 Noutopisteet ja toimitukset

`locations` sisältää sekä keskusvarastot että noutopisteet.
`location_type` erottaa nämä toisistaan.

Noutopisteellä ei ole tässä mallissa tavallista vapaana myytävää
varastosaldoa. Noutopisteessä odottavat tuotteet liittyvät asiakkaiden
tilauksiin ja lähetyksiin.

`shipments` tallentaa keskusvarastolta noutopisteeseen menevän
lähetyksen sekä mahdollisen palautuslähetyksen. Noutopisteiden välisiä
siirtoja ei ole suunniteltu.

### 2.6 Kanta-asiakaspisteet

`loyalty_transactions` on pisteiden tapahtumakirjanpito. Positiivinen
`points_delta` kasvattaa saldoa ja negatiivinen vähentää sitä.

Maksun ajaksi käytettävät pisteet voidaan ensin varata
`loyalty_holds`-tauluun. Näin samaa pistemäärää ei voi käyttää kahdessa
samanaikaisessa tilauksessa.

Pisteiden rahallinen arvo ja tilauksen lopullinen hinta lasketaan
backendissä. Suunniteltu muuntosuhde on 1 piste = 0,01 euroa, mutta
tietokanta tallentaa sekä käytetyt pisteet että alennuksen rahamäärän
erikseen.

---

# 3. Taulujen dokumentaatio

## 3.1 `users` -- käyttäjätilit

**Tarkoitus:** Tallentaa verkkokaupan rekisteröityneet käyttäjät ja
ylläpitäjät. Taulu sisältää käyttäjän yleiset henkilötiedot ja
käyttöoikeusroolin, mutta ei sähköpostia tai salasanaa.
**Tarkoitus:** Tallentaa verkkokaupan rekisteröityneet käyttäjät ja
ylläpitäjät. Taulu sisältää käyttäjän yleiset henkilötiedot ja
käyttöoikeusroolin, mutta ei sähköpostia tai salasanaa.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, AUTO_INCREMENT Käyttäjän
yksilöllinen
tunniste.

`first_name` VARCHAR(100) NOT NULL Käyttäjän etunimi.

`last_name` VARCHAR(100) NOT NULL Käyttäjän sukunimi.

`phone` VARCHAR(30) NULL Käyttäjän profiiliin
tallennettu
puhelinnumero.

`role` VARCHAR(20) NOT NULL, DEFAULT Käyttöoikeusrooli.
`CUSTOMER` Sallitut arvot ovat
`CUSTOMER` ja
`ADMIN`.

`is_active` TINYINT(1) NOT NULL, DEFAULT 1 Ilmaisee, onko
käyttäjätili
aktiivinen.

`created_at` DATETIME NOT NULL, DEFAULT Käyttäjätilin
CURRENT_TIMESTAMP luontiaika.

`updated_at` DATETIME NOT NULL, Viimeisin
automaattinen käyttäjätietojen
päivitys muokkausaika.

---

**Avaimet ja rajoitteet:** - `id` on taulun pääavain. - `role`
tarkistetaan CHECK-rajoitteella. - `is_active` saa olla vain 0 tai 1.

**Liittyminen projektin toimintoihin:** Käyttäjä kirjautuu
verkkokauppaan ja voi tallentaa osoitteita, käyttää tietokantaan
tallennettua ostoskoria ja kerätä kanta-asiakaspisteitä.
`ADMIN`-roolilla voidaan näyttää ylläpitonäkymä ja sallia tuotteiden
sekä tilausten hallinta. Backendin pitää tarkistaa admin-oikeus
jokaisella suojatulla ylläpitäjän API-reitillä

## 3.2 `user_credentials` -- kirjautumistiedot

**Tarkoitus:** Erottaa kirjautumiseen liittyvät tiedot käyttäjän muista
profiilitiedoista.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`user_id` BIGINT UNSIGNED PK, FK Viittaus käyttäjään
`users.id`.

`email` VARCHAR(255) NOT NULL, UNIQUE Käyttäjän
kirjautumissähköposti.

`password_hash` VARCHAR(255) NOT NULL Palvelimella muodostettu
salasanan hash.

`password_changed_at` DATETIME NOT NULL, DEFAULT Aika, jolloin salasana
CURRENT_TIMESTAMP on viimeksi vaihdettu.

---

**Avaimet ja rajoitteet:** - `user_id` on sekä pääavain että
vierasavain. - `user_id` viittaa `users.id`-sarakkeeseen. - `email` on
yksilöllinen.

**Liittyminen projektin toimintoihin:** Rekisteröitymisessä backend
tallentaa sähköpostin ja salasanan hashin. Salasanaa ei tallenneta
selväkielisenä eikä tietokantaan tallenneta erillistä salausavainta.
Hash muodostetaan sovelluksessa esimerkiksi Argon2id- tai
bcrypt-menetelmällä. Kirjautumisessa annettua salasanaa verrataan
tallennettuun hashiin turvallisen kirjaston avulla.

## 3.3 `user_addresses` -- käyttäjän tallennetut osoitteet

**Tarkoitus:** Mahdollistaa useamman osoitteen tallentaminen käyttäjän
tilille.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, Osoitteen
AUTO_INCREMENT tunniste.

`user_id` BIGINT UNSIGNED FK, NOT NULL Osoitteen omistava
käyttäjä.

`label` VARCHAR(50) NULL Osoitteen
vapaaehtoinen
nimi, esimerkiksi
Koti tai Työ.

`street_address` VARCHAR(255) NOT NULL Katuosoite.

`postal_code` VARCHAR(20) NOT NULL Postinumero.

`city` VARCHAR(100) NOT NULL Paikkakunta.

`country_code` CHAR(2) NOT NULL, DEFAULT Maan
`FI` kaksikirjaiminen
tunnus.

`is_default` TINYINT(1) NOT NULL, DEFAULT Ilmaisee käyttäjän
0 oletusosoitteen.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `user_id` viittaa
`users.id`-sarakkeeseen. - `is_default` saa olla 0 tai 1.

**Liittyminen projektin toimintoihin:** Kirjautunut käyttäjä voi
tallentaa osoitteensa ja käyttää niitä myöhemmissä tilauksissa.
Osoitetta voidaan tarjota oletuksena kassalla. Tilauksen yhteydessä
osoitetiedot kopioidaan kuitenkin `orders`-tauluun tilaushetken tietojen
säilyttämiseksi. Sovelluslogiikan pitää huolehtia siitä, että
käyttäjällä on korkeintaan yksi oletusosoite kerrallaan.

## 3.4 `brands` -- tuotemerkit

**Tarkoitus:** Tallentaa tuotteiden valmistajat ja tuotemerkit
erilliseen tauluun.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, Tuotemerkin
AUTO_INCREMENT tunniste.

`name` VARCHAR(120) NOT NULL, UNIQUE Tuotemerkin nimi,
esimerkiksi Nike
tai Adidas.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `name` on yksilöllinen.

**Liittyminen projektin toimintoihin:** Tuotteita voidaan suodattaa ja
ryhmitellä tuotemerkin mukaan. Yksi tuotemerkki voi liittyä moneen
tuotteeseen. Tuotemerkin nimi tallennetaan vain kerran, jolloin
kirjoitusasu pysyy yhtenäisenä.

## 3.5 `categories` -- tuotekategoriat

**Tarkoitus:** Määrittää verkkokaupan tuotekategoriat ja mahdolliset
alakategoriat.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, Kategorian
AUTO_INCREMENT tunniste.

`parent_id` BIGINT UNSIGNED NULL, FK Yläkategorian
tunniste. NULL
tarkoittaa
päätason
kategoriaa.

`name` VARCHAR(120) NOT NULL Kategorian nimi,
esimerkiksi
Vaatteet tai
Lisäravinteet.

`slug` VARCHAR(140) NOT NULL, UNIQUE URL-ystävällinen
yksilöllinen nimi.

`is_active` TINYINT(1) NOT NULL, DEFAULT Ilmaisee,
1 näytetäänkö
kategoria
kaupassa.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `parent_id` viittaa
saman taulun `id`-sarakkeeseen. - `slug` on yksilöllinen. - `is_active`
saa olla 0 tai 1.

**Liittyminen projektin toimintoihin:** Etusivun kategoriavalikko ja
tuotesivujen suodatus voidaan muodostaa tämän taulun avulla. Esimerkiksi
pääkategoria `Vaatteet` voi sisältää alakategoriat `Paidat`, `Housut` ja
`Kengät`. `parent_id` mahdollistaa hierarkian ilman erillisiä tauluja
eri kategorioille.

## 3.6 `products` -- yleiset tuotteet

**Tarkoitus:** Tallentaa tuotteen yhteiset tiedot riippumatta sen
koosta, väristä tai muista varianttikohtaisista ominaisuuksista.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, AUTO_INCREMENT Yleisen tuotteen
tunniste.

`category_id` BIGINT UNSIGNED FK, NOT NULL Tuotteen
kategoria.

`brand_id` BIGINT UNSIGNED NULL, FK Tuotemerkki.

`name` VARCHAR(200) NOT NULL Tuotteen nimi,
esimerkiksi Nike
Air Force 1.

`description` TEXT NULL Tuotteen kuvaus
ja lisätiedot.

`is_active` TINYINT(1) NOT NULL, DEFAULT 1 Ilmaisee, onko
tuote näkyvissä
ja myynnissä.

`created_at` DATETIME NOT NULL, DEFAULT Tuotteen
CURRENT_TIMESTAMP luontiaika.

`updated_at` DATETIME NOT NULL, Viimeisin
automaattinen muokkausaika.
päivitys

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `category_id` viittaa
`categories.id`-sarakkeeseen. - `brand_id` viittaa
`brands.id`-sarakkeeseen. - `is_active` saa olla 0 tai 1.

**Liittyminen projektin toimintoihin:** Tuotesivulla näytetään tuotteen
nimi, kuvaus, tuotemerkki ja kategoria. Tuotteen eri koot, värit ja muut
ostettavat versiot löytyvät `product_variants`-taulusta. `is_active = 0`
mahdollistaa tuotteen piilottamisen ilman vanhojen tilausten historian
rikkomista.

## 3.7 `product_variants` -- myytävät tuotevariantit

**Tarkoitus:** Tallentaa jokainen yksilöllinen myytävä versio omaksi
tietueekseen. Variantti voi olla esimerkiksi tietyn paidan koko M ja
väri musta tai proteiinijauheen suklaanmakuinen 1 kg:n pakkaus.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, AUTO_INCREMENT Variantin
yksilöllinen
tunniste.

`product_id` BIGINT UNSIGNED FK, NOT NULL Yleinen tuote,
johon variantti
kuuluu.

`sku` VARCHAR(80) NOT NULL, UNIQUE Kaupan ja
varaston
yksilöllinen
tuotetunnus.

`barcode` VARCHAR(80) NULL Viivakoodi, jos
tuotteella on
sellainen.

`shipping_weight_g` INT UNSIGNED NULL Variantin
toimituspaino
grammoina.

`is_active` TINYINT(1) NOT NULL, DEFAULT 1 Ilmaisee, onko
variantti
ostettavissa.

`created_at` DATETIME NOT NULL, DEFAULT Variantin
CURRENT_TIMESTAMP luontiaika.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `product_id` viittaa
`products.id`-sarakkeeseen. - `sku` on yksilöllinen. -
`(id, product_id)` on lisäksi yksilöllinen yhdistelmäavain, jota
käytetään tuotekuvien yhdistelmäviittauksessa. - `is_active` saa olla 0
tai 1.

**Liittyminen projektin toimintoihin:** Kun asiakas valitsee tuotteen
koon ja värin, käyttöliittymä valitsee oikean variantin. Ostoskori,
tilausrivi, hinta, varastosaldo ja varaus viittaavat varianttiin, eivät
pelkkään yleiseen tuotteeseen. `shipping_weight_g` tarkoittaa
toimituksen kannalta käytettävää painoa. Se on eri asia kuin asiakkaalle
näkyvä variantin ominaisuus, esimerkiksi käsipainon paino 10 kg.

## 3.8 `product_images` -- tuotekuvat

**Tarkoitus:** Tallentaa tuotteeseen tai tiettyyn varianttiin liittyvien
kuvien osoitteet ja näyttöjärjestys.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, Kuvan tunniste.
AUTO_INCREMENT

`product_id` BIGINT UNSIGNED FK, NOT NULL Tuote, johon kuva
kuuluu.

`variant_id` BIGINT UNSIGNED NULL, Valinnainen
yhdistelmä-FK variantti, jota
kuva esittää.

`image_url` VARCHAR(500) NOT NULL Kuvan URL tai
tallennuspolku.

`alt_text` VARCHAR(255) NULL Saavutettavuutta
tukeva
vaihtoehtoinen
kuvateksti.

`sort_order` INT UNSIGNED NOT NULL, DEFAULT Kuvien järjestys
0 tuotesivulla.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `product_id` viittaa
`products.id`-sarakkeeseen. - `(variant_id, product_id)` viittaa
`product_variants(id, product_id)`-yhdistelmään. - Yhdistelmäviittaus
varmistaa, että variantti kuuluu samaan tuotteeseen kuin kuva.

**Liittyminen projektin toimintoihin:** Tuotesivulla voidaan näyttää
useita kuvia. Jos kuva liittyy tiettyyn väriin tai varianttiin,
`variant_id` kertoo, minkä vaihtoehdon kuva se on. Jos `variant_id` on
NULL, kuva on yleinen tuotekuva.

## 3.9 `attributes` -- ominaisuustyypit

**Tarkoitus:** Määrittää, millaisia ominaisuuksia varianteilla voi olla.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, Ominaisuustyypin
AUTO_INCREMENT tunniste.

`name` VARCHAR(100) NOT NULL, UNIQUE Ominaisuuden nimi,
esimerkiksi Koko,
Väri, Paino tai
Maku.

`unit` VARCHAR(20) NULL Ominaisuuden
yksikkö,
esimerkiksi kg, g
tai cm.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `name` on yksilöllinen.

**Liittyminen projektin toimintoihin:** Ominaisuustyypit mahdollistavat
erilaisten tuoteryhmien käsittelyn samalla rakenteella. Vaatteissa
voidaan käyttää kokoa ja väriä, käsipainoissa painoa ja materiaalia sekä
lisäravinteissa makua ja pakkauskokoa.

## 3.10 `attribute_values` -- ominaisuuksien sallitut arvot

**Tarkoitus:** Tallentaa yksittäisen ominaisuustyypin mahdolliset arvot.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, Ominaisuusarvon
AUTO_INCREMENT tunniste.

`attribute_id` BIGINT UNSIGNED FK, NOT NULL Ominaisuustyyppi,
johon arvo kuuluu.

`value` VARCHAR(100) NOT NULL Arvo, esimerkiksi
M, Musta, 10 tai
Suklaa.

`sort_order` INT UNSIGNED NOT NULL, DEFAULT Arvon järjestys
0 valintalistassa.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `attribute_id` viittaa
`attributes.id`-sarakkeeseen. - Saman ominaisuustyypin sisällä `value`
on yksilöllinen. - `(attribute_id, id)` on yksilöllinen yhdistelmä, jota
käytetään seuraavan taulun vierasavaimessa.

**Liittyminen projektin toimintoihin:** Admin voi lisätä
ominaisuusarvoja, joita käytetään varianttien määrittelyssä. Esimerkiksi
Koko-ominaisuudelle voidaan lisätä arvot XS, S, M, L ja XL.
Paino-ominaisuudelle voidaan lisätä arvot 0.1, 0.5 ja 10, jolloin
yksikkö tulee `attributes.unit`-sarakkeesta.

## 3.11 `variant_attribute_values` -- variantin ominaisuudet

**Tarkoitus:** Yhdistää yksittäisen variantin sen ominaisuustyyppeihin
ja valittuihin arvoihin.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`variant_id` BIGINT UNSIGNED PK:n osa, FK Variantti, jonka
ominaisuudesta on
kyse.

`attribute_id` BIGINT UNSIGNED PK:n osa Ominaisuustyyppi,
esimerkiksi Koko
tai Väri.

`attribute_value_id` BIGINT UNSIGNED FK Valittu
ominaisuusarvo.

---

**Avaimet ja rajoitteet:** - Yhdistelmä `(variant_id, attribute_id)` on
pääavain. - `variant_id` viittaa `product_variants.id`-sarakkeeseen. -
`(attribute_id, attribute_value_id)` viittaa
`attribute_values(attribute_id, id)`-yhdistelmään. - Pääavain estää
saman ominaisuustyypin lisäämisen kahdesti samalle variantille. -
Yhdistelmävierasavain varmistaa, että valittu arvo kuuluu ilmoitettuun
ominaisuustyyppiin.

**Liittyminen projektin toimintoihin:** Tämä on tuotevarianttien
joustavuuden kannalta keskeinen taulu. Esimerkiksi paidan variantilla
voi olla ominaisuudet Koko=M ja Väri=Musta. Käsipainon variantilla voi
olla Paino=10 kg. Yhdellä variantilla voi olla monta eri ominaisuutta,
mutta kustakin ominaisuustyypistä vain yksi arvo.

## 3.12 `variant_prices` -- varianttien nykyiset hinnat

**Tarkoitus:** Tallentaa kunkin variantin tämänhetkinen myyntihinta.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`variant_id` BIGINT UNSIGNED PK, FK Variantti, jonka
hinta
tallennetaan.

`price_cents` BIGINT UNSIGNED NOT NULL Hinta sentteinä.

`currency` CHAR(3) NOT NULL, DEFAULT Valuutan
`EUR` ISO-koodi.

`updated_at` DATETIME NOT NULL, Viimeisin hinnan
automaattinen muokkausaika.
päivitys

---

**Avaimet ja rajoitteet:** - `variant_id` on pääavain ja vierasavain
`product_variants.id`-sarakkeeseen. - Yksi variantti voi saada tässä
mallissa yhden nykyisen hintatietueen.

**Liittyminen projektin toimintoihin:** Kun asiakas avaa tuotesivun tai
lisää variantin ostoskoriin, backend hakee sen nykyisen hinnan tästä
taulusta. Tilaushetken hinta tallennetaan lisäksi
`order_items.unit_price_cents`-sarakkeeseen.

## 3.13 `locations` -- keskusvarastot ja noutopisteet

**Tarkoitus:** Tallentaa fyysiset sijainnit yhteen tauluun. Sijainti voi
olla keskusvarasto tai asiakkaan valitsema noutopiste.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, Sijainnin
AUTO_INCREMENT tunniste.

`name` VARCHAR(150) NOT NULL Sijainnin nimi.

`location_type` VARCHAR(20) NOT NULL Sijainnin tyyppi:
`WAREHOUSE` tai
`PICKUP_POINT`.

`street_address` VARCHAR(255) NOT NULL Katuosoite.

`postal_code` VARCHAR(20) NOT NULL Postinumero.

`city` VARCHAR(100) NOT NULL Paikkakunta.

`latitude` DECIMAL(9,6) NOT NULL Maantieteellinen
leveysaste.

`longitude` DECIMAL(9,6) NOT NULL Maantieteellinen
pituusaste.

`default_pickup_days` SMALLINT UNSIGNED NOT NULL, DEFAULT Noutopisteen
14 oletusnoutoaika
päivinä.

`is_active` TINYINT(1) NOT NULL, DEFAULT Ilmaisee, onko
1 sijainti käytössä.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `location_type`
rajataan arvoihin `WAREHOUSE` ja `PICKUP_POINT`. - Leveys- ja
pituusasteiden tulee olla maantieteellisesti mahdollisissa rajoissa. -
`default_pickup_days` tulee olla suurempi kuin nolla. - `is_active` saa
olla 0 tai 1.

**Liittyminen projektin toimintoihin:** Asiakas valitsee noutopisteen
kassalla. Tilaukselle tallennetaan valitun noutopisteen tunniste.
Backend käyttää noutopisteen osoitetta ja koordinaatteja HSL:n
Digitransit-rajapinnan reittihakua varten. Noutoaika voidaan asettaa
oletuksena 14 päiväksi ja tallentaa tilaukselle erikseen, jolloin
yksittäisen tilauksen määräaikaa voidaan muuttaa.

## 3.14 `inventory` -- fyysiset varastosaldot

**Tarkoitus:** Tallentaa varianttien fyysiset varastosaldot
sijainneittain. Nykyisessä toimintamallissa tavalliset myytävät saldot
pidetään keskusvarastolla. Noutopisteiden tilauskohtainen tavara
seurataan tilausten ja lähetysten avulla.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`location_id` BIGINT UNSIGNED PK:n osa, FK Varastosijainnin
tunniste.

`variant_id` BIGINT UNSIGNED PK:n osa, FK Varastoitavan
tuotevariantin
tunniste.

`quantity_on_hand` INT UNSIGNED NOT NULL, DEFAULT Fyysisesti
sijainnissa
olevien
kappaleiden määrä.

`quantity_reserved` INT UNSIGNED NOT NULL, DEFAULT Varattujen
kappaleiden määrä.

`updated_at` DATETIME NOT NULL, Viimeisin saldon
automaattinen muutos.
päivitys

---

**Avaimet ja rajoitteet:** - Yhdistelmä `(location_id, variant_id)` on
pääavain. - `location_id` viittaa `locations.id`-sarakkeeseen. -
`variant_id` viittaa `product_variants.id`-sarakkeeseen. -
`quantity_reserved` ei saa ylittää `quantity_on_hand`-määrää.

**Liittyminen projektin toimintoihin:** Tuotesivulla voidaan näyttää
saatavuus. Backend laskee vapaan saldon vähentämällä varatut kappaleet
fyysisestä määrästä. Maksuprosessin aikana varattu määrä kasvaa, mutta
fyysinen määrä pienenee vasta tuotteen lähtiessä varastosta.

## 3.15 `carts` -- kirjautuneen käyttäjän ostoskori

**Tarkoitus:** Tallentaa kirjautuneen käyttäjän pysyvä ostoskori.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, Ostoskorin
AUTO_INCREMENT tunniste.

`user_id` BIGINT UNSIGNED FK, UNIQUE Ostoskorin
omistava
käyttäjä.

`updated_at` DATETIME NOT NULL, Viimeisin
automaattinen ostoskorin
päivitys muutos.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `user_id` viittaa
`users.id`-sarakkeeseen. - `user_id` on yksilöllinen, joten käyttäjällä
voi olla yksi tietokantaan tallennettu ostoskori.

**Liittyminen projektin toimintoihin:** Kirjautuneen käyttäjän ostoskori
säilyy tietokannassa, vaikka hän sulkee selaimen tai kirjautuu ulos.
Käyttäjän kirjautuessa uudelleen backend hakee hänen ostoskorinsa.

## 3.16 `cart_items` -- ostoskorin tuotteet

**Tarkoitus:** Tallentaa ostoskoriin lisätyt variantit ja niiden
kappalemäärät.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, Ostoskoririvin
AUTO_INCREMENT tunniste.

`cart_id` BIGINT UNSIGNED FK, NOT NULL Ostoskori, johon
rivi kuuluu.

`variant_id` BIGINT UNSIGNED FK, NOT NULL Valittu
tuotevariantti.

`quantity` INT UNSIGNED NOT NULL Ostoskorissa
haluttu
kappalemäärä.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `cart_id` viittaa
`carts.id`-sarakkeeseen. - `variant_id` viittaa
`product_variants.id`-sarakkeeseen. - `(cart_id, variant_id)` on
yksilöllinen, joten sama variantti tallennetaan samaan ostoskoriin vain
yhdelle riville. - `quantity` tulee olla suurempi kuin nolla.

**Liittyminen projektin toimintoihin:** Kun asiakas lisää tuotteen
ostoskoriin, backend luo rivin tai kasvattaa olemassa olevan rivin
määrää. Ostoskorin hinta lasketaan ajantasaisista varianttihinnoista.
Ostoskori ei itsessään varaa varastosaldoa; varaus tehdään vasta
kassalla maksuprosessin alkaessa.

**Vieraskori:** Vieraskäyttäjän ostoskori voidaan säilyttää selaimessa
esimerkiksi `localStorage`-muistissa. Tässä skeemassa ei ole
vierasostoskoria varten tietokantataulua.

## 3.17 `orders` -- tilaukset

**Tarkoitus:** Tallentaa tilauksen pää- ja yhteystiedot, valittu
noutopiste, hinnat, alennukset ja tilauksen nykyinen tila.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, AUTO_INCREMENT Tilauksen tunniste.

`user_id` BIGINT UNSIGNED NULL, FK Rekisteröitynyt
tilaaja. NULL
tarkoittaa
vierastilausta.

`pickup_location_id` BIGINT UNSIGNED FK, NOT NULL Asiakkaan valitsema
noutopiste.

`first_name` VARCHAR(100) NOT NULL Tilaajan etunimi
tilaushetkellä.

`last_name` VARCHAR(100) NOT NULL Tilaajan sukunimi
tilaushetkellä.

`email` VARCHAR(255) NOT NULL Tilausvahvistuksen
sähköpostiosoite.

`phone` VARCHAR(30) NOT NULL Tilaajan
puhelinnumero.

`street_address` VARCHAR(255) NOT NULL Tilaajan antama
katuosoite.

`postal_code` VARCHAR(20) NOT NULL Tilaajan
postinumero.

`city` VARCHAR(100) NOT NULL Tilaajan
paikkakunta.

`country_code` CHAR(2) NOT NULL, DEFAULT Maan tunnus.
`FI`

`currency` CHAR(3) NOT NULL, DEFAULT Tilauksen valuutta.
`EUR`

`subtotal_cents` BIGINT UNSIGNED NOT NULL, DEFAULT 0 Tuotteiden
yhteishinta ennen
alennuksia.

`campaign_discount_cents` BIGINT UNSIGNED NOT NULL, DEFAULT 0 Kampanjoiden
yhteisalennus.

`loyalty_points_used` INT UNSIGNED NOT NULL, DEFAULT 0 Tilauksessa
käytettyjen
pisteiden määrä.

`loyalty_discount_cents` BIGINT UNSIGNED NOT NULL, DEFAULT 0 Pisteillä saatu
alennus rahana.

`total_cents` BIGINT UNSIGNED NOT NULL, DEFAULT 0 Lopullinen
maksettava summa.

`status` VARCHAR(30) NOT NULL, DEFAULT Tilauksen nykyinen
`PENDING_PAYMENT` tila.

`created_at` DATETIME NOT NULL, DEFAULT Tilauksen
CURRENT_TIMESTAMP luontiaika.

`updated_at` DATETIME NOT NULL, Viimeisin tilauksen
automaattinen muokkausaika.
päivitys

`ready_at` DATETIME NULL Aika, jolloin tilaus
on valmis
noudettavaksi.

`pickup_deadline` DATETIME NULL Viimeinen noutoaika.

`collected_at` DATETIME NULL Aika, jolloin
asiakas nouti
tilauksen.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `(id, user_id)` on
yksilöllinen yhdistelmä, jota käytetään kanta-asiakastaulujen
yhdistelmäviittauksissa. - `user_id` viittaa `users.id`-sarakkeeseen.
Käyttäjän poistaminen asettaa tilauksen `user_id`-arvon NULL-arvoksi,
jolloin tilaushistoria säilyy. - `pickup_location_id` viittaa
`locations.id`-sarakkeeseen. - `status` rajataan skeemassa
määriteltyihin tiloihin. - CHECK-rajoitteet estävät alennusten
yhteismäärää ylittämästä välisummaa ja varmistavat, että loppusumma
vastaa välisummaa vähennettynä alennuksilla.

**Sallitut tilat:** - `PENDING_PAYMENT` -- tilaus odottaa maksun
valmistumista. - `CONFIRMED` -- maksu on vahvistettu ja tilaus
hyväksytty. - `PROCESSING` -- tilausta käsitellään varastolla. -
`IN_TRANSIT` -- tilaus on matkalla noutopisteeseen. - `READY_FOR_PICKUP`
-- tilaus odottaa asiakkaan noutoa. - `COLLECTED` -- asiakas on noutanut
tilauksen. - `EXPIRED` -- noutoaika on päättynyt. - `RETURNING` --
tilaus on palautumassa keskusvarastoon. - `RETURNED` -- palautus on
vastaanotettu. - `CANCELLED` -- tilaus on peruutettu.

**Liittyminen projektin toimintoihin:** Tämä on koko tilausprosessin
päätaulu. Vierastilauksessa `user_id` on NULL, mutta yhteystiedot ovat
silti pakollisia. Rekisteröityneen käyttäjän kohdalla `user_id` yhdistää
tilauksen käyttäjätiliin. Tilauskohtaiset yhteystiedot ovat tilaushetken
kopioita, eivät jatkuvia viittauksia käyttäjän profiilitietoihin.

Noutopiste valitaan ennen tilauksen vahvistamista. Kun tilaus saapuu
noutopisteeseen, backend asettaa `ready_at`- ja `pickup_deadline`-arvot.
Oletusaika voidaan hakea `locations.default_pickup_days`-sarakkeesta,
mutta tilauksen määräaikaa voidaan muuttaa yksilöllisesti.

## 3.18 `order_items` -- tilausrivit

**Tarkoitus:** Tallentaa tilauksen yksittäiset tuotteet ja ostotilanteen
tuotetiedot.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, Tilausrivin
AUTO_INCREMENT tunniste.

`order_id` BIGINT UNSIGNED FK, NOT NULL Tilaus, johon
rivi kuuluu.

`variant_id` BIGINT UNSIGNED FK, NOT NULL Ostettu
tuotevariantti.

`product_name` VARCHAR(200) NOT NULL Tuotteen nimi
kopioituna
ostohetkellä.

`variant_label` VARCHAR(255) NOT NULL Variantin
ominaisuudet
tekstinä
ostohetkellä,
esimerkiksi Musta
/ M.

`sku_snapshot` VARCHAR(80) NOT NULL Variantin SKU
kopioituna
ostohetkellä.

`quantity` INT UNSIGNED NOT NULL Ostettu
kappalemäärä.

`unit_price_cents` BIGINT UNSIGNED NOT NULL Yhden kappaleen
hinta
ostohetkellä
sentteinä.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `order_id` viittaa
`orders.id`-sarakkeeseen. - `variant_id` viittaa
`product_variants.id`-sarakkeeseen. - `(order_id, variant_id)` on
yksilöllinen, joten sama variantti tallennetaan tilaukselle yhdelle
riville. - `quantity` tulee olla suurempi kuin nolla. -
`(id, variant_id)` on yksilöllinen yhdistelmäavain, jota käytetään
varausrivin tarkassa yhdistämisessä.

**Liittyminen projektin toimintoihin:** Kun asiakas maksaa ostoskorinsa,
backend luo tilaukselle tilausrivit. Tuotteen nimi, variantin kuvaus,
SKU ja hinta tallennetaan kopiona. Näin tilauksen sisältö pysyy
historiallisesti oikein, vaikka tuotteen nimi, hinta tai variantin
ominaisuudet muuttuisivat myöhemmin.

Rivin kokonaishinta voidaan laskea kertomalla `quantity` ja
`unit_price_cents`. Tilausrivin kokonaissummaa ei ole tallennettu
erilliseen sarakkeeseen.

## 3.19 `inventory_reservations` -- maksun aikaiset varaukset

**Tarkoitus:** Tallentaa tilausriviin liittyvä varaus, joka pitää
tuotteen poissa muiden asiakkaiden saatavilta maksuprosessin aikana.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, AUTO_INCREMENT Varauksen
tunniste.

`order_item_id` BIGINT UNSIGNED FK, UNIQUE Tilausrivi, jota
varten varaus
tehdään.

`variant_id` BIGINT UNSIGNED FK:n osa Varattava
variantti.

`location_id` BIGINT UNSIGNED FK:n osa Varaston
sijainti, josta
tuote varataan.

`quantity` INT UNSIGNED NOT NULL Varattavien
kappaleiden
määrä.

`status` VARCHAR(20) NOT NULL, DEFAULT Varauksen tila.
`HELD`

`expires_at` DATETIME NULL Aika, jolloin
keskeneräinen
varaus voidaan
vapauttaa.

`created_at` DATETIME NOT NULL, DEFAULT Varauksen
CURRENT_TIMESTAMP luontiaika.

`updated_at` DATETIME NOT NULL, Viimeisin
automaattinen muutosaika.
päivitys

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `order_item_id` on
yksilöllinen, joten yhdellä tilausrivillä on tässä mallissa yksi
varaus. - `(order_item_id, variant_id)` viittaa
`order_items(id, variant_id)`-yhdistelmään. -
`(location_id, variant_id)` viittaa
`inventory(location_id, variant_id)`-yhdistelmään. - `quantity` tulee
olla suurempi kuin nolla.

**Sallitut tilat:** - `HELD` -- tuote on varattu maksun käsittelyn
ajaksi. - `ALLOCATED` -- maksu on hyväksytty ja varaus on sidottu
tilaukseen. - `FULFILLED` -- tuote on lähetetty varastosta. - `RELEASED`
-- varaus on vapautettu esimerkiksi epäonnistuneen maksun vuoksi. -
`EXPIRED` -- varaus on vanhentunut.

**Liittyminen projektin toimintoihin:** Kassalla backend tarkistaa
saatavuuden ja varaa tuotteet ennen maksun käsittelyä. Jos maksu
onnistuu, varaus siirtyy tilaan `ALLOCATED`. Jos maksu epäonnistuu tai
aikaraja ylittyy, varaus vapautetaan. Tuotteen fyysinen varastosaldo
vähenee vasta lähetyksen yhteydessä.

Varaus ja `inventory.quantity_reserved`-päivitys tulee tehdä samassa
tietokantatransaktiossa. Myös vapautuksen ja määrän pienentämisen tulee
tapahtua atomisesti.

## 3.20 `payments` -- maksuyritykset

**Tarkoitus:** Tallentaa maksupalveluntarjoajan maksuyritykset ja niiden
tilat. Yhdellä tilauksella voi olla useampi maksuyritys.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, AUTO_INCREMENT Maksutapahtuman sisäinen
tunniste.

`order_id` BIGINT UNSIGNED FK, NOT NULL Tilaus, johon maksu
liittyy.

`provider` VARCHAR(60) NOT NULL Maksupalveluntarjoajan
nimi.

`provider_payment_id` VARCHAR(180) NULL, UNIQUE Maksupalveluntarjoajan
yhdessä providerin antama maksutunniste.
kanssa

`amount_cents` BIGINT UNSIGNED NOT NULL Maksun summa sentteinä.

`currency` CHAR(3) NOT NULL, DEFAULT Maksun valuutta.
`EUR`

`status` VARCHAR(25) NOT NULL, DEFAULT Maksun nykyinen tila.
`CREATED`

`created_at` DATETIME NOT NULL, DEFAULT Maksuyrityksen
CURRENT_TIMESTAMP luontiaika.

`updated_at` DATETIME NOT NULL, Viimeisin maksutietojen
automaattinen muutosaika.
päivitys

`completed_at` DATETIME NULL Maksun valmistumisaika,
jos maksu onnistui.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `order_id` viittaa
`orders.id`-sarakkeeseen. - `(provider, provider_payment_id)` on
yksilöllinen silloin, kun palveluntarjoajan tunniste on annettu. -
Maksun tila rajataan skeemassa sallittuihin arvoihin.

**Sallitut tilat:** - `CREATED` -- maksutietue luotu. - `PENDING` --
maksupalvelu käsittelee maksua. - `SUCCEEDED` -- maksu onnistui. -
`FAILED` -- maksu epäonnistui. - `CANCELLED` -- maksu peruutettiin. -
`PARTIALLY_REFUNDED` -- osa maksusta on palautettu. - `REFUNDED` -- koko
maksu on palautettu.

**Liittyminen projektin toimintoihin:** Backend luo tilauksen ja
maksuyrityksen ennen maksupalveluun siirtymistä. Maksun onnistuminen
vahvistetaan palvelinpuolen maksupalveluilmoituksen tai muun luotettavan
palvelinpuolen tarkistuksen avulla. Selaimen paluuosoite ei yksin riitä
maksun onnistumisen todisteeksi.

Korttinumeroita tai kortin turvakoodeja ei tallenneta tähän
tietokantaan. Maksupalveluntarjoaja käsittelee maksukorttitiedot.

## 3.21 `refunds` -- maksujen hyvitykset

**Tarkoitus:** Tallentaa maksun osittaiset tai täydelliset hyvitykset,
esimerkiksi noutamatta jääneen tilauksen palautuksen yhteydessä.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, AUTO_INCREMENT Hyvityksen sisäinen
tunniste.

`payment_id` BIGINT UNSIGNED FK, NOT NULL Maksu, josta hyvitys
tehdään.

`provider_refund_id` VARCHAR(180) NULL, UNIQUE Maksupalveluntarjoajan
hyvitystunniste.

`amount_cents` BIGINT UNSIGNED NOT NULL Hyvitettävä summa
sentteinä.

`reason` VARCHAR(255) NULL Hyvityksen syy.

`status` VARCHAR(20) NOT NULL, DEFAULT Hyvityksen tila.
`REQUESTED`

`created_at` DATETIME NOT NULL, DEFAULT Hyvityspyynnön
CURRENT_TIMESTAMP luontiaika.

`completed_at` DATETIME NULL Hyvityksen
valmistumisaika.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `payment_id` viittaa
`payments.id`-sarakkeeseen. - `provider_refund_id` on yksilöllinen, jos
se on annettu. - `amount_cents` tulee olla suurempi kuin nolla.

**Sallitut tilat:** - `REQUESTED` -- hyvitys pyydetty. - `PROCESSING` --
maksupalvelu käsittelee hyvitystä. - `SUCCEEDED` -- hyvitys onnistui. -
`FAILED` -- hyvitys epäonnistui.

**Liittyminen projektin toimintoihin:** Jos asiakas ei nouda tilaustaan
määräajan kuluessa, backend voi käynnistää hyvityksen. Hyvityksen tila
tallennetaan erikseen, koska maksupalvelun palautus ei välttämättä
valmistu samalla hetkellä kuin pyyntö lähetetään. Hyvityksen tekeminen
ja maksupalvelun vastausten käsittely pitää toteuttaa turvallisesti,
jotta samaa hyvitystä ei tehdä kahdesti.

## 3.22 `shipments` -- lähetykset noutopisteisiin ja palautukset

**Tarkoitus:** Tallentaa keskusvarastolta noutopisteeseen menevät
lähetykset ja noutamatta jääneiden tuotteiden palautuslähetykset.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, AUTO_INCREMENT Lähetyksen
tunniste.

`order_id` BIGINT UNSIGNED FK, NOT NULL Tilaus, johon
lähetys liittyy.

`direction` VARCHAR(10) NOT NULL Lähetyksen
suunta:
`OUTBOUND` tai
`RETURN`.

`from_location_id` BIGINT UNSIGNED FK, NOT NULL Lähetyksen
lähtösijainti.

`to_location_id` BIGINT UNSIGNED FK, NOT NULL Lähetyksen
kohdesijainti.

`status` VARCHAR(20) NOT NULL, DEFAULT Lähetyksen tila.
`CREATED`

`tracking_code` VARCHAR(120) NULL Kuljetuksen
seurantatunnus.

`created_at` DATETIME NOT NULL, DEFAULT Lähetyksen
CURRENT_TIMESTAMP luontiaika.

`shipped_at` DATETIME NULL Lähetyksen
lähtöaika.

`delivered_at` DATETIME NULL Lähetyksen
toimitusaika.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `order_id` viittaa
`orders.id`-sarakkeeseen. - `from_location_id` ja `to_location_id`
viittaavat `locations.id`-sarakkeeseen. - `(order_id, direction)` on
yksilöllinen. Tässä mallissa tilauksella voi olla yksi OUTBOUND- ja yksi
RETURN-lähetys. - Lähtö- ja kohdesijainti eivät saa olla sama. -
`direction` rajataan arvoihin `OUTBOUND` ja `RETURN`.

**Sallitut tilat:** - `CREATED` -- lähetys luotu. - `IN_TRANSIT` --
lähetys kuljetuksessa. - `DELIVERED` -- lähetys toimitettu. -
`CANCELLED` -- lähetys peruutettu.

**Liittyminen projektin toimintoihin:** Kun tilaus maksetaan ja
varastolla käsitellään tuotteet, luodaan OUTBOUND-lähetys
keskusvarastolta valittuun noutopisteeseen. Kun tuote jää noutamatta,
voidaan luoda RETURN-lähetys noutopisteeltä takaisin keskusvarastoon.
Noutopisteiden välisiä siirtoja ei tässä mallissa ole.

## 3.23 `inventory_movements` -- varastotapahtumien loki

**Tarkoitus:** Tallentaa fyysisen varaston muutokset
tapahtumahistoriaksi.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, AUTO_INCREMENT Varastotapahtuman
tunniste.

`location_id` BIGINT UNSIGNED Yhdistelmä-FK:n osa Sijainti, jossa
varastomuutos
tapahtuu.

`variant_id` BIGINT UNSIGNED Yhdistelmä-FK:n osa Muuttunut
tuotevariantti.

`order_id` BIGINT UNSIGNED NULL, FK Tilaukseen liittyvä
varastomuutos.

`shipment_id` BIGINT UNSIGNED NULL, FK Lähetykseen
liittyvä
varastomuutos.

`quantity_delta` INT NOT NULL Varastosaldon
muutos.
Positiivinen
kasvattaa ja
negatiivinen
pienentää saldoa.

`movement_type` VARCHAR(20) NOT NULL Muutoksen tyyppi.

`note` VARCHAR(255) NULL Vapaa lisätieto.

`created_at` DATETIME NOT NULL, DEFAULT Tapahtuman
CURRENT_TIMESTAMP ajankohta.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. -
`(location_id, variant_id)` viittaa
`inventory(location_id, variant_id)`-yhdistelmään. - `order_id` viittaa
`orders.id`-sarakkeeseen. - `shipment_id` viittaa
`shipments.id`-sarakkeeseen. - `quantity_delta` ei saa olla nolla. -
`movement_type` rajataan arvoihin `RECEIPT`, `DISPATCH`, `RETURN` ja
`ADJUSTMENT`.

**Liittyminen projektin toimintoihin:** Kun tavaraa vastaanotetaan
keskusvarastoon, syntyy positiivinen RECEIPT-tapahtuma. Kun tavara
lähetetään noutopisteeseen, syntyy negatiivinen DISPATCH-tapahtuma. Kun
palautunut tavara vastaanotetaan takaisin varastoon, syntyy positiivinen
RETURN-tapahtuma. ADJUSTMENT soveltuu esimerkiksi inventoinnissa
havaittuun korjaukseen.

Tämä taulu toimii auditointilokina. Se kertoo, miksi saldo on muuttunut.
Backendin tulee päivittää `inventory`-saldo ja lisätä
`inventory_movements`-rivi saman SQL-transaktion sisällä. Lokirivi ei
itsessään muuta `inventory`-taulun saldoa.

## 3.24 `loyalty_holds` -- kanta-asiakaspisteiden varaukset

**Tarkoitus:** Varata käyttäjän pisteitä maksuprosessin ajaksi, jotta
samoja pisteitä ei käytetä useassa tilauksessa yhtä aikaa.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, AUTO_INCREMENT Pistevarauksen
tunniste.

`order_id` BIGINT UNSIGNED Yhdistelmä-FK:n osa Tilaus, jossa
pisteitä
käytetään.

`user_id` BIGINT UNSIGNED Yhdistelmä-FK:n Pisteiden omistava
osa, FK käyttäjä.

`points` INT UNSIGNED NOT NULL Varattavien
pisteiden määrä.

`status` VARCHAR(20) NOT NULL, DEFAULT Pistevarauksen
`HELD` tila.

`expires_at` DATETIME NOT NULL Varauksen
viimeinen
voimassaoloaika.

`created_at` DATETIME NOT NULL, DEFAULT Varauksen
CURRENT_TIMESTAMP luontiaika.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `order_id` on
yksilöllinen, joten tilauksella voi olla yksi pistevaraus. -
`(order_id, user_id)` viittaa `orders(id, user_id)`-yhdistelmään. Tämä
varmistaa, että pistevarauksen käyttäjä on sama kuin tilauksen
käyttäjä. - `user_id` viittaa lisäksi `users.id`-sarakkeeseen. -
`points` tulee olla suurempi kuin nolla.

**Sallitut tilat:** - `HELD` -- pisteet varattu maksun ajaksi. -
`CAPTURED` -- pisteet on lopullisesti käytetty. - `RELEASED` -- varaus
vapautettu.

**Liittyminen projektin toimintoihin:** Kirjautunut käyttäjä voi valita
kassalla pisteiden käytön. Backend tarkistaa pisteiden käytettävissä
olevan määrän, varaa ne ja laskee alennuksen. Maksun onnistuttua varaus
merkitään käytetyksi ja `loyalty_transactions`-tauluun lisätään
negatiivinen pistetapahtuma. Maksun epäonnistuessa varaus vapautetaan.
Vierastilaus ei voi käyttää käyttäjätiliin sidottuja pisteitä.

## 3.25 `loyalty_transactions` -- kanta-asiakaspisteiden tapahtumat

**Tarkoitus:** Tallentaa kaikki pisteiden kertymiset, käytöt,
palautukset ja ylläpidon tekemät korjaukset.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, AUTO_INCREMENT Pistetapahtuman
tunniste.

`user_id` BIGINT UNSIGNED FK, NOT NULL Pisteiden
omistava
käyttäjä.

`order_id` BIGINT UNSIGNED NULL, Tilaus, johon
yhdistelmä-FK:n osa tapahtuma
liittyy.

`points_delta` INT NOT NULL Pistemäärän
muutos.
Positiivinen
lisää ja
negatiivinen
vähentää
pisteitä.

`transaction_type` VARCHAR(20) NOT NULL Tapahtuman
tyyppi.

`description` VARCHAR(255) NULL Tapahtuman
selite.

`idempotency_key` VARCHAR(120) NOT NULL, UNIQUE Yksilöllinen
avain, joka estää
saman tapahtuman
kirjaamisen
kahdesti.

`created_at` DATETIME NOT NULL, DEFAULT Tapahtuman
CURRENT_TIMESTAMP ajankohta.

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `user_id` viittaa
`users.id`-sarakkeeseen. - `(order_id, user_id)` viittaa
`orders(id, user_id)`-yhdistelmään, kun `order_id` on annettu. -
`idempotency_key` on yksilöllinen. - `points_delta` ei saa olla nolla.

**Sallitut tapahtumatyypit:** - `PURCHASE` -- ostosta saadut pisteet. -
`BONUS` -- esimerkiksi kampanjasta tai muusta toiminnosta saadut
pisteet. - `REDEEM` -- käytetyt pisteet. - `REFUND` -- hyvitykseen
liittyvä pistekorjaus. - `ADJUSTMENT` -- ylläpidon tekemä korjaus.

**Liittyminen projektin toimintoihin:** Pisteitä voidaan kerryttää
myöhemmin useilla tavoilla. Kaikki tapahtumat kirjataan samaan tauluun,
joten järjestelmä ei tarvitse erillistä pistetaulua jokaiselle
ansaintatavalle. Käyttäjän pistetase voidaan laskea pisteiden summana
vähentämällä aktiiviset `loyalty_holds`-varaukset.

`idempotency_key` on tärkeä esimerkiksi maksupalvelun webhook-kutsujen
yhteydessä. Jos sama ilmoitus saapuu kahdesti, backend käyttää samaa
avainta eikä lisää pisteitä kahteen kertaan.

## 3.26 `order_status_history` -- tilausten tilahistoria

**Tarkoitus:** Tallentaa tilauksen tilan muutokset historiaksi. Nykyinen
tila on `orders.status`-sarakkeessa, mutta tämä taulu näyttää, miten
tilaus on edennyt.

---

Sarake Tyyppi Avain / oletus Tarkoitus

---

`id` BIGINT UNSIGNED PK, AUTO_INCREMENT Historiatapahtuman
tunniste.

`order_id` BIGINT UNSIGNED FK, NOT NULL Tilaus, jonka tila
muuttui.

`changed_by_user_id` BIGINT UNSIGNED NULL, FK Muutoksen tehnyt
ylläpitäjä tai NULL,
jos muutos tuli
järjestelmältä.

`old_status` VARCHAR(30) NULL Tilauksen aiempi
tila.

`new_status` VARCHAR(30) NOT NULL Tilauksen uusi tila.

`note` VARCHAR(255) NULL Muutoksen
lisäselite.

`changed_at` DATETIME NOT NULL, DEFAULT Muutoksen ajankohta.
CURRENT_TIMESTAMP

---

**Avaimet ja rajoitteet:** - `id` on pääavain. - `order_id` viittaa
`orders.id`-sarakkeeseen. - `changed_by_user_id` viittaa
`users.id`-sarakkeeseen ja voi olla NULL.

**Liittyminen projektin toimintoihin:** Kun ylläpitäjä muuttaa tilauksen
tilaa tai automaattinen backend-prosessi siirtää tilauksen seuraavaan
vaiheeseen, uusi tapahtuma lisätään tähän tauluun. Admin voi tarkastella
tilauksen historiaa ja selvittää esimerkiksi, milloin tilaus
lähetettiin, milloin se saapui noutopisteeseen ja milloin se merkittiin
palautettavaksi.

---

# 4. Taulujen väliset suhteet kokonaisuuksittain

## 4.1 Käyttäjät ja tunnistautuminen

- `users` 1:1 `user_credentials`
- `users` 1:N `user_addresses`
- `users` 1:0..1 `carts`
- `carts` 1:N `cart_items`

Yksi käyttäjätili sisältää yhden kirjautumistietueen, voi sisältää
useita tallennettuja osoitteita ja sillä voi olla yksi pysyvä ostoskori.
Ostoskorissa voi olla monta tuotevarianttia.

## 4.2 Tuotekatalogi

- `brands` 1:N `products`
- `categories` 1:N `products`
- `categories` 1:N `categories` (ylä- ja alakategoriat)
- `products` 1:N `product_variants`
- `products` 1:N `product_images`
- `attributes` 1:N `attribute_values`
- `product_variants` N:M `attribute_values` taulun
  `variant_attribute_values` kautta
- `product_variants` 1:1 `variant_prices`

Tuotteen perustiedot tallennetaan kerran. Variantit määrittelevät
myytävät vaihtoehdot, ja niiden ominaisuudet liitetään joustavasti
erillisillä ominaisuustauluilla.

## 4.3 Ostoskori ja tilaukset

- `users` 1:N `orders`, mutta tilauksen `user_id` voi olla NULL
  vierastilauksessa.
- `orders` 1:N `order_items`
- `product_variants` 1:N `order_items`
- `orders` 1:N `payments`
- `payments` 1:N `refunds`
- `orders` 1:N `order_status_history`

Ostoskori on keskeneräinen ostos. Tilaus on vahvistettava ostotapahtuma,
jonka tiedot ja hinnat säilytetään historiassa.

## 4.4 Varasto ja toimitukset

- `locations` 1:N `inventory`
- `product_variants` 1:N `inventory`
- `order_items` 1:0..1 `inventory_reservations`
- `inventory` 1:N `inventory_reservations`
- `orders` 1:N `shipments`
- `locations` 1:N `shipments` lähtö- ja kohdesijaintina
- `inventory` 1:N `inventory_movements`
- `orders` 1:N `inventory_movements`
- `shipments` 1:N `inventory_movements`

Varastotaulu kuvaa nykyistä fyysistä saldoa. Varaustaulu kuvaa
tilauskohtaisia varauksia. Varastotapahtumien loki kertoo, miten
fyysinen saldo on muuttunut.

## 4.5 Kanta-asiakkuus

- `users` 1:N `loyalty_transactions`
- `users` 1:N `loyalty_holds`
- `orders` 1:0..1 `loyalty_holds`
- `orders` 1:N `loyalty_transactions` (tilaukseen liittyvät
  pistekirjaukset)

Pisteiden tapahtumahistoria ja maksuprosessin aikaiset pistevaraukset
ovat erillään. Näin pisteitä ei voi käyttää kahdesti samanaikaisissa
tilauksissa.

---

# 5. Esimerkkiprosessit sovelluksessa

## 5.1 Tuotteen lisääminen ylläpidossa

1.  Admin kirjautuu sisään. Backend tarkistaa, että käyttäjän `role` on
    `ADMIN` ja `is_active` on 1.
2.  Tuotteelle valitaan tai luodaan tuotemerkki `brands`-taulussa.
3.  Tuotteelle valitaan kategoria `categories`-taulusta.
4.  Tuotteen perustiedot tallennetaan `products`-tauluun.
5.  Jokainen myytävä koko-, väri-, maku- tai painovaihtoehto lisätään
    `product_variants`-tauluun.
6.  Variantin ominaisuudet liitetään `variant_attribute_values`-taulun
    kautta.
7.  Variantin hinta lisätään `variant_prices`-tauluun.
8.  Tuotekuvat lisätään `product_images`-tauluun.
9.  Keskusvaraston alkuperäinen saldo luodaan `inventory`-tauluun.

Tuote voidaan piilottaa asettamalla `products.is_active = 0`.
Yksittäinen variantti voidaan poistaa myynnistä asettamalla
`product_variants.is_active = 0`.

## 5.2 Tuotteen selaaminen ja ostoskori

1.  Frontend hakee tuotteet backendin REST API:n kautta.
2.  Backend hakee tuotteen tiedot `products`-taulusta ja liittää mukaan
    tuotemerkin, kategorian, kuvat ja variantit.
3.  Variantin ominaisuudet haetaan `variant_attribute_values`- ja
    `attribute_values`-tauluista.
4.  Variantin hinta haetaan `variant_prices`-taulusta.
5.  Saatavuus haetaan `inventory`-taulusta vähentämällä varattu määrä
    fyysisestä saldosta.
6.  Kirjautuneen käyttäjän ostoskori tallennetaan `carts`- ja
    `cart_items`-tauluihin.
7.  Vieraskäyttäjän ostoskori voidaan pitää selaimen
    `localStorage`-muistissa.

## 5.3 Kassaprosessi ja maksun aikainen varaus

1.  Backend vastaanottaa kassalla valitut variantit ja määrät.
2.  Backend hakee hinnat ja saatavuuden uudelleen tietokannasta.
    Selaimen lähettämiin hintoihin ei luoteta.
3.  Backend luo `orders`-tietueen tilaan `PENDING_PAYMENT`.
4.  Tuotteet tallennetaan `order_items`-tauluun tilaushetken tietojen
    kopioina.
5.  Backend tarkistaa varastosaldon ja varaa tuotteet
    `inventory_reservations`-tauluun. Samalla päivitetään
    `inventory.quantity_reserved`.
6.  Jos käyttäjä käyttää loyalty-pisteitä, backend tarkistaa saldon ja
    luo `loyalty_holds`-varauksen.
7.  Backend luo `payments`-tauluun maksuyrityksen.
8.  Maksupalveluntarjoaja käsittelee maksun.
9.  Maksun onnistuminen vahvistetaan palvelinpuolen ilmoituksella tai
    palvelinpuolen tarkistuksella.
10. Onnistuneen maksun jälkeen tilaus vahvistetaan ja varaus siirtyy
    tilaan `ALLOCATED`.
11. Epäonnistuneen tai vanhentuneen maksun yhteydessä varastovaraus ja
    pistevaraus vapautetaan.

Varaston, pisteiden ja tilauksen muutokset pitää toteuttaa huolellisesti
SQL-transaktioilla. Näin osittain onnistunutta tilausta ei jää
tietokantaan.

## 5.4 Lähetys noutopisteeseen

1.  Varasto kerää tilauksen tuotteet.
2.  Backend luo `shipments`-tauluun OUTBOUND-lähetyksen.
3.  Lähetyksen lähtöpaikka on keskusvarasto ja kohde on tilauksen
    `pickup_location_id`.
4.  Kun lähetys lähtee, `inventory.quantity_on_hand` ja
    `inventory.quantity_reserved` pienenevät.
5.  Samassa transaktiossa lisätään `inventory_movements`-tauluun
    negatiivinen DISPATCH-tapahtuma.
6.  Tilauksen tila muuttuu `IN_TRANSIT`-tilaan.
7.  Kun lähetys saapuu noutopisteeseen, tilauksen tila muuttuu
    `READY_FOR_PICKUP`-tilaan.
8.  Backend asettaa `ready_at`- ja `pickup_deadline`-arvot.

## 5.5 Nouto tai noutamatta jääneen tilauksen palautus

**Jos asiakas noutaa tilauksen:** 1. Admin tai noutopisteen toiminto
merkitsee tilauksen `COLLECTED`-tilaan. 2. `collected_at` asetetaan. 3.
Tilanmuutos lisätään `order_status_history`-tauluun.

**Jos asiakas ei nouda tilausta:** 1. Ajastettu backend-prosessi etsii
tilaukset, joiden `pickup_deadline` on mennyt umpeen ja joita ei ole
noudettu. 2. Tilaus merkitään `EXPIRED`-tilaan ja myöhemmin
`RETURNING`-tilaan. 3. Backend käynnistää maksun hyvityksen ja tallentaa
sen `refunds`-tauluun. 4. Pisteiden palautus käsitellään
`loyalty_transactions`-taulussa tarpeen mukaan. 5. Luodaan
RETURN-lähetys noutopisteeltä keskusvarastoon. 6. Kun tuote
vastaanotetaan keskusvarastoon, `inventory.quantity_on_hand` kasvaa ja
`inventory_movements`-tauluun lisätään positiivinen RETURN-tapahtuma. 7.
Tilaus merkitään `RETURNED`-tilaan.

Hyvityksen onnistuminen ja tuotteen fyysinen palautuminen ovat eri
tapahtumia. Hyvitys voidaan käsitellä ennen kuin tuote on fyysisesti
takaisin keskusvarastossa, jos liiketoiminnan säännöt niin määräävät.

## 5.6 Kanta-asiakaspisteiden kertyminen ja käyttö

1.  Onnistuneesta ostosta voidaan myöntää pisteitä lisäämällä
    positiivinen `PURCHASE`-tapahtuma `loyalty_transactions`-tauluun.
2.  Muista toiminnoista voidaan myöntää pisteitä `BONUS`-tapahtumina.
3.  Kassalla käyttäjä valitsee, haluaako hän käyttää pisteitä.
4.  Backend laskee käytettävissä olevat pisteet tapahtumahistoriasta ja
    vähentää aktiiviset pistevaraukset.
5.  Käytettävät pisteet varataan `loyalty_holds`-tauluun.
6.  Maksun vahvistuttua pistevaraus merkitään `CAPTURED`-tilaan ja
    tapahtumatauluun lisätään negatiivinen `REDEEM`-kirjaus.
7.  Jos maksu epäonnistuu, pistevaraus vapautetaan.

Suunnitellulla muuntosuhteella 100 pistettä vastaa 1,00 euron alennusta.
Backendin pitää varmistaa, että käytettyjen pisteiden määrä ja
`orders.loyalty_discount_cents` vastaavat toisiaan.

## 5.7 HSL-reititys

1.  Backend hakee aktiiviset noutopisteet `locations`-taulusta.
2.  Noutopisteiden koordinaatit (`latitude`, `longitude`) annetaan
    Digitransit/HSL-reititysrajapinnalle.
3.  Ulkoinen rajapinta palauttaa asiakkaalle reittivaihtoehtoja.
4.  Frontend näyttää reitit ja noutopisteet asiakkaalle.

Reittejä ei tarvitse tallentaa tähän tietokantaan. Tietokanta säilyttää
noutopisteiden pysyvät sijaintitiedot, ja reitti lasketaan tarpeen
mukaan ulkoisessa palvelussa.

---

# 6. Myöhemmin lisättävät ominaisuudet

## 6.1 Kampanjat ja tarjoukset

Kampanjoiden toimintalogiikkaa ei ole vielä päätetty, joten niitä varten
ei ole tässä skeemassa omia kampanjatauluja.

Kun ominaisuus suunnitellaan, voidaan lisätä esimerkiksi: - `campaigns`
-- kampanjan nimi, kuvaus, voimassaoloaika ja alennustyyppi. -
`campaign_products` -- kampanjaan kuuluvat tuotteet. - Tarvittaessa
`campaign_categories` -- kampanjaan kuuluvat kategoriat. - Tarvittaessa
`order_campaigns` -- tilauksella käytetyt kampanjat ja niiden
toteutuneet alennukset.

`orders.campaign_discount_cents` on jo mukana, jotta tilauksen
kampanja-alennusten kokonaissumma voidaan tallentaa. Pelkkä
kokonaissumma ei kuitenkaan kerro, mitä kampanjaa käytettiin. Siksi
kampanjoiden käyttöönotossa kannattaa tallentaa myös tilauskohtaiset
kampanjaviittaukset.

## 6.2 Hintahistoria

`variant_prices` tallentaa vain nykyisen hinnan. Hintahistoria voidaan
lisätä myöhemmin esimerkiksi `variant_price_history`-taululla, jossa on
hinnan lisäksi voimassaolon alku- ja loppuaika.

## 6.3 Analytiikka

Adminin analytiikka voidaan aluksi muodostaa kyselyillä `orders`,
`order_items`, `payments` ja `products`-tauluista. Esimerkiksi myyntiä,
tilausmääriä ja suosituimpia tuotteita voidaan laskea SQL-kyselyillä.

Laajempaa raportointia varten voidaan myöhemmin rakentaa erillisiä
näkymiä tai raportointitauluja.
