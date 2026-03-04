export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return Response.redirect("https://projournalmitrad.vercel.app/login?error=discord_error&msg=No+code");
  }

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: "1478766636118052935",
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "https://projournalmitrad.vercel.app/api/discord-callback",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return Response.redirect("https://projournalmitrad.vercel.app/login?error=discord_error&msg=" + encodeURIComponent(JSON.stringify(tokenData)));
    }

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: "Bearer " + tokenData.access_token },
    });
    const discordUser = await userRes.json();

    const backendRes = await fetch("https://mitrad-backend.onrender.com/api/auth/discord/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discord_id: discordUser.id,
        email: discordUser.email,
        name: discordUser.global_name || discordUser.username,
        avatar: discordUser.avatar
          ? "https://cdn.discordapp.com/avatars/" + discordUser.id + "/" + discordUser.avatar + ".png"
          : null,
      }),
    });

    const backendData = await backendRes.json();
    if (!backendData.token) {
      return Response.redirect("https://projournalmitrad.vercel.app/login?error=discord_error&msg=" + encodeURIComponent("Backend error: " + JSON.stringify(backendData)));
    }

    const userData = encodeURIComponent(JSON.stringify(backendData.user));
    return Response.redirect(
      "https://projournalmitrad.vercel.app/login?token=" + encodeURIComponent(backendData.token) + "&user=" + userData
    );

  } catch (e) {
    return Response.redirect("https://projournalmitrad.vercel.app/login?error=discord_error&msg=" + encodeURIComponent(e.message));
  }
}