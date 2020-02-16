import { Mito } from "./mito";

export function perfDebugThreeObjects(mito: Mito) {
  // count how many have autoUpdate enabled
  let yes = 0,
    no = 0;
  mito.scene.traverse((o) => {
    if (o.matrixAutoUpdate) {
      yes++;
    } else {
      no++;
    }
  });
  console.log("matrixAutoUpdate: yes", yes, ", no", no);
  // count how many Objects of each type there are
  const s = new Map();
  mito.scene.traverse((o) => {
    const k = s.get(o.name || o.constructor.name) || [];
    s.set(o.name || o.constructor.name, k);
    k.push(o);
  });
  console.log(s);
}
