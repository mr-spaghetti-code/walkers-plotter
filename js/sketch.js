// Path repulsion algorithm converted to p5.js
// Original by Jurgen Westerhof 2024, p5.js conversion by Claude

// Configuration parameters
let seed = 'Empty seed is random every run.'; // Empty seed gives random results each run
let size = 90; // Canvas size multiplier (min=10, max=100)
let population = 1; // Multiplier of walker population per area (min=0, max=4)
let pencils = 1; // Number of different colored pencils to use (min=1, max=10)
let drawPencil = 1; // The color to plot (min=1, max=pencils)
let repulsion = 1; // Distance threshold for repulsion (min=1, max=2)
let dropoffRate = 0; // Rate at which paths are removed based on position (min=0, max=1)
let dropoffDirection = 'none'; // Direction of dropoff gradient: none, x-positive, x-negative, y-positive, y-negative, radial
let maxTurnDeg = 180; // Maximum turn angle in degrees (default 180, max 270)
let lineStyle = 'solid'; // Default line style
let hatchingType = 'none'; // Default hatching type
let hatchingDensity = 5; // Default hatching density
let colorMode = 'direction'; // New parameter: 'single', 'direction' or 'position'
let color1 = '#B8E0FF'; // Default color 1 (light pastel blue)
let color2 = '#6EAED5'; // Default color 2 (dark pastel blue)
let color3 = '#FFCBA4'; // Default color 3 (pastel orange)
let bgColor = '#FFFFFF'; // Default background color (white)
let paperFormat = 'square'; // Default paper format: 'square', 'letter-h', or 'letter-v'

// Paper format dimensions in inches (width, height)
const PAPER_FORMATS = {
  'square': [8.5, 8.5],
  'letter-h': [11, 8.5],
  'letter-v': [8.5, 11]
};

// DPI for conversion to pixels
const DPI = 96; // Standard screen DPI

// Canvas dimensions
let canvasWidth = 800;
let canvasHeight = 800;

// Constants
const MODE_INACTIVE = 0;
const MODE_NORMAL = 1;
const MODE_REVERSE = 2;

// Global variables
let config;
let walkerScene;
let walkerPaths = []; // Array to store paths for each walker
let walkerColors = []; // Array to store colors for each walker
let density = 0; // Value for hatching density
let pg; // Graphics buffer for hatching

let frameCounter = 0; // Add a frame counter
const maxFrames = 5000; // Set a maximum number of frames

// HTML Elements (for controls)
let seedInput, sizeSlider, populationSlider, pencilsSlider, drawPencilSlider, repulsionSlider;
let sizeValueSpan, populationValueSpan, pencilsValueSpan, drawPencilValueSpan, repulsionValueSpan;
let redrawButton;
let maxTurnSlider; // Add variable for the new slider
let maxTurnValueSpan; // Add variable for the new value span
let dropoffRateSlider; // Add variable for dropoff rate slider
let dropoffRateValueSpan; // Add variable for dropoff rate value span
let dropoffDirectionSelect; // Add variable for dropoff direction dropdown
let lineStyleSelect; // For line style
let hatchingTypeSelect; // For hatching type
let hatchingDensitySlider; // For hatching density
let hatchingDensityValueSpan; // For hatching density display
let exportSVGButton; // For SVG export
let colorModeSelect; // New control for color mode
let color1Picker, color2Picker, color3Picker; // Color pickers
let bgColorPicker; // Background color picker
let paperFormatSelect; // Paper format selector

