import { log } from '$root/logger.js';
import { labelHelper, updateNodeBounds, getNodeClasses, createPathFromPoints } from './util.js';
import intersect from '../intersect/index.js';
import type { Node } from '$root/rendering-util/types.d.ts';
import {
  styles2String,
  userNodeOverrides,
} from '$root/rendering-util/rendering-elements/shapes/handDrawnShapeStyles.js';
import rough from 'roughjs';

function createHalfRoundedRectShapePathD(
  x: number,
  y: number,
  totalWidth: number,
  totalHeight: number,
  radius: number
) {
  const rw = totalWidth - radius;
  const rh = totalHeight;

  const points = [
    { x: x + rw, y },
    { x, y },
    { x, y: y + rh },
    { x: x + rw, y: y + rh },
  ];

  const rectPath = createPathFromPoints(points);
  const arcPath = `M ${rw},0 A ${rh / 2} ${rh / 2} 0 0 1 ${rw} ${rh}`;
  const finalPath = `${rectPath} ${arcPath}`.replace('Z', '');

  return finalPath;
}

export const halfRoundedRectangle = async (parent: SVGAElement, node: Node) => {
  const { labelStyles, nodeStyles } = styles2String(node);
  node.labelStyle = labelStyles;
  const { shapeSvg, bbox, label } = await labelHelper(parent, node, getNodeClasses(node));
  const w = (bbox.width + node.padding) * 1.2;
  const h = bbox.height + node.padding;
  const radius = h / 2;
  const rx = radius;
  const ry = radius;
  const { cssStyles } = node;

  // @ts-ignore - rough is not typed
  const rc = rough.svg(shapeSvg);
  const options = userNodeOverrides(node, {});

  if (node.look !== 'handDrawn') {
    options.roughness = 0;
    options.fillStyle = 'solid';
  }

  const pathData = createHalfRoundedRectShapePathD(0, 0, w, h, radius);
  const shapeNode = rc.path(pathData, options);
  const polygon = shapeSvg.insert(() => shapeNode, ':first-child');
  polygon.attr('class', 'basic label-container');

  if (cssStyles) {
    polygon.attr('style', cssStyles);
  }

  if (nodeStyles) {
    polygon.attr('style', nodeStyles);
  }

  polygon.attr('transform', `translate(${-w / 2}, ${-h / 2})`);

  updateNodeBounds(node, polygon);

  label.attr('transform', `translate(${-bbox.width / 2}, ${h / 2 - bbox.height})`);

  node.intersect = function (point) {
    log.info('Pill intersect', node, { radius, point });
    const pos = intersect.rect(node, point);
    const y = pos.y - (node.y ?? 0);
    if (
      ry != 0 &&
      (Math.abs(y) < (node.height ?? 0) / 2 ||
        (Math.abs(y) == (node.height ?? 0) / 2 &&
          Math.abs(pos.x - (node.x ?? 0)) > (node.width ?? 0) / 2 - rx))
    ) {
      let x = rx * rx * (1 - (y * y) / (ry * ry));
      if (x != 0) {
        x = Math.sqrt(x);
      }
      x = rx - x;
      if (point.x - (node.x ?? 0) > 0) {
        x = -x;
      }

      pos.x += x;
    }
    return pos;
  };

  return shapeSvg;
};