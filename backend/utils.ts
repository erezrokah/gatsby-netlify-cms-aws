import * as SSM from 'aws-sdk/clients/ssm';

export const getSecrets = async (names: string[]) => {
  const ssm = new SSM();
  const Parameters =
    (
      await ssm
        .getParameters({
          Names: names,
          WithDecryption: true,
        })
        .promise()
    ).Parameters || [];

  const result: Record<string, string> = {};
  Parameters.forEach((currentItem) => {
    if (currentItem.Name) {
      result[currentItem.Name] = currentItem.Value || '';
    }
  });
  return result;
};