function setup() {
  // Calculate canvas dimensions based on paper format
  updateCanvasSize();
  
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent('canvas-container'); // Place canvas inside the element with ID 'canvas-container'
  noFill();
  strokeWeight(1.5);
  
  // Create a graphics buffer for hatching
  pg = createGraphics(canvasWidth, canvasHeight);
  pg.noFill();
  pg.strokeWeight(1);
  
  // --- Get HTML elements --- 
  seedInput = select('#seed');
  sizeSlider = select('#size');
  populationSlider = select('#population');
  pencilsSlider = select('#pencils');
  drawPencilSlider = select('#drawPencil');
  repulsionSlider = select('#repulsion');
  maxTurnSlider = select('#maxTurn'); // Get the new slider element
  dropoffRateSlider = select('#dropoffRate'); // Get the dropoff rate slider
  dropoffDirectionSelect = select('#dropoffDirection'); // Get the dropoff direction dropdown
  
  sizeValueSpan = select('#size-value');
  populationValueSpan = select('#population-value');
  pencilsValueSpan = select('#pencils-value');
  drawPencilValueSpan = select('#drawPencil-value');
  repulsionValueSpan = select('#repulsion-value');
  maxTurnValueSpan = select('#maxTurn-value'); // Get the new value span element
  dropoffRateValueSpan = select('#dropoffRate-value'); // Get the dropoff rate value span
  
  lineStyleSelect = select('#lineStyle');
  hatchingTypeSelect = select('#hatchingType');
  hatchingDensitySlider = select('#hatchingDensity');
  hatchingDensityValueSpan = select('#hatchingDensity-value');
  colorModeSelect = select('#colorMode'); // Get the new color mode select
  color1Picker = select('#color1'); // Get color1 picker
  color2Picker = select('#color2'); // Get color2 picker
  color3Picker = select('#color3'); // Get color3 picker
  bgColorPicker = select('#bgColor'); // Get background color picker
  paperFormatSelect = select('#paperFormat'); // Get paper format selector
  
  exportSVGButton = select('#exportSVG');
  redrawButton = select('#redrawButton');
  
  // --- Add event listeners --- 
  seedInput.input(updateValueDisplays);
  sizeSlider.input(updateValueDisplays);
  populationSlider.input(updateValueDisplays);
  pencilsSlider.input(updateValueDisplays);
  drawPencilSlider.input(updateValueDisplays);
  repulsionSlider.input(updateValueDisplays);
  maxTurnSlider.input(updateValueDisplays); // Add event listener for new slider display
  dropoffRateSlider.input(updateValueDisplays); // Add event listener for dropoff rate display
  hatchingDensitySlider.input(updateValueDisplays); // Add event listener for hatching density display
  
  // Redraw on button click OR any slider input change (more interactive)
  redrawButton.mousePressed(resetSketch);
  sizeSlider.changed(resetSketch);
  populationSlider.changed(resetSketch);
  pencilsSlider.changed(resetSketch);
  drawPencilSlider.changed(resetSketch);
  repulsionSlider.changed(resetSketch);
  maxTurnSlider.changed(resetSketch); // Add event listener for new slider redraw
  dropoffRateSlider.changed(resetSketch); // Add event listener for dropoff rate redraw
  dropoffDirectionSelect.changed(resetSketch); // Add event listener for dropoff direction change
  lineStyleSelect.changed(resetSketch); // Add event listener for line style change
  hatchingTypeSelect.changed(resetSketch); // Add event listener for hatching type change
  hatchingDensitySlider.changed(resetSketch); // Add event listener for hatching density change
  colorModeSelect.changed(resetSketch); // Add event listener for color mode change
  color1Picker.changed(resetSketch); // Add event listener for color1 change
  color2Picker.changed(resetSketch); // Add event listener for color2 change
  color3Picker.changed(resetSketch); // Add event listener for color3 change
  bgColorPicker.changed(updateBackground); // Add event listener for background color change
  paperFormatSelect.changed(changePaperFormat); // Add event listener for paper format change
  
  // Export SVG functionality
  exportSVGButton.mousePressed(exportSVG);
  
  // Redraw on seed change only when button is pressed or input loses focus (less disruptive)
  seedInput.changed(resetSketch); 
  
  // --- Initial setup --- 
  updateValueDisplays(); // Set initial span values
  resetSketch(); // Run initial simulation setup
}

// Function to update canvas dimensions based on paper format
function updateCanvasSize() {
  paperFormat = paperFormatSelect ? paperFormatSelect.value() : 'square';
  
  // Get dimensions in inches
  const dimensions = PAPER_FORMATS[paperFormat];
  
  // Convert to pixels (with a max size of 800px for the largest dimension)
  const maxDimension = Math.max(dimensions[0], dimensions[1]);
  const scale = 800 / (maxDimension * DPI);
  
  canvasWidth = Math.round(dimensions[0] * DPI * scale);
  canvasHeight = Math.round(dimensions[1] * DPI * scale);
  
  // Resize canvas if it already exists
  if (pg) {
    resizeCanvas(canvasWidth, canvasHeight);
    pg.resizeCanvas(canvasWidth, canvasHeight);
  }
}

