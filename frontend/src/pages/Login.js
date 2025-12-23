import api from '../services/api';
import { useState } from 'react';

export default function Login() {
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [subdomain,setSubdomain] = useState('');

  const submit = async () => {
    const res = await api.post('/auth/login',{ email,password,tenantSubdomain:subdomain });
    localStorage.setItem('token',res.data.token);
  };

  return (
    <>
      <input onChange={e=>setEmail(e.target.value)} />
      <input type="password" onChange={e=>setPassword(e.target.value)} />
      <input onChange={e=>setSubdomain(e.target.value)} />
      <button onClick={submit}>Login</button>
    </>
  );
}
