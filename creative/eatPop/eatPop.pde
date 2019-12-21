PGraphics g;
void setup() {
  size(32, 32, P2D);
  g = createGraphics(32, 32, P2D);
}

void draw() {
  g.beginDraw();
  g.background(255, 255, 255, 0);
  g.strokeWeight(1);
  g.stroke(255, 64);
  for (float a = 0; a < 9; a++) {
    float angle = (a + random(-0.1, 0.1)) / 9 * TWO_PI;
    float w1 = 12;
    float w2 = 16;
    g.line(
      16 + w1 * cos(angle), 16 + w1 * sin(angle),
      16 + w2 * cos(angle), 16 + w2 * sin(angle)
    );
  }
  g.endDraw();
  image(g, 0, 0);
}