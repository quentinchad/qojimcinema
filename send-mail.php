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

$users = $data['users'];
$movieTitle = $data['movieTitle'];
$movieUrl = $data['movieUrl'];
$rating = $data['rating'];
$content = $data['content'];

$subject = "Nouvelle critique Qojim : " . $movieTitle;

foreach ($users as $user) {
    $to = $user['email'];
    $message = "Qojim a publié une critique sur : " . $movieTitle . "\n\n";
    $message .= "Note : " . $rating . "/10\n\n";
    if ($content) $message .= '"' . substr($content, 0, 200) . "...\"\n\n";
    $message .= "Voir la critique : " . $movieUrl . "\n\n";
    $message .= "---\nVous recevez cet email car vous etes inscrit sur Qojim.";

    $headers = "From: Qojim <qojim@cinema.com>\r\n";
    mail($to, $subject, $message, $headers);
}

echo json_encode(['success' => true]);
