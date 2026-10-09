'use strict';

// Development runner: starts the local PostgreSQL cluster if needed, runs the
// app in watch mode, and stops the cluster again on exit (Ctrl+C).

const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.join(__dirname, '..');
const dataDir = path.join(root, '.local', 'postgres');
const pgCtl = path.join(
  process.env.PGBIN || '/usr/lib/postgresql/16/bin',
  'pg_ctl'
);

function pg(args, stdio = 'inherit') {
  return spawnSync(pgCtl, ['-D', dataDir, ...args], { stdio });
}

// Only stop the cluster on exit if this script was the one that started it.
const alreadyRunning = pg(['status'], 'ignore').status === 0;

if (!alreadyRunning) {
  const started = pg(['-l', path.join(dataDir, 'server.log'), '-w', 'start']);
  if (started.error || started.status !== 0) {
    console.error(
      `Could not start PostgreSQL with ${pgCtl}. ` +
        'Set PGBIN to the directory that contains pg_ctl.'
    );
    process.exit(1);
  }
}

const app = spawn(process.execPath, ['--watch', 'server.js'], {
  cwd: root,
  stdio: 'inherit',
});

// Ctrl+C reaches the app directly (same process group); wait for it to exit
// so the cluster is stopped afterwards instead of dying mid-cleanup.
process.on('SIGINT', () => {});
process.on('SIGTERM', () => app.kill('SIGTERM'));

app.on('exit', (code) => {
  if (!alreadyRunning) {
    pg(['-m', 'fast', 'stop']);
  }
  process.exit(code ?? 0);
});
