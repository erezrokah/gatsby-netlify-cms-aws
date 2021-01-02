import * as SSM from 'aws-sdk/clients/ssm';

export const getSecrets = async (
  names: string[],
): Promise<Record<string, string>> => {
  const ssm = new SSM();
  const parameters =
    (
      await ssm
        .getParameters({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Names: names,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          WithDecryption: true,
        })
        .promise()
    ).Parameters || [];

  const result: Record<string, string> = {};
  parameters.forEach((currentItem) => {
    if (currentItem.Name) {
      result[currentItem.Name] = currentItem.Value || '';
    }
  });
  return result;
};