// Handler for paper format change
function changePaperFormat() {
  paperFormat = paperFormatSelect.value();
  updateCanvasSize();
  resetSketch();
}

function draw() {
  // Run multiple simulation steps per frame for better performance
  for (let steps = 0; steps < 10; steps++) {
    walkerScene.step();
  }
  
  // Clear canvas and redraw all paths
  background(bgColor); // Set background to selected background color
  
  if (hatchingType !== 'none') {
    drawHatching();
  }
  
  // Draw each walker's path with its assigned color
  for (let i = 0; i < walkerScene.walkers.length; i++) {
    const walker = walkerScene.walkers[i];
    
    // In the original code, we only draw paths from walkers in the selected channel
    // Now we'll draw all paths but with different colors based on colorMode
    if (colorMode === 'single') {
      // Original behavior - only draw selected channel with one color
      if (walker.channel === config.drawChannel) {
        stroke(walkerColors[walker.channel]);
        drawPath(walkerPaths[i]);
      }
    } else {
      // Draw all paths with their individual colors
      stroke(walker.color);
      drawPath(walkerPaths[i]);
    }
  }

  // Check if walkers are active, mirroring TurtleToy's walk() loop condition
  if (!walkerScene.hasActive()) {
    noLoop(); // Stop animation when all walkers are inactive
    console.log("Simulation complete");
    return;
  }
}

// Draw hatching patterns
function drawHatching() {
  pg.clear(); // Clear graphics buffer
  pg.stroke(0);
  
  // Get the min and max coordinates from paths to define boundaries
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < walkerScene.walkers.length; i++) {
    const walker = walkerScene.walkers[i];
    if (walker.channel === config.drawChannel) {
      for (let j = 0; j < walkerPaths[i].length; j++) {
        const pt = walkerPaths[i][j];
        if (pt === null) continue;
        const screenX = map(pt[0], -config.size, config.size, 0, width);
        const screenY = map(pt[1], -config.size, config.size, 0, height);
        minX = min(minX, screenX);
        minY = min(minY, screenY);
        maxX = max(maxX, screenX);
        maxY = max(maxY, screenY);
      }
    }
  }
  
  // Add padding
  minX = max(0, minX - 20);
  minY = max(0, minY - 20);
  maxX = min(width, maxX + 20);
  maxY = min(height, maxY + 20);
  
  // Get the density spacing
  const spacing = hatchingDensity * 5;
  
  // Apply different hatching patterns
  switch (hatchingType) {
    case 'parallel':
      // Draw parallel hatching
      for (let y = minY; y <= maxY; y += spacing) {
        pg.line(minX, y, maxX, y);
      }
      break;
    case 'cross':
      // Draw cross-hatching
      for (let y = minY; y <= maxY; y += spacing) {
        pg.line(minX, y, maxX, y);
      }
      for (let x = minX; x <= maxX; x += spacing) {
        pg.line(x, minY, x, maxY);
      }
      break;
    case 'radial':
      // Draw radial hatching from center
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const maxRadius = dist(centerX, centerY, maxX, maxY);
      for (let r = spacing; r <= maxRadius; r += spacing) {
        pg.ellipse(centerX, centerY, r * 2);
      }
      for (let a = 0; a < TWO_PI; a += TWO_PI / (12 + hatchingDensity)) {
        const x1 = centerX + cos(a) * 10;
        const y1 = centerY + sin(a) * 10;
        const x2 = centerX + cos(a) * maxRadius;
        const y2 = centerY + sin(a) * maxRadius;
        pg.line(x1, y1, x2, y2);
      }
      break;
  }
  
  // Draw the hatching
  image(pg, 0, 0);
}

