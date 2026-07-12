const major = Number(process.versions.node.split('.')[0]);

if (major < 22) {
  console.error(`Violet's Wizard Game requires Node 22 or newer; found ${process.version}. Run \"nvm use\" from the project directory.`);
  process.exit(1);
}
