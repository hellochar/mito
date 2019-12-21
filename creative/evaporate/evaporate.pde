PGraphics g;
void setup() {
  size(32, 32, P2D);
  g = createGraphics(32, 32, P2D);
}

void draw() {
  g.beginDraw();
  g.background(255, 255, 255, 0);
  g.strokeWeight(4);
  g.stroke(255, 128);
  g.fill(255, 64);
  //g.ellipse(16, 16, 28, 28);
  g.beginShape();
  for (float a = 0; a < 12; a++) {
    float angle = (a + random(-0.1, 0.1)) / 12 * TWO_PI;
    float w2 = map(noise(12 + cos(angle) * 8, 37 + sin(angle) * 8), -0.7, 0.7, 8, 12);
    g.vertex(
      16 + w2 * cos(angle), 16 + w2 * sin(angle)
    );
  }
  g.endShape(CLOSE);
  g.endDraw();
  image(g, 0, 0);
  g.save("energyGive.png");
  noLoop();
}

void mousePressed() {
  loop();
}