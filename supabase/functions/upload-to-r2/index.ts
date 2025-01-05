import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.370.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const compressCSS = (css: string): string => {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around special characters
    .replace(/;\}/g, '}') // Remove unnecessary semicolons
    .trim();
};

serve(async (req) => {
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

    // Validate file size (1MB limit)
    if (file.size > 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 1MB limit' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check user's storage limit (1GB)
    const { data: profile } = await supabase
      .from('profiles')
      .select('storage_used')
      .eq('id', userId)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (profile.storage_used + file.size > 1024 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Storage limit exceeded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Process file content
    let fileContent = await file.text();
    if (file.name.endsWith('.css')) {
      fileContent = compressCSS(fileContent);
    }

    // Configure R2
    const R2 = new S3Client({
      region: "auto",
      endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') || '',
      },
    });

    const key = `${userId}/${file.name}`;
    
    // Upload to R2
    await R2.send(
      new PutObjectCommand({
        Bucket: "files",
        Key: key,
        Body: fileContent,
        ContentType: file.type,
      })
    );

    const url = `https://pub-c7fe5d7345b64a8aa90756d140154223.r2.dev/${key}`;

    // Delete old file if it exists with the same name
    const { data: existingFile } = await supabase
      .from('files')
      .select('size')
      .eq('user_id', userId)
      .eq('name', file.name)
      .single();

    if (existingFile) {
      // Update storage used (subtract old file size, add new file size)
      await supabase
        .from('profiles')
        .update({ 
          storage_used: profile.storage_used - existingFile.size + file.size 
        })
        .eq('id', userId);

      // Delete old file record
      await supabase
        .from('files')
        .delete()
        .eq('user_id', userId)
        .eq('name', file.name);
    } else {
      // Update storage used (add new file size)
      await supabase
        .from('profiles')
        .update({ 
          storage_used: profile.storage_used + file.size 
        })
        .eq('id', userId);
    }

    // Insert new file record
    await supabase
      .from('files')
      .insert({
        user_id: userId,
        name: file.name,
        url,
        type: file.name.split('.').pop() || '',
        size: file.size,
      });

    return new Response(
      JSON.stringify({ url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});