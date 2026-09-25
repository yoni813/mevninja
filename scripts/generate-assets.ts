import fs from 'fs';
import path from 'path';

// Helper to generate constellation points on a ring
function generateRingNodes(cx: number, cy: number, rMin: number, rMax: number, count: number, seed: number) {
  const nodes: { x: number; y: number; r: number }[] = [];
  let s = seed;
  const pseudoRand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const rings = 4;
  for (let ring = 0; ring < rings; ring++) {
    const r = rMin + (rMax - rMin) * (ring / (rings - 1));
    const itemsInRing = Math.floor(count / rings);
    for (let i = 0; i < itemsInRing; i++) {
      const angle = (i / itemsInRing) * Math.PI * 2 + (pseudoRand() * 0.2 - 0.1);
      const radiusOffset = (pseudoRand() * 10 - 5);
      const x = cx + (r + radiusOffset) * Math.cos(angle);
      const y = cy + (r + radiusOffset) * Math.sin(angle);
      nodes.push({ x, y, r: 2 + pseudoRand() * 2 });
    }
  }
  return nodes;
}

function generateNetworkEdges(nodes: { x: number; y: number }[], maxDist: number) {
  const edges: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < maxDist) {
        edges.push({
          x1: nodes[i].x,
          y1: nodes[i].y,
          x2: nodes[j].x,
          y2: nodes[j].y,
          opacity: Math.max(0.15, 1 - (dist / maxDist))
        });
      }
    }
  }
  return edges;
}

// Generate filaments converging towards center (cx, cy)
function generateFilaments(
  sourceCx: number,
  sourceCy: number,
  rInner: number,
  centerFocalX: number,
  centerFocalY: number,
  isLeft: boolean
) {
  const paths: string[] = [];
  const lines = 32;
  for (let i = 0; i < lines; i++) {
    const frac = i / (lines - 1); // 0 to 1
    const angleRange = Math.PI * 0.55;
    const startAngle = isLeft 
      ? -angleRange / 2 + frac * angleRange 
      : Math.PI - angleRange / 2 + frac * angleRange;

    const x0 = sourceCx + rInner * Math.cos(startAngle);
    const y0 = sourceCy + rInner * Math.sin(startAngle);

    // Control point pulling horizontally toward focal center
    const cpX = (x0 + centerFocalX) / 2;
    const cpY = (y0 * 0.3 + centerFocalY * 0.7);

    paths.push(`M ${x0.toFixed(1)} ${y0.toFixed(1)} Q ${cpX.toFixed(1)} ${cpY.toFixed(1)} ${centerFocalX.toFixed(1)} ${centerFocalY.toFixed(1)}`);
  }
  return paths;
}

