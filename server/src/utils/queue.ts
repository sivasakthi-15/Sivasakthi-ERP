import { logger } from './logger';

export type JobType = 'INVOICE_PDF' | 'PAYSLIP_PDF' | 'BACKUP_SYS' | 'GST_EXPORT' | 'REPORT_EXPORT' | 'NOTIFICATION_DISPATCH';

export interface Job {
  id: string;
  type: JobType;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'dlq';
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

class BackgroundQueue {
  private queue: Job[] = [];
  private dlq: Job[] = [];
  private isProcessing = false;

  /**
   * Submit a heavy task to the background queue
   */
  public enqueue(type: JobType, payload: any, maxAttempts: number = 3): string {
    const job: Job = {
      id: `job_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      type,
      payload,
      status: 'pending',
      attempts: 0,
      maxAttempts,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.queue.push(job);
    logger.info(`[BACKGROUND QUEUE] Enqueued job ${job.id} (${type})`);
    
    // Trigger loop execution asynchronously
    this.processQueue().catch(err => {
      logger.error(`Error in queue process loop: ${err.message}`);
    });

    return job.id;
  }

  /**
   * Get single job info
   */
  public getJob(jobId: string): Job | undefined {
    return this.queue.find(j => j.id === jobId) || this.dlq.find(j => j.id === jobId);
  }

  /**
   * Get all active queue jobs
   */
  public listJobs(): Job[] {
    return [...this.queue];
  }

  /**
   * Get DLQ (Dead Letter Queue) jobs
   */
  public listDlq(): Job[] {
    return [...this.dlq];
  }

  /**
   * Worker processing loop
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.some(j => j.status === 'pending')) {
      const job = this.queue.find(j => j.status === 'pending');
      if (!job) break;

      job.status = 'processing';
      job.attempts++;
      job.updatedAt = new Date();
      logger.info(`[BACKGROUND QUEUE] Processing job ${job.id} (${job.type}) - Attempt ${job.attempts}/${job.maxAttempts}`);

      try {
        await this.executeJob(job);
        job.status = 'completed';
        logger.info(`[BACKGROUND QUEUE] Job ${job.id} completed successfully.`);
      } catch (err: any) {
        job.error = err.message;
        job.updatedAt = new Date();

        if (job.attempts < job.maxAttempts) {
          job.status = 'pending'; // Re-queue for retry
          logger.warn(`[BACKGROUND QUEUE] Job ${job.id} failed, re-queueing for retry. Error: ${err.message}`);
        } else {
          job.status = 'dlq';
          this.dlq.push(job);
          this.queue = this.queue.filter(j => j.id !== job.id);
          logger.error(`[BACKGROUND QUEUE] Job ${job.id} failed permanently and moved to DLQ. Error: ${err.message}`);
        }
      }

      // Small throttle yield between heavy jobs
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.isProcessing = false;
  }

  /**
   * Executor router for background jobs
   */
  private async executeJob(job: Job): Promise<void> {
    switch (job.type) {
      case 'INVOICE_PDF':
        logger.info(`[WORKER] Generating high-resolution customer Invoice PDF in background: ${JSON.stringify(job.payload)}`);
        break;
      case 'PAYSLIP_PDF':
        logger.info(`[WORKER] Preparing payslip document PDF in background: ${JSON.stringify(job.payload)}`);
        break;
      case 'BACKUP_SYS':
        logger.info(`[WORKER] Creating secure automatic local/cloud database system backup...`);
        // Simulate backup taking 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        break;
      case 'GST_EXPORT':
        logger.info(`[WORKER] Extracting GST report datasets & formatting tax JSON schemas...`);
        break;
      case 'REPORT_EXPORT':
        logger.info(`[WORKER] Running slow server-side ledger aggregates for final spreadsheet compiling...`);
        break;
      case 'NOTIFICATION_DISPATCH':
        logger.info(`[WORKER] Sending system notifications / outstandings alert emails and SMS messages...`);
        break;
      default:
        throw new Error(`Unsupported background job type: ${job.type}`);
    }
  }
}

export const backgroundQueue = new BackgroundQueue();
