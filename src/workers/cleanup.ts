import * as cron from 'node-cron';
import { db } from '../db';
import { storage } from '../services/storage';

/**
 * Cleanup worker for removing expired files
 * Runs hourly to delete files older than 24 hours
 */
export class CleanupWorker {
    /**
     * Execute cleanup process
     */
    static async cleanup(): Promise<void> {
        console.log('[Cleanup] Starting cleanup process...');

        try {
            const expiredFiles = db.getExpiredFiles();

            if (expiredFiles.length === 0) {
                console.log('[Cleanup] No expired files found');
                return;
            }

            console.log(`[Cleanup] Found ${expiredFiles.length} expired file(s)`);

            let deletedCount = 0;
            let errorCount = 0;

            for (const file of expiredFiles) {
                try {
                    // Delete from storage
                    await storage.delete(file.storage_path);

                    // Delete from database
                    db.deleteById(file.id);

                    deletedCount++;
                    console.log(`[Cleanup] Deleted: ${file.id} (${file.original_name})`);
                } catch (error) {
                    errorCount++;
                    console.error(`[Cleanup] Failed to delete ${file.id}:`, error);
                }
            }

            console.log(`[Cleanup] Completed: ${deletedCount} deleted, ${errorCount} errors`);
        } catch (error) {
            console.error('[Cleanup] Cleanup process failed:', error);
        }
    }

    /**
     * Start scheduled cleanup job (runs hourly)
     */
    static startScheduled(): void {
        console.log('[Cleanup] Scheduling hourly cleanup job...');

        // Run every hour at minute 0
        cron.schedule('0 * * * *', async () => {
            await CleanupWorker.cleanup();
        });

        console.log('[Cleanup] Cleanup job scheduled (runs hourly)');
    }
}

// If run directly, execute cleanup once
if (require.main === module) {
    CleanupWorker.cleanup()
        .then(() => {
            console.log('[Cleanup] Manual cleanup completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('[Cleanup] Manual cleanup failed:', error);
            process.exit(1);
        });
}
