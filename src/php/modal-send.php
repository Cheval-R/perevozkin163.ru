<?php
header('Content-Type: text/plain; charset=utf-8');
require __DIR__ . '/form-helpers.php';

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

if (!isAjaxPost()) {
	rejectRequest('booking', 'bad_request', 400, 'Некорректный запрос.');
}

$name = postValue('name', 60);
$phone = postValue('phone', 30);
$tripDate = postValue('date', 20);
$route = postValue('route', 40);
$tripTime = postValue('time', 40);
$honeypot = postValue('company', 120);
$formStartedAt = (int) ($_POST['form_started_at'] ?? 0);
$csrfToken = postValue('csrf_token', 100);

$allowedTimes = [
	'Самара—Казань' => [
		'7:00(Самара-Казань)',
	],
	'Казань—Самара' => [
		'13:00(Казань-Самара)',
	],
];

if ($honeypot !== '') {
	rejectRequest('booking', 'honeypot', 400, 'Некорректный запрос.');
}

if (!validateCsrfToken('booking', $csrfToken)) {
	rejectRequest('booking', 'csrf', 403, 'Обновите страницу и попробуйте еще раз.');
}

if ($formStartedAt > 0 && (time() - $formStartedAt) < 3) {
	rejectRequest('booking', 'too_fast', 429, 'Заявка отправлена слишком быстро. Попробуйте еще раз.');
}

if ($name === '') {
	rejectRequest('booking', 'empty_name', 422, 'Не заполнено имя.');
}

if (!preg_match('/^[А-Яа-яA-Za-z]+(?:\s[А-Яа-яA-Za-z]+)*$/u', $name)) {
	rejectRequest('booking', 'invalid_name', 422, 'Некорректное имя.');
}

$phoneDigits = preg_replace('/\D+/', '', $phone);
if (strlen($phoneDigits) === 11 && $phoneDigits[0] === '7') {
	$phoneDigits = substr($phoneDigits, 1);
}

if (strlen($phoneDigits) !== 10) {
	rejectRequest('booking', 'invalid_phone', 422, 'Некорректный телефон.');
}

$date = DateTime::createFromFormat('d.m.Y', $tripDate);
$dateErrors = DateTime::getLastErrors();
if (
	$date === false ||
	($dateErrors !== false && ($dateErrors['warning_count'] > 0 || $dateErrors['error_count'] > 0))
) {
	rejectRequest('booking', 'invalid_date', 422, 'Некорректная дата отправления.');
}

$today = new DateTime('today', new DateTimeZone('Europe/Samara'));
$maxTripDate = (clone $today)->modify('+1 month');
$date->setTime(0, 0, 0);
if ($date < $today || $date > $maxTripDate) {
	rejectRequest('booking', 'date_out_of_range', 422, 'Дата отправления вне доступного диапазона.');
}

if (!isset($allowedTimes[$route])) {
	rejectRequest('booking', 'invalid_route', 422, 'Некорректный маршрут.');
}

if (!in_array($tripTime, $allowedTimes[$route], true)) {
	rejectRequest('booking', 'invalid_time', 422, 'Некорректное время отправления.');
}

if (!checkRateLimit('booking', 5, 3600)) {
	rejectRequest('booking', 'rate_limit', 429, 'Слишком много заявок. Попробуйте позже.');
}

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
	$secretCandidates = [
		__DIR__ . '/../.secrets/telegram.php',
		__DIR__ . '/../../.secrets/telegram.php',
		dirname(__DIR__, 2) . '/.secrets/telegram.php',
	];

	foreach ($secretCandidates as $secretsPath) {
		if (!is_file($secretsPath)) {
			continue;
		}

		$secrets = require $secretsPath;
		if (!is_array($secrets)) {
			continue;
		}

		if ($botToken === '') {
			$botToken = trim((string) ($secrets['bot_token'] ?? ''));
		}
		if ($chatId === '') {
			$chatId = trim((string) ($secrets['chat_id'] ?? ''));
		}

		if ($botToken !== '' && $chatId !== '') {
			break;
		}
	}
}

$telegramText = "📩 НОВОЕ БРОНИРОВАНИЕ\n\n" . $message;
$telegramSent = false;
if ($botToken !== '' && $chatId !== '') {
	$telegramSent = sendTelegramMessage($botToken, $chatId, $telegramText);
}

if ($mailSent && $telegramSent) {
	logFormEvent('booking', 'sent', ['delivery' => 'mail+telegram']);
	echo 'Спасибо, мы свяжемся с вами в самое ближайшее время!';
	exit;
}

if ($mailSent && !$telegramSent) {
	logFormEvent('booking', 'partial_sent', ['delivery' => 'mail']);
	http_response_code(207);
	echo 'Заявка отправлена на почту, но не доставлена в Telegram.';
	exit;
}

if (!$mailSent && $telegramSent) {
	logFormEvent('booking', 'partial_sent', ['delivery' => 'telegram']);
	http_response_code(207);
	echo 'Заявка отправлена в Telegram, но не доставлена на почту.';
	exit;
}

logFormEvent('booking', 'failed', ['delivery' => 'none']);
http_response_code(500);
echo 'Сообщение не отправлено!';
?>
