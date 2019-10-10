import { Gene, DNATuple, DNA } from "./gene";

export function mutateRandomNewGene(): Gene {
  const tuplePlus = randomDNATuple();
  const tupleMinus = randomDNATuple();
  return [tuplePlus, tupleMinus];
}

export function mutateSwapDNA(gene1: Gene, position1: number, gene2: Gene, position2: number): [Gene, Gene] {
  const gene1Str = gene1.join("");
  const gene2Str = gene2.join("");
  const dnaPosition1 = gene1Str.charAt(position1);
  const dnaPosition2 = gene2Str.charAt(position2);

  const newGeneStr1 = gene1Str.substr(0, position1) + dnaPosition2 + gene1Str.substr(position1 + 1);
  const newGeneStr2 = gene2Str.substr(0, position2) + dnaPosition1 + gene2Str.substr(position2 + 1);

  const newGene1 = strToGene(newGeneStr1);
  const newGene2 = strToGene(newGeneStr2);
  return [newGene1, newGene2];
}

export function mutatePosition(gene: Gene, position: number): Gene {
  const geneStr = gene.join("");
  const newGeneStr = geneStr.substr(0, position) + randomNewDNA(geneStr.charAt(position) as DNA) + geneStr.substr(position + 1);
  const newGene = strToGene(newGeneStr);
  return newGene;
}

function strToGene(str: string): Gene {
  return [str.substr(0, 2), str.substr(2)] as Gene;
}

function randomDNATuple(): DNATuple {
  const dna1 = randomDNA();
  const dna2 = randomDNA();
  return (dna1 + dna2) as DNATuple;
}

function randomNewDNA(old: DNA) {
  let d: DNA;
  do {
    d = randomDNA();
  } while (d === old);
  return d;
}

function randomDNA(): DNA {
  const r = Math.random();
  if (r < 0.25) {
    return "A";
  } else if (r < 0.5) {
    return "C";
  } else if (r < 0.75) {
    return "G";
  } else {
    return "T";
  }
}
