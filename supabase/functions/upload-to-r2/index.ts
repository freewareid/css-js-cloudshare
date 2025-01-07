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
    
    const { fileName, fileType, userId, fileContent } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!fileName || !fileType || !fileContent) {
      throw new Error('Missing required file information');
    }

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    const isAnonymous = !authHeader || authHeader === 'Bearer anonymous';

    console.log('Auth status:', isAnonymous ? 'anonymous' : 'authenticated');

    // Initialize clients
    const R2 = initializeR2Client();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Process file content if it's CSS
    let processedContent = fileContent;
    if (fileName.endsWith('.css')) {
      processedContent = compressCSS(fileContent);
    }

    // Upload to R2
    const key = `${userId}/${fileName}`;
    console.log('Attempting to upload file:', key);
    
    try {
      const fileUrl = await uploadFileToR2(R2, key, processedContent, fileType);
      console.log('File uploaded successfully:', fileUrl);

      // Only store file metadata in database for authenticated users
      if (!isAnonymous) {
        const { error: dbError } = await supabase
          .from('files')
          .insert({
            user_id: userId,
            name: fileName,
            url: fileUrl,
            type: fileName.split('.').pop() || '',
            size: new TextEncoder().encode(processedContent).length,
          });

        if (dbError) {
          console.error('Database error:', dbError);
          throw new Error(`Failed to save file metadata: ${dbError.message}`);
        }
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