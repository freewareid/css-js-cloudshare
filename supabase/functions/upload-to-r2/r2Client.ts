import { S3Client } from "https://esm.sh/@aws-sdk/client-s3@3.370.0";

export const initializeR2Client = () => {
  const r2AccountId = Deno.env.get('R2_ACCOUNT_ID');
  const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
  const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');

  if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
    throw new Error('Missing R2 configuration');
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });
};