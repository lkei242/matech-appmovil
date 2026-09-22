import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiLogin, apiLogout } from '../api';

const CLAVE_SESION = 'matech_sesion';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const guardado = await AsyncStorage.getItem(CLAVE_SESION);
        if (guardado) setSesion(JSON.parse(guardado));
      } catch {
        setSesion(null);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  async function login(usuario, password) {
    const resp = await apiLogin(usuario, password);
    if (!resp.ok) {
      const mensaje =
        resp.datos && resp.datos.error ? resp.datos.error : 'Error al iniciar sesión';
      throw new Error(mensaje);
    }

    const nueva = {
      access: resp.datos.access,
      refresh: resp.datos.refresh,
      usuario: resp.datos.usuario,
      correo: resp.datos.correo,
      rol: resp.datos.rol,
      dashboardUrl: resp.datos.dashboard_url,
      persona: resp.datos.persona,
    };
    setSesion(nueva);
    await AsyncStorage.setItem(CLAVE_SESION, JSON.stringify(nueva));
    return nueva;
  }

  async function logout() {
    if (sesion) {
      try {
        await apiLogout(sesion.refresh);
      } catch {}
      await AsyncStorage.removeItem(CLAVE_SESION);
    }
    setSesion(null);
  }

  return (
    <AuthContext.Provider value={{ sesion, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}