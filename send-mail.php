<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$secret = $data['secret'] ?? '';

if ($secret !== 'MON_SECRET_123') {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$users         = $data['users'];
$movieTitle    = $data['movieTitle'];
$movieUrl      = $data['movieUrl'];
$rating        = $data['rating'];
$content       = $data['content'];
$posterPath    = $data['moviePosterPath'] ?? '';

$subject = "Nouvelle critique Qojim Cinema : " . $movieTitle;

// Générer les étoiles (sur 10, affichées sur 10 cases)
function renderStars($rating)
{
    $full  = (int) round($rating);
    $empty = 10 - $full;
    $stars = str_repeat('&#9733;', $full) . str_repeat('&#9734;', $empty);
    return $stars;
}

$posterUrl = $posterPath
    ? 'https://image.tmdb.org/t/p/w300' . $posterPath
    : '';

$starsHtml = renderStars($rating);
$excerpt   = $content ? '"' . mb_substr($content, 0, 220) . (mb_strlen($content) > 220 ? '…' : '') . '"' : '';

foreach ($users as $user) {
    $to = $user['email'];

    $html = '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>' . htmlspecialchars($subject) . '</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:\'Helvetica Neue\',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#111827;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;border-bottom:2px solid #2563eb;">
              <a href="https://qojimcinema.vercel.app" style="text-decoration:none;">
                <span style="font-size:22px;font-weight:700;color:#3b82f6;">Qojim Cinema</span>
              </a>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#111827;padding:32px;">

              <!-- Title -->
              <p style="margin:0 0 6px 0;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Nouvelle critique d\'expert</p>
              <h1 style="margin:0 0 24px 0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">
                ' . htmlspecialchars($movieTitle) . '
              </h1>

              <!-- Movie card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1f2937;border-radius:10px;overflow:hidden;margin-bottom:28px;">
                <tr>
                  ' . ($posterUrl ? '
                  <td width="120" valign="top" style="padding:0;">
                    <img src="' . $posterUrl . '" alt="' . htmlspecialchars($movieTitle) . '"
                         width="120" style="display:block;border-radius:10px 0 0 10px;object-fit:cover;height:100%;min-height:160px;" />
                  </td>
                  ' : '') . '
                  <td valign="top" style="padding:20px 22px;">
                    <!-- Stars -->
                    <p style="margin:0 0 6px 0;font-size:22px;letter-spacing:2px;color:#f59e0b;">' . $starsHtml . '</p>
                    <p style="margin:0 0 16px 0;font-size:14px;color:#9ca3af;">
                      Note : <strong style="color:#f59e0b;font-size:16px;">' . $rating . '</strong><span style="color:#6b7280;">/10</span>
                    </p>
                    ' . ($excerpt ? '
                    <p style="margin:0;font-size:14px;color:#d1d5db;line-height:1.65;font-style:italic;">
                      ' . htmlspecialchars($excerpt) . '
                    </p>
                    ' : '<p style="margin:0;font-size:13px;color:#6b7280;font-style:italic;">Note sans commentaire.</p>') . '
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="' . $movieUrl . '"
                       style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;
                              font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;
                              letter-spacing:0.3px;">
                      Lire la critique complete
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0d1117;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;border-top:1px solid #1f2937;">
              <p style="margin:0 0 6px 0;font-size:12px;color:#4b5563;">
                Vous recevez cet email car vous êtes inscrit sur
                <a href="https://qojimcinema.vercel.app" style="color:#3b82f6;text-decoration:none;">Qojim Cinéma</a>.
              </p>
              <p style="margin:0;font-size:12px;color:#374151;">
                Pour vous désabonner, rendez-vous sur votre
                <a href="https://qojimcinema.vercel.app/profile" style="color:#6b7280;text-decoration:underline;">page profil</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>';

    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Qojim Cinéma <noreply@quentin-chirat.com>\r\n";

    mail($to, $subject, $html, $headers);
}

echo json_encode(['success' => true]);
