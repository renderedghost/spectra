// Convert Color
function hexToHSL(H) {
  let r = 0,
    g = 0,
    b = 0;
  if (H.length == 4) {
    r = parseInt(H[1] + H[1], 16);
    g = parseInt(H[2] + H[2], 16);
    b = parseInt(H[3] + H[3], 16);
  } else if (H.length == 7) {
    r = parseInt(H[1] + H[2], 16);
    g = parseInt(H[3] + H[4], 16);
    b = parseInt(H[5] + H[6], 16);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
}

// Convert HSL to RGB for figma's color object
function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    let hue2rgb = function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r, g, b];
}

// Generate Swatches
function generateLuminanceColors(h, s, steps) {
  const stepSize = 1 / (steps - 1);  // Adjust the step size
  let colors = [];

  for (let i = 0; i < steps; i++) {
    let l = stepSize * i;
    colors.push([h, s, l]);
  }

  return colors;
}

// Create Styles
function createColorStyles(colorName, baseColor, steps) {
  const hsl = hexToHSL(baseColor);
  const colors = generateLuminanceColors(hsl[0], hsl[1], steps);  // Correcting the arguments

  let styles = figma.getLocalPaintStyles();

  colors.forEach((color, index) => {
    try {
      let style = figma.createPaintStyle();
      style.name = `${colorName}/${Math.round(color[2] * 100)}`;  // Adding a percentage representation for the luminance
      const rgb = hslToRgb(color[0], color[1], color[2]);
      style.paints = [
        { type: "SOLID", color: { r: rgb[0], g: rgb[1], b: rgb[2] } },
      ];
      styles.push(style);
    } catch (error) {
      figma.notify(`Error creating color style: ${error.message}`);
    }
  });

  figma.notify("Styles created successfully!");
}

const html = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      /* Your CSS styles go here */
    </style>
  </head>
  <body>
    <label>
      Color Name:
      <input type="text" id="color-name">
    </label>
    <label>
      Base Color:
      <input type="text" id="base-color">
    </label>
    <label>
      Steps:
      <input type="number" id="steps" min="2" max="50" value="12">
    </label>
    <button id="generate-colors">Generate Colors</button>
    <div id="color-preview"></div>
    <script>
      // Your JavaScript functionality goes here
      document.getElementById('generate-colors').addEventListener('click', () => {
        const colorName = document.getElementById('color-name').value;
        const baseColor = document.getElementById('base-color').value;
        const steps = document.getElementById('steps').value;
        parent.postMessage({pluginMessage: {type: 'generate-colors', colorName, baseColor, steps}}, '*');
      });
    </script>
  </body>
</html>
`;

figma.showUI(html, { width: 400, height: 500 });

figma.ui.onmessage = (msg) => {
  if (msg.type === "generate-colors") {
    try {
      createColorStyles(msg.colorName, msg.baseColor, Number(msg.steps));
    } catch (error) {
      figma.notify(`Error generating colors: ${error.message}`);
    }
  }
};