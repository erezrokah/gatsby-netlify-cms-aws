/* eslint-disable @typescript-eslint/no-var-requires */

jest.mock('./s3');
jest.spyOn(console, 'log');

describe('previewCleanup', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('should not do anything on no BUCKET_REGEX', async () => {
    delete process.env.BUCKET_REGEX;

    const { handler } = require('./previewCleanup');
    const { listBuckets, deleteBuckets } = require('./s3');

    await handler();

    expect(listBuckets).toHaveBeenCalledTimes(0);
    expect(deleteBuckets).toHaveBeenCalledTimes(0);
  });

  test('should not do anything on invalid BUCKET_REGEX', async () => {
    process.env.BUCKET_REGEX = '';

    const { handler } = require('./previewCleanup');
    const { listBuckets, deleteBuckets } = require('./s3');

    await handler();

    expect(listBuckets).toHaveBeenCalledTimes(0);
    expect(deleteBuckets).toHaveBeenCalledTimes(0);
    expect(console.log).toHaveBeenCalledTimes(0);
  });

  test('should not delete on non expired buckets', async () => {
    process.env.BUCKET_REGEX = 'prefix-preview-\\d+';
    process.env.PREVIEW_EXPIRY_SECONDS = `${60 * 60 * 24 * 31}`;

    const { handler } = require('./previewCleanup');
    const { listBuckets, deleteBuckets } = require('./s3');

    const buckets = [
      { Name: 'bucket1', CreationDate: new Date() },
      { Name: 'bucket2', CreationDate: new Date() },
    ];

    const previewBuckets = [
      { Name: 'prefix-preview-1', CreationDate: new Date() },
      { Name: 'prefix-preview-2', CreationDate: new Date() },
    ];

    (listBuckets as jest.Mock<any>).mockReturnValueOnce([
      ...buckets,
      ...previewBuckets,
    ]);

    await handler();

    expect(listBuckets).toHaveBeenCalledTimes(1);
    expect(deleteBuckets).toHaveBeenCalledTimes(0);

    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(
      'Found',
      previewBuckets.length,
      'preview buckets',
      JSON.stringify(previewBuckets),
    );
    expect(console.log).toHaveBeenCalledWith('No preview buckets to delete');
  });

  test('should delete expired buckets', async () => {
    process.env.BUCKET_REGEX = 'prefix-preview-\\d+';
    process.env.PREVIEW_EXPIRY_SECONDS = `${300}`;

    const { handler } = require('./previewCleanup');
    const { listBuckets, deleteBuckets } = require('./s3');

    const buckets = [
      { Name: 'bucket1', CreationDate: new Date() },
      { Name: 'bucket2', CreationDate: new Date() },
    ];

    const previewBuckets = [
      { Name: 'prefix-preview-1', CreationDate: new Date() },
      {
        Name: 'prefix-preview-2',
        CreationDate: new Date(Date.now() - 1000 * 300 * 2),
      },
    ];

    (listBuckets as jest.Mock<any>).mockReturnValueOnce([
      ...buckets,
      ...previewBuckets,
    ]);

    await handler();

    const expectedToDelete = [previewBuckets[1].Name];
    expect(listBuckets).toHaveBeenCalledTimes(1);
    expect(deleteBuckets).toHaveBeenCalledTimes(1);
    expect(deleteBuckets).toHaveBeenCalledWith(expectedToDelete);

    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(
      'Found',
      previewBuckets.length,
      'preview buckets',
      JSON.stringify(previewBuckets),
    );
    expect(console.log).toHaveBeenCalledWith(
      'Deleting',
      expectedToDelete.length,
      'preview buckets',
      JSON.stringify(expectedToDelete),
    );
  });
});
