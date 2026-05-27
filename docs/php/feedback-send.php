<?php
header('Content-Type: text/plain; charset=utf-8');
require __DIR__ . '/form-helpers.php';

if (!isAjaxPost()) {
	rejectRequest('feedback', 'bad_request', 400, 'Некорректный запрос.');
}

$name = postValue('feedback-name', 60);
$text = postValue('feedback-text', 1200);
$honeypot = postValue('company', 120);
$formStartedAt = (int) ($_POST['form_started_at'] ?? 0);
$csrfToken = postValue('csrf_token', 100);

if ($honeypot !== '') {
	rejectRequest('feedback', 'honeypot', 400, 'Некорректный запрос.');
}

if (!validateCsrfToken('feedback', $csrfToken)) {
	rejectRequest('feedback', 'csrf', 403, 'Обновите страницу и попробуйте еще раз.');
}

if ($formStartedAt > 0 && (time() - $formStartedAt) < 3) {
	rejectRequest('feedback', 'too_fast', 429, 'Отзыв отправлен слишком быстро. Попробуйте еще раз.');
}

if ($name === '' || !preg_match('/^[А-Яа-яA-Za-z]+(?:\s[А-Яа-яA-Za-z]+)*$/u', $name)) {
	rejectRequest('feedback', 'invalid_name', 422, 'Некорректное имя.');
}

if ($text === '' || strlen($text) < 2) {
	rejectRequest('feedback', 'empty_text', 422, 'Введите отзыв.');
}

if (!checkRateLimit('feedback', 3, 3600)) {
	rejectRequest('feedback', 'rate_limit', 429, 'Слишком много сообщений. Попробуйте позже.');
}

$safeName = htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeText = nl2br(htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));

$message = '
		<html>
		<head>
			<title>Новый отзыв</title>
		</head>
		<body>
			<p><strong>Имя:</strong> ' . $safeName . '</p>
			<p><strong>Отзыв:</strong> ' . $safeText . '</p>
		</body>
		</html>
	';

$mailTo = "zzzelectroniczzz@gmail.com";
$subject = "Новый отзыв";
$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/html; charset=utf-8\r\n";
$headers .= "From: mail-perevozkin@perevozkin163.ru <mail-perevozkin@perevozkin163.ru>\r\n";

if (mail($mailTo, $subject, $message, $headers)) {
	logFormEvent('feedback', 'sent');
	echo "Спасибо, за ваш отзыв!";
	exit;
}

logFormEvent('feedback', 'failed');
respond(500, 'Сообщение не отправлено!');
?>
