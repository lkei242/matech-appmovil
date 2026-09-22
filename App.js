import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';

const Stack = createNativeStackNavigator();

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
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
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