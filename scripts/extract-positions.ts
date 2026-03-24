import { readFileSync, writeFileSync } from "fs";

const input = readFileSync("./GrappleMap/GrappleMap.txt", "utf-8");
const lines = input.split("\n");

interface Position {
  id: string;
  name: string;
  tags: string[];
  frames: number[][][];
}

const positions: Position[] = [];
let currentName = "";
let currentTags: string[] = [];
let currentFrames: number[][][] = [];

function decodeLine(encoded: string): number[] {
  const decoded: number[] = [];
  for (let i = 0; i < encoded.length; i++) {
    const c = encoded[i];
    let v = 0;
    if (c === "_") v = 62;
    else if (c >= "a" && c <= "z") v = 26 + c.charCodeAt(0) - 97;
    else if (c >= "A" && c <= "Z") v = c.charCodeAt(0) - 65;
    else if (c >= "0" && c <= "9") v = 52 + c.charCodeAt(0) - 48;
    decoded.push(v);
  }
  return decoded;
}

function processCurrent() {
  if (currentName && currentFrames.length > 0) {
    positions.push({
      id: `pos_${positions.length + 1}`,
      name: currentName,
      tags: currentTags,
      frames: [...currentFrames],
    });
  }
}

for (const line of lines) {
  const trimmed = line.trim();
  
  if (!trimmed) {
    if (currentName || currentFrames.length > 0) {
      processCurrent();
    }
    currentName = "";
    currentTags = [];
    currentFrames = [];
    continue;
  }
  
  // Tags line
  if (trimmed.startsWith("tags:")) {
    const tagsStr = trimmed.slice(5).trim();
    currentTags = tagsStr ? tagsStr.split(" ").filter(Boolean) : [];
    continue;
  }
  
  // Frame line (starts with 4 spaces, encoded data is 69 chars)
  if (line.startsWith("    ") && trimmed.length === 69) {
    const encoded = trimmed;
    if (/^[A-Za-z0-9_]+$/.test(encoded)) {
      const decoded = decodeLine(encoded);
      const player1 = decoded.slice(0, 23);
      const player2 = decoded.slice(23, 46);
      currentFrames.push([player1, player2]);
    }
    continue;
  }
  
  // Name line (not tags, not frame, not empty)
  if (!trimmed.startsWith("tags:") && !line.startsWith("    ")) {
    // If we already have frames for current position, save it
    if (currentName && currentFrames.length > 0) {
      processCurrent();
      currentFrames = [];
    }
    // Append to name (multi-line positions use \n)
    if (currentName) {
      currentName += "\n" + trimmed;
    } else {
      currentName = trimmed;
    }
  }
}

// Final position
if (currentName && currentFrames.length > 0) {
  processCurrent();
}

const output = {
  meta: {
    extractedAt: new Date().toISOString(),
    source: "GrappleMap.txt",
    positionCount: positions.length,
  },
  positions: positions.map((p) => ({
    id: p.id,
    name: p.name,
    tags: p.tags,
    frameCount: p.frames.length,
  })),
};

writeFileSync(
  "./client/public/data/library/admin/positions.json",
  JSON.stringify(output, null, 2)
);

console.log(`Extracted ${positions.length} positions`);

// Also output frames for first few positions to verify
console.log("\nSample positions with frames:");
positions.slice(0, 3).forEach((p) => {
  console.log(`  ${p.name} (${p.tags.join(", ")}) - ${p.frames.length} frames`);
  if (p.frames.length > 0) {
    const f = p.frames[0];
    console.log(`    Frame 0: player1[0:5]=${f[0].slice(0, 5)}, player2[0:5]=${f[1].slice(0, 5)}`);
  }
});
