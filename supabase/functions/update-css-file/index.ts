import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.370.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileId, content } = await req.json()
    console.log('Processing update request for file:', fileId)

    if (!fileId || !content) {
      throw new Error('Missing required information')
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get file details from database
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fileError || !file) {
      console.error('File fetch error:', fileError)
      throw new Error('File not found or access denied')
    }

    // Initialize R2 client
    const R2 = new S3Client({
      region: "auto",
      endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') ?? '',
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '',
      },
    })

    // Extract key from URL
    const key = file.url.replace('https://cdn.000.web.id/', '')
    console.log('Updating file in R2:', key)

    // Upload updated content to R2
    const command = new PutObjectCommand({
      Bucket: "st8",
      Key: key,
      Body: content,
      ContentType: file.type === 'css' ? 'text/css' : 'application/javascript',
    })

    await R2.send(command)
    console.log('File updated successfully in R2')

    // Update the last_edited_at timestamp in the database
    const { error: updateError } = await supabase
      .from('files')
      .update({ last_edited_at: new Date().toISOString() })
      .eq('id', fileId)

    if (updateError) {
      console.error('Error updating last_edited_at:', updateError)
      throw new Error('Failed to update last edited timestamp')
    }

    return new Response(
      JSON.stringify({ message: 'File updated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})