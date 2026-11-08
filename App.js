import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CuotasScreen from './src/features/cuotas/CuotasScreen';
import PagarScreen from './src/features/pagos/PagarScreen';
import ComprobanteScreen from './src/features/pagos/ComprobanteScreen';
import FacturasScreen from './src/features/facturas/FacturasScreen';

const Stack = createNativeStackNavigator();

// Cada pantalla de módulo se registra acá. Qué ve cada rol se decide en src/navigation/modulos.js.
const PANTALLAS_MODULOS = [
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
        <ActivityIndicator size="large" color="#0B3D63" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {sesion ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            {PANTALLAS_MODULOS.map((modulo) => (
              <Stack.Screen
                key={modulo.name}
                name={modulo.name}
                component={modulo.component}
                options={{ headerShown: true, title: modulo.title, headerTintColor: '#0B3D63' }}
              />
            ))}
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
    backgroundColor: '#E6F4FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