// Draw a path as a connected line with selected style
function drawPath(path) {
  if (path.length < 1) return;
  
  // For solid lines, use the original drawing method
  if (lineStyle === 'solid') {
    let shapeStarted = false; // Track if beginShape() has been called for the current segment
    for (let i = 0; i < path.length; i++) {
      const pt = path[i];
      
      if (pt === null) {
        if (shapeStarted) {
          endShape();
          shapeStarted = false;
        }
        continue; // Skip the null marker
      }
      
      // If starting a new shape (first point or after a null)
      if (!shapeStarted) {
        beginShape();
        shapeStarted = true;
      }
      
      const screenX = map(pt[0], -config.size, config.size, 0, width);
      const screenY = map(pt[1], -config.size, config.size, 0, height);
      vertex(screenX, screenY);
    }
    
    // End the last shape if it was started
    if (shapeStarted) {
      endShape();
    }
  } 
  // For dashed or dotted lines, draw line segments
  else {
    let currentPath = [];
    
    // First collect all the points for the current segment
    for (let i = 0; i < path.length; i++) {
      const pt = path[i];
      
      if (pt === null) {
        if (currentPath.length > 1) {
          drawStyledPath(currentPath);
        }
        currentPath = [];
        continue;
      }
      
      const screenX = map(pt[0], -config.size, config.size, 0, width);
      const screenY = map(pt[1], -config.size, config.size, 0, height);
      currentPath.push([screenX, screenY]);
    }
    
    // Draw any remaining path
    if (currentPath.length > 1) {
      drawStyledPath(currentPath);
    }
  }
}

// Helper function to draw dashed or dotted lines
function drawStyledPath(points) {
  if (points.length < 2) return;
  
  // Parameters for dashed/dotted lines
  let dashLength = 10;
  let gapLength = 5;
  
  if (lineStyle === 'dotted') {
    dashLength = 2;
    gapLength = 8;
  }
  
  let totalLength = 0;
  let segmentLengths = [];
  
  // Calculate the total path length and individual segment lengths
  for (let i = 1; i < points.length; i++) {
    const prev = points[i-1];
    const current = points[i];
    const segLength = dist(prev[0], prev[1], current[0], current[1]);
    segmentLengths.push(segLength);
    totalLength += segLength;
  }
  
  // Draw the styled path
  let distanceTraveled = 0;
  let drawing = true; // Start with drawing a dash
  let dashStart = 0;
  let remainingDash = dashLength;
  
  for (let i = 0; i < segmentLengths.length; i++) {
    const segLength = segmentLengths[i];
    const p1 = points[i];
    const p2 = points[i+1];
    
    let segmentStart = 0;
    
    while (segmentStart < segLength) {
      if (drawing) {
        // Drawing a dash
        const dashEnd = min(segLength, segmentStart + remainingDash);
        const t1 = segmentStart / segLength;
        const t2 = dashEnd / segLength;
        
        const x1 = lerp(p1[0], p2[0], t1);
        const y1 = lerp(p1[1], p2[1], t1);
        const x2 = lerp(p1[0], p2[0], t2);
        const y2 = lerp(p1[1], p2[1], t2);
        
        line(x1, y1, x2, y2);
        
        remainingDash -= (dashEnd - segmentStart);
        segmentStart = dashEnd;
        
        if (remainingDash <= 0) {
          drawing = false;
          remainingDash = gapLength;
        }
      } else {
        // Creating a gap
        const gapEnd = min(segLength, segmentStart + remainingDash);
        segmentStart = gapEnd;
        remainingDash -= (gapEnd - segmentStart);
        
        if (remainingDash <= 0) {
          drawing = true;
          remainingDash = dashLength;
        }
      }
    }
    
    // Adjust remaining dash/gap for the next segment
    if (segmentStart >= segLength) {
      remainingDash = abs(remainingDash);
    }
  }
}

