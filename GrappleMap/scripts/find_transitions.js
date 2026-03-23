#!/usr/bin/env node
const fs = require('fs');

const text = fs.readFileSync('GrappleMap.txt', 'utf8');
const lines = text.split('\n');

let inData = false;
let desc = [];
let sequences = [];
let frames = [];
let dataLines = [];

for (const line of lines) {
  const isData = line.length > 0 && line[0] === ' ';
  if (isData) {
    if (!inData && desc.length > 0 && frames.length > 0) {
      sequences.push({ desc: [...desc], frames: [...frames] });
      frames = [];
    }
    dataLines.push(line);
    if (dataLines.length === 4) {
      frames.push(dataLines.join('\n'));
      dataLines = [];
    }
    inData = true;
  } else {
    if (inData && frames.length > 0) {
      sequences.push({ desc: [...desc], frames: [...frames] });
      desc = [];
      frames = [];
      dataLines = [];
    }
    inData = false;
    if (line.trim()) desc.push(line);
  }
}

if (frames.length > 0 && desc.length > 0) {
  sequences.push({ desc, frames });
}

const transitions = sequences.filter(s => s.frames.length >= 2);

console.log('Total transitions:', transitions.length);
console.log('');
console.log('Transition 1387:', transitions[1387]?.desc?.[0] || 'NOT FOUND');
console.log('  Frames:', transitions[1387]?.frames?.length || 0);
console.log('');
console.log('Transition 57:', transitions[57]?.desc?.[0] || 'NOT FOUND');
console.log('  Frames:', transitions[57]?.frames?.length || 0);
