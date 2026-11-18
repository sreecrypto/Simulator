const palette = {
  R: ['#e7ae72', '#a16442', '#805138'], C: ['#7dbeff', '#3d74bc', '#35568b'],
  L: ['#d4a179', '#875a46', '#694339'], D: ['#fcaa81', '#ac5d54', '#74434b'],
  V: ['#9f91ff', '#5f50b4', '#494384'], I: ['#9f91ff', '#5f50b4', '#494384'],
  INPUT: ['#8bbcff', '#486caa', '#374975'], OUTPUT: ['#79d7b1', '#397c72', '#2b6259'],
  CLOCK: ['#f0cd7a', '#99723e', '#755c39'],
};
const chip = ['#414f73', '#293552', '#202a45'];
const initialCamera = { yaw: -.36, tilt: .68, zoom: 1, x: 0, y: 0 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function projection(camera, width, height, bounds) {
  const cos = Math.cos(camera.yaw), sin = Math.sin(camera.yaw);
  const pitch = Math.sin(camera.tilt), elevation = Math.cos(camera.tilt);
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const fitX = Math.abs(cos) * bounds.width + Math.abs(sin) * bounds.height;
  const fitY = pitch * (Math.abs(sin) * bounds.width + Math.abs(cos) * bounds.height);
  const scale = Math.min(width * .80 / fitX, height * .67 / (fitY + 50)) * camera.zoom;
  return ([worldX, worldY, z = 0]) => {
    const x = worldX - centerX, y = worldY - centerY;
    const forward = sin * x + cos * y;
    return [
      width / 2 + camera.x + scale * (cos * x - sin * y),
      height / 2 + camera.y + scale * (pitch * forward - elevation * z),
      elevation * forward + pitch * z,
    ];
  };
}

export function createBoardView(canvas) {
  const ctx = canvas.getContext('2d');
  let camera = { ...initialCamera };
  let scene, sample, frame, drag;

  function requestDraw() {
    if (!ctx || canvas.hidden || frame !== undefined) return;
    frame = requestAnimationFrame(draw);
  }

  function draw() {
    frame = undefined;
    if (!scene || canvas.hidden) return;
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * ratio), pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const { bounds, parts, nets, mode } = scene;
    const project = projection(camera, width, height, bounds);
    const { x, y } = bounds;
    const right = x + bounds.width, bottom = y + bounds.height;
    const corners = [[x,y], [right,y], [right,bottom], [x,bottom]];

    function polygon(points, fill, stroke) {
      ctx.beginPath();
      points.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    }
    function line(points, color, weight) {
      ctx.beginPath();
      points.map(project).forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
      ctx.strokeStyle = color;
      ctx.lineWidth = weight;
      ctx.stroke();
    }
    function dot(position, radius, color) {
      const [px, py] = project(position);
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    }

    const board = corners.map(point => project(point));
    ctx.shadowColor = '#000b';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 19;
    polygon(board.map(([px, py]) => [px, py + 8]), '#08151b');
    ctx.shadowBlur = ctx.shadowOffsetY = 0;
    const gradient = ctx.createLinearGradient(0, height * .2, width, height * .85);
    gradient.addColorStop(0, '#173a45');
    gradient.addColorStop(1, '#102630');
    polygon(board, gradient, '#477480');
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const step = Math.max(20, Math.ceil(Math.max(bounds.width, bounds.height) / 90 / 20) * 20);
    for (let gx = Math.ceil(x / step) * step; gx < right; gx += step) line([[gx,y],[gx,bottom]], '#5ba8aa24', 1);
    for (let gy = Math.ceil(y / step) * step; gy < bottom; gy += step) line([[x,gy],[right,gy]], '#5ba8aa24', 1);
    for (const [cx, cy] of corners) {
      const mount = [cx + (cx === x ? 28 : -28), cy + (cy === y ? 28 : -28)];
      dot(mount, 5, '#709294');
      dot(mount, 3, '#0a1923');
    }

    for (const [name, points] of nets) {
      const [start, ...ends] = points;
      const value = sample?.[name];
      const color = name === '0' ? '#6c8894' : mode === 'digital' && value === 1 ? '#77ffcb' :
        mode === 'digital' && value === 0 ? '#628393' : Number.isFinite(value) ? '#b5a0ff' : '#e3a66f';
      for (const end of ends) {
        if (name === '0') break;
        const mid = (start[0] + end[0]) / 2;
        line([start,[mid,start[1]],[mid,end[1]],end], '#081a23', 4);
        line([start,[mid,start[1]],[mid,end[1]],end], color, 1.7);
      }
      for (const point of points) {
        dot(point, 3.5, color);
        dot(point, 1.4, '#10252e');
      }
    }

    const ordered = parts.map(part => ({ part, depth: project([part.x,part.y])[2] }))
      .sort((a,b) => a.depth - b.depth);
    for (const { part } of ordered) {
      const { x: px, y: py, halfWidth, halfHeight, height: rise, pins, transform } = part;
      const footprint = [[-halfWidth,-halfHeight],[halfWidth,-halfHeight],[halfWidth,halfHeight],[-halfWidth,halfHeight]]
        .map(([dx, dy]) => transform([px + dx, py + dy]));
      const base = footprint.map(point => project(point));
      const top = footprint.map(([fx,fy]) => project([fx,fy,rise]));
      for (const [pinX, pinY] of pins) {
        const distance = Math.hypot(pinX - px, pinY - py) || 1;
        const reach = Math.min(.85, 20 / distance);
        line([[pinX,pinY],[px + (pinX-px)*reach,py + (pinY-py)*reach,4]], '#cfaa82', 1.4);
      }
      const colors = palette[part.type] || chip;
      const area = (a, b, c) => (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
      const winding = Math.sign(area(top[0], top[1], top[2]));
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        if (area(top[i], top[j], base[j]) * winding < 0) {
          polygon([top[i],top[j],base[j],base[i]], colors[i % 2 + 1], '#0c192a');
        }
      }
      polygon(top, colors[0], part.selected ? '#ffffff' : '#ffffff42');
      const surface = (dx, dy) => [...transform([px + dx, py + dy]), rise + .2];
      if (part.type === 'R' || part.type === 'L') {
        const bands = part.type === 'R' ? [-.70, -.51, .53, .75] : [-.75, -.5, -.25, 0, .25, .5, .75];
        for (const offset of bands) {
          line([surface(halfWidth * offset, -halfHeight), surface(halfWidth * offset, halfHeight)], colors[2], 1.6);
        }
      } else if (part.type === 'C' || part.type === 'D') {
        line([surface(halfWidth * .72, -halfHeight), surface(halfWidth * .72, halfHeight)], '#e6efff', 1.7);
      } else {
        dot(surface(-halfWidth * .75, -halfHeight * .60), 1.8, '#dfebff');
      }
      const [labelX, labelY] = project([px,py,rise]);
      const available = Math.max(...top.map(p=>p[0])) - Math.min(...top.map(p=>p[0]));
      if (available > 13) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '600 11px ui-monospace, Consolas, monospace';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#10192b';
        ctx.fillStyle = '#f2f7ff';
        ctx.strokeText(part.id, labelX, labelY - 1, Math.max(12, available - 4));
        ctx.fillText(part.id, labelX, labelY - 1, Math.max(12, available - 4));
      }
      if (mode === 'digital' && sample?.[part.output] === 1) dot([px,py,rise+6], 3, '#89ffbf');
    }
  }

  const reset = () => { camera = { ...initialCamera }; requestDraw(); };
  const zoom = factor => { camera.zoom = clamp(camera.zoom * factor, .45, 5); requestDraw(); };
  const orbit = (dx, dy) => {
    camera.yaw += dx;
    camera.tilt = clamp(camera.tilt + dy, .18, 1.52);
    requestDraw();
  };
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 && event.button !== 1) return;
    event.preventDefault();
    canvas.focus();
    canvas.setPointerCapture(event.pointerId);
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, pan: event.shiftKey || event.button === 1 };
    canvas.classList.add('orbiting');
  });
  canvas.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    drag.x = event.clientX;
    drag.y = event.clientY;
    if (drag.pan) { camera.x += dx; camera.y += dy; requestDraw(); }
    else orbit(dx * .008, dy * .006);
  });
  for (const type of ['pointerup','pointercancel','lostpointercapture']) {
    canvas.addEventListener(type, event => {
      if (drag?.id !== event.pointerId) return;
      drag = undefined;
      canvas.classList.remove('orbiting');
    });
  }
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    zoom(Math.exp(-clamp(event.deltaY, -160, 160) * .003));
  }, { passive: false });
  canvas.addEventListener('keydown', event => {
    const moves = { ArrowLeft: [-.12,0], ArrowRight: [.12,0], ArrowUp: [0,-.10], ArrowDown: [0,.10] };
    if (Object.hasOwn(moves, event.key)) orbit(...moves[event.key]);
    else if (event.key === '+' || event.key === '=') zoom(1.25);
    else if (event.key === '-') zoom(.8);
    else if (event.key === 'Home') reset();
    else return;
    event.preventDefault();
  });
  new ResizeObserver(requestDraw).observe(canvas);
  return {
    available: Boolean(ctx),
    setScene(next) { scene = next; requestDraw(); },
    setSample(next) { sample = next; requestDraw(); },
    reset,
    zoom,
  };
}
