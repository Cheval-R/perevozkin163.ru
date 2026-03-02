<?php
header('Content-Type: text/plain; charset=utf-8');

function sendTelegramMessage($botToken, $chatId, $message)
{
	if (empty($botToken) || empty($chatId)) {
		return false;
	}

	$payload = json_encode(
		[
			'chat_id' => $chatId,
			'text' => $message,
		],
		JSON_UNESCAPED_UNICODE
	);

	if ($payload === false) {
		return false;
	}

	$url = "https://api.telegram.org/bot{$botToken}/sendMessage";

	if (function_exists('curl_init')) {
		$curl = curl_init($url);
		if ($curl === false) {
			return false;
		}

		curl_setopt_array($curl, [
			CURLOPT_POST => true,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
			CURLOPT_POSTFIELDS => $payload,
			CURLOPT_TIMEOUT => 10,
		]);

		$response = curl_exec($curl);
		$statusCode = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
		curl_close($curl);

		return $response !== false && $statusCode >= 200 && $statusCode < 300;
	}

	$context = stream_context_create([
		'http' => [
			'method' => 'POST',
			'header' => "Content-Type: application/json\r\n",
			'content' => $payload,
			'timeout' => 10,
		],
	]);

	$response = @file_get_contents($url, false, $context);

	return $response !== false;
}

$isAjax = isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
	!empty($_SERVER['HTTP_X_REQUESTED_WITH']) &&
	strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';

if (!$isAjax) {
	http_response_code(400);
	echo 'Некорректный запрос.';
	exit;
}

$name = trim($_POST['name'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$tripDate = trim($_POST['date'] ?? '');
$route = trim($_POST['route'] ?? '');
$tripTime = trim($_POST['time'] ?? '');

if ($name === '') {
	http_response_code(422);
	echo 'Не заполнено имя.';
	exit;
}

date_default_timezone_set('Europe/Samara');
$submittedAt = date('d.m.Y H:i:s');

$messageLines = [
	"Имя: {$name}",
	"Телефон: {$phone}",
	"Дата поездки: {$tripDate}",
	"Маршрут: {$route}",
	"Время отправления рейса: {$tripTime}",
	"Время отправки заявки: {$submittedAt}",
];

$message = implode("\n", $messageLines);

$mailTo = 'zzzelectroniczzz@gmail.com';
$subject = 'Новое бронирование';
$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/plain; charset=utf-8\r\n";
$headers .= "From: mail-perevozkin@perevozkin163.ru <mail-perevozkin@perevozkin163.ru>\r\n";

$mailSent = mail($mailTo, $subject, $message, $headers);

$botToken = trim((string) getenv('TELEGRAM_BOT_TOKEN'));
$chatId = trim((string) getenv('TELEGRAM_CHAT_ID'));

if ($botToken === '' || $chatId === '') {
	$secretsPath = dirname(__DIR__, 2) . '/.secrets/telegram.php';
	if (is_file($secretsPath)) {
		$secrets = require $secretsPath;
		if (is_array($secrets)) {
			if ($botToken === '') {
				$botToken = trim((string) ($secrets['bot_token'] ?? ''));
			}
			if ($chatId === '') {
				$chatId = trim((string) ($secrets['chat_id'] ?? ''));
			}
		}
	}
}

$telegramText = "📩 НОВОЕ БРОНИРОВАНИЕ\n\n" . $message;
$telegramSent = false;
if ($botToken !== '' && $chatId !== '') {
	$telegramSent = sendTelegramMessage($botToken, $chatId, $telegramText);
}

if ($mailSent && $telegramSent) {
	echo 'Спасибо, мы свяжемся с вами в самое ближайшее время!';
	exit;
}

if ($mailSent && !$telegramSent) {
	http_response_code(207);
	echo 'Заявка отправлена на почту, но не доставлена в Telegram.';
	exit;
}

if (!$mailSent && $telegramSent) {
	http_response_code(207);
	echo 'Заявка отправлена в Telegram, но не доставлена на почту.';
	exit;
}

http_response_code(500);
echo 'Сообщение не отправлено!';
?>
