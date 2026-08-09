'use strict';

const fs = require('fs');

// pkg builds on a console-subsystem Node binary, so Explorer opens a console
// window for the packaged exe and keeps it there for the life of the server.
// Windows decides that from one field in the PE optional header, and pkg
// exposes no option for it, so the field is rewritten after the build.
const WINDOWS_GUI = 2;
const WINDOWS_CUI = 3;

function subsystemOffset(binary) {
  if (binary.length < 0x40) {
    throw new Error('File is too small to be a PE image.');
  }
  const peHeader = binary.readUInt32LE(0x3c);
  // 'P', 'E', 0, 0 read little endian.
  if (binary.readUInt32LE(peHeader) !== 0x00004550) {
    throw new Error('File is not a PE image.');
  }
  // Subsystem sits 68 bytes into the optional header, which follows the 4 byte
  // signature and the 20 byte COFF header. PE32 and PE32+ agree on that offset.
  return peHeader + 24 + 68;
}

function setWindowsGuiSubsystem(file) {
  const binary = fs.readFileSync(file);
  const offset = subsystemOffset(binary);
  const subsystem = binary.readUInt16LE(offset);
  if (subsystem === WINDOWS_GUI) {
    return false;
  }
  if (subsystem !== WINDOWS_CUI) {
    throw new Error(`Refusing to rewrite unexpected PE subsystem ${subsystem} in ${file}.`);
  }
  binary.writeUInt16LE(WINDOWS_GUI, offset);
  fs.writeFileSync(file, binary);
  return true;
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/set-windows-subsystem.js <exe>');
    process.exit(1);
  }
  console.log(setWindowsGuiSubsystem(file)
    ? `${file}: subsystem changed from console to windows`
    : `${file}: already the windows subsystem`);
}

module.exports = { setWindowsGuiSubsystem, subsystemOffset };
