import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "./corsHeaders.ts";
import { initializeR2Client } from "./r2Client.ts";
import { validateFile, compressCSS, uploadFileToR2 } from "./fileUtils.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting file upload process');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!userId) {
      throw new Error('User ID is required');
    }

    validateFile(file);

    // Initialize clients
    const R2 = initializeR2Client();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process file content
    let fileContent = await file.text();
    if (file.name.endsWith('.css')) {
      fileContent = compressCSS(fileContent);
    }

    // Upload to R2
    const key = `${userId}/${file.name}`;
    console.log('Attempting to upload file:', key);
    
    try {
      const fileUrl = await uploadFileToR2(R2, key, fileContent, file.type);
      console.log('File uploaded successfully:', fileUrl);

      // Update database records
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          user_id: userId,
          name: file.name,
          url: fileUrl,
          type: file.name.split('.').pop() || '',
          size: file.size,
        });

      if (dbError) {
        throw new Error(`Failed to save file metadata: ${dbError.message}`);
      }

      return new Response(
        JSON.stringify({ url: fileUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (uploadError) {
      console.error('R2 Upload Error:', uploadError);
      throw new Error(`Failed to upload to R2: ${uploadError.message}`);
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});