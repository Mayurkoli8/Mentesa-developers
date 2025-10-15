class BackgroundAnimation {
    constructor() {
        this.svg = document.querySelector('.lines');
        this.lines = [];
        this.init();
    }

    init() {
        // Add SVG filter for glow effect
        this.createGlowFilter();
        this.createCircuitLines();
        this.createCornerLines();
    }

    createGlowFilter() {
        const svgNS = "http://www.w3.org/2000/svg";
        const defs = document.createElementNS(svgNS, "defs");
        
        // Create stronger glow filter for dots
        const dotFilter = document.createElementNS(svgNS, "filter");
        dotFilter.setAttribute("id", "dotGlow");
        dotFilter.innerHTML = `
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        `;
        
        // Create regular glow filter for lines
        const lineFilter = document.createElementNS(svgNS, "filter");
        lineFilter.setAttribute("id", "lineGlow");
        lineFilter.innerHTML = `
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        `;
        
        defs.appendChild(dotFilter);
        defs.appendChild(lineFilter);
        this.svg.appendChild(defs);
    }

    createCircuitLines() {
        const svgNS = "http://www.w3.org/2000/svg";
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        for (let i = 0; i < 6; i++) {
            const group = document.createElementNS(svgNS, "g");
            const pathGlow = document.createElementNS(svgNS, "path");
            const path = document.createElementNS(svgNS, "path");
            const dot = document.createElementNS(svgNS, "circle");
            const dotGlow = document.createElementNS(svgNS, "circle");
            
            const color = i % 2 === 0 ? "#00FFFF" : "#FF00FF";
            
            // Glow path
            pathGlow.setAttribute("stroke", color);
            pathGlow.setAttribute("stroke-width", "4");
            pathGlow.setAttribute("fill", "none");
            pathGlow.setAttribute("filter", "url(#lineGlow)");
            pathGlow.setAttribute("opacity", "0.5");
            
            // Main path
            path.setAttribute("stroke", color);
            path.setAttribute("stroke-width", "2");
            path.setAttribute("fill", "none");
            
            // Glow dot - enhanced with stronger glow
            dotGlow.setAttribute("r", "5");
            dotGlow.setAttribute("fill", color);
            dotGlow.setAttribute("filter", "url(#dotGlow)");
            dotGlow.setAttribute("opacity", "0.8");
            
            // Main dot - slightly larger
            dot.setAttribute("r", "3.5");
            dot.setAttribute("fill", color);
            
            group.appendChild(pathGlow);
            group.appendChild(path);
            group.appendChild(dotGlow);
            group.appendChild(dot);
            this.svg.appendChild(group);
            
            const segments = this.generateSegments(width, height);
            
            this.lines.push({
                group,
                path,
                pathGlow,
                dot,
                dotGlow,
                segments,
                currentSegment: 0,
                progress: 0,
                color,
                trailSegments: [] // Store trail segments for fading effect
            });
            
            this.animateLine(this.lines[i]);
        }
    }

    generateSegments(width, height) {
        const segments = [];
        let x = Math.random() * width;
        let y = Math.random() * height;
        let isHorizontal = Math.random() > 0.5;
        
        for (let i = 0; i < 3; i++) {
            const length = 100 + Math.random() * 150;
            const segment = {
                startX: x,
                startY: y,
                endX: x + (isHorizontal ? length : 0),
                endY: y + (isHorizontal ? 0 : length),
                length
            };
            
            x = segment.endX;
            y = segment.endY;
            isHorizontal = !isHorizontal;
            
            segments.push(segment);
        }
        
        return segments;
    }

    animateLine(line) {
        // Create trail segments for fading effect
        const createTrailSegment = (x1, y1, x2, y2, opacity = 1) => {
            const svgNS = "http://www.w3.org/2000/svg";
            const trailPath = document.createElementNS(svgNS, "path");
            const trailPathGlow = document.createElementNS(svgNS, "path");
            
            // Trail path
            trailPath.setAttribute("stroke", line.color);
            trailPath.setAttribute("stroke-width", "2");
            trailPath.setAttribute("fill", "none");
            trailPath.setAttribute("opacity", opacity);
            trailPath.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2}`);
            
            // Trail glow path
            trailPathGlow.setAttribute("stroke", line.color);
            trailPathGlow.setAttribute("stroke-width", "4");
            trailPathGlow.setAttribute("fill", "none");
            trailPathGlow.setAttribute("filter", "url(#lineGlow)");
            trailPathGlow.setAttribute("opacity", opacity * 0.5);
            trailPathGlow.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2}`);
            
            line.group.appendChild(trailPathGlow);
            line.group.appendChild(trailPath);
            
            return { trailPath, trailPathGlow, opacity };
        };
        
        const animate = () => {
            line.progress += 2;
            
            const segment = line.segments[line.currentSegment];
            const progress = Math.min(1, line.progress / segment.length);
            
            const currentX = segment.startX + (segment.endX - segment.startX) * progress;
            const currentY = segment.startY + (segment.endY - segment.startY) * progress;
            
            // Create trail segment every few frames
            if (line.progress % 10 === 0) {
                const lastX = segment.startX + (segment.endX - segment.startX) * Math.max(0, (line.progress - 10) / segment.length);
                const lastY = segment.startY + (segment.endY - segment.startY) * Math.max(0, (line.progress - 10) / segment.length);
                
                const trailSegment = createTrailSegment(lastX, lastY, currentX, currentY, 1);
                line.trailSegments.push(trailSegment);
                
                // Limit the number of trail segments
                if (line.trailSegments.length > 15) {
                    const oldestSegment = line.trailSegments.shift();
                    line.group.removeChild(oldestSegment.trailPath);
                    line.group.removeChild(oldestSegment.trailPathGlow);
                }
            }
            
            // Fade out trail segments
            line.trailSegments.forEach((trailSegment, index) => {
                const fadeRate = 0.98;
                trailSegment.opacity *= fadeRate;
                
                trailSegment.trailPath.setAttribute("opacity", trailSegment.opacity);
                trailSegment.trailPathGlow.setAttribute("opacity", trailSegment.opacity * 0.5);
            });
            
            // Update both main and glow dots
            line.dot.setAttribute("cx", currentX);
            line.dot.setAttribute("cy", currentY);
            line.dotGlow.setAttribute("cx", currentX);
            line.dotGlow.setAttribute("cy", currentY);
            
            if (progress >= 1) {
                line.progress = 0;
                line.currentSegment++;
                
                // Clear trail segments when moving to a new segment
                line.trailSegments.forEach(trailSegment => {
                    line.group.removeChild(trailSegment.trailPath);
                    line.group.removeChild(trailSegment.trailPathGlow);
                });
                line.trailSegments = [];
                
                if (line.currentSegment >= line.segments.length) {
                    line.segments = this.generateSegments(window.innerWidth, window.innerHeight);
                    line.currentSegment = 0;
                }
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    createCornerLines() {
        const svgNS = "http://www.w3.org/2000/svg";
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Create corner lines for all four corners
        const corners = [
            // Top-left corner
            {
                // First point: 150px to the right of the left corner
                x1: 0, y1: 120,
                // Second point: 150px to the right (horizontal segment)
                x2: 120, y2: 120,
                // Third point: angled down and ending 200px below the corner
                x3: 200, y3: 0,
                color: "#00FFFF"
            },
            // Top-right corner
            {
                // First point: 150px to the left of the right corner
                x1: width, y1: 120,
                // Second point: 150px to the left (horizontal segment)
                x2: width - 120, y2: 120,
                // Third point: angled down and ending 200px below the corner
                x3: width - 200, y3: 0,
                color: "#FF00FF"
            },
            // Bottom-left corner
            {
                // First point: 150px to the right of the left corner
                x1: 0, y1: height - 120,
                // Second point: 150px to the right (horizontal segment)
                x2: 120, y2: height - 120,
                // Third point: angled up and ending 200px up from the corner
                x3: 200, y3: height,
                color: "#FF00FF"
            },
            // Bottom-right corner
            {
                // First point: 150px above the right corner
                x1: width, y1: height - 120,
                // Second point: 150px to the left (horizontal segment)
                x2: width - 120, y2: height - 120,
                // Third point: angled down and ending 200px to the left of corner
                x3: width - 200, y3: height,
                color: "#00FFFF"
            }
        ];
        
        // Process all corners with the same rendering logic
        for (let i = 0; i < corners.length; i++) {
            const corner = corners[i];
            const group = document.createElementNS(svgNS, "g");
            
            // Create the L-shaped path
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", `M ${corner.x1} ${corner.y1} L ${corner.x2} ${corner.y2} L ${corner.x3} ${corner.y3}`);
            path.setAttribute("stroke", corner.color);
            path.setAttribute("stroke-width", "2");
            path.setAttribute("fill", "none");
            
            // Create the glow path
            const glowPath = document.createElementNS(svgNS, "path");
            glowPath.setAttribute("d", `M ${corner.x1} ${corner.y1} L ${corner.x2} ${corner.y2} L ${corner.x3} ${corner.y3}`);
            glowPath.setAttribute("stroke", corner.color);
            glowPath.setAttribute("stroke-width", "4");
            glowPath.setAttribute("fill", "none");
            glowPath.setAttribute("filter", "url(#lineGlow)");
            glowPath.setAttribute("opacity", "0.7");
            
            // Add elements to the group
            group.appendChild(glowPath);
            group.appendChild(path);
            
            this.svg.appendChild(group);
        }
    }
}

window.addEventListener('load', () => {
    // Initialize background animation
    new BackgroundAnimation();

    // --- MOBILE MENU TOGGLE ---
    const toggle = document.getElementById("menu-toggle");
    const nav = document.getElementById("nav-menu");

    toggle.addEventListener("click", () => {
        nav.classList.toggle("show");
    });
});

