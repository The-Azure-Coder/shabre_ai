import { EventEmitter } from 'node:events';

class JobEmitter extends EventEmitter {
  emitJobProgress(jobId, progress, message) {
    this.emit(`job:${jobId}`, { event: 'progress', progress, message });
  }

  emitJobComplete(jobId, resultUrl) {
    this.emit(`job:${jobId}`, { event: 'complete', progress: 100, message: 'Process complete', resultUrl });
  }

  emitJobError(jobId, error) {
    this.emit(`job:${jobId}`, { event: 'error', progress: 0, message: error });
  }
}

export const jobEmitter = new JobEmitter();
