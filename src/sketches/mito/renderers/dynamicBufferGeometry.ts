import { arrayRange } from "math/arrays";
import { BufferGeometry, Float32BufferAttribute, Vector2, Vector3 } from "three";

type AttributeDescriptor = "vec3" | "vec2" | "float";
interface DescriptorToType {
  vec3: Vector3;
  vec2: Vector2;
  float: number;
}

type CommitObject<T extends string, Map extends Record<T, AttributeDescriptor>> = {
  [K in T]: DescriptorToType[Map[K]];
};

// new DynamicBufferGeometry(10000, {
//   position: Vector3,
//   uv: Vector2,
//   index: "number"
// });

export class DynamicBufferGeometry<T extends string> extends BufferGeometry {
  constructor(public length: number, attributeList: Record<T, AttributeDescriptor>) {
    super();
    let name: T;
    for (name in attributeList) {
      const descriptor: AttributeDescriptor = attributeList[name];
      let attribute: Float32BufferAttribute;
      if (descriptor === "vec3") {
        attribute = new Float32BufferAttribute(arrayRange(3 * length), 3);
      } else if (descriptor === "vec2") {
        attribute = new Float32BufferAttribute(arrayRange(2 * length), 2);
      } else {
        attribute = new Float32BufferAttribute(arrayRange(length), 1);
      }
      attribute.setDynamic(true);
      this.addAttribute(name, attribute);
    }
  }

  private frameIndex = 0;
  public startFrame() {
    this.frameIndex = 0;
  }

  public endFrame() {
    for (const attribute of Object.values(this.attributes) as Float32BufferAttribute[]) {
      attribute.needsUpdate = true;
    }
    this.setDrawRange(0, this.frameIndex);
  }

  commit() {
    // TODO implement
  }
}
