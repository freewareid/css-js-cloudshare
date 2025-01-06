import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import { S3Client, GetObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.370.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { fileId } = await req.json()
    
    if (!fileId) {
      throw new Error('File ID is required')
    }

    console.log('Getting file details for ID:', fileId)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get file details from database
    const { data: file, error: dbError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (dbError || !file) {
      console.error('Database error:', dbError)
      throw new Error('File not found')
    }

    console.log('File details retrieved:', { name: file.name, type: file.type })

    // Initialize R2 client
    const R2 = new S3Client({
      region: "auto",
      endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') ?? '',
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '',
      },
    })

    // Get file from R2
    const key = `${file.user_id}/${file.name}`
    console.log('Fetching file from R2:', key)

    const command = new GetObjectCommand({
      Bucket: "st8",
      Key: key,
    })

    const response = await R2.send(command)
    
    if (!response.Body) {
      throw new Error('No file content received from R2')
    }

    // Convert the readable stream to text
    const streamReader = response.Body.getReader()
    const chunks = []
    
    while (true) {
      const { done, value } = await streamReader.read()
      if (done) break
      chunks.push(value)
    }

    const content = new TextDecoder().decode(
      new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []))
    )

    console.log('File content retrieved successfully')

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})