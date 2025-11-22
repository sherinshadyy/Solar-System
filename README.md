# Solar-System
# 3D Solar System Project Using Three.js

## Project Description

This project demonstrates a **3D solar system environment** using **Three.js (WebGL)**. The goal is to showcase:

- 3D scene creation and rendering.
- Management of different materials, lighting, and textures.
- User interactivity through **raycasting**, **OrbitControls**, and basic camera movement.
- A visually cohesive solar system theme with planets, rings, and additional 3D objects.

**Objectives:**

1. Render a 3D solar system with the Sun and planets (Mercury → Pluto).
2. Apply multiple materials and textures for visual variety.
3. Enable user interaction:  
   - Orbiting the camera around the scene.
   - Clicking objects to display labels and toggle textures.  
   - Double-clicking objects to toggle visibility.
4. Demonstrate continuous animation (planet rotation and orbiting).

---

## Repository Structure

| File Name                | Description |
|---------------------------|-------------|
| `index.html`              | Main HTML file to load and render the 3D scene. Contains a `<script>` reference to `mainsh.js`. |
| `mainsh.js`               | Core JavaScript file containing all Three.js code: scene initialization, camera, lights, planets, textures, geometries, animations, raycasting, and controls. |
| `sun.jpg`                 | Texture for the Sun. |
| `mercury.jpg`             | Texture for Mercury. |
| `venus.jpg`               | Texture for Venus. |
| `earth.jpg`               | Texture for Earth. |
| `mars.jpg`                | Texture for Mars. |
| `jupiter.jpg`             | Texture for Jupiter. |
| `saturn.jpg`              | Texture for Saturn. |
| `saturnring.png`          | Saturn’s ring texture (transparent PNG). |
| `uranus.jpg`              | Texture for Uranus. |
| `neptune.jpg`             | Texture for Neptune. |
| `pluto.jpg`               | Texture for Pluto. |
| `stars_milky_way.jpg`     | Background texture for the space environment. |
| `README.md`               | This file, containing project description, setup instructions, and file details. |

---

## Project Setup Instructions

Follow these steps to run the project locally:

### 1. Download or Clone Repository
You can either download the ZIP of this repository or clone it using Git:

```bash
git clone https://github.com/sherinshadyy/Solar-System.git

then, right click on the indexsh.html and open with live server.

