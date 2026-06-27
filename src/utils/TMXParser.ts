/**
 * Converts a Tiled TMX (XML) map string to the Tiled JSON format
 * expected by Phaser.Tilemaps.Formats.TILED_JSON.
 *
 * Supports CSV-encoded tile layers only (no base64 or compression).
 * Raw GID values (including Tiled flip-bit flags) are passed through as-is
 * — Phaser's ParseGID handles them correctly at tilemap-creation time.
 */
export function parseTMXtoTiledJSON(xmlText: string): object | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');

    const mapEl = doc.querySelector('map');
    if (!mapEl) return null;

    const width      = parseInt(mapEl.getAttribute('width')      ?? '0',  10);
    const height     = parseInt(mapEl.getAttribute('height')     ?? '0',  10);
    const tilewidth  = parseInt(mapEl.getAttribute('tilewidth')  ?? '16', 10);
    const tileheight = parseInt(mapEl.getAttribute('tileheight') ?? '16', 10);
    const orientation = mapEl.getAttribute('orientation') ?? 'orthogonal';
    const renderorder = mapEl.getAttribute('renderorder') ?? 'right-down';

    const children = Array.from(mapEl.children);

    // Parse tilesets (direct children only)
    const tilesets: object[] = [];
    for (const el of children) {
      if (el.tagName !== 'tileset') continue;
      const name     = el.getAttribute('name')     ?? 'tileset';
      const firstgid = parseInt(el.getAttribute('firstgid') ?? '1',  10);
      const tw       = parseInt(el.getAttribute('tilewidth') ?? String(tilewidth),  10);
      const th       = parseInt(el.getAttribute('tileheight') ?? String(tileheight), 10);
      const spacing  = parseInt(el.getAttribute('spacing')   ?? '0',  10);
      const margin   = parseInt(el.getAttribute('margin')    ?? '0',  10);
      const imageEl  = el.querySelector('image');
      const imageSrc = (imageEl?.getAttribute('source') ?? 'rpg-full.png').split('/').pop() ?? 'rpg-full.png';
      tilesets.push({
        name,
        firstgid,
        tilewidth:   tw,
        tileheight:  th,
        margin,
        spacing,
        // 'image' must be a truthy string so Phaser treats this as an image-based tileset.
        // The actual texture is associated later via map.addTilesetImage().
        image:       imageSrc,
        imagewidth:  968,
        imageheight: 1052,
      });
    }

    // Parse tile layers (direct children only)
    const layers: object[] = [];
    for (const el of children) {
      if (el.tagName !== 'layer') continue;
      const name = el.getAttribute('name')  ?? '';
      const lw   = parseInt(el.getAttribute('width')  ?? String(width),  10);
      const lh   = parseInt(el.getAttribute('height') ?? String(height), 10);
      const id   = parseInt(el.getAttribute('id')     ?? '0', 10);

      const dataEl = el.querySelector('data');
      if (!dataEl) continue;

      const csvText = dataEl.textContent ?? '';
      const data = csvText
        .replace(/\s/g, '')
        .split(',')
        .filter(s => s.length > 0)          // guard against trailing comma
        .map(s => { const n = parseInt(s, 10); return isNaN(n) ? 0 : n; });

      layers.push({
        id,
        name,
        type:    'tilelayer',
        width:   lw,
        height:  lh,
        x:       0,
        y:       0,
        opacity: 1,
        visible: true,
        data,
      });
    }

    return {
      version:      1.4,
      tiledversion: '1.2.2',
      width,
      height,
      tilewidth,
      tileheight,
      orientation,
      renderorder,
      infinite:     false,
      layers,
      tilesets,
      nextlayerid:  layers.length + 2,
      nextobjectid: 1,
    };
  } catch {
    return null;
  }
}
