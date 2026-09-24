/** Business config. Replace placeholders with the client's real details before launch. */

// WhatsApp number in international format, digits only (country code, no "+" or spaces).
// Tunisia +216 51 828 810.
export const WHATSAPP_NUMBER = "21651828810";
/** Human-friendly phone shown in the UI. */
export const CONTACT_PHONE = "+216 51 828 810";
/** Social / contact links. */
export const INSTAGRAM_URL = "https://www.instagram.com/para_bingo/";
export const INSTAGRAM_HANDLE = "@para_bingo";

export const BUSINESS_NAME = "BHC Bingo Parapharmacie";

// Flat delivery fee in millimes (7,000 DT = 7000). Shown at checkout (demo value).
export const DELIVERY_FEE_MILLIMES = 7000;
export const FREE_DELIVERY_OVER_MILLIMES = 100000; // free over 100 DT

/** Reservations: the only bookable time slots, and the weekly closed day (0 = Sunday). */
export const RESERVATION_SLOTS = ["10:00", "15:00"] as const;
export const RESERVATION_CLOSED_DOW = 0; // Sunday

/** Physical store — used for in-store pickup and the "Visit us" map. */
export const STORE = {
  name: "Bingo Cosmetics",
  /** Short human line shown near the map (kept generic — the map is the source of truth). */
  area: "Sousse, Tunisia",
  lat: 35.8549834,
  lng: 10.611173,
  /** Opens the exact place in Google Maps (directions, hours, reviews). */
  mapsUrl:
    "https://www.google.com/maps/place/Bingo+cosmetics/@35.8549834,10.611173,17z/data=!4m6!3m5!1s0x12fd8b0051c07cc1:0x96ca221039d55ab5!8m2!3d35.8549834!4d10.611173!16s%2Fg%2F11mdjn0jxs",
  /** Keyless embeddable map centred on the shop pin. */
  embedUrl:
    "https://www.google.com/maps?q=35.8549834,10.611173&z=17&hl=en&output=embed",
} as const;
