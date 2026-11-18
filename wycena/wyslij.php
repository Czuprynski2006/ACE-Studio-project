<?php
declare(strict_types=1);

const RECIPIENT = 'kontakt@ace-studio.pl';
const SENDER = 'kontakt@ace-studio.pl';
const SITE_HOSTS = ['www.ace-studio.pl', 'ace-studio.pl', 'localhost', '127.0.0.1'];
const RATE_LIMIT = 5;
const RATE_WINDOW = 3600;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(int $status, bool $ok, string $message): never
{
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function clean(mixed $value, int $max, bool $multiline = false): string
{
    if (!is_string($value)) {
        return '';
    }
    $value = str_replace("\0", '', $value);
    $pattern = $multiline ? '/[^\P{C}\n\t]/u' : '/\p{C}/u';
    $value = (string) preg_replace($pattern, $multiline ? '' : ' ', str_replace("\r\n", "\n", $value));
    $value = trim($value);
    return mb_substr($value, 0, $max, 'UTF-8');
}

function rateLimited(string $ip): bool
{
    $file = sys_get_temp_dir() . '/ace-quote-' . hash('sha256', $ip) . '.json';
    $now = time();
    $hits = [];
    if (is_file($file)) {
        $stored = json_decode((string) file_get_contents($file), true);
        if (is_array($stored)) {
            $hits = array_values(array_filter($stored, static fn ($t) => is_int($t) && $now - $t < RATE_WINDOW));
        }
    }
    if (count($hits) >= RATE_LIMIT) {
        return true;
    }
    $hits[] = $now;
    file_put_contents($file, json_encode($hits), LOCK_EX);
    return false;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'Metoda niedozwolona.');
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array((string) parse_url($origin, PHP_URL_HOST), SITE_HOSTS, true)) {
    respond(403, false, 'Nieprawidłowe źródło żądania.');
}

$data = json_decode((string) file_get_contents('php://input', false, null, 0, 40000), true);
if (!is_array($data)) {
    respond(400, false, 'Nieprawidłowe dane formularza.');
}

// Pole-pułapka dla botów: człowiek go nie widzi, więc go nie wypełnia.
if (clean($data['website'] ?? '', 200) !== '') {
    respond(200, true, 'Dziękujemy! Zapytanie zostało wysłane.');
}

$name = clean($data['name'] ?? '', 100);
$email = clean($data['email'] ?? '', 150);
$phone = clean($data['phone'] ?? '', 40);
$message = clean($data['message'] ?? '', 3000, true);
$service = clean($data['service'] ?? '', 120);
$summary = clean($data['summary'] ?? '', 6000, true);

if ($name === '') {
    respond(422, false, 'Podaj imię, abyśmy wiedzieli, jak się do Ciebie zwracać.');
}
if ($email === '' || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    respond(422, false, 'Podaj poprawny adres e-mail, na który możemy odpowiedzieć.');
}
if ($phone !== '' && preg_match('/^[0-9+()\-\s]{6,40}$/', $phone) !== 1) {
    respond(422, false, 'Numer telefonu zawiera niedozwolone znaki.');
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (rateLimited($ip)) {
    respond(429, false, 'Wysłano zbyt wiele zapytań. Spróbuj ponownie za godzinę lub napisz na ' . RECIPIENT . '.');
}

$lines = ["Imię: $name", "E-mail: $email"];
if ($phone !== '') {
    $lines[] = "Telefon: $phone";
}
if ($service !== '') {
    $lines[] = "Usługa: $service";
}
if ($summary !== '') {
    $lines[] = '';
    $lines[] = 'Konfiguracja z kalkulatora (dane wprowadzone przez klienta):';
    $lines[] = $summary;
}
if ($message !== '') {
    $lines[] = '';
    $lines[] = 'Wiadomość:';
    $lines[] = $message;
}
$lines[] = '';
$lines[] = '— Wysłano z formularza na ace-studio.pl/wycena/';

$subjectText = 'Zapytanie o wycenę' . ($service !== '' ? ' — ' . $service : '');
$subject = '=?UTF-8?B?' . base64_encode($subjectText) . '?=';
$headers = [
    'From: ACE Studio <' . SENDER . '>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];

$sent = mail(RECIPIENT, $subject, implode("\r\n", $lines), implode("\r\n", $headers));
if (!$sent) {
    respond(502, false, 'Nie udało się wysłać wiadomości. Napisz bezpośrednio na ' . RECIPIENT . '.');
}

respond(200, true, 'Dziękujemy! Zapytanie zostało wysłane — odpowiemy na podany adres e-mail.');
