import { STORE } from "../lib/config";

interface StoreMapProps {
  /** Compact height (checkout side panel) vs full (Visit-us section). */
  height?: number;
}

/**
 * Embedded Google map centred on the physical shop, with the store name and a
 * link that opens directions in Google Maps. Keyless embed — no API key needed.
 */
export function StoreMap({ height = 200 }: StoreMapProps) {
  return (
    <div className="store-map">
      <div className="store-map-frame" style={{ height }}>
        <iframe
          title={`${STORE.name} location`}
          src={STORE.embedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div className="store-map-meta">
        <div>
          <strong className="store-map-name">{STORE.name}</strong>
          <span className="store-map-area">{STORE.area}</span>
        </div>
        <a className="store-map-link" href={STORE.mapsUrl} target="_blank" rel="noreferrer">
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}
