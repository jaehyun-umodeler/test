import { registerAs } from '@nestjs/config';

export default registerAs('gcp', () => ({
  serviceAccountEmail: process.env.GCP_SERVICE_ACCOUNT_EMAIL || '',
  storage: {
    bucketNameMedia: process.env.GCP_STORAGE_BUCKET_NAME_MEDIA || '',
    bucketNameDownload: process.env.GCP_STORAGE_BUCKET_NAME_DOWNLOAD || '',
    keyFilename: process.env.GCP_STORAGE_KEY_FILENAME || '',
  },
  tasks: {
    billing: {
      queuePath: {
        old: process.env.CLOUD_TASK_QUEUE_PATH_BILLING_OLD || '',
      },
    },
  },
}));
