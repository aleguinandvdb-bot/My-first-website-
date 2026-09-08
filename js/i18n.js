/* Chateau de Rockville Cafe — language switcher (EN default, FR, ES) */
(function () {
  "use strict";

  var STORAGE_KEY = "crc-lang";

  var STRINGS = {
    en: {
      "nav.home": "Home",
      "nav.story": "Our Story",
      "nav.menu": "Menu",
      "nav.process": "The Process",
      "nav.gallery": "Gallery",
      "nav.visit": "Visit Us",
      "nav.contact": "Contact",
      "nav.call": "Call (667) 324-7743",
      "nav.doordash": "Order on DoorDash",
      "hero.eyebrow": "Rockville, Maryland · Since 2024",
      "hero.title": "A café built like a small <span class=\"accent-word\">château</span>.",
      "hero.lede": "Stone-milled pastry, single-origin espresso, and a garden terrace in the heart of Rockville.",
      "hero.cta1": "View the Menu",
      "hero.cta2": "Call to Reserve",
      "hero.caption": "3D · rendered live",
      "about.eyebrow": "Our Story",
      "about.title": "A corner of Provence in downtown Rockville",
      "about.p1": "Chateau de Rockville Cafe opened as a small corner of Provence in downtown Rockville — a place for stone-milled pastry, patient espresso, and mornings that don't feel rushed.",
      "about.p2": "Everything on the counter is baked, brewed, or built in-house, in small batches, every day.",
      "about.quote": "We wanted a café that felt like a doorway to somewhere slower.",
      "about.quoteCite": "— The founders, Chateau de Rockville Cafe",
      "menu.eyebrow": "On the Counter",
      "menu.title": "Our Menu",
      "menu.lede": "Baked each morning. Poured to order.",
      "menu.cat1": "Espresso & Coffee",
      "menu.cat2": "Pâtisserie",
      "menu.cat3": "Tartines & Light Bites",
      "menu.item1": "House blend, steamed milk.",
      "menu.item2": "Double shot, single-origin.",
      "menu.item3": "Espresso, foamed milk.",
      "menu.item4": "Oat milk, honey.",
      "menu.item5": "Butter-laminated, baked daily.",
      "menu.item6": "Dark chocolate batons.",
      "menu.item7": "Almond cream, strawberries.",
      "menu.item8": "Brown butter, lemon zest.",
      "menu.item9": "Ham, butter, baguette.",
      "menu.item10": "Gruyère, béchamel.",
      "menu.item11": "Whipped ricotta, seasonal vegetables.",
      "menu.cat4": "Specialty Drinks",
      "menu.item12": "Soft soda cream over rich espresso.",
      "menu.item13": "Sweet-tangy lemonade, cherry, and butterfly pea tea.",
      "menu.item14": "Delicate cherry blossom aroma, creamy milk.",
      "process.eyebrow": "Behind the Counter",
      "process.title": "The Process",
      "process.lede": "Our coffee, to you.",
      "process.stage1Title": "Ground to order",
      "process.stage1Desc": "Whole beans, weighed and ground the moment your order comes in — never sitting stale in a hopper.",
      "process.stage2Title": "Steamed to silk",
      "process.stage2Desc": "Cold milk, stretched and steamed to a silky microfoam — the kind that holds a heart.",
      "process.grindButton": "Grind the beans",
      "process.grinding": "Grinding…",
      "process.grindAgain": "Refill the hopper",
      "gallery.eyebrow": "A Look Inside",
      "gallery.title": "Gallery",
      "gallery.lede": "A few corners of the café.",
      "gallery.tile1": "The Espresso Bar",
      "gallery.slot": "Photo goes here",
      "gallery.tile1sub": "Warm light, quiet hum",
      "gallery.tile2": "The Pastry Case",
      "gallery.tile2sub": "Fresh every morning",
      "gallery.tile3": "Single-Origin",
      "gallery.tile4": "Street-Side Window",
      "gallery.tile5": "Slow Pour-Over",
      "gallery.tile6": "Weekend Tarts",
      "visit.eyebrow": "Come By",
      "visit.title": "Visit Us",
      "visit.lede": "Stop by, stay a while.",
      "visit.days1": "Mon – Fri",
      "visit.days2": "Sat – Sun",
      "visit.venue": "The Shops at Congressional Village",
      "visit.address": "1701 Rockville Pike, Suite A-11, Rockville, MD 20852",
      "visit.note": "Pickup and delivery available on DoorDash.",
      "visit.directions": "Get Directions",
      "visit.doordash": "Order on DoorDash",
      "visit.call": "Call the Café",
      "footer.signature": "À bientôt — see you soon.",
      "footer.callLabel": "Call Us",
      "footer.emailLabel": "Email Us",
      "footer.addressLabel": "Address",
      "footer.orderLabel": "Order Online",
      "footer.orderValue": "DoorDash pickup & delivery",
      "footer.followLabel": "Follow Along",
      "footer.copyright": "© 2026 Chateau de Rockville Cafe. All rights reserved.",
      "footer.madeWith": "Rockville, Maryland"
    },
    fr: {
      "nav.home": "Accueil",
      "nav.story": "Notre histoire",
      "nav.menu": "Menu",
      "nav.process": "Notre procédé",
      "nav.gallery": "Galerie",
      "nav.visit": "Nous trouver",
      "nav.contact": "Contact",
      "nav.call": "Appeler le (667) 324-7743",
      "nav.doordash": "Commander sur DoorDash",
      "hero.eyebrow": "Rockville, Maryland · Depuis 2024",
      "hero.title": "Un café pensé comme un petit <span class=\"accent-word\">château</span>.",
      "hero.lede": "Pâtisserie à la meule de pierre, espresso d'origine unique, et une terrasse au cœur de Rockville.",
      "hero.cta1": "Voir le menu",
      "hero.cta2": "Appeler pour réserver",
      "hero.caption": "3D · en direct",
      "about.eyebrow": "Notre histoire",
      "about.title": "Un coin de Provence au cœur de Rockville",
      "about.p1": "Chateau de Rockville Cafe a ouvert comme un petit coin de Provence au centre de Rockville — un lieu pour la pâtisserie à la meule de pierre, l'espresso patient, et des matins sans précipitation.",
      "about.p2": "Tout ce qui est au comptoir est cuit, préparé ou brassé sur place, en petites quantités, chaque jour.",
      "about.quote": "Nous voulions un café qui donne l'impression d'une porte vers un lieu plus lent.",
      "about.quoteCite": "— Les fondateurs, Chateau de Rockville Cafe",
      "menu.eyebrow": "Au comptoir",
      "menu.title": "Notre carte",
      "menu.lede": "Cuit chaque matin. Servi à la commande.",
      "menu.cat1": "Espresso & Café",
      "menu.cat2": "Pâtisserie",
      "menu.cat3": "Tartines & Petites Faims",
      "menu.item1": "Mélange maison, lait vapeur.",
      "menu.item2": "Double dose, origine unique.",
      "menu.item3": "Espresso, lait moussé.",
      "menu.item4": "Lait d'avoine, miel.",
      "menu.item5": "Feuilleté au beurre, cuit chaque jour.",
      "menu.item6": "Bâtons de chocolat noir.",
      "menu.item7": "Crème d'amande, fraises.",
      "menu.item8": "Beurre noisette, zeste de citron.",
      "menu.item9": "Jambon, beurre, baguette.",
      "menu.item10": "Gruyère, béchamel.",
      "menu.item11": "Ricotta fouettée, légumes de saison.",
      "menu.cat4": "Boissons Spéciales",
      "menu.item12": "Crème soda légère sur un espresso riche.",
      "menu.item13": "Limonade douce-acidulée, cerise, et thé de pois papillon.",
      "menu.item14": "Arôme délicat de fleur de cerisier, lait crémeux.",
      "process.eyebrow": "Derrière le comptoir",
      "process.title": "Notre procédé",
      "process.lede": "Notre café, jusqu'à vous.",
      "process.stage1Title": "Moulu à la commande",
      "process.stage1Desc": "Des grains entiers, pesés et moulus au moment de votre commande — jamais laissés à rassir dans une trémie.",
      "process.stage2Title": "Vapeur soyeuse",
      "process.stage2Desc": "Du lait froid, étiré et chauffé à la vapeur jusqu'à une mousse soyeuse — celle qui tient un cœur.",
      "process.grindButton": "Moudre les grains",
      "process.grinding": "Mouture en cours…",
      "process.grindAgain": "Remplir la trémie",
      "gallery.eyebrow": "Coup d'œil",
      "gallery.title": "Galerie",
      "gallery.lede": "Quelques coins du café.",
      "gallery.tile1": "Le bar à espresso",
      "gallery.slot": "Photo à ajouter",
      "gallery.tile1sub": "Lumière chaude, calme",
      "gallery.tile2": "La vitrine à pâtisseries",
      "gallery.tile2sub": "Fraîche chaque matin",
      "gallery.tile3": "Origine unique",
      "gallery.tile4": "La fenêtre sur rue",
      "gallery.tile5": "Pour-over lent",
      "gallery.tile6": "Tartes du week-end",
      "visit.eyebrow": "Venez nous voir",
      "visit.title": "Nous trouver",
      "visit.lede": "Passez, prenez votre temps.",
      "visit.days1": "Lun – Ven",
      "visit.days2": "Sam – Dim",
      "visit.venue": "The Shops at Congressional Village",
      "visit.address": "1701 Rockville Pike, Suite A-11, Rockville, MD 20852",
      "visit.note": "Retrait et livraison disponibles sur DoorDash.",
      "visit.directions": "Itinéraire",
      "visit.doordash": "Commander sur DoorDash",
      "visit.call": "Appeler le café",
      "footer.signature": "À bientôt — au Chateau de Rockville.",
      "footer.callLabel": "Appelez-nous",
      "footer.emailLabel": "Écrivez-nous",
      "footer.addressLabel": "Adresse",
      "footer.orderLabel": "Commander en ligne",
      "footer.orderValue": "Retrait et livraison DoorDash",
      "footer.followLabel": "Suivez-nous",
      "footer.copyright": "© 2026 Chateau de Rockville Cafe. Tous droits réservés.",
      "footer.madeWith": "Rockville, Maryland"
    },
    es: {
      "nav.home": "Inicio",
      "nav.story": "Nuestra historia",
      "nav.menu": "Menú",
      "nav.process": "El proceso",
      "nav.gallery": "Galería",
      "nav.visit": "Visítanos",
      "nav.contact": "Contacto",
      "nav.call": "Llamar al (667) 324-7743",
      "nav.doordash": "Pedir por DoorDash",
      "hero.eyebrow": "Rockville, Maryland · Desde 2024",
      "hero.title": "Un café construido como un pequeño <span class=\"accent-word\">château</span>.",
      "hero.lede": "Repostería de piedra molida, espresso de origen único y una terraza en el corazón de Rockville.",
      "hero.cta1": "Ver el menú",
      "hero.cta2": "Llamar para reservar",
      "hero.caption": "3D · en vivo",
      "about.eyebrow": "Nuestra historia",
      "about.title": "Un rincón de Provenza en el centro de Rockville",
      "about.p1": "Chateau de Rockville Cafe abrió como un pequeño rincón de Provenza en el centro de Rockville — un lugar para repostería de piedra molida, espresso paciente y mañanas sin prisa.",
      "about.p2": "Todo en el mostrador se hornea, prepara o elabora en casa, en pequeños lotes, cada día.",
      "about.quote": "Queríamos un café que se sintiera como una puerta hacia un lugar más tranquilo.",
      "about.quoteCite": "— Los fundadores, Chateau de Rockville Cafe",
      "menu.eyebrow": "En el mostrador",
      "menu.title": "Nuestra carta",
      "menu.lede": "Horneado cada mañana. Servido al momento.",
      "menu.cat1": "Espresso y Café",
      "menu.cat2": "Repostería",
      "menu.cat3": "Tartines y Bocados",
      "menu.item1": "Mezcla de la casa, leche vaporizada.",
      "menu.item2": "Doble shot, origen único.",
      "menu.item3": "Espresso, leche espumada.",
      "menu.item4": "Leche de avena, miel.",
      "menu.item5": "Laminado con mantequilla, horneado a diario.",
      "menu.item6": "Barras de chocolate negro.",
      "menu.item7": "Crema de almendra, fresas.",
      "menu.item8": "Mantequilla avellanada, ralladura de limón.",
      "menu.item9": "Jamón, mantequilla, baguette.",
      "menu.item10": "Gruyère, bechamel.",
      "menu.item11": "Ricotta batida, vegetales de temporada.",
      "menu.cat4": "Bebidas Especiales",
      "menu.item12": "Suave crema de soda sobre espresso intenso.",
      "menu.item13": "Limonada dulce y ácida, cereza, y té de flor de mariposa.",
      "menu.item14": "Delicado aroma a flor de cerezo, leche cremosa.",
      "process.eyebrow": "Detrás del mostrador",
      "process.title": "El proceso",
      "process.lede": "Nuestro café, hasta ti.",
      "process.stage1Title": "Molido al momento",
      "process.stage1Desc": "Granos enteros, pesados y molidos justo cuando llega tu pedido — nunca reposando en una tolva.",
      "process.stage2Title": "Vapor de seda",
      "process.stage2Desc": "Leche fría, estirada y vaporizada hasta una microespuma sedosa — la que sostiene un corazón.",
      "process.grindButton": "Moler los granos",
      "process.grinding": "Moliendo…",
      "process.grindAgain": "Rellenar la tolva",
      "gallery.eyebrow": "Un vistazo",
      "gallery.title": "Galería",
      "gallery.lede": "Algunos rincones del café.",
      "gallery.tile1": "La barra de espresso",
      "gallery.slot": "Foto por añadir",
      "gallery.tile1sub": "Luz cálida, calma",
      "gallery.tile2": "La vitrina de repostería",
      "gallery.tile2sub": "Fresca cada mañana",
      "gallery.tile3": "Origen único",
      "gallery.tile4": "La ventana a la calle",
      "gallery.tile5": "Pour-over lento",
      "gallery.tile6": "Tartas de fin de semana",
      "visit.eyebrow": "Ven a visitarnos",
      "visit.title": "Visítanos",
      "visit.lede": "Pasa y quédate un rato.",
      "visit.days1": "Lun – Vie",
      "visit.days2": "Sáb – Dom",
      "visit.venue": "The Shops at Congressional Village",
      "visit.address": "1701 Rockville Pike, Suite A-11, Rockville, MD 20852",
      "visit.note": "Recogida y entrega disponibles en DoorDash.",
      "visit.directions": "Cómo llegar",
      "visit.doordash": "Pedir por DoorDash",
      "visit.call": "Llamar al café",
      "footer.signature": "Hasta pronto — en Chateau de Rockville.",
      "footer.callLabel": "Llámanos",
      "footer.emailLabel": "Escríbenos",
      "footer.addressLabel": "Dirección",
      "footer.orderLabel": "Pedir en línea",
      "footer.orderValue": "Recogida y entrega por DoorDash",
      "footer.followLabel": "Síguenos",
      "footer.copyright": "© 2026 Chateau de Rockville Cafe. Todos los derechos reservados.",
      "footer.madeWith": "Rockville, Maryland"
    }
  };

  var LANG_NAMES = { en: "EN", fr: "FR", es: "ES" };

  function getStoredLang() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function storeLang(lang) {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* private browsing / storage disabled — non-fatal */
    }
  }

  function applyLanguage(lang) {
    var dict = STRINGS[lang] || STRINGS.en;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (dict[key]) {
        el.innerHTML = dict[key];
      }
    });

    document.documentElement.setAttribute("lang", lang);

    var label = document.getElementById("langButtonLabel");
    if (label) label.textContent = LANG_NAMES[lang] || "EN";

    document.querySelectorAll(".lang-switch__option").forEach(function (opt) {
      var isCurrent = opt.getAttribute("data-lang") === lang;
      opt.setAttribute("aria-current", isCurrent ? "true" : "false");
    });

    storeLang(lang);
  }

  window.CRCi18n = {
    apply: applyLanguage,
    strings: STRINGS
  };

  document.addEventListener("DOMContentLoaded", function () {
    var initial = getStoredLang() || "en";
    if (!STRINGS[initial]) initial = "en";
    applyLanguage(initial);
  });
})();
