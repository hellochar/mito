import { FunctionNode, Node, NodeBuilder, TempNode, UVNode } from "three/examples/jsm/nodes/Nodes";

export class OvalNode extends TempNode {
  private uv = new UVNode();

  // VERY IMPORTANT TO TRIM WHITESPACE because THREE's internal regex is whitespace sensitive
  static ovalOutFn = new FunctionNode(
    `
float ovalOut(vec2 vUv, float time) {
    return clamp((time - length(vUv - vec2(0.5))) * 15., 0.0, 1.0);
}`.trim()
  );

  constructor(public time: Node) {
    super("f");
  }

  generate(builder: NodeBuilder, output: string) {
    const fn = builder.include(OvalNode.ovalOutFn);
    return builder.format(
      fn + "( " + this.uv.build(builder, "v2") + ", " + this.time.build(builder, "f") + " )",
      this.getType(builder),
      output
    );
  }
}
