const { spawn } = require('child_process');
const path = require('path');

function startWorker(): void {
  const workerPath = path.join(__dirname, '../worker/spreads.ts');
  
  console.log('Starting spreads worker...');
  
  const worker = spawn('ts-node', [workerPath], {
    stdio: 'inherit',
    env: process.env
  });

  worker.on('error', (error: Error) => {
    console.error('Failed to start worker:', error);
    process.exit(1);
  });

  worker.on('exit', (code: number | null, signal: string | null) => {
    if (code !== null) {
      console.log(`Worker process exited with code ${code}`);
    } else if (signal !== null) {
      console.log(`Worker process killed with signal ${signal}`);
    }
    
    // Restart the worker after a short delay
    console.log('Restarting worker in 5 seconds...');
    setTimeout(startWorker, 5000);
  });

  // Handle process termination
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Gracefully shutting down worker...');
    worker.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT. Gracefully shutting down worker...');
    worker.kill('SIGINT');
    process.exit(0);
  });
}

// Start the worker process
startWorker();
