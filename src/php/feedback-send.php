<?php
if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
	$message = '
		<html>
		<head>
			<title>Новое бронирование</title>
		</head>
		<body>
			<p><strong>Имя:</strong> ' . $_POST['feedback-name'] . '</p>
			<p><strong>Отзыв:</strong> ' . $_POST['feedback-text'] . '</p>
		</body>
		</html>
	';

	$mailTo = "zzzelectroniczzz@gmail.com"; // Ваш e-mail
	$subject = "Новый отзыв"; // Тема сообщения
	$headers = "MIME-Version: 1.0\r\n";
	$headers .= "Content-type: text/html; charset=utf-8\r\n";
	$headers .= "From: mail-perevozkin@perevozkin163.ru <mail-perevozkin@perevozkin163.ru>\r\n";
	if (mail($mailTo, $subject, $message, $headers)) {
		echo "Спасибо, за ваш отзыв!";
	} else {
		echo "Сообщение не отправлено!";
	}
}
?>