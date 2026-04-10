import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ valid: false, reason: "method_not_allowed", server_time: new Date().toISOString() }, 405);
  }

  try {
    const { key, fingerprint, machine_id } = await req.json();

    if (!key) {
      return jsonResponse({
        valid: false,
        reason: "missing_key",
        server_time: new Date().toISOString(),
      }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Look up the license by key
    const { data: license, error } = await supabase
      .from("licenses")
      .select("id, key, type, user_id, machine_id, is_revoked, revoked_reason, created_at, expires_at, metadata")
      .eq("key", key)
      .single();

    const serverTime = new Date().toISOString();

    if (error || !license) {
      return jsonResponse({
        valid: false,
        reason: "key_not_found",
        server_time: serverTime,
      }, 404);
    }

    // Check if revoked
    if (license.is_revoked) {
      return jsonResponse({
        valid: false,
        reason: "revoked",
        revoked_reason: license.revoked_reason,
        server_time: serverTime,
      });
    }

    // Check machine match (if machine_id provided by client and license has one assigned)
    if (license.machine_id && machine_id && license.machine_id !== machine_id) {
      return jsonResponse({
        valid: false,
        reason: "wrong_machine",
        server_time: serverTime,
      });
    }

    // Query the machine record using license.machine_id (server-side authority)
    // This works even when the client doesn't send machine_id
    let trialActionsUsed = null;
    if (license.machine_id) {
      const { data: machineData } = await supabase
        .from("machines")
        .select("hardware_signature, trial_actions_used, is_blocked, blocked_reason")
        .eq("id", license.machine_id)
        .single();

      if (machineData) {
        trialActionsUsed = machineData.trial_actions_used;

        // Verify fingerprint against the machine's stored signature
        if (fingerprint && machineData.hardware_signature !== fingerprint) {
          return jsonResponse({
            valid: false,
            reason: "fingerprint_mismatch",
            server_time: serverTime,
          });
        }

        // Check if machine is blocked
        if (machineData.is_blocked) {
          return jsonResponse({
            valid: false,
            reason: "machine_blocked",
            blocked_reason: machineData.blocked_reason,
            server_time: serverTime,
          });
        }
      }

      // Update last_seen on the machine
      await supabase
        .from("machines")
        .update({ last_seen: serverTime })
        .eq("id", license.machine_id);
    }

    // Check expiry
    const isExpired = license.expires_at && new Date(license.expires_at) < new Date();

    return jsonResponse({
      valid: !isExpired,
      type: license.type,
      expires_at: license.expires_at,
      server_time: serverTime,
      is_revoked: false,
      trial_actions_used: trialActionsUsed,
      metadata: license.metadata || {},
    });

  } catch (err) {
    console.error("licenses-validate error:", err);
    return jsonResponse({
      valid: false,
      reason: "internal_error",
      server_time: new Date().toISOString(),
    }, 500);
  }
});
