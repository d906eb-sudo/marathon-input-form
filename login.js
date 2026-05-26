const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx2npA7iA4mnhKPalNnkCfrvuiJA9JtkF7BgwZo51sw_KVHYuawENBqtHzcuCSWUOambA/exec";
const $ = (id) => document.getElementById(id);

async function verifyAndLogin() {
  const raceId = ($('race-id').value || '').trim();
  const token = ($('token').value || '').trim();
  const err = $('login-error');
  err.style.display = 'none';

  if (!raceId || !token) {
    err.textContent = 'ID とパスワードを入力してください。';
    err.style.display = 'block';
    return;
  }

  try {
    const u = new URL(APPS_SCRIPT_URL);
    u.searchParams.set('race_id', raceId);
    u.searchParams.set('token', token);
    const res = await fetch(u.toString());
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'ログインに失敗しました。');

    sessionStorage.setItem('marathon_race_id', raceId);
    sessionStorage.setItem('marathon_token', token);
    location.href = 'index.html';
  } catch (e) {
    err.textContent = e.message || 'ログインに失敗しました。';
    err.style.display = 'block';
  }
}

$('login-btn').addEventListener('click', verifyAndLogin);
$('token').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') verifyAndLogin();
});