export function buildNexusCortexLogoSvg(isDarkTheme = false): string {
  const width = 1000;
  const height = 1000;
  const leftCx = 360;
  const rightCx = 640;
  const cy = 400;
  const rMin = 145;
  const rMax = 225;
  const focalX = 500;
  const focalY = 400;

  const leftNodes = generateRingNodes(leftCx, cy, rMin, rMax, 64, 42);
  const rightNodes = generateRingNodes(rightCx, cy, rMin, rMax, 64, 99);

  const leftEdges = generateNetworkEdges(leftNodes, 55);
  const rightEdges = generateNetworkEdges(rightNodes, 55);

  const leftFilaments = generateFilaments(leftCx, cy, rMin, focalX, focalY, true);
  const rightFilaments = generateFilaments(rightCx, cy, rMin, focalX, focalY, false);

  const bgColor = isDarkTheme ? '#06080F' : '#F8FAFC';
  const leftColor = '#0284C7';
  const leftGlow = '#38BDF8';
  const rightColor = '#059669';
  const rightGlow = '#34D399';
  const flareColor = '#E0F2FE';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <!-- Radial Soft Bloom Glow -->
    <radialGradient id="bgGlow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="${isDarkTheme ? '#0E2A47' : '#FFFFFF'}" stop-opacity="${isDarkTheme ? '0.45' : '1'}" />
      <stop offset="100%" stop-color="${bgColor}" stop-opacity="1" />
    </radialGradient>

    <!-- Linear Gradients for Text & Accents -->
    <linearGradient id="nexusGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284C7" />
      <stop offset="100%" stop-color="#0EA5E9" />
    </linearGradient>

    <linearGradient id="cortexGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#34D399" />
    </linearGradient>

    <linearGradient id="leftFilamentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284C7" stop-opacity="0.3" />
      <stop offset="60%" stop-color="#38BDF8" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#E0F2FE" stop-opacity="0.95" />
    </linearGradient>

    <linearGradient id="rightFilamentGrad" x1="100%" y1="0%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#059669" stop-opacity="0.3" />
      <stop offset="60%" stop-color="#34D399" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#E0F2FE" stop-opacity="0.95" />
    </linearGradient>

    <radialGradient id="lensFlareGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
      <stop offset="25%" stop-color="#A5F3FC" stop-opacity="0.9" />
      <stop offset="60%" stop-color="#38BDF8" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#0284C7" stop-opacity="0" />
    </radialGradient>

    <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="flareGlow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Background Plate -->
  <rect width="${width}" height="${height}" fill="url(#bgGlow)" />

  <!-- Base Orbital Concentric Guide Circles (Left) -->
  <circle cx="${leftCx}" cy="${cy}" r="${rMin}" stroke="${leftColor}" stroke-width="2" fill="none" opacity="0.45" />
  <circle cx="${leftCx}" cy="${cy}" r="${(rMin + rMax) / 2}" stroke="${leftColor}" stroke-width="1.5" fill="none" opacity="0.3" stroke-dasharray="8 6" />
  <circle cx="${leftCx}" cy="${cy}" r="${rMax}" stroke="${leftColor}" stroke-width="2.5" fill="none" opacity="0.5" />

  <!-- Base Orbital Concentric Guide Circles (Right) -->
  <circle cx="${rightCx}" cy="${cy}" r="${rMin}" stroke="${rightColor}" stroke-width="2" fill="none" opacity="0.45" />
  <circle cx="${rightCx}" cy="${cy}" r="${(rMin + rMax) / 2}" stroke="${rightColor}" stroke-width="1.5" fill="none" opacity="0.3" stroke-dasharray="8 6" />
  <circle cx="${rightCx}" cy="${cy}" r="${rMax}" stroke="${rightColor}" stroke-width="2.5" fill="none" opacity="0.5" />

  <!-- Left Ring Constellation Network (Edges) -->
  <g stroke="${leftGlow}" stroke-linecap="round">
    ${leftEdges.map(e => `<line x1="${e.x1.toFixed(1)}" y1="${e.y1.toFixed(1)}" x2="${e.x2.toFixed(1)}" y2="${e.y2.toFixed(1)}" stroke-width="1.2" opacity="${e.opacity.toFixed(2)}" />`).join('\n    ')}
  </g>

  <!-- Right Ring Constellation Network (Edges) -->
  <g stroke="${rightGlow}" stroke-linecap="round">
    ${rightEdges.map(e => `<line x1="${e.x1.toFixed(1)}" y1="${e.y1.toFixed(1)}" x2="${e.x2.toFixed(1)}" y2="${e.y2.toFixed(1)}" stroke-width="1.2" opacity="${e.opacity.toFixed(2)}" />`).join('\n    ')}
  </g>

  <!-- Inward Converging Filament Threads (Left & Right) -->
  <g fill="none" stroke="url(#leftFilamentGrad)" stroke-width="1.2">
    ${leftFilaments.map(d => `<path d="${d}" />`).join('\n    ')}
  </g>
  <g fill="none" stroke="url(#rightFilamentGrad)" stroke-width="1.2">
    ${rightFilaments.map(d => `<path d="${d}" />`).join('\n    ')}
  </g>

  <!-- Left Ring Constellation Nodes (Dots) -->
  <g filter="url(#nodeGlow)">
    ${leftNodes.map(n => `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${n.r.toFixed(1)}" fill="#BAE6FD" stroke="${leftColor}" stroke-width="1.5" />`).join('\n    ')}
  </g>

  <!-- Right Ring Constellation Nodes (Dots) -->
  <g filter="url(#nodeGlow)">
    ${rightNodes.map(n => `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${n.r.toFixed(1)}" fill="#A7F3D0" stroke="${rightColor}" stroke-width="1.5" />`).join('\n    ')}
  </g>

  <!-- Interlocking Intersection Glow & Lens Flare Core -->
  <g filter="url(#flareGlow)">
    <!-- Radial Aura -->
    <circle cx="${focalX}" cy="${focalY}" r="48" fill="url(#lensFlareGrad)" />
    <!-- Center Hotspot -->
    <circle cx="${focalX}" cy="${focalY}" r="9" fill="#FFFFFF" />
    <!-- Horizontal Flare Rays -->
    <line x1="${focalX - 110}" y1="${focalY}" x2="${focalX + 110}" y2="${focalY}" stroke="#FFFFFF" stroke-width="2" opacity="0.8" />
    <line x1="${focalX - 180}" y1="${focalY}" x2="${focalX + 180}" y2="${focalY}" stroke="#38BDF8" stroke-width="1" opacity="0.5" />
    <line x1="${focalX}" y1="${focalY - 45}" x2="${focalX}" y2="${focalY + 45}" stroke="#A7F3D0" stroke-width="1.5" opacity="0.6" />
  </g>

  <!-- NEXUS CORTEX Premium Brand Typography -->
  <g text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <text x="500" y="780" font-size="68" font-weight="900" letter-spacing="18">
      <tspan fill="url(#nexusGrad)">NEXUS </tspan>
      <tspan fill="url(#cortexGrad)">CORTEX</tspan>
    </text>
  </g>
</svg>`;
}

export function buildNexusCortexWallpaperSvg(): string {
  const width = 1920;
  const height = 1080;
  const leftCx = 780;
  const rightCx = 1140;
  const cy = 480;
  const rMin = 210;
  const rMax = 320;
  const focalX = 960;
  const focalY = 480;

  const leftNodes = generateRingNodes(leftCx, cy, rMin, rMax, 84, 55);
  const rightNodes = generateRingNodes(rightCx, cy, rMin, rMax, 84, 102);

  const leftEdges = generateNetworkEdges(leftNodes, 68);
  const rightEdges = generateNetworkEdges(rightNodes, 68);

  const leftFilaments = generateFilaments(leftCx, cy, rMin, focalX, focalY, true);
  const rightFilaments = generateFilaments(rightCx, cy, rMin, focalX, focalY, false);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <!-- Dark Space Radial Background -->
    <radialGradient id="wallBg" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#0A1628" />
      <stop offset="45%" stop-color="#060913" />
      <stop offset="100%" stop-color="#030408" />
    </radialGradient>

    <!-- Cyber Grid Pattern -->
    <pattern id="techGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" stroke-width="0.75" opacity="0.4" />
    </pattern>

    <linearGradient id="wallLeftFilament" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284C7" stop-opacity="0.15" />
      <stop offset="65%" stop-color="#38BDF8" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.95" />
    </linearGradient>

    <linearGradient id="wallRightFilament" x1="100%" y1="0%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#059669" stop-opacity="0.15" />
      <stop offset="65%" stop-color="#34D399" stop-opacity="0.85" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.95" />
    </linearGradient>

    <radialGradient id="wallLensFlare" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1" />
      <stop offset="20%" stop-color="#E0F2FE" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#38BDF8" stop-opacity="0.5" />
      <stop offset="80%" stop-color="#10B981" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <filter id="wallGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Wallpaper Background -->
  <rect width="${width}" height="${height}" fill="url(#wallBg)" />
  <rect width="${width}" height="${height}" fill="url(#techGrid)" />

  <!-- Ambient Light Orbs behind rings -->
  <circle cx="${leftCx}" cy="${cy}" r="340" fill="#0284C7" opacity="0.12" filter="url(#wallGlow)" />
  <circle cx="${rightCx}" cy="${cy}" r="340" fill="#059669" opacity="0.12" filter="url(#wallGlow)" />

  <!-- Concentric Orbits Left -->
  <circle cx="${leftCx}" cy="${cy}" r="${rMin}" stroke="#0284C7" stroke-width="2.5" fill="none" opacity="0.6" />
  <circle cx="${leftCx}" cy="${cy}" r="${(rMin + rMax) / 2}" stroke="#38BDF8" stroke-width="1.5" fill="none" opacity="0.35" stroke-dasharray="10 8" />
  <circle cx="${leftCx}" cy="${cy}" r="${rMax}" stroke="#0284C7" stroke-width="3" fill="none" opacity="0.6" />

  <!-- Concentric Orbits Right -->
  <circle cx="${rightCx}" cy="${cy}" r="${rMin}" stroke="#059669" stroke-width="2.5" fill="none" opacity="0.6" />
  <circle cx="${rightCx}" cy="${cy}" r="${(rMin + rMax) / 2}" stroke="#34D399" stroke-width="1.5" fill="none" opacity="0.35" stroke-dasharray="10 8" />
  <circle cx="${rightCx}" cy="${cy}" r="${rMax}" stroke="#059669" stroke-width="3" fill="none" opacity="0.6" />

  <!-- Left Ring Edges -->
  <g stroke="#38BDF8" stroke-linecap="round">
    ${leftEdges.map(e => `<line x1="${e.x1.toFixed(1)}" y1="${e.y1.toFixed(1)}" x2="${e.x2.toFixed(1)}" y2="${e.y2.toFixed(1)}" stroke-width="1.4" opacity="${(e.opacity * 0.9).toFixed(2)}" />`).join('\n    ')}
  </g>

  <!-- Right Ring Edges -->
  <g stroke="#34D399" stroke-linecap="round">
    ${rightEdges.map(e => `<line x1="${e.x1.toFixed(1)}" y1="${e.y1.toFixed(1)}" x2="${e.x2.toFixed(1)}" y2="${e.y2.toFixed(1)}" stroke-width="1.4" opacity="${(e.opacity * 0.9).toFixed(2)}" />`).join('\n    ')}
  </g>

  <!-- Inward Converging Filament Threads -->
  <g fill="none" stroke="url(#wallLeftFilament)" stroke-width="1.5">
    ${leftFilaments.map(d => `<path d="${d}" />`).join('\n    ')}
  </g>
  <g fill="none" stroke="url(#wallRightFilament)" stroke-width="1.5">
    ${rightFilaments.map(d => `<path d="${d}" />`).join('\n    ')}
  </g>

  <!-- Nodes Left -->
  <g filter="url(#wallGlow)">
    ${leftNodes.map(n => `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${(n.r * 1.2).toFixed(1)}" fill="#BAE6FD" stroke="#0284C7" stroke-width="2" />`).join('\n    ')}
  </g>

  <!-- Nodes Right -->
  <g filter="url(#wallGlow)">
    ${rightNodes.map(n => `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${(n.r * 1.2).toFixed(1)}" fill="#A7F3D0" stroke="#059669" stroke-width="2" />`).join('\n    ')}
  </g>

  <!-- Center Flare Starburst -->
  <g filter="url(#wallGlow)">
    <circle cx="${focalX}" cy="${focalY}" r="70" fill="url(#wallLensFlare)" />
    <circle cx="${focalX}" cy="${focalY}" r="12" fill="#FFFFFF" />
    <line x1="${focalX - 220}" y1="${focalY}" x2="${focalX + 220}" y2="${focalY}" stroke="#FFFFFF" stroke-width="2.5" opacity="0.9" />
    <line x1="${focalX - 340}" y1="${focalY}" x2="${focalX + 340}" y2="${focalY}" stroke="#38BDF8" stroke-width="1.2" opacity="0.6" />
    <line x1="${focalX}" y1="${focalY - 70}" x2="${focalX}" y2="${focalY + 70}" stroke="#A7F3D0" stroke-width="2" opacity="0.75" />
  </g>
</svg>`;
}

// Generate the SVG files into public
const publicDir = path.join(process.cwd(), 'public');
fs.writeFileSync(path.join(publicDir, 'nexus-cortex-logo.svg'), buildNexusCortexLogoSvg(false), 'utf-8');
fs.writeFileSync(path.join(publicDir, 'nexus-cortex-logo-dark.svg'), buildNexusCortexLogoSvg(true), 'utf-8');
fs.writeFileSync(path.join(publicDir, 'nexus-cortex-wallpaper.svg'), buildNexusCortexWallpaperSvg(), 'utf-8');
console.log('Successfully generated SVG assets in /public');
