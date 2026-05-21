import { spawnSync } from 'node:child_process'
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const bin = (name) => path.join('node_modules', '.bin', `${name}${process.platform === 'win32' ? '.cmd' : ''}`)
const staticIndex = readFileSync('index.html', 'utf8')

function run(command, args) {
  const runner = process.platform === 'win32' ? 'cmd.exe' : command
  const runnerArgs = process.platform === 'win32' ? ['/c', command, ...args] : args
  const result = spawnSync(runner, runnerArgs, { stdio: 'inherit', shell: false })
  if (result.status !== 0) {
    process.exitCode = result.status || 1
    throw new Error(`${command} ${args.join(' ')} failed`)
  }
}

try {
  copyFileSync('index.vite.html', 'index.html')
  run(bin('tsc'), ['-b'])
  run(bin('vite'), ['build'])
} finally {
  writeFileSync('index.html', staticIndex, 'utf8')
}
