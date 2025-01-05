import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.370.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility function to compress CSS
const compressCSS = (css: string): string => {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;\}/g, '}')
    .trim();
};

// Validate and get R2 configuration
const getR2Config = () => {
  const r2AccountId = Deno.env.get('R2_ACCOUNT_ID');
  const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
  const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');

  if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
    throw new Error('Missing R2 configuration');
  }

  return { r2AccountId, r2AccessKeyId, r2SecretAccessKey };
};

// Initialize R2 client
const initializeR2Client = (config: ReturnType<typeof getR2Config>) => {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
    },
  });
};

// Check user storage limit
const checkStorageLimit = async (supabase: any, userId: string, fileSize: number) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('storage_used')
    .eq('id', userId)
    .single();

  if (!profile) {
    throw new Error('User profile not found');
  }

  if (profile.storage_used + fileSize > 1024 * 1024 * 1024) {
    throw new Error('Storage limit exceeded');
  }

  return profile;
};

// Upload file to R2
const uploadFileToR2 = async (R2: S3Client, key: string, fileContent: string | ArrayBuffer, contentType: string) => {
  const uploadCommand = new PutObjectCommand({
    Bucket: "st8", // Updated to use the correct bucket name
    Key: key,
    Body: fileContent,
    ContentType: contentType,
  });

  await R2.send(uploadCommand);
  return `https://pub-c7fe5d7345b64a8aa90756d140154223.r2.dev/${key}`;
};

// Update database records
const updateDatabaseRecords = async (
  supabase: any,
  userId: string,
  fileName: string,
  fileUrl: string,
  fileType: string,
  fileSize: number,
  profile: any
) => {
  const { data: existingFile } = await supabase
    .from('files')
    .select('size')
    .eq('user_id', userId)
    .eq('name', fileName)
    .single();

  if (existingFile) {
    await supabase
      .from('profiles')
      .update({ 
        storage_used: profile.storage_used - existingFile.size + fileSize 
      })
      .eq('id', userId);

    await supabase
      .from('files')
      .delete()
      .eq('user_id', userId)
      .eq('name', fileName);
  } else {
    await supabase
      .from('profiles')
      .update({ 
        storage_used: profile.storage_used + fileSize 
      })
      .eq('id', userId);
  }

  await supabase
    .from('files')
    .insert({
      user_id: userId,
      name: fileName,
      url: fileUrl,
      type: fileName.split('.').pop() || '',
      size: fileSize,
    });
};

serve(async (req) => {
  console.log("Function started");

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing file or user ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const r2Config = getR2Config();
    console.log("R2 Configuration validated");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const profile = await checkStorageLimit(supabase, userId, file.size);
    console.log("Storage limit checked");

    let fileContent = await file.text();
    if (file.name.endsWith('.css')) {
      fileContent = compressCSS(fileContent);
    }

    try {
      const R2 = initializeR2Client(r2Config);
      console.log("R2 client initialized");

      const key = `${userId}/${file.name}`;
      console.log("Attempting to upload file:", key);
      
      const fileUrl = await uploadFileToR2(R2, key, fileContent, file.type);
      console.log("File uploaded to R2 successfully");

      await updateDatabaseRecords(
        supabase,
        userId,
        file.name,
        fileUrl,
        file.type,
        file.size,
        profile
      );
      console.log("Database records updated");

      return new Response(
        JSON.stringify({ url: fileUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (r2Error) {
      console.error("R2 Error:", r2Error);
      return new Response(
        JSON.stringify({ error: 'Failed to upload to R2', details: r2Error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});