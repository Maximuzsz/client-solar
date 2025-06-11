#!/usr/bin/env node

import { join, dirname } from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Iniciando o cliente Vite...');

// Caminho direto para o binário Vite na pasta node_modules
const viteBin = join(__dirname, '../node_modules/.bin/vite');

// Inicia o processo Vite diretamente, sem usar shell
// Adicionamos o parâmetro --host para permitir qualquer host
const viteProcess = spawn(viteBin, ['--host', '0.0.0.0', '--strictPort', '--port', '5000', '--cors'], {
  env: { 
    ...process.env,
    PORT: '5000',
    HOST: '0.0.0.0'
  },
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

viteProcess.on('error', (err) => {
  console.error('Erro ao iniciar Vite:', err);
});

viteProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Vite process exited with code ${code}`);
  }
});