import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { apiLogin, apiLogout } from '../api';
import { configurarCliente, fijarSesion } from '../api/cliente';

const CLAVE_SESION = 'matech_sesion';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const guardado = await AsyncStorage.getItem(CLAVE_SESION);
        if (guardado) {
          const previa = JSON.parse(guardado);
          fijarSesion(previa);
          setSesion(previa);
        }
      } catch {
        setSesion(null);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  // Cuando el cliente HTTP renueva el access token, guardamos la sesión nueva.
  // Si la renovación falla, cerramos la sesión sin esperar a que el usuario lo note.
  useEffect(() => {
    configurarCliente({
      onRenovada: async (renovada) => {
        fijarSesion(renovada);
        setSesion(renovada);
        await AsyncStorage.setItem(CLAVE_SESION, JSON.stringify(renovada));
      },
      onExpirada: async () => {
        fijarSesion(null);
        await AsyncStorage.removeItem(CLAVE_SESION);
        setSesion(null);
      },
    });
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
    fijarSesion(nueva);
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
    fijarSesion(null);
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