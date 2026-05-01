# Schiaparelli-Inspired Analysis

This project is inspired by the structure and digital posture of schiaparelli.com, not by copying its protected brand, copy, products, or imagery.

## Observed Patterns

Source pages reviewed:

- https://schiaparelli.com/en
- https://schiaparelli.com/en/collections/pret-a-porter
- https://schiaparelli.com/en/pages/l-histoire-de-la-maison
- https://schiaparelli.com/en/blogs/news
- https://schiaparelli.com/en/pages/toutes-nos-boutiques
- https://schiaparelli.com/en/blogs/schiaparelli-et-les-artistes

Key patterns:

- The site behaves like a digital maison, not only a store.
- Navigation separates Collections, Shop, News, Maison, and Boutiques.
- Shop taxonomy is precise: ready-to-wear, accessories, jewelry, bags, shoes, belts, earrings, necklaces, brooches, bracelets, and rings.
- Category pages use filter and sort affordances while preserving a luxury editorial tone.
- The homepage repeats a symbolic house code, then ties it to products and heritage.
- Heritage is handled as a timeline with years, archive imagery, artists, and short historical notes.
- News is used as cultural proof: event appearances, red carpet moments, and public figures.
- Boutique pages are direct and practical: country, city, address, contact, and learn-more route.
- Newsletter and service/legal links complete the luxury-commerce trust layer.

## Applied Direction

VAEL Atelier keeps the same useful information architecture while staying original:

- Edits: three editorial entry points for users who browse by mood or service.
- Shop: category chips, filter summary, product cards, and clear availability language.
- Code: "The Aperture" as a fictional recurring maison symbol.
- Maison: original timeline that explains the brand world.
- Atelier system: performance and security positioning for this HonoJS project.
- Journal: release, service, craft, and security notes.
- Boutiques: fictional private rooms and appointment context.
- Newsletter: simple mailto CTA, avoiding a broken form endpoint.

## Performance Rules Preserved

- No third-party render requests.
- No external fonts.
- No client-side JavaScript required for content.
- Local compressed images only.
- Explicit image dimensions to reduce layout shift.
- Lazy loading for below-fold images.
- Immutable cache headers for static assets.
- Strict CSP and security headers from Hono.

## Implemented CMS Direction

The current implementation expands VAEL into a monochrome luxury CMS:

- Black/white editorial direction influenced by Schiaparelli house codes, Dior campaign scale, Saint Laurent cinematic restraint, Maison Margiela experimentation, and Loewe craft storytelling.
- Multi-page public surface: homepage, collections index/detail, product detail, journal index/detail, and boutiques.
- Admin studio for content and image management: hero, campaign panels, collections, products, journal, boutiques, house code, appointment, newsletter, media library, and raw JSON.
- File-based storage remains intentional for Pterodactyl: `DATA_DIR/content.json` and `DATA_DIR/uploads/`.
- Buyer inquiry stays lightweight through mailto/optional WhatsApp, with no checkout or stored personal lead data in v1.
