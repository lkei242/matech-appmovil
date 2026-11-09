import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { colores } from './src/theme';

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CuotasScreen from './src/features/cuotas/CuotasScreen';
import PagarScreen from './src/features/pagos/PagarScreen';
import ComprobanteScreen from './src/features/pagos/ComprobanteScreen';
import FacturasScreen from './src/features/facturas/FacturasScreen';
import ServiciosScreen from './src/features/servicios/ServiciosScreen';
import PerfilScreen from './src/features/perfil/PerfilScreen';
import OfflineScreen from './src/features/offline/OfflineScreen';

const Stack = createNativeStackNavigator();

// Pantallas de pagos: usan la barra de título del navegador.
// Qué módulos ve cada rol se decide en src/navigation/modulos.js.
const PANTALLAS_PAGOS = [
  { name: 'Cuotas', component: CuotasScreen, title: 'Cuotas y deuda' },
  { name: 'Pagar', component: PagarScreen, title: 'Pagar' },
  { name: 'Comprobante', component: ComprobanteScreen, title: 'Cargar comprobante' },
  { name: 'Facturas', component: FacturasScreen, title: 'Facturas y comprobantes' },
];

function Pantallas() {
  const { sesion, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator size="large" color={colores.azul} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {sesion ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            {PANTALLAS_PAGOS.map((pantalla) => (
              <Stack.Screen
                key={pantalla.name}
                name={pantalla.name}
                component={pantalla.component}
                options={{
                  headerShown: true,
                  title: pantalla.title,
                  headerStyle: { backgroundColor: colores.azul },
                  headerTintColor: '#FFFFFF',
                  headerTitleStyle: { fontWeight: '700' },
                  headerShadowVisible: false,
                  contentStyle: { backgroundColor: colores.fondo },
                }}
              />
            ))}
            <Stack.Screen name="Servicios" component={ServiciosScreen} />
            <Stack.Screen name="Perfil" component={PerfilScreen} />
            <Stack.Screen name="Offline" component={OfflineScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Pantallas />
      <StatusBar style="light" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  cargando: {
    flex: 1,
    backgroundColor: colores.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
