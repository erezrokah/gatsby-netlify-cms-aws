import S3 = require('aws-sdk/clients/s3');
import { ObjectIdentifier } from 'aws-sdk/clients/s3';

const s3 = new S3();

const emptyS3Bucket = async (bucket: string) => {
  const listParams = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Bucket: bucket,
  };

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { Contents = [], IsTruncated = false } = await s3
    .listObjectsV2(listParams)
    .promise();

  if (Contents.length === 0) {
    return bucket;
  }

  const deleteParams = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Bucket: bucket,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Delete: { Objects: [] as ObjectIdentifier[] },
  };

  // eslint-disable-next-line @typescript-eslint/naming-convention
  Contents.forEach(({ Key = '' }) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    deleteParams.Delete.Objects.push({ Key });
  });

  await s3.deleteObjects(deleteParams).promise();

  if (IsTruncated) {
    await emptyS3Bucket(bucket);
  }

  return bucket;
};

export const deleteBuckets = async (buckets: string[]): Promise<void> => {
  await Promise.all(
    buckets.map((bucket) =>
      emptyS3Bucket(bucket).then((bucket) =>
        // eslint-disable-next-line @typescript-eslint/naming-convention
        s3.deleteBucket({ Bucket: bucket }).promise(),
      ),
    ),
  );
};

export const listBuckets = async (): Promise<S3.Buckets> => {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { Buckets = [] } = await s3.listBuckets().promise();
  return Buckets;
};
