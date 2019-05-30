interface Element {
  mozRequestFullScreen?(): void;
  webkitRequestFullscreen?(): void;
}

interface Document {
  webkitExitFullscreen?(): void;
  mozCancelFullScreen?(): void;
}