import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import { S3Client, GetObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.370.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileId } = await req.json()
    console.log('Getting file content for:', fileId)

    if (!fileId) {
      throw new Error('File ID is required')
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get file metadata from database
    const { data: file, error: dbError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (dbError || !file) {
      throw new Error('File not found')
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
    console.log('Fetching from R2 with key:', key)

    // Get file from R2
    const command = new GetObjectCommand({
      Bucket: "st8",
      Key: key,
    })

    const r2Response = await R2.send(command)
    const content = await r2Response.Body?.text()

    if (!content) {
      throw new Error('Failed to read file content')
    }

    return new Response(
      JSON.stringify({ content }),
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