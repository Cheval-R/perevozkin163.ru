<?php
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/form-helpers.php';

$form = trim((string) ($_GET['form'] ?? ''));
$allowedForms = ['booking', 'feedback'];

if (!in_array($form, $allowedForms, true)) {
	http_response_code(400);
	echo json_encode(['error' => 'Некорректная форма.'], JSON_UNESCAPED_UNICODE);
	exit;
}

echo json_encode([
	'token' => createCsrfToken($form),
], JSON_UNESCAPED_UNICODE);
?>
