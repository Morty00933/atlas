import { useState } from 'react';
import { ADMIN_PASSWORD } from '../lib/constants';

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      onLogin();
      setPassword('');
      setError('');
    } else {
      setError('Неверный пароль');
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-form">
        <h3>Вход в админ-панель</h3>
        <input type="password" placeholder="Пароль"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        {error && <p className="login-error">{error}</p>}
        <button className="btn btn-primary" onClick={handleLogin}>Войти</button>
      </div>
    </div>
  );
}