// Modified exportSVG function to handle multiple colors as layers in a single SVG file
function exportSVG() {
  // Get paper dimensions in inches
  const dimensions = PAPER_FORMATS[paperFormat];
  const svgWidth = dimensions[0] * DPI;  // Convert inches to pixels
  const svgHeight = dimensions[1] * DPI;
  
  // Get the current timestamp for filename
  const timestamp = Date.now();
  
  // Create a single SVG with all color groups as layers
  let svgContent = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n';
  svgContent += `<svg width="${svgWidth}px" height="${svgHeight}px" viewBox="0 0 ${canvasWidth} ${canvasHeight}" xmlns="http://www.w3.org/2000/svg">\n`;
  svgContent += `<rect width="${canvasWidth}" height="${canvasHeight}" fill="white"/>\n`;
  
  // Add hatching if active
  if (hatchingType !== 'none') {
    svgContent += `<g id="hatching" class="hatching-layer">\n`;
    // Add hatching paths based on the type
    const spacing = hatchingDensity * 5;
    
    switch (hatchingType) {
      case 'parallel':
        for (let y = 0; y <= height; y += spacing) {
          svgContent += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="black" stroke-width="0.5"/>\n`;
        }
        break;
      case 'cross':
        for (let y = 0; y <= height; y += spacing) {
          svgContent += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="black" stroke-width="0.5"/>\n`;
        }
        for (let x = 0; x <= width; x += spacing) {
          svgContent += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="black" stroke-width="0.5"/>\n`;
        }
        break;
      case 'radial':
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = dist(centerX, centerY, width, height);
        for (let r = spacing; r <= maxRadius; r += spacing) {
          svgContent += `<circle cx="${centerX}" cy="${centerY}" r="${r}" stroke="black" fill="none" stroke-width="0.5"/>\n`;
        }
        for (let a = 0; a < TWO_PI; a += TWO_PI / (12 + hatchingDensity)) {
          const x1 = centerX + cos(a) * 10;
          const y1 = centerY + sin(a) * 10;
          const x2 = centerX + cos(a) * maxRadius;
          const y2 = centerY + sin(a) * maxRadius;
          svgContent += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black" stroke-width="0.5"/>\n`;
        }
        break;
    }
    svgContent += `</g>\n`;
  }
  
  // Get color names and values for layer names
  const colorNames = {
    1: color1.toUpperCase(),
    2: color2.toUpperCase(),
    3: color3.toUpperCase()
  };
  
  // Create a layer for each color group (now 3 groups)
  for (let colorGroup = 1; colorGroup <= 3; colorGroup++) {
    // Extract RGB components of this color for naming
    let colorValue = colorGroup === 1 ? color1 : (colorGroup === 2 ? color2 : color3);
    
    // Start a group (layer) for this color
    svgContent += `<g id="${colorGroup}_color" class="color-layer" data-color="${colorNames[colorGroup]}">\n`;
    
    // Add path data only for walkers in the current color group
    for (let i = 0; i < walkerScene.walkers.length; i++) {
      const walker = walkerScene.walkers[i];
      
      // Skip walkers that don't match the current color group
      if (walker.colorGroup !== colorGroup) {
        continue;
      }
      
      const path = walkerPaths[i];
      if (path.length < 2) continue;
      
      // Convert walker.color to SVG color format
      let strokeColor = "black";
      if (walker.color) {
        // Extract RGB components
        let r = red(walker.color);
        let g = green(walker.color);
        let b = blue(walker.color);
        strokeColor = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
      }
      
      let pathSegments = [];
      let currentSegment = [];
      
      // Split the path at null points into separate segments
      for (let j = 0; j < path.length; j++) {
        const pt = path[j];
        if (pt === null) {
          if (currentSegment.length > 0) {
            pathSegments.push(currentSegment);
            currentSegment = [];
          }
        } else {
          const screenX = map(pt[0], -config.size, config.size, 0, canvasWidth);
          const screenY = map(pt[1], -config.size, config.size, 0, canvasHeight);
          currentSegment.push([screenX, screenY]);
        }
      }
      
      if (currentSegment.length > 0) {
        pathSegments.push(currentSegment);
      }
      
      // Convert each segment to SVG path or line elements
      for (let segment of pathSegments) {
        if (segment.length < 2) continue;
        
        if (lineStyle === 'solid') {
          // Create a path element for solid lines
          let pathData = `M${segment[0][0]},${segment[0][1]}`;
          for (let j = 1; j < segment.length; j++) {
            pathData += ` L${segment[j][0]},${segment[j][1]}`;
          }
          svgContent += `<path d="${pathData}" stroke="${strokeColor}" fill="none" stroke-width="1.5"/>\n`;
        } else {
          // Create dash or dot pattern
          let dashArray = lineStyle === 'dashed' ? '10,5' : '2,8';
          let pathData = `M${segment[0][0]},${segment[0][1]}`;
          for (let j = 1; j < segment.length; j++) {
            pathData += ` L${segment[j][0]},${segment[j][1]}`;
          }
          svgContent += `<path d="${pathData}" stroke="${strokeColor}" fill="none" stroke-width="1.5" stroke-dasharray="${dashArray}"/>\n`;
        }
      }
    }
    
    // End the group for this color
    svgContent += `</g>\n`;
  }
  
  svgContent += '</svg>';
  
  // Create a download link for the single SVG with all layers
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `walker-plot-${paperFormat}-${timestamp}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Walker class represents an agent that navigates the space
class Walker {
  constructor(position, direction, maxTurn, turnResolution = Math.PI / 360) {
    this.p = position;
    this.d = direction;
    this.mt = maxTurn;
    this.tr = turnResolution;
    this.mode = MODE_NORMAL;
    this.startPosition = position.map(v => v);
    this.otherDirection = V.scale(direction, -1);
    
    this.turnPreference = random() < 0.5 ? 1 : -1;
    this.channel = floor(random(config.channels)) + 1;
  }
  
  step(scene) {
    if (this.mode === MODE_INACTIVE) return;
    
    // Store the current position for the path *before* calculating the next step
    let walkerIndex = scene.walkers.indexOf(this);
    if (walkerIndex >= 0) {
      walkerPaths[walkerIndex].push([...this.p]);
    }
    
    function tryCandidates(p, d, maxTurn, turnResolution, tp) {
      for (let sign = 1; sign >= -1; sign -= 2) {
        for (let t = 0; t <= maxTurn; t += turnResolution) {
          const rotatedD = V.trans(V.rot2d(tp * sign * t), d);
          const candidateP = V.add(p, rotatedD);
          if (!scene.proximityToRegistered(candidateP, p, config.repulsion)) {
            return [candidateP, rotatedD];
          }
        }
      }
      return false;
    }
    
    const candidateP_RotatedD = tryCandidates(this.p, this.d, this.mt, this.tr, this.turnPreference);
    
    if (candidateP_RotatedD === false) {
      if (this.mode == MODE_REVERSE) {
        this.mode = MODE_INACTIVE;
        if (walkerIndex >= 0) {
          walkerPaths[walkerIndex].push(null);
        }
        return;
      }
      this.p = [...this.startPosition];
      this.d = [...this.otherDirection];
      this.mode = MODE_REVERSE;
      if (walkerIndex >= 0) {
        walkerPaths[walkerIndex].push(null);
      }
      return;
    }
    
    this.p = candidateP_RotatedD[0];
    this.d = candidateP_RotatedD[1];
    scene.registerPoint(this.p);
  }
}

// WalkerScene class manages all walkers and the spatial grid
class WalkerScene {
  constructor(s, binSize = 2) {
    this.walkers = [];
    this.s = s;
    this.binSize = binSize;
    this.bins = [];
    
    // Initialize the spatial binning grid
    for (let x = -120; x <= 120; x++) {
      const xBin = (x / binSize) | 0;
      if (this.bins[xBin] == undefined) this.bins[xBin] = [];
      for (let y = -120; y <= 120; y++) {
        const yBin = (y / binSize) | 0;
        if (this.bins[xBin][yBin] == undefined) this.bins[xBin][yBin] = [];
      }
    }
  }
  
  addWalker(walker) {
    this.walkers.push(walker);
    this.registerPoint(walker.p);
  }
  
  registerPoint(point) {
    const xBin = (point[0] / this.binSize) | 0;
    const yBin = (point[1] / this.binSize) | 0;
    
    // Register point in current bin and all adjacent bins (TurtleToy logic)
    // Assumes bins are initialized and exist within bounds
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        // Simplified check, assumes dx/dy offsets are valid within pre-initialized range
        // This mirrors the direct indexing in TurtleToy's registerPoint
        const currentBin = this.bins[xBin + dx]?.[yBin + dy];
        if (currentBin) { // Basic check if the bin array exists
          currentBin.push(point.map(v => v));
        }
      }
    }
  }
  
  proximityToRegistered(p, excluding, threshold = 1) {
    // Check if point is outside canvas boundaries
    if (p[0] < -this.s || p[0] > this.s || p[1] < -this.s || p[1] > this.s) return true;
    
    const thresholdSq = threshold * threshold;
    const xBin = (p[0] / this.binSize) | 0;
    const yBin = (p[1] / this.binSize) | 0;
    
    // Check proximity within the specific bin (TurtleToy logic)
    // Assumes bin exists from initialization
    for (let i = 0; i < this.bins[xBin][yBin].length; i++) {
      if (V.equals(this.bins[xBin][yBin][i], excluding)) continue;
      if (V.lenSq(V.sub(this.bins[xBin][yBin][i], p)) < thresholdSq) return true;
    }
    return false;
  }
  
  step() {
    this.walkers.forEach(walker => walker.step(this));
  }
  
  hasActive() {
    return this.walkers.some(w => w.mode !== MODE_INACTIVE);
  }
}

// Vector math library (simplified version of original)
const V = {
  // Basic vector operations
  add: (a, b) => a.map((v, i) => v + b[i]),
  sub: (a, b) => a.map((v, i) => v - b[i]),
  scale: (a, s) => a.map(v => v * s),
  
  // Vector utilities
  equals: (a, b) => !a.some((e, i) => e != b[i]),
  len: (a) => Math.sqrt(a.reduce((sum, v) => sum + v * v, 0)),
  lenSq: (a) => a.reduce((sum, v) => sum + v * v, 0),
  norm: (a) => {
    const len = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
    return a.map(v => v / len);
  },
  
  // 2D rotation and transformation
  rot2d: (angle) => [
    [Math.cos(angle), -Math.sin(angle)],
    [Math.sin(angle), Math.cos(angle)]
  ],
  trans: (matrix, a) => a.map((v, i) => 
    a.reduce((acc, cur, ci) => acc + cur * matrix[ci][i], 0)
  )
};

// Add a hash code function to String (for random seed)
String.prototype.hashCode = function() {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

// UI Controls (optional, uncomment to add interactive controls)
/*
function keyPressed() {
  if (key === '1' || key === '2' || key === '3' || key === '4' || key === '5') {
    config.drawChannel = parseInt(key);
    // Limit to available channels
    config.drawChannel = Math.min(config.drawChannel, config.channels);
  }
}
*/

function updateValueDisplays() {
  sizeValueSpan.html(sizeSlider.value());
  populationValueSpan.html(nf(populationSlider.value(), 1, 2));
  pencilsValueSpan.html(pencilsSlider.value());
  drawPencilValueSpan.html(drawPencilSlider.value());
  repulsionValueSpan.html(nf(repulsionSlider.value(), 1, 2));
  maxTurnValueSpan.html(maxTurnSlider.value());
  dropoffRateValueSpan.html(nf(dropoffRateSlider.value(), 1, 2));
  hatchingDensityValueSpan.html(hatchingDensitySlider.value());

  // Fix pencils at 1 by disabling the input
  pencilsSlider.value(1);
  pencilsValueSpan.html("1");
  pencilsSlider.attribute('disabled', '');

  // Adjust drawPencil max based on pencils value
  drawPencilSlider.elt.max = pencilsSlider.value(); 
  // Ensure current drawPencil value is not greater than the new max
  if (parseInt(drawPencilSlider.value()) > parseInt(pencilsSlider.value())) {
     drawPencilSlider.value(pencilsSlider.value());
     drawPencilValueSpan.html(pencilsSlider.value());
  }
}

function resetSketch() {
  console.log("Resetting sketch...");
  let seed = seedInput.value();
  let size = parseInt(sizeSlider.value());
  let population = parseFloat(populationSlider.value());
  let pencils = 1; // Fix pencils at 1
  let drawPencil = 1; // Fix drawPencil at 1 since we only have one pencil
  let repulsion = parseFloat(repulsionSlider.value());
  let maxTurnDeg = parseInt(maxTurnSlider.value()); // Get max turn value in degrees
  let dropoffRate = parseFloat(dropoffRateSlider.value()); // Get dropoff rate value
  let dropoffDirection = dropoffDirectionSelect.value(); // Get dropoff direction value
  lineStyle = lineStyleSelect.value(); // Get line style
  hatchingType = hatchingTypeSelect.value(); // Get hatching type
  hatchingDensity = parseInt(hatchingDensitySlider.value()); // Get hatching density
  colorMode = colorModeSelect.value(); // Get the color mode
  color1 = color1Picker.value(); // Get color1
  color2 = color2Picker.value(); // Get color2
  color3 = color3Picker.value(); // Get color3
  bgColor = bgColorPicker.value(); // Get background color

  // Initialize random seed
  if (seed === '' || seed === 'Empty seed is random.') {
    seed = Date.now().toString();
  }
  randomSeed(seed.hashCode());
  
  // Configure settings
  config = {
    populationMultiplier: population * population,
    channels: pencils,
    drawChannel: 1, // Fixed at 1
    size: size,
    repulsion: repulsion,
    maxTurn: radians(maxTurnDeg), // Convert degrees to radians and store in config
    dropoffRate: dropoffRate, // Store dropoff rate in config
    dropoffDirection: dropoffDirection // Store dropoff direction in config
  };
  
  // Calculate actual canvas dimensions
  const canvasSize = size * 2;
  
  // Initialize the walker scene
  walkerScene = new WalkerScene(config.size, 2);
  
  // Reset paths
  walkerPaths = [];
  
  // Generate walkers
  const totalWalkers = config.populationMultiplier * config.size * config.size / 10;
  for (let i = 0; i < totalWalkers; i++) {
    // Create a new position and direction
    let newPos = [
      random(-config.size, config.size),
      random(-config.size, config.size)
    ];
    
    let newDir = [
      random(-0.5, 0.5),
      random(-0.5, 0.5)
    ];
    newDir = V.scale(V.norm(newDir), 1);
    
    // Create a new walker, passing config.maxTurn
    let walker = new Walker(newPos, newDir, config.maxTurn);
    
    // Apply dropoff based on starting position if dropoff rate > 0 and direction is not 'none'
    if (config.dropoffRate > 0 && config.dropoffDirection !== 'none') {
      let dropoffProbability = 0;
      
      // Calculate probability based on walker's starting position and dropoff direction
      switch (config.dropoffDirection) {
        case 'x-positive': // Left to right (higher probability on right)
          dropoffProbability = map(newPos[0], -config.size, config.size, 0, config.dropoffRate);
          break;
        case 'x-negative': // Right to left (higher probability on left)
          dropoffProbability = map(newPos[0], config.size, -config.size, 0, config.dropoffRate);
          break;
        case 'y-positive': // Top to bottom (higher probability on bottom)
          dropoffProbability = map(newPos[1], -config.size, config.size, 0, config.dropoffRate);
          break;
        case 'y-negative': // Bottom to top (higher probability on top)
          dropoffProbability = map(newPos[1], config.size, -config.size, 0, config.dropoffRate);
          break;
        case 'radial': // Center outward (higher probability at edges)
          let distanceFromCenter = dist(newPos[0], newPos[1], 0, 0);
          let maxDistance = sqrt(2 * config.size * config.size); // Distance to corner
          dropoffProbability = map(distanceFromCenter, 0, maxDistance, 0, config.dropoffRate);
          break;
      }
      
      // Randomly remove walker based on calculated probability
      if (random() < dropoffProbability) {
        // Skip this walker
        continue;
      }
    }
    
    // Assign a color to the walker based on colorMode
    if (colorMode === 'single') {
      walker.color = color(color1); // Use color1 for single color mode
      walker.colorGroup = 1; // Mark as color group 1
    } else if (colorMode === 'direction' || colorMode === 'position') {
      // Determine which color to use based on a property
      let colorChoice;
      
      if (colorMode === 'direction') {
        // Color based on direction (divided into three segments)
        let angle = atan2(newDir[1], newDir[0]);
        // Map angle from [-PI, PI] to [0, 3]
        colorChoice = floor(map(angle, -PI, PI, 0, 3));
      } else { // position
        // Color based on position in the canvas (three segments)
        // Divide into three regions based on angle from center
        let angle = atan2(newPos[1], newPos[0]);
        colorChoice = floor(map(angle, -PI, PI, 0, 3));
      }
      
      // Assign color based on the choice (0, 1, or 2)
      if (colorChoice === 0) {
        walker.color = color(color1);
        walker.colorGroup = 1;
      } else if (colorChoice === 1) {
        walker.color = color(color2);
        walker.colorGroup = 2;
      } else {
        walker.color = color(color3);
        walker.colorGroup = 3;
      }
    }
    
    // Add walker to the scene
    walkerScene.addWalker(walker);
    
    // Initialize an empty path array for this walker
    walkerPaths.push([]);
  }
  
  background(bgColor); // Clear background with selected background color
  console.log("Sketch reset complete. Starting loop.");
  loop(); // Ensure the draw loop is running
}

function updateBackground() {
  bgColor = bgColorPicker.value();
  draw(); // Redraw with new background
}