<?php
date_default_timezone_set('Europe/Samara');

function startFormSession()
{
	if (session_status() !== PHP_SESSION_ACTIVE) {
		session_start();
	}
}

function respond($statusCode, $message)
{
	http_response_code($statusCode);
	echo $message;
	exit;
}

function rejectRequest($form, $reason, $statusCode, $message)
{
	logFormEvent($form, 'rejected', [
		'reason' => $reason,
		'status' => $statusCode,
		'post_keys' => array_keys($_POST),
	]);

	respond($statusCode, $message);
}

function postValue($key, $maxLength = 120)
{
	$value = trim((string) ($_POST[$key] ?? ''));
	$value = str_replace(["\r", "\n"], ' ', $value);

	return substr($value, 0, $maxLength);
}

function getClientIp()
{
	foreach (['HTTP_CF_CONNECTING_IP', 'REMOTE_ADDR', 'HTTP_X_FORWARDED_FOR'] as $key) {
		if (empty($_SERVER[$key])) {
			continue;
		}

		$value = explode(',', (string) $_SERVER[$key])[0];
		$value = trim($value);
		if (filter_var($value, FILTER_VALIDATE_IP)) {
			return $value;
		}
	}

	return 'unknown';
}

function isAjaxPost()
{
	return $_SERVER['REQUEST_METHOD'] === 'POST' &&
		isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
		!empty($_SERVER['HTTP_X_REQUESTED_WITH']) &&
		strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
}

function checkRateLimit($bucket, $limit, $windowSeconds)
{
	$ip = getClientIp();
	$file = sys_get_temp_dir() . '/perevozkin_' . $bucket . '_' . sha1($ip) . '.json';
	$now = time();
	$hits = [];

	if (is_file($file)) {
		$storedHits = json_decode((string) file_get_contents($file), true);
		if (is_array($storedHits)) {
			$hits = array_filter($storedHits, function ($timestamp) use ($now, $windowSeconds) {
				return is_numeric($timestamp) && ($now - (int) $timestamp) < $windowSeconds;
			});
		}
	}

	if (count($hits) >= $limit) {
		return false;
	}

	$hits[] = $now;
	@file_put_contents($file, json_encode(array_values($hits)), LOCK_EX);

	return true;
}

function createCsrfToken($form)
{
	startFormSession();

	if (empty($_SESSION['csrf_tokens']) || !is_array($_SESSION['csrf_tokens'])) {
		$_SESSION['csrf_tokens'] = [];
	}

	$token = bin2hex(random_bytes(32));
	$_SESSION['csrf_tokens'][$form] = $_SESSION['csrf_tokens'][$form] ?? [];
	$_SESSION['csrf_tokens'][$form][] = [
		'token' => $token,
		'created_at' => time(),
	];
	$_SESSION['csrf_tokens'][$form] = array_slice($_SESSION['csrf_tokens'][$form], -5);

	return $token;
}

function validateCsrfToken($form, $token, $ttlSeconds = 7200)
{
	startFormSession();

	if ($token === '' || empty($_SESSION['csrf_tokens'][$form]) || !is_array($_SESSION['csrf_tokens'][$form])) {
		return false;
	}

	foreach ($_SESSION['csrf_tokens'][$form] as $stored) {
		if (
			empty($stored['token']) ||
			empty($stored['created_at']) ||
			(time() - (int) $stored['created_at']) > $ttlSeconds
		) {
			continue;
		}

		if (hash_equals((string) $stored['token'], (string) $token)) {
			return true;
		}
	}

	return false;
}

function logFormEvent($form, $event, array $context = [])
{
	$logDir = dirname(__DIR__, 2) . '/logs';
	if (!is_dir($logDir)) {
		@mkdir($logDir, 0755, true);
	}

	$entry = [
		'time' => date('c'),
		'form' => $form,
		'event' => $event,
		'ip' => getClientIp(),
		'user_agent' => substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 250),
		'context' => $context,
	];

	@file_put_contents(
		$logDir . '/forms.log',
		json_encode($entry, JSON_UNESCAPED_UNICODE) . PHP_EOL,
		FILE_APPEND | LOCK_EX
	);
}
?>
