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

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Error fetching file details')
    }

    if (!file) {
      throw new Error('File not found')
    }

    console.log('File details retrieved:', { name: file.name, type: file.type, user_id: file.user_id })

    // Get the folder name (12 chars from user ID)
    const folderName = file.user_id.replace(/-/g, '').substring(0, 12)
    const key = `${folderName}/${file.name}`
    
    console.log('Fetching file from R2 with key:', key)

    const R2 = new S3Client({
      region: "auto",
      endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') ?? '',
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '',
      },
    })

    try {
      const command = new GetObjectCommand({
        Bucket: "st8",
        Key: key,
      })

      const response = await R2.send(command)
      
      if (!response.Body) {
        throw new Error('No file content received from R2')
      }

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
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json'
          } 
        }
      )
    } catch (r2Error) {
      console.error('R2 error:', r2Error)
      throw new Error(`Failed to fetch file from R2: ${r2Error.message}`)
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})