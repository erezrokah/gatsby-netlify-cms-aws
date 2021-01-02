import { Handler } from 'aws-lambda';
import { listBuckets, deleteBuckets } from './s3';

const bucketRegex = process.env.BUCKET_REGEX || '$^';
const previewExpirySeconds = process.env.PREVIEW_EXPIRY_SECONDS
  ? parseInt(process.env.PREVIEW_EXPIRY_SECONDS)
  : 60 * 60 * 24 * 31;

const regexp = new RegExp(bucketRegex);

export const handler: Handler = async () => {
  if (bucketRegex.endsWith('-preview-\\d+')) {
    const buckets = await listBuckets();

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const previews = buckets.filter(({ Name = '' }) => regexp.test(Name));

    console.log(
      'Found',
      previews.length,
      'preview buckets',
      JSON.stringify(previews),
    );

    const currentTime = Date.now();

    const toDelete = previews
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .filter(({ CreationDate = new Date(0) }) => {
        const timePassedSeconds = (currentTime - CreationDate.getTime()) / 1000;
        return timePassedSeconds > previewExpirySeconds;
      })
      // eslint-disable-next-line @typescript-eslint/naming-convention
      .map(({ Name }) => Name || '');

    if (toDelete.length > 0) {
      console.log(
        'Deleting',
        toDelete.length,
        'preview buckets',
        JSON.stringify(toDelete),
      );
      await deleteBuckets(toDelete);
    } else {
      console.log('No preview buckets to delete');
    }
  }
};
