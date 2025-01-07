import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "./corsHeaders.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileName, fileType, userId, fileContent } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!fileName || !fileContent) {
      throw new Error('Missing required file information');
    }

    console.log('Processing file:', fileName);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate a unique file path while preserving the original filename
    const key = `${userId}/${fileName}`;
    console.log('Generated file path:', key);

    // Upload to R2
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('files')
      .upload(key, fileContent, {
        contentType: fileType,
        upsert: true
      });

    if (uploadError) {
      console.error('R2 Upload Error:', uploadError);
      throw new Error(`Failed to upload to R2: ${uploadError.message}`);
    }

    console.log('File uploaded to R2 successfully');

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('files')
      .getPublicUrl(key);

    // Save file metadata to database
    const { error: dbError } = await supabase
      .from('files')
      .insert({
        user_id: userId,
        name: fileName,
        url: publicUrl,
        type: fileName.split('.').pop() || '',
        size: new TextEncoder().encode(fileContent).length,
      });

    if (dbError) {
      console.error('Database Error:', dbError);
      throw new Error(`Failed to save file metadata: ${dbError.message}`);
    }

    console.log('File metadata saved successfully');

    return new Response(
      JSON.stringify({ url: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: `Failed to upload to R2: ${error.message}` }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});