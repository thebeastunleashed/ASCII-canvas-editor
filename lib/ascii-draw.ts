export type Point = { x: number; y: number };

export const BORDER_STYLES = {
  single: { h: '─', v: '│', tl: '┌', tr: '┐', bl: '└', br: '┘' },
  double: { h: '═', v: '║', tl: '╔', tr: '╗', bl: '╚', br: '╝' },
  ascii: { h: '-', v: '|', tl: '+', tr: '+', bl: '+', br: '+' },
  rounded: { h: '─', v: '│', tl: '╭', tr: '╮', bl: '╰', br: '╯' },
};

export type BorderStyle = keyof typeof BORDER_STYLES;

export function drawLine(p0: Point, p1: Point, char = '█'): Map<string, string> {
  const points = new Map<string, string>();
  let dx = Math.abs(p1.x - p0.x);
  let dy = Math.abs(p1.y - p0.y);
  let sx = p0.x < p1.x ? 1 : -1;
  let sy = p0.y < p1.y ? 1 : -1;
  let err = dx - dy;

  let x = p0.x;
  let y = p0.y;

  while (true) {
    points.set(`${x},${y}`, char);
    if (x === p1.x && y === p1.y) break;
    let e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
}

export function drawSmartLine(p0: Point, p1: Point): Map<string, string> {
  const points = new Map<string, string>();
  let dx = Math.abs(p1.x - p0.x);
  let dy = Math.abs(p1.y - p0.y);
  let sx = p0.x < p1.x ? 1 : -1;
  let sy = p0.y < p1.y ? 1 : -1;
  let err = dx - dy;

  let x = p0.x;
  let y = p0.y;

  let prevX = x;
  let prevY = y;

  while (true) {
    let char = 'x';
    if (x === p0.x && y === p0.y) {
       char = dx > dy ? '─' : '│';
    } else {
       if (x !== prevX && y === prevY) char = '─';
       else if (x === prevX && y !== prevY) char = '│';
       else char = dx > dy ? '─' : '│';
    }
    
    points.set(`${x},${y}`, char);
    if (x === p1.x && y === p1.y) break;
    
    prevX = x;
    prevY = y;

    let e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
}

export function drawRect(p0: Point, p1: Point, style: BorderStyle = 'single'): Map<string, string> {
  const points = new Map<string, string>();
  const minX = Math.min(p0.x, p1.x);
  const maxX = Math.max(p0.x, p1.x);
  const minY = Math.min(p0.y, p1.y);
  const maxY = Math.max(p0.y, p1.y);

  const chars = BORDER_STYLES[style];

  if (minX === maxX && minY === maxY) {
    points.set(`${minX},${minY}`, chars.tl);
    return points;
  }

  if (minX === maxX) {
    for (let y = minY; y <= maxY; y++) points.set(`${minX},${y}`, chars.v);
    return points;
  }

  if (minY === maxY) {
    for (let x = minX; x <= maxX; x++) points.set(`${x},${minY}`, chars.h);
    return points;
  }

  for (let x = minX + 1; x < maxX; x++) {
    points.set(`${x},${minY}`, chars.h);
    points.set(`${x},${maxY}`, chars.h);
  }
  for (let y = minY + 1; y < maxY; y++) {
    points.set(`${minX},${y}`, chars.v);
    points.set(`${maxX},${y}`, chars.v);
  }

  points.set(`${minX},${minY}`, chars.tl);
  points.set(`${maxX},${minY}`, chars.tr);
  points.set(`${minX},${maxY}`, chars.bl);
  points.set(`${maxX},${maxY}`, chars.br);

  return points;
}

export function drawDiamond(p0: Point, p1: Point, style: BorderStyle = 'single'): Map<string, string> {
  const points = new Map<string, string>();
  const minX = Math.min(p0.x, p1.x);
  const maxX = Math.max(p0.x, p1.x);
  const minY = Math.min(p0.y, p1.y);
  const maxY = Math.max(p0.y, p1.y);
  
  const midX = Math.floor((minX + maxX) / 2);
  const midY = Math.floor((minY + maxY) / 2);

  const l1 = drawLine({x: midX, y: minY}, {x: maxX, y: midY}, '/');
  const l2 = drawLine({x: maxX, y: midY}, {x: midX, y: maxY}, '\\');
  const l3 = drawLine({x: midX, y: maxY}, {x: minX, y: midY}, '/');
  const l4 = drawLine({x: minX, y: midY}, {x: midX, y: minY}, '\\');

  l1.forEach((v, k) => points.set(k, v));
  l2.forEach((v, k) => points.set(k, v));
  l3.forEach((v, k) => points.set(k, v));
  l4.forEach((v, k) => points.set(k, v));

  points.set(`${midX},${minY}`, '^');
  points.set(`${maxX},${midY}`, '>');
  points.set(`${midX},${maxY}`, 'v');
  points.set(`${minX},${midY}`, '<');

  return points;
}

export function drawArrow(p0: Point, p1: Point): Map<string, string> {
  const points = drawSmartLine(p0, p1);
  
  let dx = p1.x - p0.x;
  let dy = p1.y - p0.y;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    points.set(`${p1.x},${p1.y}`, dx > 0 ? '>' : '<');
  } else {
    points.set(`${p1.x},${p1.y}`, dy > 0 ? 'v' : '^');
  }
  
  return points;
}
