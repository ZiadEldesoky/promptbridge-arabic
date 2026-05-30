import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scale = 4;

const targets = [
  ["extensions/browser/icons/icon16.png", 16],
  ["extensions/browser/icons/icon32.png", 32],
  ["extensions/browser/icons/icon48.png", 48],
  ["extensions/browser/icons/icon128.png", 128],
  ["extensions/vscode/assets/icon.png", 128]
];

const palette = {
  background: hex("#111827"),
  panel: hex("#F8FAFC"),
  panelInk: hex("#111827"),
  teal: hex("#2DD4BF"),
  amber: hex("#F59E0B"),
  white: hex("#FFFFFF")
};

for (const [relativePath, size] of targets) {
  const png = renderIcon(size);
  const outputPath = resolve(rootDir, relativePath);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, png);
  console.log(`Wrote ${relativePath}`);
}

function renderIcon(size) {
  const highSize = size * scale;
  const canvas = createCanvas(highSize, highSize);

  const n = (value) => Math.round(value * highSize);
  fillRoundedRect(canvas, n(0.02), n(0.02), n(0.96), n(0.96), n(0.19), palette.background);

  drawQuadraticLine(
    canvas,
    n(0.29),
    n(0.76),
    n(0.5),
    n(0.56),
    n(0.71),
    n(0.76),
    n(0.055),
    palette.teal
  );
  drawLine(canvas, n(0.22), n(0.73), n(0.78), n(0.73), n(0.07), palette.amber);
  fillRoundedRect(canvas, n(0.25), n(0.72), n(0.07), n(0.15), n(0.02), palette.panel);
  fillRoundedRect(canvas, n(0.68), n(0.72), n(0.07), n(0.15), n(0.02), palette.panel);

  fillRoundedRect(canvas, n(0.17), n(0.2), n(0.35), n(0.27), n(0.065), palette.panel);
  fillPolygon(
    canvas,
    [
      [n(0.31), n(0.45)],
      [n(0.39), n(0.45)],
      [n(0.32), n(0.56)]
    ],
    palette.panel
  );
  fillRoundedRect(canvas, n(0.24), n(0.29), n(0.2), n(0.035), n(0.018), palette.panelInk);
  fillRoundedRect(canvas, n(0.24), n(0.37), n(0.15), n(0.035), n(0.018), palette.panelInk);

  fillRoundedRect(canvas, n(0.48), n(0.31), n(0.35), n(0.28), n(0.065), palette.teal);
  fillPolygon(
    canvas,
    [
      [n(0.61), n(0.57)],
      [n(0.72), n(0.57)],
      [n(0.75), n(0.69)]
    ],
    palette.teal
  );
  fillRoundedRect(canvas, n(0.56), n(0.4), n(0.18), n(0.035), n(0.018), palette.background);
  fillRoundedRect(canvas, n(0.56), n(0.48), n(0.13), n(0.035), n(0.018), palette.background);

  return encodePng(downsample(canvas, size, scale));
}

function createCanvas(width, height) {
  return {
    width,
    height,
    data: new Uint8Array(width * height * 4)
  };
}

function hex(value) {
  const normalized = value.replace("#", "");
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
    255
  ];
}

function fillRoundedRect(canvas, x, y, width, height, radius, color) {
  const xEnd = x + width;
  const yEnd = y + height;
  for (let yy = Math.max(0, y); yy < Math.min(canvas.height, yEnd); yy += 1) {
    for (let xx = Math.max(0, x); xx < Math.min(canvas.width, xEnd); xx += 1) {
      const dx = Math.max(x + radius - xx, 0, xx - (xEnd - radius));
      const dy = Math.max(y + radius - yy, 0, yy - (yEnd - radius));
      if (dx * dx + dy * dy <= radius * radius) {
        paint(canvas, xx, yy, color);
      }
    }
  }
}

function fillPolygon(canvas, points, color) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.max(0, Math.min(...xs));
  const maxX = Math.min(canvas.width - 1, Math.max(...xs));
  const minY = Math.max(0, Math.min(...ys));
  const maxY = Math.min(canvas.height - 1, Math.max(...ys));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (isPointInPolygon(x + 0.5, y + 0.5, points)) {
        paint(canvas, x, y, color);
      }
    }
  }
}

function isPointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function drawQuadraticLine(canvas, x1, y1, cx, cy, x2, y2, width, color) {
  const points = [];
  for (let i = 0; i <= 24; i += 1) {
    const t = i / 24;
    const mt = 1 - t;
    points.push([
      mt * mt * x1 + 2 * mt * t * cx + t * t * x2,
      mt * mt * y1 + 2 * mt * t * cy + t * t * y2
    ]);
  }
  for (let i = 1; i < points.length; i += 1) {
    drawLine(canvas, points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], width, color);
  }
}

function drawLine(canvas, x1, y1, x2, y2, width, color) {
  const radius = width / 2;
  const minX = Math.max(0, Math.floor(Math.min(x1, x2) - radius));
  const maxX = Math.min(canvas.width - 1, Math.ceil(Math.max(x1, x2) + radius));
  const minY = Math.max(0, Math.floor(Math.min(y1, y2) - radius));
  const maxY = Math.min(canvas.height - 1, Math.ceil(Math.max(y1, y2) + radius));
  const lengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const t =
        lengthSquared === 0
          ? 0
          : Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lengthSquared));
      const px = x1 + t * (x2 - x1);
      const py = y1 + t * (y2 - y1);
      if ((x - px) ** 2 + (y - py) ** 2 <= radius ** 2) {
        paint(canvas, x, y, color);
      }
    }
  }
}

function paint(canvas, x, y, color) {
  const index = (Math.round(y) * canvas.width + Math.round(x)) * 4;
  canvas.data[index] = color[0];
  canvas.data[index + 1] = color[1];
  canvas.data[index + 2] = color[2];
  canvas.data[index + 3] = color[3];
}

function downsample(canvas, size, sampleScale) {
  const output = createCanvas(size, size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const totals = [0, 0, 0, 0];
      for (let yy = 0; yy < sampleScale; yy += 1) {
        for (let xx = 0; xx < sampleScale; xx += 1) {
          const sourceIndex =
            ((y * sampleScale + yy) * canvas.width + x * sampleScale + xx) * 4;
          totals[0] += canvas.data[sourceIndex];
          totals[1] += canvas.data[sourceIndex + 1];
          totals[2] += canvas.data[sourceIndex + 2];
          totals[3] += canvas.data[sourceIndex + 3];
        }
      }
      const outputIndex = (y * size + x) * 4;
      const divisor = sampleScale * sampleScale;
      output.data[outputIndex] = Math.round(totals[0] / divisor);
      output.data[outputIndex + 1] = Math.round(totals[1] / divisor);
      output.data[outputIndex + 2] = Math.round(totals[2] / divisor);
      output.data[outputIndex + 3] = Math.round(totals[3] / divisor);
    }
  }
  return output;
}

function encodePng(canvas) {
  const raw = Buffer.alloc((canvas.width * 4 + 1) * canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    const rowStart = y * (canvas.width * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < canvas.width * 4; x += 1) {
      raw[rowStart + 1 + x] = canvas.data[y * canvas.width * 4 + x];
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr(canvas.width, canvas.height)),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function ihdr(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data[8] = 8;
  data[9] = 6;
  return data;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
