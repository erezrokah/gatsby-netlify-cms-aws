import S3 = require('aws-sdk/clients/s3');
import { ObjectIdentifier } from 'aws-sdk/clients/s3';

const s3 = new S3();

const emptyS3Bucket = async (bucket: string) => {
  const listParams = {
    Bucket: bucket,
  };

  const { Contents = [], IsTruncated = false } = await s3
    .listObjectsV2(listParams)
    .promise();

  if (Contents.length === 0) {
    return bucket;
  }

  const deleteParams = {
    Bucket: bucket,
    Delete: { Objects: [] as ObjectIdentifier[] },
  };

  Contents.forEach(({ Key = '' }) => {
    deleteParams.Delete.Objects.push({ Key });
  });

  await s3.deleteObjects(deleteParams).promise();

  if (IsTruncated) {
    await emptyS3Bucket(bucket);
  }

  return bucket;
};

export const deleteBuckets = async (buckets: string[]) => {
  await Promise.all(
    buckets.map((bucket) =>
      emptyS3Bucket(bucket).then((bucket) =>
        s3.deleteBucket({ Bucket: bucket }).promise(),
      ),
    ),
  );
};

export const listBuckets = async () => {
  const { Buckets = [] } = await s3.listBuckets().promise();
  return Buckets;
};
