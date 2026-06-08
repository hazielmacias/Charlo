import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  )
  
  const { data, error } = await supabase.from("clients").select("count").limit(1)
  
  return new Response(JSON.stringify({ 
    message: "Supabase connection test",
    data,
    error: error?.message 
  }), {
    headers: { "Content-Type": "application/json" },
  })
})
